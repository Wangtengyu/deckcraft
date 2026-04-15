/**
 * 演讲稿生成API
 * 基于PPT内容生成口播风格的Word文档
 */

import cloud from '@lafjs/cloud'

// 火山方舟API配置
const ARK_CHAT_API = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_CHAT_MODEL = 'doubao-seed-1-8-251228'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'

// 品牌配置
const BRAND_EN = 'FDeck'
const BRAND_CN = '秒演'

/**
 * 调用火山方舟API生成演讲稿（V9.2 优化版）
 */
async function generateSpeechContent(pptData, style = 'storytelling', options = {}) {
  const { title, pages } = pptData
  const { scene = 'other', audience = 'adult' } = options
  
  // 构建更详细的场景和受众上下文
  const sceneContext = {
    report: '这是一份工作汇报PPT，需要体现专业性和数据支撑',
    proposal: '这是一份项目方案PPT，需要突出方案优势和实施价值',
    training: '这是一份培训课件PPT，需要讲解清晰、易于理解',
    science: '这是一份科普内容PPT，需要生动有趣、联系生活',
    other: '这是一份演示PPT'
  }[scene] || '这是一份演示PPT'
  
  const audienceContext = {
    children: '听众是6-12岁儿童，语言要非常生动有趣，多用比喻和故事',
    students: '听众是12-22岁学生，语言要清晰有启发性',
    adults: '听众是25-50岁成年人，语言要务实专业',
    professionals: '听众是专业人士，语言要精准深入'
  }[audience] || '听众是成年人，语言要务实专业'
  
  // 构建演讲稿生成提示词
  const stylePrompts = {
    formal: '正式商务风格，语言规范严谨，适合正式场合演讲。开场要问候领导，结尾要感谢聆听。',
    casual: '轻松自然风格，口语化表达，适合日常分享。开场可以用轻松的话题引入。',
    storytelling: '故事化风格，用生动的比喻和案例，像讲故事一样表达。有起承转合，有情感高潮。'
  }
  
  // 将每页的详细内容组合成演讲稿上下文
  const contentContext = pages.map((page, idx) => {
    const pageTitle = page.title || `第${idx + 1}部分`
    // 如果content太长，说明是V9.2的详细格式，直接使用
    const pageContent = page.content || ''
    return `${idx + 1}. 【${pageTitle}】${pageContent}`
  }).join('\n\n')

  const prompt = `你是一位经验丰富的演讲稿撰写专家。现在需要你为一篇PPT撰写配套的演讲稿。

## PPT信息
**标题：** ${title}
**类型：** ${sceneContext}
**听众：** ${audienceContext}

## PPT详细内容（请仔细阅读每页内容）：
${contentContext}

## 演讲稿要求：
1. **风格：** ${stylePrompts[style] || stylePrompts.storytelling}
2. **结构完整：**
   - 开场白（自我介绍/问候/引入主题，约50字）
   - 主体内容（按PPT页数顺序展开，每页80-150字）
   - 总结升华（回顾核心观点+呼吁行动/感谢，约60字）
3. **口播风格：** 
   - 像平时说话一样自然流畅
   - 避免书面语和长句
   - 可以加入"各位好"、"接下来"、"大家可以看到"等口语化表达
4. **衔接自然：**
   - 每页之间有过渡语
   - 使用"正如刚才所说"、"接下来我们看"、"值得注意的是"等连接词
5. **情感共鸣：**
   - 适当加入情感表达
   - 可以提问引发思考
   - 数据和案例要配合叙述

## 输出格式：
直接输出演讲稿全文，不要有任何额外的说明或标注。
使用自然的段落分隔，不要列表或序号。
总字数建议：开场(50) + 主体(${pages.length}页 × 100) + 结尾(60) ≈ ${50 + pages.length * 100 + 60}字

请开始撰写演讲稿：`

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
  
  const body = ctx.body || {}
  
  // 兼容多种参数格式
  const pptData = body.pptContent || body.outline || { title: body.title || 'PPT', pages: [] }
  const speechStyle = body.style || body.speechStyle || 'storytelling'
  const scene = body.scene || 'other'
  const audience = body.audience || 'adult'
  const title = body.title || pptData.title || '演示文稿'
  
  if (!pptData.pages || pptData.pages.length === 0) {
    return {
      success: false,
      message: 'PPT内容为空，请先生成PPT'
    }
  }
  
  try {
    // 1. 生成演讲稿内容（传递更多上下文）
    console.log('[演讲稿] 正在生成内容...')
    const result = await generateSpeechContent({ title, ...pptData }, speechStyle, { scene, audience })
    
    if (!result.success) {
      return {
        success: false,
        message: result.error || '生成失败'
      }
    }
    
    const speechContent = result.content
    console.log(`[演讲稿] 生成成功，共 ${speechContent.length} 字`)
    
    // 2. 生成Word文档
    const wordHtml = await generateWordDocument(title, speechContent)
    
    // 3. 返回结果（前端期望script字段）
    return {
      success: true,
      script: speechContent,
      title: title,
      content: speechContent,
      wordHtml: wordHtml,
      wordCount: speechContent.length,
      style: speechStyle,
      message: `演讲稿生成成功，共${speechContent.length}字`
    }
    
  } catch (error) {
    console.error('[演讲稿] 生成异常:', error)
    return {
      success: false,
      message: error.message || '生成失败'
    }
  }
}
