import cloud from '@lafjs/cloud'

// PPTX生成函数
export default async function (ctx) {
  const { body } = ctx
  
  try {
    const { images, title = '未命名PPT', style = '信息图风' } = body || {}
    
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
      
      // 如果有图片URL，添加图片
      if (img.url) {
        try {
          slide.addImage({
            url: img.url,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' }
          })
        } catch (error) {
          console.error('添加图片失败:', error)
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
    
    // 生成PPTX文件（返回base64）
    const pptxData = await pptx.write({ outputType: 'base64' })
    
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
