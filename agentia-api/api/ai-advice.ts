import express from 'express';
const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-eb51213b7bec4a5589536985e0d7a06e';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// AI 建议接口
router.post('/api/ai-advice', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }
    
    // 根据类型生成不同的 prompt
    let prompt = '';
    
    switch (type) {
      case 'encouragement':
        // 结果页鼓励建议
        prompt = `你是一个温暖专业的财务顾问。用户情况：月存${data.monthlySave}元，储蓄率${data.savingsRate}%，目标${data.target}元，预计${data.years}年达成财务自由。请给出一句50字以内的鼓励建议，要具体、有温度、有行动指导。只输出建议，不要其他内容。`;
        break;
        
      case 'savings':
        // 省钱建议
        prompt = `你是一个理财专家。用户月支出结构：住房${data.housing}元(${data.housingPercent}%)，餐饮${data.food}元(${data.foodPercent}%)，交通${data.transport}元，娱乐${data.entertainment}元，其他${data.other}元。总支出${data.totalExpense}元。请给出3条具体可执行的省钱建议，每条30字以内，格式为：1.xxx 2.xxx 3.xxx`;
        break;
        
      case 'goal':
        // 目标规划建议
        prompt = `你是一个人生规划师。用户目标：${data.goalName}，需要${data.goalAmount}元，计划${data.months}个月达成，月存${data.monthlySave}元。请给出一条40字以内的建议，帮助用户更好地达成目标。只输出建议。`;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid advice type' });
    }
    
    // 调用 DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 150,
        temperature: 0.8
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const advice = result.choices[0].message.content.trim();
      res.json({ 
        success: true, 
        advice,
        type 
      });
    } else {
      // 返回默认建议
      res.json({ 
        success: true, 
        advice: getDefaultAdvice(type, data),
        type,
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('AI advice error:', error);
    // 出错时返回默认建议
    res.json({ 
      success: true, 
      advice: getDefaultAdvice(req.body.type, req.body.data),
      type: req.body.type,
      fallback: true,
      error: 'AI service temporarily unavailable'
    });
  }
});

// 默认建议（AI 服务不可用时）
function getDefaultAdvice(type: string, data: any): string {
  switch (type) {
    case 'encouragement':
      return `坚持储蓄，每月存下${data.monthlySave}元，${data.years}年后你将拥有财务自由的选择权。`;
    case 'savings':
      return `1.住房占比偏高，可考虑合租 2.自己做饭可省餐饮支出 3.减少非必要娱乐消费`;
    case 'goal':
      return `设定自动转账，每月固定存入目标账户，让储蓄成为习惯。`;
    default:
      return '保持良好的储蓄习惯，财务自由指日可待。';
  }
}

export default router;
