export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { topic } = req.body || {};
  
  return res.json({
    success: true,
    message: '测试成功',
    topic: topic || '无主题'
  });
}
