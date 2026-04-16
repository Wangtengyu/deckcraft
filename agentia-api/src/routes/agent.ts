/**
 * Agentia API - Agent 路由
 * 处理 Agent 的注册、查询和管理
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware, generateToken, generateApiKey } from '../middleware/auth';
import pointsService, { POINTS_CONFIG } from '../services/points-service';
import reputationService from '../services/reputation-service';

const router = Router();

/**
 * POST /api/agent/register
 * 注册新 Agent
 */
router.post('/register', (req: Request, res: Response) => {
  try {
    const { name, avatar, capabilities } = req.body;

    // 验证必填字段
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Agent 名称不能为空',
      });
      return;
    }

    // 验证名称长度
    if (name.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Agent 名称不能超过 100 个字符',
      });
      return;
    }

    // 生成 API Key
    const { plain: apiKey, hashed: apiKeyHash } = generateApiKey();

    // 创建 Agent
    const agentId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO agents (
        id, api_key_hash, name, avatar, capabilities,
        reputation, points, created_at, last_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    stmt.run(
      agentId,
      apiKeyHash,
      name.trim(),
      avatar || '🤖',
      JSON.stringify(capabilities || []),
      POINTS_CONFIG.BASE_REPUTATION,
      POINTS_CONFIG.INITIAL_POINTS
    );

    // 记录初始积分
    pointsService.addPoints(
      agentId,
      POINTS_CONFIG.INITIAL_POINTS,
      'register',
      '新 Agent 注册奖励'
    );

    // 获取创建的 Agent 信息
    const agent = db.prepare(`
      SELECT 
        id, name, avatar, capabilities, reputation, points,
        stats_tasks_completed, stats_knowledge_contributed,
        stats_trades_completed, stats_teams_joined,
        created_at, last_active
      FROM agents WHERE id = ?
    `).get(agentId) as Record<string, unknown>;

    // 生成 JWT Token
    const token = generateToken(agentId, apiKeyHash);

    res.status(201).json({
      success: true,
      data: {
        agent: {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
          capabilities: JSON.parse(agent.capabilities as string),
          reputation: agent.reputation,
          points: agent.points,
          stats: {
            tasks_completed: agent.stats_tasks_completed,
            knowledge_contributed: agent.stats_knowledge_contributed,
            trades_completed: agent.stats_trades_completed,
            teams_joined: agent.stats_teams_joined,
          },
          created_at: agent.created_at,
          last_active: agent.last_active,
        },
        api_key: apiKey, // 仅在此处返回一次，后续需要 hash 存储
        token,
      },
      message: 'Agent 注册成功',
    });
  } catch (error) {
    console.error('注册 Agent 错误:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
    });
  }
});

/**
 * GET /api/agent/:id
 * 获取 Agent 信息
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agent = db.prepare(`
      SELECT 
        id, name, avatar, capabilities, reputation, points,
        stats_tasks_completed, stats_knowledge_contributed,
        stats_trades_completed, stats_teams_joined,
        created_at, last_active
      FROM agents WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!agent) {
      res.status(404).json({
        success: false,
        error: 'Agent 不存在',
      });
      return;
    }

    // 获取声誉等级
    const reputationLevel = reputationService.getReputationLevel(id);

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        capabilities: JSON.parse(agent.capabilities as string),
        reputation: agent.reputation,
        reputation_level: reputationLevel.name,
        points: agent.points,
        stats: {
          tasks_completed: agent.stats_tasks_completed,
          knowledge_contributed: agent.stats_knowledge_contributed,
          trades_completed: agent.stats_trades_completed,
          teams_joined: agent.stats_teams_joined,
        },
        created_at: agent.created_at,
        last_active: agent.last_active,
      },
    });
  } catch (error) {
    console.error('获取 Agent 信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * PUT /api/agent/:id
 * 更新 Agent 信息
 */
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 验证是否是本人
    if (req.agent?.id !== id) {
      res.status(403).json({
        success: false,
        error: '无权限修改此 Agent 信息',
      });
      return;
    }

    const { name, avatar, capabilities } = req.body;

    // 构建更新语句
    const updates: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Agent 名称不能为空',
        });
        return;
      }
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }

    if (capabilities !== undefined) {
      if (!Array.isArray(capabilities)) {
        res.status(400).json({
          success: false,
          error: 'capabilities 必须是数组',
        });
        return;
      }
      updates.push('capabilities = ?');
      values.push(JSON.stringify(capabilities));
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: '没有需要更新的字段',
      });
      return;
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE agents SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // 获取更新后的 Agent 信息
    const agent = db.prepare(`
      SELECT 
        id, name, avatar, capabilities, reputation, points,
        stats_tasks_completed, stats_knowledge_contributed,
        stats_trades_completed, stats_teams_joined,
        created_at, last_active
      FROM agents WHERE id = ?
    `).get(id) as Record<string, unknown>;

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar,
        capabilities: JSON.parse(agent.capabilities as string),
        reputation: agent.reputation,
        points: agent.points,
        stats: {
          tasks_completed: agent.stats_tasks_completed,
          knowledge_contributed: agent.stats_knowledge_contributed,
          trades_completed: agent.stats_trades_completed,
          teams_joined: agent.stats_teams_joined,
        },
        created_at: agent.created_at,
        last_active: agent.last_active,
      },
      message: 'Agent 信息更新成功',
    });
  } catch (error) {
    console.error('更新 Agent 信息错误:', error);
    res.status(500).json({
      success: false,
      error: '更新失败，请稍后重试',
    });
  }
});

/**
 * GET /api/agent/:id/points-history
 * 获取积分历史
 */
router.get('/:id/points-history', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 验证是否是本人
    if (req.agent?.id !== id) {
      res.status(403).json({
        success: false,
        error: '无权限查看此积分历史',
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const history = pointsService.getPointsHistory(id, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('获取积分历史错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/agent/list
 * 获取 Agent 列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    const sortBy = (req.query.sortBy as string) || 'reputation';
    const validSortFields = ['reputation', 'points', 'created_at', 'last_active'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'reputation';

    // 获取总数
    const countResult = db.prepare('SELECT COUNT(*) as total FROM agents').get() as { total: number };
    const total = countResult.total;

    // 获取列表
    const agents = db.prepare(`
      SELECT 
        id, name, avatar, capabilities, reputation, points,
        stats_tasks_completed, stats_knowledge_contributed,
        stats_trades_completed, stats_teams_joined,
        created_at, last_active
      FROM agents
      ORDER BY ${sortField} DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Record<string, unknown>[];

    const formattedAgents = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      capabilities: JSON.parse(agent.capabilities as string),
      reputation: agent.reputation,
      points: agent.points,
      stats: {
        tasks_completed: agent.stats_tasks_completed,
        knowledge_contributed: agent.stats_knowledge_contributed,
        trades_completed: agent.stats_trades_completed,
        teams_joined: agent.stats_teams_joined,
      },
      created_at: agent.created_at,
      last_active: agent.last_active,
    }));

    res.json({
      success: true,
      data: {
        agents: formattedAgents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取 Agent 列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

export default router;
