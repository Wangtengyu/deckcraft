/**
 * 大纲生成API V3 - 使用火山方舟AI生成智能大纲
 */
import cloud from '@lafjs/cloud'

// 火山方舟 API 配置
const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'
// 火山方舟模型ID（需要替换为实际的模型ID）
const ARK_MODEL_ID = 'ep-20250414125000000-doubao' // 豆包模型

export default async function (ctx: any) {
  console.log('=== 大纲生成API V3 (火山方舟) ===')
  
  try {
    const { topic, pageCount, refDocument, refUrl, scene } = ctx.body
    
    if (!topic) {
      return { ok: false, message: '请提供主题' }
    }
    
    console.log('主题:', topic, '页数:', pageCount, '场景:', scene)
    
    // 场景说明
    const sceneDesc = {
      report: '工作汇报',
      proposal: '项目方案',
      training: '培训课件',
      science: '知识科普',
      other: '通用内容'
    }[scene] || '通用内容'
    
    // 构建提示词
    const prompt = `请为"${topic}"这个主题生成一个PPT大纲。

要求：
1. 场景类型：${sceneDesc}
2. 页数要求：约${pageCount || 5}页（不含封面和结尾）
3. 每个章节需要3个具体要点
4. 内容要贴合主题，不要空泛

请直接输出JSON格式，不要其他说明：
{
  "title": "PPT标题",
  "subtitle": "副标题（可为空）",
  "outline": [
    {
      "section": "章节名称",
      "points": ["要点1", "要点2", "要点3"]
    }
  ],
  "ending": "结尾语"
}`

    // 调用火山方舟 API
    console.log('调用火山方舟API...')
    const response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ARK_MODEL_ID,
        messages: [
          {
            role: 'system',
            content: '你是一个PPT内容专家，擅长根据主题生成结构清晰、内容具体的大纲。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })
    
    const result = await response.json()
    console.log('火山方舟响应:', JSON.stringify(result).substring(0, 500))
    
    if (result.choices && result.choices[0]?.message?.content) {
      let content = result.choices[0].message.content
      
      // 提取JSON（可能被markdown包裹）
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const outline = JSON.parse(jsonMatch[0])
          
          console.log('AI大纲生成成功:', outline.title, outline.outline?.length, '个章节')
          
          return {
            ok: true,
            outline: outline
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError)
          // 继续使用fallback
        }
      }
    }
    
    // 如果AI调用失败，使用智能模板
    console.log('AI调用失败，使用智能模板')
    return generateFallbackOutline(topic, scene, pageCount)
    
  } catch (error) {
    console.error('大纲生成失败:', error)
    return generateFallbackOutline(ctx.body?.topic || '主题', ctx.body?.scene || 'other', ctx.body?.pageCount || 5)
  }
}

// 备用模板生成
function generateFallbackOutline(topic, scene, pageCount) {
  const templates = {
    report: {
      sections: [
        { section: '背景与目标', points: [`${topic}背景分析`, '核心目标', '关键里程碑'] },
        { section: '执行过程', points: ['前期调研', '实施步骤', '关键动作'] },
        { section: '关键成果', points: ['量化成果', '质量提升', '用户反馈'] },
        { section: '总结展望', points: ['经验总结', '下一步计划'] }
      ],
      ending: '感谢聆听'
    },
    proposal: {
      sections: [
        { section: '问题与机会', points: [`${topic}现状分析`, '核心问题', '改进机会'] },
        { section: '解决方案', points: ['解决思路', '具体方案', '实施路径'] },
        { section: '预期效果', points: ['预期收益', '资源需求', '时间规划'] }
      ],
      ending: '期待合作'
    }
  }
  
  const template = templates[scene] || templates.report
  const sections = template.sections.slice(0, Math.max(2, (pageCount || 5) - 2))
  
  return {
    ok: true,
    outline: {
      title: topic,
      subtitle: '',
      outline: sections,
      ending: template.ending
    }
  }
}
