/**
 * 大纲生成API - 基于主题和参考素材生成PPT大纲
 */
import cloud from '@lafjs/cloud'

const COZE_API_URL = 'https://api.coze.cn/v1/chat'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'
const BOT_ID = '7584118159226241076' // 使用相同的workflow

export default async function (ctx: any) {
  console.log('=== 大纲生成API ===')
  
  try {
    const { topic, pageCount, refDocument, refUrl, scene } = ctx.body
    
    if (!topic) {
      return { ok: false, message: '请提供主题' }
    }
    
    console.log('主题:', topic, '页数:', pageCount)
    console.log('参考文档:', refDocument ? '有' : '无')
    console.log('参考链接:', refUrl ? '有' : '无')
    
    // 构建提示词
    let prompt = `请为以下主题生成一个${pageCount || 5}页的PPT大纲：

主题：${topic}

`
    
    // 添加参考素材
    if (refDocument) {
      prompt += `参考文档内容：
${refDocument.substring(0, 3000)}

`
    }
    
    if (refUrl) {
      prompt += `参考链接内容：
${refUrl.substring(0, 3000)}

`
    }
    
    prompt += `
请按以下JSON格式返回大纲：
{
  "title": "PPT主标题",
  "subtitle": "PPT副标题（可选）",
  "outline": [
    {
      "section": "章节标题",
      "points": ["要点1：具体内容", "要点2：具体内容", "要点3：具体内容"]
    }
  ],
  "ending": "结尾语（如：感谢聆听）"
}

要求：
1. 标题要有观点，不只是描述
2. 每个章节要有2-4个具体要点
3. 要点要有具体内容，不只是关键词
4. 严格按JSON格式返回，不要有多余文字`
    
    // 调用Coze API生成大纲
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user_id: 'user_' + Date.now(),
        stream: false,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { ok: false, message: result.msg || '大纲生成失败' }
    }
    
    // 提取返回内容
    const content = result.data?.messages?.[0]?.content || result.data?.content || ''
    
    // 解析JSON
    let outline
    try {
      // 尝试提取JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到JSON格式的大纲')
      }
    } catch (e) {
      console.error('JSON解析失败:', e)
      // 返回默认大纲
      outline = {
        title: topic,
        outline: [
          { section: '背景介绍', points: ['背景要点1', '背景要点2', '背景要点3'] },
          { section: '核心内容', points: ['核心要点1', '核心要点2', '核心要点3'] },
          { section: '总结展望', points: ['总结要点1', '总结要点2'] }
        ],
        ending: '感谢聆听'
      }
    }
    
    console.log('大纲生成成功:', outline.title, outline.outline?.length, '个章节')
    
    return {
      ok: true,
      outline: outline
    }
    
  } catch (error) {
    console.error('大纲生成失败:', error)
    return {
      ok: false,
      message: error.message || '大纲生成失败'
    }
  }
}
