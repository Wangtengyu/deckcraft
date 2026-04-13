import cloud from '@lafjs/cloud'

// PPTX生成函数（修复版：先下载图片转base64）
export default async function (ctx) {
  const { body } = ctx
  
  try {
    const { images, title = '未命名PPT', style = '信息图风' } = body || {}
    
    console.log('=== PPTX生成开始 ===')
    console.log('图片数量:', images?.length)
    console.log('标题:', title)
    
    if (!images || images.length === 0) {
      return { success: false, error: '缺少图片数据' }
    }
    
    // 使用pptxgenjs生成PPTX
    const pptxgen = require('pptxgenjs')
    const pptx = new pptxgen()
    
    // 设置PPT属性
    pptx.author = 'DeckCraft AI'
    pptx.title = title
    pptx.subject = `由DeckCraft AI生成的${title}PPT`
    
    // 设置幻灯片尺寸 (16:9)
    pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 })
    pptx.layout = 'CUSTOM'
    
    // 为每张图片创建幻灯片
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const slide = pptx.addSlide()
      
      // 添加背景
      slide.background = { color: 'FFFFFF' }
      
      console.log(`处理第${i + 1}页:`, img.type, img.url ? '有URL' : '无URL')
      
      // 如果有图片URL，先下载转base64
      if (img.url) {
        try {
          console.log('下载图片:', img.url.substring(0, 80))
          
          // 下载图片
          const response = await fetch(img.url)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // 转换为base64
          const base64 = buffer.toString('base64')
          
          // 检测图片类型
          const contentType = response.headers.get('content-type') || 'image/png'
          const dataUrl = `data:${contentType};base64,${base64}`
          
          console.log('图片大小:', (base64.length / 1024).toFixed(2), 'KB')
          
          // 添加图片到PPT
          slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' }
          })
          
          console.log('第', i + 1, '页添加成功')
          
        } catch (error) {
          console.error('添加图片失败:', error.message)
          // 添加占位符文字
          slide.addText(`第${i + 1}页`, {
            x: 0,
            y: 3,
            w: '100%',
            h: 1.5,
            align: 'center',
            fontSize: 36,
            color: '666666'
          })
        }
      } else {
        // 没有图片，显示占位符
        console.log('第', i + 1, '页无图片URL')
        slide.addText(`第${i + 1}页 - ${img.type === 'cover' ? '封面' : '内容'}`, {
          x: 0,
          y: 3,
          w: '100%',
          h: 1.5,
          align: 'center',
          fontSize: 36,
          color: '666666'
        })
      }
    }
    
    console.log('=== 开始生成PPTX文件 ===')
    
    // 生成PPTX文件（返回base64）
    const pptxData = await pptx.write({ outputType: 'base64' })
    
    console.log('PPTX生成成功，大小:', (pptxData.length / 1024).toFixed(2), 'KB')
    
    return {
      success: true,
      filename: `${title}.pptx`,
      data: pptxData,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    
  } catch (error) {
    console.error('PPTX生成失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
