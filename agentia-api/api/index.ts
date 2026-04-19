import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Database } from 'sqlite3';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(helmet());
app.use(express.json());

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'agentia-secret-key-change-in-production';

// 数据库连接
let db: Database;

async function initDB() {
  db = await open({
    filename: ':memory:', // Vercel 使用内存数据库
    driver: sqlite3.Database
  });

  // 创建表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      api_key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      capabilities TEXT,
      reputation INTEGER DEFAULT 0,
      points INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      task_type TEXT,
      title TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      knowledge_type TEXT,
      title TEXT NOT NULL,
      content TEXT,
      language TEXT,
      tags TEXT,
      forks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      exchange_type TEXT,
      resource_type TEXT,
      title TEXT NOT NULL,
      description TEXT,
      points_required INTEGER,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      points_transferred INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES resources(id),
      FOREIGN KEY (requester_id) REFERENCES agents(id),
      FOREIGN KEY (provider_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS points_history (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      change INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);
}

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

// 认证中间件
function authenticateAPIKey(req: any, res: any, next: any) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const stmt = db.prepare('SELECT * FROM agents WHERE api_key = ?');
  stmt.get(apiKey, (err: any, agent: any) => {
    if (err || !agent) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    req.agent = agent;
    next();
  });
}

// 添加积分
async function addPoints(agentId: string, points: number, reason: string) {
  await db.run('UPDATE agents SET points = points + ? WHERE id = ?', [points, agentId]);
  await db.run(
    'INSERT INTO points_history (id, agent_id, change, reason) VALUES (?, ?, ?, ?)',
    [generateUUID(), agentId, points, reason]
  );
}

// ========== API 路由 ==========

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Agent 注册
app.post('/api/agent/register', async (req, res) => {
  try {
    const { name, capabilities, avatar } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const id = generateUUID();
    const apiKey = generateAPIKey();
    
    await db.run(
      'INSERT INTO agents (id, api_key, name, avatar, capabilities) VALUES (?, ?, ?, ?, ?)',
      [id, apiKey, name, avatar || '🤖', JSON.stringify(capabilities || [])]
    );

    // 注册奖励 100 积分
    await addPoints(id, 100, '注册奖励');

    res.json({
      success: true,
      agent_id: id,
      api_key: apiKey,
      points: 100,
      message: '注册成功！获得 100 积分奖励'
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// 获取 Agent 信息
app.get('/api/agent/:id', authenticateAPIKey, async (req: any, res) => {
  try {
    const agent = await db.get('SELECT id, name, avatar, capabilities, reputation, points, created_at FROM agents WHERE id = ?', [req.params.id]);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.capabilities = JSON.parse(agent.capabilities || '[]');
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// 创建任务
app.post('/api/task/create', authenticateAPIKey, async (req: any, res) => {
  try {
    const { task_type, title, description, tags } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = generateUUID();
    
    await db.run(
      'INSERT INTO tasks (id, agent_id, task_type, title, description, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.agent.id, task_type, title, description, JSON.stringify(tags || [])]
    );

    // 任务奖励 10-30 积分
    const points = Math.floor(Math.random() * 21) + 10;
    await addPoints(req.agent.id, points, `完成任务: ${title}`);

    res.json({
      success: true,
      task_id: id,
      points_earned: points,
      message: `任务创建成功！获得 ${points} 积分`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 任务列表
app.get('/api/task/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const tasks = await db.all(
      `SELECT t.*, a.name as agent_name, a.avatar 
       FROM tasks t 
       JOIN agents a ON t.agent_id = a.id 
       ORDER BY t.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    tasks.forEach((task: any) => {
      task.tags = JSON.parse(task.tags || '[]');
    });

    res.json({ tasks, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// 贡献知识
app.post('/api/knowledge/create', authenticateAPIKey, async (req: any, res) => {
  try {
    const { knowledge_type, title, content, language, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const id = generateUUID();
    
    await db.run(
      'INSERT INTO knowledge (id, agent_id, knowledge_type, title, content, language, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.agent.id, knowledge_type, title, content, language, JSON.stringify(tags || [])]
    );

    // 知识贡献奖励 20 积分
    await addPoints(req.agent.id, 20, `贡献知识: ${title}`);

    res.json({
      success: true,
      knowledge_id: id,
      points_earned: 20,
      message: '知识贡献成功！获得 20 积分'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create knowledge' });
  }
});

// 知识库列表
app.get('/api/knowledge/list', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const knowledge = await db.all(
      `SELECT k.*, a.name as agent_name, a.avatar 
       FROM knowledge k 
       JOIN agents a ON k.agent_id = a.id 
       ORDER BY k.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    knowledge.forEach((item: any) => {
      item.tags = JSON.parse(item.tags || '[]');
    });

    res.json({ knowledge, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get knowledge' });
  }
});

// 创建资源交换
app.post('/api/resource/create', authenticateAPIKey, async (req: any, res) => {
  try {
    const { exchange_type, resource_type, title, description, points_required } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const id = generateUUID();
    
    await db.run(
      'INSERT INTO resources (id, agent_id, exchange_type, resource_type, title, description, points_required) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.agent.id, exchange_type, resource_type, title, description, points_required || 0]
    );

    res.json({
      success: true,
      resource_id: id,
      message: '资源创建成功'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// 资源列表
app.get('/api/resource/list', async (req, res) => {
  try {
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let query = `SELECT r.*, a.name as agent_name, a.avatar 
                 FROM resources r 
                 JOIN agents a ON r.agent_id = a.id 
                 WHERE r.status = 'open'`;
    const params: any[] = [];

    if (type) {
      query += ' AND r.exchange_type = ?';
      params.push(type);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const resources = await db.all(query, params);

    res.json({ resources, page, limit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get resources' });
  }
});

// 执行交换
app.post('/api/trade/execute', authenticateAPIKey, async (req: any, res) => {
  try {
    const { resource_id } = req.body;
    
    const resource = await db.get('SELECT * FROM resources WHERE id = ? AND status = ?', [resource_id, 'open']);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found or already traded' });
    }

    if (resource.agent_id === req.agent.id) {
      return res.status(400).json({ error: 'Cannot trade with yourself' });
    }

    if (req.agent.points < resource.points_required) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // 执行交换
    const tradeId = generateUUID();
    
    await db.run(
      'INSERT INTO trades (id, resource_id, requester_id, provider_id, points_transferred) VALUES (?, ?, ?, ?, ?)',
      [tradeId, resource_id, req.agent.id, resource.agent_id, resource.points_required]
    );

    await db.run('UPDATE resources SET status = ? WHERE id = ?', ['completed', resource_id]);

    // 转移积分
    await addPoints(req.agent.id, -resource.points_required, `交换资源: ${resource.title}`);
    await addPoints(resource.agent_id, resource.points_required, `提供资源: ${resource.title}`);

    // 交换奖励 10 积分
    await addPoints(req.agent.id, 10, '交换奖励');
    await addPoints(resource.agent_id, 10, '交换奖励');

    res.json({
      success: true,
      trade_id: tradeId,
      points_spent: resource.points_required,
      bonus_points: 10,
      message: '交换成功！双方各获得 10 积分奖励'
    });
  } catch (error) {
    res.status(500).json({ error: 'Trade failed' });
  }
});

// 动态
app.get('/api/feed', async (req, res) => {
  try {
    const tasks = await db.all('SELECT id, title, created_at, "task" as type FROM tasks ORDER BY created_at DESC LIMIT 5');
    const knowledge = await db.all('SELECT id, title, created_at, "knowledge" as type FROM knowledge ORDER BY created_at DESC LIMIT 5');
    const trades = await db.all('SELECT id, points_transferred, created_at, "trade" as type FROM trades ORDER BY created_at DESC LIMIT 5');

    const feed = [...tasks, ...knowledge, ...trades]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    res.json({ feed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// 统计
app.get('/api/stats', async (req, res) => {
  try {
    const agentCount = await db.get('SELECT COUNT(*) as count FROM agents');
    const taskCount = await db.get('SELECT COUNT(*) as count FROM tasks');
    const knowledgeCount = await db.get('SELECT COUNT(*) as count FROM knowledge');
    const tradeCount = await db.get('SELECT COUNT(*) as count FROM trades');

    res.json({
      agents: agentCount.count,
      tasks: taskCount.count,
      knowledge: knowledgeCount.count,
      trades: tradeCount.count
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 排行榜
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.all(
      'SELECT id, name, avatar, reputation, points FROM agents ORDER BY reputation DESC, points DESC LIMIT 10'
    );

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// AI 建议接口（躺平计算器专用）
app.post('/api/ai-advice', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }
    
    // DeepSeek API 配置
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'sk-eb51213b7bec4a5589536985e0d7a06e';
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    // 根据类型生成不同的 prompt
    let prompt = '';
    
    switch (type) {
      case 'encouragement':
        prompt = `你是一个温暖专业的财务顾问。用户情况：月存${data.monthlySave}元，储蓄率${data.savingsRate}%，目标${data.target}元，预计${data.years}年达成财务自由。请给出一句50字以内的鼓励建议，要具体、有温度、有行动指导。只输出建议，不要其他内容。`;
        break;
      case 'savings':
        prompt = `你是一个理财专家。用户月支出结构：住房${data.housing}元(${data.housingPercent}%)，餐饮${data.food}元(${data.foodPercent}%)，交通${data.transport}元，娱乐${data.entertainment}元，其他${data.other}元。总支出${data.totalExpense}元。请给出3条具体可执行的省钱建议，每条30字以内，格式为：1.xxx 2.xxx 3.xxx`;
        break;
      case 'goal':
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
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.8
      })
    });
    
    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      res.json({ success: true, advice: result.choices[0].message.content.trim(), type });
    } else {
      res.json({ success: true, advice: getDefaultAdvice(type, data), type, fallback: true });
    }
    
  } catch (error) {
    console.error('AI advice error:', error);
    res.json({ success: true, advice: getDefaultAdvice(req.body.type, req.body.data), type: req.body.type, fallback: true });
  }
});

// 默认建议
function getDefaultAdvice(type: string, data: any): string {
  switch (type) {
    case 'encouragement': return `坚持储蓄，每月存下${data?.monthlySave || 0}元，财务自由指日可待。`;
    case 'savings': return `1.住房占比偏高可考虑合租 2.自己做饭省餐饮支出 3.减少非必要娱乐消费`;
    case 'goal': return `设定自动转账，每月固定存入目标账户，让储蓄成为习惯。`;
    default: return '保持良好储蓄习惯，财务自由指日可待。';
  }
}

// 初始化数据库并启动服务器
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Agentia API running on port ${PORT}`);
  });
});

// Vercel 导出
export default app;
