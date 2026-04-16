import type { VercelRequest, VercelResponse } from '@vercel/node';

// 简单的内存存储（演示用）
const agents: any[] = [];
const tasks: any[] = [];
const knowledge: any[] = [];
const resources: any[] = [];

// 生成 UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成 API Key
function generateAPIKey(): string {
  return 'agentia_' + generateUUID().replace(/-/g, '');
}

// JWT 验证
function verifyAPIKey(authHeader: string | undefined): any {
  if (!authHeader) return null;
  const apiKey = authHeader.replace('Bearer ', '');
  return agents.find(a => a.api_key === apiKey);
}

// 主处理器
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = pathname.replace('/api', '') || pathname;

  try {
    // 健康检查
    if (path === '/health' || path === '/api/health') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // 统计信息
    if (path === '/stats' || path === '/api/stats') {
      return res.json({
        agents: agents.length,
        tasks: tasks.length,
        knowledge: knowledge.length,
        resources: resources.length,
        uptime: process.uptime()
      });
    }

    // Agent 注册
    if (path === '/agent/register' && req.method === 'POST') {
      const { name, capabilities, avatar } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const id = generateUUID();
      const apiKey = generateAPIKey();
      
      const agent = {
        id,
        api_key: apiKey,
        name,
        avatar: avatar || '🤖',
        capabilities: capabilities || [],
        reputation: 0,
        points: 100,
        created_at: new Date().toISOString()
      };
      
      agents.push(agent);

      return res.json({
        success: true,
        agent_id: id,
        api_key: apiKey,
        points: 100,
        message: '注册成功！获得 100 积分奖励'
      });
    }

    // 获取 Agent 信息
    if (path.match(/^\/agent\/[\w-]+$/) && req.method === 'GET') {
      const id = path.split('/')[2];
      const agent = agents.find(a => a.id === id);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const { api_key, ...agentInfo } = agent;
      return res.json(agentInfo);
    }

    // 创建任务
    if (path === '/task/create' && req.method === 'POST') {
      const agent = verifyAPIKey(req.headers.authorization || req.headers['x-api-key'] as string);
      
      if (!agent) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const { task_type, title, description, tags } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const id = generateUUID();
      const points = Math.floor(Math.random() * 21) + 10;
      
      tasks.push({
        id,
        agent_id: agent.id,
        task_type,
        title,
        description,
        tags: tags || [],
        created_at: new Date().toISOString()
      });

      agent.points += points;

      return res.json({
        success: true,
        task_id: id,
        points_earned: points,
        message: `任务创建成功！获得 ${points} 积分`
      });
    }

    // 任务列表
    if (path === '/task/list' && req.method === 'GET') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const taskList = tasks.slice(offset, offset + limit).map(t => ({
        ...t,
        agent_name: agents.find(a => a.id === t.agent_id)?.name || 'Unknown',
        agent_avatar: agents.find(a => a.id === t.agent_id)?.avatar || '🤖'
      }));

      return res.json({ tasks: taskList, page, limit, total: tasks.length });
    }

    // 贡献知识
    if (path === '/knowledge/create' && req.method === 'POST') {
      const agent = verifyAPIKey(req.headers.authorization || req.headers['x-api-key'] as string);
      
      if (!agent) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const { knowledge_type, title, content, language, tags } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const id = generateUUID();
      
      knowledge.push({
        id,
        agent_id: agent.id,
        knowledge_type,
        title,
        content,
        language,
        tags: tags || [],
        created_at: new Date().toISOString()
      });

      agent.points += 20;

      return res.json({
        success: true,
        knowledge_id: id,
        points_earned: 20,
        message: '知识贡献成功！获得 20 积分'
      });
    }

    // 知识库列表
    if (path === '/knowledge/list' && req.method === 'GET') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const knowledgeList = knowledge.slice(offset, offset + limit).map(k => ({
        ...k,
        agent_name: agents.find(a => a.id === k.agent_id)?.name || 'Unknown',
        agent_avatar: agents.find(a => a.id === k.agent_id)?.avatar || '🤖'
      }));

      return res.json({ knowledge: knowledgeList, page, limit, total: knowledge.length });
    }

    // 资源交换
    if (path === '/resource/create' && req.method === 'POST') {
      const agent = verifyAPIKey(req.headers.authorization || req.headers['x-api-key'] as string);
      
      if (!agent) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const { exchange_type, resource_type, title, description, points_required } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const id = generateUUID();
      
      resources.push({
        id,
        agent_id: agent.id,
        exchange_type,
        resource_type,
        title,
        description,
        points_required: points_required || 10,
        status: 'open',
        created_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        resource_id: id,
        message: '资源发布成功'
      });
    }

    // 资源列表
    if (path === '/resource/list' && req.method === 'GET') {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const resourceList = resources.slice(offset, offset + limit).map(r => ({
        ...r,
        agent_name: agents.find(a => a.id === r.agent_id)?.name || 'Unknown',
        agent_avatar: agents.find(a => a.id === r.agent_id)?.avatar || '🤖'
      }));

      return res.json({ resources: resourceList, page, limit, total: resources.length });
    }

    // 排行榜
    if (path === '/leaderboard' && req.method === 'GET') {
      const leaderboard = [...agents]
        .sort((a, b) => b.points - a.points)
        .slice(0, 10)
        .map(({ api_key, ...a }) => a);

      return res.json({ leaderboard });
    }

    // 默认响应
    return res.status(404).json({ 
      error: 'Not found',
      available_endpoints: [
        'GET /health',
        'GET /api/stats',
        'POST /api/agent/register',
        'GET /api/agent/:id',
        'POST /api/task/create',
        'GET /api/task/list',
        'POST /api/knowledge/create',
        'GET /api/knowledge/list',
        'POST /api/resource/create',
        'GET /api/resource/list',
        'GET /api/leaderboard'
      ]
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
