import cloud from '@lafjs/cloud'

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

const STYLE_CONFIG = {
  A: { name: '信息图风', style: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。' },
  B: { name: '插画科普风', style: '扁平插画风格，天蓝色背景，搭配橙黄色强调色。' },
  C: { name: '图文混排风', style: '照片为主的排版风格，留白充足，文字简洁。' },
  D: { name: '卡通绘本风', style: '可爱卡通插画风格，柔和的暖色调背景。' },
  E: { name: '手绘笔记风', style: '手绘线条风格，米色笔记本背景。' }
}

const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, name: '小红书' },
  wechat: { width: 1080, height: 1920, name: '微信' },
  mobile: { width: 1080, height: 1920, name: '手机竖屏' },
  poster: { width: 2480, height: 3508, name: '海报' }
}

// 调用Coze API生成图片（正确解析返回数据）
async function generateImage(prompt, apiKey) {
  console.log('=== 开始调用Coze API ===')
  console.log('Prompt:', prompt.substring(0, 100))
  
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
          size: '4096x2304',
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    console.log('Coze API原始返回:', JSON.stringify(result))
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { url: '', error: result.msg || 'API调用失败' }
    }
    
    // 关键：data字段是JSON字符串，需要解析
    const rawData = result.data
    let parsedData
    
    if (typeof rawData === 'string') {
      parsedData = JSON.parse(rawData)
    } else {
      parsedData = rawData
    }
    
    console.log('解析后的data:', JSON.stringify(parsedData))
    
    // 图片URL在 output.data 字段
    const imageUrl = parsedData?.output?.data || ''
    const apiMsg = parsedData?.output?.msg || ''
    
    console.log('API消息:', apiMsg)
    console.log('提取到的图片URL:', imageUrl)
    
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

export default async function (ctx) {
  console.log('=== 函数开始执行 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  try {
    const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
    const platform = ctx.body?.platform || 'ppt'
    const style = ctx.body?.style || 'A'
    const pageCount = parseInt(ctx.body?.pageCount) || 2
    
    console.log('解析参数:', { topic, platform, style, pageCount })
    
    const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.A
    
    const images = []
    
    // 生成封面（第1页）
    const coverPrompt = `生成一张${platformSize.name}封面页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n页面中央展示主标题「${topic}」，粗体，字号适中。整体留白充足。`
    
    console.log('开始生成封面(1/${pageCount})...')
    const coverResult = await generateImage(coverPrompt, COZE_API_KEY)
    
    if (coverResult.url) {
      images.push({ page_id: 1, type: 'cover', url: coverResult.url })
    } else {
      console.error('封面生成失败:', coverResult.error)
      images.push({ page_id: 1, type: 'cover', error: coverResult.error, url: '' })
    }
    
    // 生成内容页（第2页到第pageCount页）
    for (let i = 2; i <= pageCount; i++) {
      const contentPrompt = `生成一张${platformSize.name}内容页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n标题「${topic} - 第${i-1}部分」位于页面左上角。页面中央展示3个要点。整体布局清晰。`
      
      console.log(`开始生成内容页(${i}/${pageCount})...`)
      const contentResult = await generateImage(contentPrompt, COZE_API_KEY)
      
      if (contentResult.url) {
        images.push({ page_id: i, type: 'content', url: contentResult.url })
      } else {
        console.error(`内容页${i}生成失败:`, contentResult.error)
        images.push({ page_id: i, type: 'content', error: contentResult.error, url: '' })
      }
    }
    
    console.log('=== 生成完成 ===')
    console.log('图片数量:', images.length)
    console.log('图片列表:', JSON.stringify(images))
    
    return {
      success: true,
      ppt_title: topic,
      style: styleConfig.name,
      platform: platformSize.name,
      images: images
    }
    
  } catch (error) {
    console.error('函数执行出错:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
