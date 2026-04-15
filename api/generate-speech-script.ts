/**
 * 演讲稿生成API
 * 基于PPT内容生成口播风格的Word文档
 */

const cloud = require('@lafjs/cloud')

// 火山方舟API配置
const ARK_CHAT_API = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_CHAT_MODEL = 'doubao-seed-1-8-251228'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'

// 品牌配置
const BRAND_EN = 'FDeck'
const BRAND_CN = '秒演'

/**
 * 调用火山方舟API生成演讲稿
 */
async function generateSpeechContent(pptData, style = 'storytelling') {
  const { title, pages } = pptData
  
  // 构建演讲稿生成提示词
  const stylePrompts = {
    formal: '正式商务风格，语言规范严谨，适合正式场合演讲',
    casual: '轻松自然风格，口语化表达，适合日常分享',
    storytelling: '故事化风格，用生动的比喻和案例，像讲故事一样表达'
  }
  
  const prompt = `你是一位专业的演讲稿撰写专家。现在需要你为一篇PPT撰写配套的演讲稿。

**PPT标题：** ${title}

**PPT内容结构：**
${pages.map((page, idx) => `
第${idx + 1}页 - ${page.title}
${page.content || page.points?.join('、') || ''}
`).join('\n')}

**演讲稿要求：**
1. 风格：${stylePrompts[style] || stylePrompts.storytelling}
2. 口播风格：像平时说话一样自然流畅，避免书面语
3. 结构完整：开场白引入 → 主体内容展开 → 总结升华
4. 时长控制：总字数约${pages.length * 150}字（每页约150字）
5. 情感共鸣：适当加入情感表达和互动语句
6. 过渡自然：每页内容之间要有自然的过渡和衔接

请直接输出演讲稿全文，不要有任何额外的说明或标注。`

  try {
    const response = await fetch(ARK_CHAT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`
      },
      body: JSON.stringify({
        model: ARK_CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的演讲稿撰写专家，擅长撰写口播风格的演讲稿，语言生动自然，富有感染力。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      })
    })
    
    const data = await response.json()
    
    if (data.choices && data.choices[0]) {
      return {
        success: true,
        content: data.choices[0].message.content.trim()
      }
    } else {
      throw new Error(data.error?.message || '生成失败')
    }
  } catch (error) {
    console.error('[演讲稿生成] 错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 生成Word文档（简化版，使用HTML转Word）
 */
async function generateWordDocument(title, content) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - 演讲稿</title>
  <style>
    body {
      font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
      font-size: 14px;
      line-height: 2;
      padding: 40px;
      color: #333;
    }
    h1 {
      font-size: 24px;
      text-align: center;
      margin-bottom: 40px;
      color: #C41E3A;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 40px;
      font-size: 12px;
    }
    p {
      text-indent: 2em;
      margin: 15px 0;
    }
    .brand {
      text-align: right;
      margin-top: 60px;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${BRAND_CN}演讲稿 | 由${BRAND_CN}AI生成</div>
  
  ${content.split('\n\n').map(p => `<p>${p.trim()}</p>`).join('\n')}
  
  <div class="brand">
    ${BRAND_EN} - ${BRAND_CN}<br>
    生成时间: ${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>
  `
  
  // 返回HTML内容（前端可以直接下载为.doc）
  return html
}

/**
 * 主函数
 */
export default async function (ctx) {
  console.log(`=== ${BRAND_CN} 演讲稿生成开始 ===`)
  
  const { pptContent, style = 'storytelling' } = ctx.body || {}
  
  if (!pptContent || !pptContent.title) {
    return {
      success: false,
      error: '缺少PPT内容'
    }
  }
  
  try {
    // 1. 生成演讲稿内容
    console.log('[演讲稿] 正在生成内容...')
    const result = await generateSpeechContent(pptContent, style)
    
    if (!result.success) {
      return result
    }
    
    const speechContent = result.content
    console.log(`[演讲稿] 生成成功，共 ${speechContent.length} 字`)
    
    // 2. 生成Word文档
    const wordHtml = await generateWordDocument(pptContent.title, speechContent)
    
    // 3. 返回结果
    return {
      success: true,
      title: `${pptContent.title} - 演讲稿`,
      content: speechContent,
      wordHtml: wordHtml,
      wordCount: speechContent.length,
      style: style,
      message: `演讲稿生成成功，共${speechContent.length}字`
    }
    
  } catch (error) {
    console.error('[演讲稿] 生成异常:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
