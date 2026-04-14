/**
 * 模板复刻API - Laf云函数
 * Phase 5: 实现模板复刻功能
 * 
 * 功能：
 * 1. 上传PPTX文件
 * 2. 解析模板风格和布局
 * 3. 返回风格标签和每页布局信息
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// 风格映射表
const STYLE_MAPPINGS = {
  // A风格映射
  'red_gold': { style: 'A', subStyle: 'party_red', name: '党政红金' },
  'dark_blue': { style: 'A', subStyle: 'gov_blue', name: '政务蓝' },
  'classical': { style: 'A', subStyle: 'culture', name: '文化古典' },
  'warm_beige': { style: 'A', subStyle: 'tech_warm', name: '米白暖色' },
  'blue_white': { style: 'A', subStyle: 'general_blue', name: '通用蓝白' },
  
  // B风格映射
  'blackboard': { style: 'B', subStyle: 'blackboard', name: '黑板粉笔' },
  'flat_illustration': { style: 'B', subStyle: 'flat_illustration', name: '扁平插画' },
  'warm_yellow': { style: 'B', subStyle: 'warm_yellow', name: '暖黄亲切' },
  
  // C风格映射
  'nature_photo': { style: 'C', subStyle: 'nature', name: '自然风光' },
  'city_photo': { style: 'C', subStyle: 'city', name: '城市建筑' },
  'food_photo': { style: 'C', subStyle: 'food', name: '美食摄影' },
  
  // D风格映射
  'candy': { style: 'D', subStyle: 'candy', name: '糖果色' },
  'watercolor': { style: 'D', subStyle: 'watercolor', name: '绘本水彩' },
  
  // E风格映射
  'hand_drawn': { style: 'E', subStyle: 'hand_drawn', name: '手绘信息图' }
}

/**
 * 分析模板图片，识别风格
 */
async function analyzeTemplateStyle(imageUrl, apiKey) {
  try {
    // 使用多模态模型分析图片
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: {
          prompt: `分析这张PPT模板图片的视觉风格，返回：
1. 主色调（如：蓝色、红色、绿色等）
2. 风格类型（如：信息图、插画、照片、卡通、手绘）
3. 适用场景（如：政务、教育、科技、幼儿等）
4. 布局特征（如：左右分栏、居中、卡片式等）

请用JSON格式返回：{"mainColor": "", "styleType": "", "scene": "", "layout": ""}`,
          images_url: [imageUrl],
          size: '1024x1024',
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      return { error: result.msg || '分析失败' }
    }
    
    // 解析返回结果
    const rawData = result.data
    let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    
    return {
      analysis: parsedData?.output?.data || parsedData,
      error: ''
    }
    
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * 根据分析结果匹配风格标签
 */
function matchStyleTag(analysis) {
  if (!analysis) return { style: 'A', subStyle: 'general_blue', name: '通用蓝白' }
  
  const mainColor = (analysis.mainColor || '').toLowerCase()
  const styleType = (analysis.styleType || '').toLowerCase()
  const scene = (analysis.scene || '').toLowerCase()
  
  // 根据颜色匹配
  if (mainColor.includes('红') || mainColor.includes('red')) {
    if (scene.includes('党建') || scene.includes('党课')) {
      return STYLE_MAPPINGS['red_gold']
    }
    return { style: 'A', subStyle: 'general_blue', name: '通用蓝白' }
  }
  
  if (mainColor.includes('蓝') || mainColor.includes('blue')) {
    if (scene.includes('政务') || scene.includes('政府')) {
      return STYLE_MAPPINGS['dark_blue']
    }
    return STYLE_MAPPINGS['blue_white']
  }
  
  // 根据风格类型匹配
  if (styleType.includes('插画') || styleType.includes('illustration')) {
    return STYLE_MAPPINGS['flat_illustration']
  }
  
  if (styleType.includes('卡通') || styleType.includes('cartoon')) {
    if (mainColor.includes('糖') || mainColor.includes('candy')) {
      return STYLE_MAPPINGS['candy']
    }
    return STYLE_MAPPINGS['watercolor']
  }
  
  if (styleType.includes('照片') || styleType.includes('photo')) {
    if (scene.includes('城市') || scene.includes('建筑')) {
      return STYLE_MAPPINGS['city_photo']
    }
    if (scene.includes('美食') || scene.includes('food')) {
      return STYLE_MAPPINGS['food_photo']
    }
    return STYLE_MAPPINGS['nature_photo']
  }
  
  if (styleType.includes('手绘') || styleType.includes('hand')) {
    return STYLE_MAPPINGS['hand_drawn']
  }
  
  // 根据场景匹配
  if (scene.includes('党建') || scene.includes('党课')) {
    return STYLE_MAPPINGS['red_gold']
  }
  
  if (scene.includes('政务') || scene.includes('政府')) {
    return STYLE_MAPPINGS['dark_blue']
  }
  
  if (scene.includes('幼儿') || scene.includes('儿童')) {
    return STYLE_MAPPINGS['candy']
  }
  
  if (scene.includes('教育') || scene.includes('培训')) {
    return STYLE_MAPPINGS['blackboard']
  }
  
  // 默认返回通用蓝白
  return STYLE_MAPPINGS['blue_white']
}

/**
 * 分析单页布局
 */
function analyzePageLayout(imageUrl, pageRole) {
  const layoutTypes = {
    cover: ['center_title', 'left_title', 'full_image'],
    content: ['two_column', 'three_column', 'title_content', 'image_left', 'image_right'],
    ending: ['center_text', 'contact_info']
  }
  
  // 简化的布局识别逻辑
  // 实际应用中应该使用AI模型进行更精确的识别
  return {
    role: pageRole,
    layout: 'title_content',
    text_density: 'medium',
    image_density: 'low'
  }
}

/**
 * 主函数
 */
export default async function (ctx) {
  console.log('=== 模板复刻API调用 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const templateFile = ctx.body?.template_file
  const templateImages = ctx.body?.template_images || []  // 模板图片URL列表
  const apiKey = COZE_API_KEY
  
  if (!templateFile && templateImages.length === 0) {
    return {
      code: -1,
      message: '缺少模板文件或模板图片',
      data: null
    }
  }
  
  try {
    // 如果提供了模板图片，直接分析
    if (templateImages.length > 0) {
      const results = []
      
      // 分析第一张图片确定整体风格
      const firstImageAnalysis = await analyzeTemplateStyle(templateImages[0], apiKey)
      
      if (firstImageAnalysis.error) {
        return {
          code: -1,
          message: '模板风格分析失败: ' + firstImageAnalysis.error,
          data: null
        }
      }
      
      // 匹配风格标签
      const styleTag = matchStyleTag(firstImageAnalysis.analysis)
      
      // 分析每一页的布局
      const slides = []
      for (let i = 0; i < templateImages.length; i++) {
        const role = i === 0 ? 'cover' : i === templateImages.length - 1 ? 'ending' : 'content'
        const layout = analyzePageLayout(templateImages[i], role)
        slides.push({
          index: i,
          ...layout,
          image_url: templateImages[i]
        })
      }
      
      return {
        code: 0,
        message: 'success',
        data: {
          template_file: templateFile,
          style: {
            tag: `${styleTag.style}_${styleTag.subStyle}`,
            display_name: `${SUB_STYLE_CONFIG[styleTag.style]?.name || ''} · ${styleTag.name}`,
            family: styleTag.style,
            subStyle: styleTag.subStyle,
            confidence: 0.85,
            analysis: firstImageAnalysis.analysis
          },
          slides: slides,
          image_urls: templateImages
        }
      }
    }
    
    // 如果提供了PPTX文件，需要先转换为图片
    // TODO: 实现PPTX转图片功能
    return {
      code: -1,
      message: '暂不支持直接上传PPTX文件，请先转换为图片',
      data: null
    }
    
  } catch (error) {
    console.error('模板分析失败:', error)
    
    return {
      code: -1,
      message: error.message,
      data: null
    }
  }
}

// SUB_STYLE_CONFIG 定义（与 generate-v6.ts 保持一致）
const SUB_STYLE_CONFIG = {
  A: { name: '信息图风' },
  B: { name: '插画科普风' },
  C: { name: '图文混排风' },
  D: { name: '卡通绘本风' },
  E: { name: '手绘笔记风' }
}
