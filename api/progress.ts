import cloud from '@lafjs/cloud'

// 进度存储（使用Redis/缓存）
const PROGRESS_TTL = 300 // 5分钟

// 生成唯一任务ID
function generateTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 创建任务进度
async function createProgress(taskId) {
  const progress = {
    taskId,
    status: 'pending', // pending, generating, completed, failed
    currentStep: 0,
    totalSteps: 5,
    currentPage: 0,
    totalPages: 0,
    message: '准备开始...',
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    images: [],
    error: null
  }
  
  await cloud.cache.set(`progress_${taskId}`, progress, PROGRESS_TTL)
  return progress
}

// 更新进度
async function updateProgress(taskId, updates) {
  const key = `progress_${taskId}`
  let progress = await cloud.cache.get(key)
  
  if (!progress) {
    progress = { taskId, status: 'pending' }
  }
  
  progress = { ...progress, ...updates, updatedAt: Date.now() }
  
  // 计算百分比
  if (progress.totalSteps > 0) {
    const stepWeight = 100 / progress.totalSteps
    progress.progress = Math.min(99, Math.round(progress.currentStep * stepWeight))
  }
  
  await cloud.cache.set(key, progress, PROGRESS_TTL)
  return progress
}

// 获取进度
async function getProgress(taskId) {
  const progress = await cloud.cache.get(`progress_${taskId}`)
  return progress || null
}

// 删除进度
async function deleteProgress(taskId) {
  await cloud.cache.del(`progress_${taskId}`)
}

// ============ 主函数 ============

export default async function (ctx) {
  const { body } = ctx
  const action = body?.action || 'get'
  const taskId = body?.taskId
  
  console.log('=== 进度API ===')
  console.log('操作:', action)
  console.log('任务ID:', taskId)
  
  try {
    switch (action) {
      // 创建新任务
      case 'create':
        const newTaskId = generateTaskId()
        const totalPages = parseInt(body?.totalPages) || 5
        const progress = await createProgress(newTaskId)
        progress.totalSteps = 5
        progress.totalPages = totalPages
        progress.message = '正在初始化...'
        await cloud.cache.set(`progress_${newTaskId}`, progress, PROGRESS_TTL)
        
        return {
          success: true,
          taskId: newTaskId,
          status: 'pending'
        }
      
      // 更新进度
      case 'update':
        if (!taskId) {
          return { success: false, error: '缺少taskId' }
        }
        const updated = await updateProgress(taskId, {
          status: body.status,
          currentStep: body.currentStep,
          currentPage: body.currentPage,
          message: body.message,
          images: body.images
        })
        return { success: true, progress: updated }
      
      // 获取进度（轮询）
      case 'get':
        if (!taskId) {
          return { success: false, error: '缺少taskId' }
        }
        const current = await getProgress(taskId)
        if (!current) {
          return { success: false, error: '任务不存在或已过期' }
        }
        return { success: true, progress: current }
      
      // 完成任务
      case 'complete':
        if (!taskId) {
          return { success: false, error: '缺少taskId' }
        }
        const completed = await updateProgress(taskId, {
          status: 'completed',
          currentStep: 5,
          progress: 100,
          message: '生成完成！',
          images: body.images
        })
        return { success: true, progress: completed }
      
      // 任务失败
      case 'fail':
        if (!taskId) {
          return { success: false, error: '缺少taskId' }
        }
        const failed = await updateProgress(taskId, {
          status: 'failed',
          progress: 0,
          error: body.error,
          message: body.error || '生成失败'
        })
        return { success: true, progress: failed }
      
      // 删除任务
      case 'delete':
        if (taskId) {
          await deleteProgress(taskId)
        }
        return { success: true }
      
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('进度API执行失败:', error)
    return { success: false, error: error.message }
  }
}
