/**
 * 模板上传API - Laf云函数
 * 仅保存元数据，不保存完整文件（避免请求体过大）
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

const TEMPLATES_COLLECTION = 'templates'
const USERS_COLLECTION = 'users'

/**
 * 上传模板元数据
 * POST /template-upload
 */
export default async function (ctx: any) {
  const { name, category, tags, userId, config, fileSize, fileName } = ctx.body
  
  if (!name || !category) {
    return {
      success: false,
      message: '缺少必要参数：模板名称和分类'
    }
  }

  try {
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    
    const templateData = {
      _id: templateId,
      name,
      category,
      tags: tags || [],
      author_id: userId || 'anonymous',
      file_url: '',
      preview_url: '',
      config: {
        ...config,
        fileSize: fileSize,
        fileName: fileName,
        mode: 'metadata'
      },
      use_count: 0,
      status: 'approved',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    await db.collection(TEMPLATES_COLLECTION).add(templateData)
    
    // 更新用户贡献数
    if (userId && userId !== 'anonymous') {
      try {
        await db.collection(USERS_COLLECTION)
          .where({ _id: userId })
          .update({
            contribute_count: db.command.inc(1)
          })
      } catch (e) {
        console.log('更新用户贡献数失败，忽略')
      }
    }
    
    return {
      success: true,
      data: {
        id: templateId,
        name,
        category
      },
      message: '模板投喂成功'
    }
    
  } catch (error) {
    console.error('模板上传失败:', error)
    return {
      success: false,
      message: '上传失败: ' + error.message
    }
  }
}
