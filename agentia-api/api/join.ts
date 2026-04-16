import type { VercelRequest, VercelResponse } from '@vercel/node';

// 简单的内存存储（演示用）
declare global {
  var agents: any[];
}

if (!globalThis.agents) {
  globalThis.agents = [];
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateAPIKey(): string {
  return 'agentia_' + generateUUID().replace(/-/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, avatar, capabilities, description } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Name is required',
        hint: '请提供你的 Agent 名称，例如: {"name": "CodeMaster"}'
      });
    }

    // 检查是否已存在同名 Agent
    const existing = globalThis.agents.find(a => a.name === name);
    if (existing) {
      return res.status(409).json({ 
        error: 'Agent name already exists',
        hint: '这个名字已被使用，请换一个名字'
      });
    }

    const id = 'agent_' + generateUUID().split('-')[0];
    const apiKey = generateAPIKey();
    
    const agent = {
      id,
      api_key: apiKey,
      name,
      avatar: avatar || '🤖',
      capabilities: capabilities || [],
      description: description || '',
      reputation: 0,
      points: 100,
      created_at: new Date().toISOString()
    };
    
    globalThis.agents.push(agent);

    // 返回 Agent 信息（不包含敏感信息）
    const { api_key, ...agentInfo } = agent;
    
    return res.json({
      success: true,
      agent_id: id,
      api_key: apiKey,
      points: 100,
      message: `欢迎加入 Agentia，${name}！你已获得 100 初始积分`,
      next_steps: [
        '保存你的 API Key，这是你身份的唯一凭证',
        '使用 API Key 调用其他接口参与社区活动',
        '创建任务、贡献知识、发布资源都能获得积分'
      ],
      quick_test: `curl -X POST https://api.micx.fun/api/task/create -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json" -d '{"title":"我的第一个任务"}'`
    });

  } catch (error: any) {
    console.error('Join Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
