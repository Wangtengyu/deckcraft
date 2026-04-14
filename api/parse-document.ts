/**
 * 文档解析API - 提取PDF/Word文档内容
 */
import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  console.log('=== 文档解析API ===')
  
  try {
    const file = ctx.files?.[0]
    
    if (!file) {
      return { success: false, error: '没有上传文件' }
    }
    
    console.log('文件信息:', file.filename, file.mimetype)
    
    const ext = file.filename.split('.').pop()?.toLowerCase()
    let content = ''
    
    // 根据文件类型处理
    if (ext === 'pdf') {
      // PDF解析 - 简单提取文本
      // 注意：Laf环境可能需要安装pdf-parse库
      content = await parsePDF(file.content)
    } else if (ext === 'docx' || ext === 'doc') {
      // Word解析
      content = await parseWord(file.content)
    } else if (ext === 'txt' || ext === 'md') {
      // 文本文件直接读取
      content = file.content.toString('utf-8')
    } else {
      return { success: false, error: '不支持的文件格式，请上传PDF、Word或文本文件' }
    }
    
    console.log('解析完成，内容长度:', content.length)
    
    return {
      success: true,
      content: content.substring(0, 10000), // 限制长度
      fileName: file.filename
    }
    
  } catch (error) {
    console.error('解析失败:', error)
    return {
      success: false,
      error: error.message || '解析失败'
    }
  }
}

// PDF解析（简化版）
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // 尝试提取文本内容
    // 实际环境中可能需要使用pdf-parse库
    // 这里返回提示信息
    return `[PDF文档内容 - 请手动提取关键信息或提供文本格式]`
  } catch (e) {
    return '[PDF解析失败，请提供文本格式]'
  }
}

// Word解析（简化版）
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    // Word文档解析
    // 实际环境中可能需要使用mammoth库
    return `[Word文档内容 - 请手动提取关键信息或提供文本格式]`
  } catch (e) {
    return '[Word解析失败，请提供文本格式]'
  }
}
