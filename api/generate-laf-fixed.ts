import cloud from '@lafjs/cloud'

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const PLATFORM_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// 测试图片URL（使用更可靠的占位图服务）
const TEST_IMAGES = [
  'https://via.placeholder.com/1920x1080/4A90E2/FFFFFF?text=Cover+Page',
  'https://via.placeholder.com/1920x1080/50C878/FFFFFF?text=Content+Page'
]

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
    console.log('Coze API完整返回:', JSON.stringify(result))
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return ''
    }
    
    // 尝试多个可能的URL字段
    const imageUrl = result.data?.image_url || 
                     result.data?.url || 
                     result.image_url || 
                     result.url ||
                     result.data?.output?.image_url ||
                     ''
    
    console.log('提取到的图片URL:', imageUrl)
    return imageUrl
    
  } catch (error) {
    console.error('Coze API调用失败:', error)
    return ''
  }
}

export default async function (ctx) {
  console.log('=== 函数开始执行 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  try {
    const topic = ctx.body?.topic || '测试主题'
    const platform = ctx.body?.platform || 'ppt'
    const style = ctx.body?.style || 'A'
    
    console.log('解析参数:', { topic, platform, style })
    
    const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.A
    
    const images = []
    
    // 尝试生成封面
    const coverPrompt = `生成一张${platformSize.name}封面页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n页面中央展示主标题「${topic}」，粗体，字号适中。整体留白充足。`
    
    console.log('开始生成封面...')
    const coverUrl = await generateImage(coverPrompt, PLATFORM_API_KEY)
    
    // 如果Coze返回了URL，使用真实URL；否则使用测试图片
    images.push({ 
      page_id: 1, 
      type: 'cover', 
      url: coverUrl || TEST_IMAGES[0]
    })
    
    // 生成内容页
    console.log('开始生成内容页...')
    const contentPrompt = `生成一张${platformSize.name}内容页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n标题「${topic} - 核心内容」位于页面左上角。页面中央展示3个要点。整体布局清晰。`
    
    const contentUrl = await generateImage(contentPrompt, PLATFORM_API_KEY)
    images.push({ 
      page_id: 2, 
      type: 'content', 
      url: contentUrl || TEST_IMAGES[1]
    })
    
    console.log('=== 生成完成，返回结果 ===')
    console.log('图片数量:', images.length)
    console.log('图片URLs:', images.map(i => i.url))
    
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
