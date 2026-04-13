import cloud from '@lafjs/cloud'

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

const STYLE_CONFIG = {
  A: { name: '信息图风', style: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调，左侧有几何图形装饰，右侧留白充足。' },
  B: { name: '插画科普风', style: '扁平插画风格，天蓝色背景，搭配橙黄色强调色，底部有简约插画装饰。' },
  C: { name: '图文混排风', style: '照片风格的背景，模糊处理的风景或城市图片，留白充足。' },
  D: { name: '卡通绘本风', style: '可爱卡通风格，柔和的暖色调背景，边角有卡通元素装饰。' },
  E: { name: '手绘笔记风', style: '手绘线条风格，米色笔记本背景，带有淡淡的手绘网格线。' }
}

const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, name: '小红书' },
  wechat: { width: 1080, height: 1920, name: '微信' },
  mobile: { width: 1080, height: 1920, name: '手机竖屏' },
  poster: { width: 2480, height: 3508, name: '海报' }
}

// ============ 进度更新函数 ============
const PROGRESS_TTL = 300

async function updateProgress(taskId, updates) {
  try {
    let progress = await cloud.cache.get(`progress_${taskId}`)
    if (!progress) {
      progress = { taskId, totalSteps: 5, totalPages: 0 }
    }
    progress = { ...progress, ...updates, updatedAt: Date.now() }
    
    // 计算百分比
    if (progress.totalSteps > 0) {
      const stepWeight = 100 / progress.totalSteps
      progress.progress = Math.min(99, Math.round(progress.currentStep * stepWeight))
    }
    
    await cloud.cache.set(`progress_${taskId}`, progress, PROGRESS_TTL)
    return progress
  } catch (e) {
    console.error('更新进度失败:', e)
    return null
  }
}

// ============ Coze API调用 ============

async function generateBackground(prompt, apiKey, size = '4096x2304') {
  console.log('=== 开始生成背景图片 ===')
  
  try {
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: {
          prompt: prompt,
          images_url: [],
          size: size,
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { url: '', error: result.msg || 'API调用失败' }
    }
    
    // 解析返回数据
    const rawData = result.data
    let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    
    const imageUrl = parsedData?.output?.data || ''
    const apiMsg = parsedData?.output?.msg || ''
    
    if (apiMsg !== 'success') {
      return { url: '', error: `Workflow错误: ${apiMsg}` }
    }
    
    if (imageUrl && imageUrl.startsWith('http')) {
      return { url: imageUrl, error: '' }
    }
    
    return { url: '', error: '无效的图片URL格式' }
    
  } catch (error) {
    console.error('Coze API调用失败:', error)
    return { url: '', error: error.message }
  }
}

// ============ 主函数（支持进度返回） ============

export default async function (ctx) {
  console.log('=== 生成V3函数开始 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  const pageCount = parseInt(ctx.body?.pageCount) || 2
  
  console.log('解析参数:', { taskId, topic, platform, style, pageCount })
  
  const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
  const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.A
  
  try {
    const images = []
    
    // ========== 步骤1: 准备 (20%) ==========
    await updateProgress(taskId, {
      status: 'generating',
      currentStep: 1,
      message: '正在准备生成参数...',
      totalSteps: 4,
      totalPages: pageCount
    })
    
    // ========== 步骤2: 生成封面 (40%) ==========
    await updateProgress(taskId, {
      currentStep: 2,
      currentPage: 1,
      message: `正在生成封面 (1/${pageCount})...`
    })
    
    const coverPrompt = `生成一张${platformSize.name}封面页的装饰性背景图片。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n重要要求：\n1. 只生成背景和装饰元素\n2. 不要包含任何文字\n3. 中央和右侧留出充足空白区域\n4. 装饰元素放在左侧或边角\n5. 整体简洁专业`
    
    console.log(`开始生成封面背景...`)
    const coverResult = await generateBackground(coverPrompt, COZE_API_KEY, `${platformSize.width}x${platformSize.height}`)
    
    if (coverResult.url) {
      images.push({ 
        page_id: 1, 
        type: 'cover', 
        url: coverResult.url,
        title: topic,
        subtitle: '副标题（可编辑）'
      })
    } else {
      console.error('封面背景生成失败:', coverResult.error)
      images.push({ page_id: 1, type: 'cover', error: coverResult.error, url: '', title: topic })
    }
    
    // ========== 步骤3: 生成内容页 (60-90%) ==========
    await updateProgress(taskId, {
      currentStep: 3,
      message: `正在生成内容页...`
    })
    
    for (let i = 2; i <= pageCount; i++) {
      const contentPrompt = `生成一张${platformSize.name}内容页的装饰性背景图片。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n重要要求：\n1. 只生成背景和装饰元素\n2. 不要包含任何文字\n3. 左上角留出标题区域\n4. 中央留出内容区域\n5. 整体简洁专业，适合放置文字内容`
      
      console.log(`开始生成内容页背景(${i}/${pageCount})...`)
      
      // 更新当前页进度
      await updateProgress(taskId, {
        currentPage: i,
        message: `正在生成第${i-1}页 (${i}/${pageCount})...`,
        images: [...images]
      })
      
      const contentResult = await generateBackground(contentPrompt, COZE_API_KEY, `${platformSize.width}x${platformSize.height}`)
      
      if (contentResult.url) {
        images.push({ 
          page_id: i, 
          type: 'content', 
          url: contentResult.url,
          title: `${topic} - 第${i-1}部分`,
          points: ['要点1（可编辑）', '要点2（可编辑）', '要点3（可编辑）']
        })
      } else {
        console.error(`内容页背景${i}生成失败:`, contentResult.error)
        images.push({ 
          page_id: i, 
          type: 'content', 
          error: contentResult.error, 
          url: '',
          title: `${topic} - 第${i-1}部分`,
          points: ['要点1', '要点2', '要点3']
        })
      }
    }
    
    // ========== 步骤4: 完成 (100%) ==========
    await updateProgress(taskId, {
      status: 'completed',
      currentStep: 4,
      progress: 100,
      message: '生成完成！',
      images: images
    })
    
    console.log('=== 生成完成 ===')
    console.log('图片数量:', images.length)
    
    return {
      success: true,
      taskId: taskId,
      ppt_title: topic,
      style: styleConfig.name,
      platform: platformSize.name,
      images: images
    }
    
  } catch (error) {
    console.error('函数执行出错:', error)
    
    await updateProgress(taskId, {
      status: 'failed',
      currentStep: 0,
      progress: 0,
      message: '生成失败',
      error: error.message
    })
    
    return {
      success: false,
      taskId: taskId,
      error: error.message
    }
  }
}
