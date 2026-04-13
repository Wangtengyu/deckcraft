import cloud from '@lafjs/cloud'

// PPTX生成函数（V2：背景图片+可编辑文本框）
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
      
      console.log(`处理第${i + 1}页:`, img.type)
      
      // 添加背景图片
      if (img.url) {
        try {
          console.log('下载背景图片:', img.url.substring(0, 80))
          
          const response = await fetch(img.url)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString('base64')
          const contentType = response.headers.get('content-type') || 'image/png'
          const dataUrl = `data:${contentType};base64,${base64}`
          
          console.log('背景图片大小:', (base64.length / 1024).toFixed(2), 'KB')
          
          // 添加背景图片
          slide.addImage({
            data: dataUrl,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' }
          })
          
        } catch (error) {
          console.error('添加背景图片失败:', error.message)
          slide.background = { color: 'FFFFFF' }
        }
      } else {
        slide.background = { color: 'FFFFFF' }
      }
      
      // 添加可编辑的文本框
      if (img.type === 'cover') {
        // 封面页：大标题 + 副标题
        slide.addText(img.title || title, {
          x: 0.5,
          y: 2.5,
          w: 12.33,
          h: 1.5,
          align: 'center',
          fontSize: 48,
          bold: true,
          color: '1a1a1a',
          fontFace: 'Microsoft YaHei'
        })
        
        slide.addText(img.subtitle || '点击编辑副标题', {
          x: 0.5,
          y: 4.2,
          w: 12.33,
          h: 0.8,
          align: 'center',
          fontSize: 24,
          color: '666666',
          fontFace: 'Microsoft YaHei'
        })
        
      } else {
        // 内容页：标题 + 要点列表
        slide.addText(img.title || `第${i}部分`, {
          x: 0.5,
          y: 0.5,
          w: 12.33,
          h: 1,
          align: 'left',
          fontSize: 32,
          bold: true,
          color: '1a1a1a',
          fontFace: 'Microsoft YaHei'
        })
        
        // 添加要点（可编辑）
        const points = img.points || ['要点1（点击编辑）', '要点2（点击编辑）', '要点3（点击编辑）']
        points.forEach((point, idx) => {
          slide.addText(`• ${point}`, {
            x: 1,
            y: 2.0 + idx * 1.2,
            w: 11,
            h: 0.8,
            align: 'left',
            fontSize: 22,
            color: '333333',
            fontFace: 'Microsoft YaHei'
          })
        })
      }
      
      console.log(`第${i + 1}页添加完成`)
    }
    
    console.log('=== 开始生成PPTX文件 ===')
    
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
