import cloud from '@lafjs/cloud'

// Coze API配置
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const PLATFORM_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// 风格配置
const STYLE_CONFIG = {
  A: { name: '信息图风', style: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。' },
  B: { name: '插画科普风', style: '扁平插画风格，天蓝色背景，搭配橙黄色强调色。' },
  C: { name: '图文混排风', style: '照片为主的排版风格，留白充足，文字简洁。' },
  D: { name: '卡通绘本风', style: '可爱卡通插画风格，柔和的暖色调背景。' },
  E: { name: '手绘笔记风', style: '手绘线条风格，米色笔记本背景。' }
}

// 平台尺寸
const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, name: '小红书' },
  wechat: { width: 1080, height: 1920, name: '微信' },
  mobile: { width: 1080, height: 1920, name: '手机竖屏' },
  poster: { width: 2480, height: 3508, name: '海报' }
}

// 调用Coze API生成图片
async function generateImage(prompt: string, apiKey: string) {
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
    
    if (result.code !== 0) {
      throw new Error(result.msg || 'API调用失败')
    }
    
    return result.data?.image_url || ''
  } catch (error) {
    throw new Error(`图片生成失败: ${error.message}`)
  }
}

export default async function (ctx: FunctionContext) {
  const { body } = ctx
  
  try {
    const { 
      topic,
      platform = 'ppt',
      audience = 'adult',
      scene = 'report',
      style = 'A',
      pageCount = 10
    } = body || {}
    
    // 参数验证
    if (!topic) {
      return { success: false, error: '缺少PPT主题' }
    }
    
    const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.A
    
    // 生成封面prompt
    const coverPrompt = `生成一张${platformSize.name}封面页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n页面中央展示主标题「${topic}」，粗体，字号适中。整体留白充足。`
    
    // 生成图片
    const images = []
    
    // 封面页
    try {
      const coverUrl = await generateImage(coverPrompt, PLATFORM_API_KEY)
      images.push({ page_id: 1, type: 'cover', url: coverUrl })
    } catch (error) {
      images.push({ page_id: 1, type: 'cover', error: error.message })
    }
    
    // 内容页（简化：只生成1-2页测试）
    const contentPrompt = `生成一张${platformSize.name}内容页。\n\n${styleConfig.style}\n\n尺寸：${platformSize.width}x${platformSize.height}\n\n标题「${topic} - 核心内容」位于页面左上角。页面中央展示3个要点。整体布局清晰。`
    
    try {
      const contentUrl = await generateImage(contentPrompt, PLATFORM_API_KEY)
      images.push({ page_id: 2, type: 'content', url: contentUrl })
    } catch (error) {
      images.push({ page_id: 2, type: 'content', error: error.message })
    }
    
    return {
      success: true,
      ppt_title: topic,
      style: styleConfig.name,
      platform: platformSize.name,
      images: images
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
