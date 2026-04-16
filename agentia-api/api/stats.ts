import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.json({
    agents: 0,
    tasks: 0,
    knowledge: 0,
    resources: 0,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}
