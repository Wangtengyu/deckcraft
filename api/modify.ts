/**
 * PPT修改API - Laf云函数
 * Phase 4: 实现修改已有PPT功能
 * 
 * 支持三种操作：
 * - delete: 删除指定页面
 * - modify: 修改指定页面内容/风格
 * - add: 在指定位置插入新页面
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// 禁用词列表
const FORBIDDEN_WORDS = [
  '商务', '现代', '专业', '商业', '咨询', '高端', '大气', 
  '童趣', '稳重', '政务', '正式', '规范', '精英', '职场'
]

/**
 * 生成修改页面的Prompt
 */
function generateModifyPrompt(originalPrompt, suggestion, pageType) {
  // 检查禁用词
  let safeSuggestion = suggestion
  FORBIDDEN_WORDS.forEach(word => {
    safeSuggestion = safeSuggestion.replace(new RegExp(word, 'g'), '')
  })
  
  // 根据修改建议类型生成不同的prompt
  const modifyTemplates = {
    style: (original, sug) => `${original}

【修改要求】
${sug}
注意：保持原有文字内容不变，只调整视觉风格。`,
    
    content: (original, sug) => `${original}

【修改要求】
${sug}
注意：保持原有视觉风格不变，只修改文字内容。`,
    
    layout: (original, sug) => `${original}

【修改要求】
${sug}
注意：调整布局结构，保持内容和风格一致。`,
    
    general: (original, sug) => `${original}

【修改要求】
${sug}`
  }
  
  // 智能判断修改类型
  let modifyType = 'general'
  if (suggestion.includes('背景') || suggestion.includes('颜色') || suggestion.includes('风格') || suggestion.includes('配色')) {
    modifyType = 'style'
  } else if (suggestion.includes('文字') || suggestion.includes('标题') || suggestion.includes('内容')) {
    modifyType = 'content'
  } else if (suggestion.includes('布局') || suggestion.includes('排版') || suggestion.includes('位置')) {
    modifyType = 'layout'
  }
  
  return modifyTemplates[modifyType](originalPrompt, safeSuggestion)
}

/**
 * 生成新增页面的Prompt
 */
function generateAddPrompt(content, style, pageType) {
  const stylePrompts = {
    A: '信息图风格，白色工程图纸感背景，浅蓝-白色调，几何色块承载文字。',
    B: '扁平插画风格，天蓝色背景，几何化简化，色彩明亮。',
    C: '图文混排风格，高质量照片为主体，浅色背景衬托。',
    D: '儿童绘本风格，浅黄色背景，糖果色装饰，可爱温馨。',
    E: '手绘信息图风格，米白色纸张肌理背景，手绘线条装饰。'
  }
  
  const baseStyle = stylePrompts[style] || stylePrompts.A
  
  if (pageType === 'cover') {
    return `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${baseStyle}

${content}

整体留白充足。禁止任何人物、人像、照片。`
  } else if (pageType === 'ending') {
    return `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${baseStyle}

${content}

整体留白充足。禁止任何人物、人像、照片。`
  } else {
    return `生成一张信息图海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${baseStyle}

${content}

整体留白充足，层次清晰。禁止任何人物、人像、照片。`
  }
}

/**
 * 调用Coze API生成图片
 */
async function generateImage(prompt, apiKey, size = '4096x2304') {
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
          size: size,
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      return { url: '', error: result.msg || 'API调用失败' }
    }
    
    const rawData = result.data
    let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    
    const imageUrl = parsedData?.output?.data || ''
    const apiMsg = parsedData?.output?.msg || ''
    
    if (apiMsg !== 'success') {
      return { url: '', error: `Workflow错误: ${apiMsg}` }
    }
    
    if (imageUrl && imageUrl.startsWith('http')) {
      return { url: imageUrl, error: '' }
    }
    
    return { url: '', error: '无效的图片URL格式' }
    
  } catch (error) {
    return { url: '', error: error.message }
  }
}

/**
 * 主函数
 */
export default async function (ctx) {
  console.log('=== PPT修改API调用 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const sourceFile = ctx.body?.source_file
  const operations = ctx.body?.operations || []
  const style = ctx.body?.style || 'A'
  const apiKey = COZE_API_KEY
  
  if (!sourceFile) {
    return {
      code: -1,
      message: '缺少源文件参数',
      data: null
    }
  }
  
  if (operations.length === 0) {
    return {
      code: -1,
      message: '缺少操作参数',
      data: null
    }
  }
  
  try {
    const results = []
    
    for (const op of operations) {
      console.log(`处理操作: ${op.action}, 页面: ${op.page_id || op.insert_after}`)
      
      if (op.action === 'delete') {
        // 删除操作：标记需要删除的页面
        results.push({
          action: 'delete',
          page_id: op.page_id,
          status: 'marked'
        })
        
      } else if (op.action === 'modify') {
        // 修改操作：重新生成该页面
        const prompt = generateModifyPrompt(
          op.original_prompt || '',
          op.suggestion,
          op.page_type || 'content'
        )
        
        const imageResult = await generateImage(prompt, apiKey)
        
        results.push({
          action: 'modify',
          page_id: op.page_id,
          status: imageResult.error ? 'failed' : 'success',
          new_image_url: imageResult.url,
          error: imageResult.error
        })
        
      } else if (op.action === 'add') {
        // 新增操作：生成新页面
        const prompt = generateAddPrompt(
          op.content,
          style,
          op.page_type || 'content'
        )
        
        const imageResult = await generateImage(prompt, apiKey)
        
        results.push({
          action: 'add',
          insert_after: op.insert_after,
          status: imageResult.error ? 'failed' : 'success',
          new_image_url: imageResult.url,
          error: imageResult.error
        })
      }
    }
    
    return {
      code: 0,
      message: 'success',
      data: {
        source_file: sourceFile,
        operations: results
      }
    }
    
  } catch (error) {
    console.error('修改失败:', error)
    
    return {
      code: -1,
      message: error.message,
      data: null
    }
  }
}
