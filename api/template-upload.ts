/**
 * 模板上传API - Laf云函数
 * 用于处理模板上传、解析、存储
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

// 模板集合
const TEMPLATES_COLLECTION = 'templates'
const USERS_COLLECTION = 'users'

/**
 * 上传模板
 * POST /template-upload
 * 
 * Body:
 * - file: PPTX文件（base64或文件流）
 * - name: 模板名称
 * - category: 分类 (party/business/tech/education/life)
 * - tags: 标签数组
 * - userId: 用户ID
 */
export default async function (ctx: any) {
  const { file, name, category, tags, userId } = ctx.body
  
  if (!file || !name || !category) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }

  try {
    // 生成模板ID
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    
    // 生成预览图URL（实际项目中需要调用截图服务）
    const previewUrl = await generatePreview(file, templateId)
    
    // 存储模板文件到云存储
    const fileUrl = await saveToCloudStorage(file, templateId)
    
    // 解析模板配色和布局（简化版，实际需要完整解析）
    const config = await parseTemplateConfig(file)
    
    // 存入数据库
    const templateData = {
      _id: templateId,
      name,
      category,
      tags: tags || [],
      author_id: userId,
      file_url: fileUrl,
      preview_url: previewUrl,
      config,
      use_count: 0,
      status: 'pending', // pending/approved/rejected
      created_at: new Date(),
      updated_at: new Date()
    }
    
    await db.collection(TEMPLATES_COLLECTION).add(templateData)
    
    // 更新用户贡献数
    if (userId) {
      await db.collection(USERS_COLLECTION)
        .where({ _id: userId })
        .update({
          contribute_count: db.command.inc(1)
        })
    }
    
    return {
      success: true,
      data: {
        id: templateId,
        preview_url: previewUrl
      },
      message: '模板上传成功，等待审核'
    }
    
  } catch (error) {
    console.error('模板上传失败:', error)
    return {
      success: false,
      message: '上传失败: ' + error.message
    }
  }
}

/**
 * 生成预览图
 */
async function generatePreview(fileBase64: string, templateId: string): Promise<string> {
  // 实际项目中需要调用截图服务
  // 这里返回占位图
  return `https://placeholder.com/preview/${templateId}.png`
}

/**
 * 存储到云存储
 */
async function saveToCloudStorage(fileBase64: string, templateId: string): Promise<string> {
  // 使用Laf云存储
  const bucket = cloud.storage()
  const buffer = Buffer.from(fileBase64, 'base64')
  const filePath = `templates/${templateId}.pptx`
  
  await bucket.upload(filePath, buffer)
  
  return filePath
}

/**
 * 解析模板配置
 */
async function parseTemplateConfig(fileBase64: string): Promise<any> {
  // 简化版配置解析
  // 实际项目中应该调用完整的解析脚本
  return {
    colors: {
      primary: '#2C5282',
      secondary: '#4A90D9',
      accent: '#00d4ff'
    },
    slide_count: 10,
    layouts: ['cover', 'content', 'content', 'content']
  }
}
