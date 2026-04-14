/**
 * 图片上传API - 使用Laf云存储
 */
import cloud from '@lafjs/cloud'

const fs = require('fs')

export default async function (ctx: any) {
  console.log('=== 图片上传API ===')
  
  try {
    // 获取上传的文件
    const file = ctx.files?.[0]
    
    if (!file) {
      return { success: false, error: '没有上传文件' }
    }
    
    console.log('文件信息:', file.filename, file.mimetype, file.size)
    
    // 生成唯一文件名
    const ext = file.filename.split('.').pop() || 'png'
    const fileName = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
    
    // 使用Laf云存储
    const bucket = cloud.storage.bucket()
    
    // 上传文件
    await bucket.putObject({
      key: fileName,
      body: file.content,
      contentType: file.mimetype || 'image/png'
    })
    
    // 获取公开访问URL
    const url = await bucket.getSignedUrl(fileName, 3600 * 24 * 365) // 1年有效期
    
    console.log('上传成功:', url)
    
    return {
      success: true,
      url: url,
      fileName: fileName
    }
    
  } catch (error) {
    console.error('上传失败:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}
