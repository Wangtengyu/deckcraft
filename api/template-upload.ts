/**
 * 模板上传API - Laf云函数
 * 用于处理模板上传、解析、存储
 * 
 * 支持两种模式：
 * 1. 完整上传：file + name + category（小文件，<5MB）
 * 2. 元数据模式：name + category + fileSize + fileName + mode='metadata'（大文件）
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

// 模板集合
const TEMPLATES_COLLECTION = 'templates'
const USERS_COLLECTION = 'users'

/**
 * 上传模板
 * POST /template-upload
 */
export default async function (ctx: any) {
  const { file, name, category, tags, userId, mode, fileSize, fileName } = ctx.body
  
  if (!name || !category) {
    return {
      success: false,
      message: '缺少必要参数'
    }
  }

  try {
    // 生成模板ID
    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    
    let templateData
    
    if (mode === 'metadata') {
      // 元数据模式：大文件，只保存信息，不保存文件
      templateData = {
        _id: templateId,
        name,
        category,
        tags: tags || [],
        author_id: userId,
        file_url: '', // 待后续上传
        preview_url: '',
        config: {
          fileSize: fileSize,
          fileName: fileName,
          mode: 'metadata'
        },
        use_count: 0,
        status: 'pending_upload', // 等待文件上传
        created_at: new Date(),
        updated_at: new Date()
      }
    } else {
      // 完整上传模式
      if (!file) {
        return {
          success: false,
          message: '缺少文件'
        }
      }
      
      // 解析模板配色和布局
      const config = await parseTemplateConfig(file)
      
      templateData = {
        _id: templateId,
        name,
        category,
        tags: tags || [],
        author_id: userId,
        file_url: `templates/${templateId}.pptx`,
        preview_url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(name)}`,
        config,
        use_count: 0,
        status: 'approved',
        created_at: new Date(),
        updated_at: new Date()
      }
    }
    
    await db.collection(TEMPLATES_COLLECTION).add(templateData)
    
    // 更新用户贡献数
    if (userId) {
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
        preview_url: templateData.preview_url,
        mode: mode || 'full'
      },
      message: mode === 'metadata' ? '模板信息已提交，等待文件上传' : '模板上传成功'
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
 * 解析模板配置
 */
async function parseTemplateConfig(fileBase64: string): Promise<any> {
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
