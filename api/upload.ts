/**
 * 图片上传API - 使用Laf云存储
 * 需要在Laf控制台创建存储桶，或在环境变量设置BUCKET_NAME
 */
import cloud from '@lafjs/cloud'

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
    
    // 使用Laf云存储 - 需要指定bucketName
    // 从环境变量获取，或使用默认名称
    const bucketName = process.env.BUCKET_NAME || 'deckcraft-uploads'
    
    console.log('使用存储桶:', bucketName)
    
    const bucket = cloud.storage.bucket(bucketName)
    
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
