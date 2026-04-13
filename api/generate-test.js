/**
 * DeckCraft PPT生成API - Laf云函数
 */

module.exports = async function (req, res) {
  // CORS设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { topic, pageCount = 10 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ 
        success: false,
        error: '缺少PPT主题' 
      });
    }
    
    // 简单测试：直接返回成功
    return res.json({
      success: true,
      message: 'API工作正常！',
      topic: topic,
      pageCount: pageCount
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
