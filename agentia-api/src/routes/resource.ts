/**
 * Agentia API - Resource 路由
 * 处理资源交换的创建和查询
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import { ExchangeType, ResourceType, CreateResourceRequest } from '../models/types';

const router = Router();

/**
 * 验证交换类型
 */
function isValidExchangeType(type: string): type is ExchangeType {
  return ['offer', 'request', 'trade'].includes(type);
}

/**
 * 验证资源类型
 */
function isValidResourceType(type: string): type is ResourceType {
  return ['skill', 'data', 'compute', 'api', 'other'].includes(type);
}

/**
 * 验证资源状态
 */
function isValidResourceStatus(status: string): boolean {
  return ['open', 'closed', 'completed'].includes(status);
}

/**
 * POST /api/resource/create
 * 创建资源交换
 */
router.post('/create', authMiddleware, (req: Request, res: Response) => {
  try {
    const agentId = req.agent!.id;
    const { exchange_type, resource_type, title, description, points_required } = req.body as CreateResourceRequest;

    // 验证必填字段
    if (!exchange_type || !isValidExchangeType(exchange_type)) {
      res.status(400).json({
        success: false,
        error: '无效的交换类型，可选值：offer, request, trade',
      });
      return;
    }

    if (!resource_type || !isValidResourceType(resource_type)) {
      res.status(400).json({
        success: false,
        error: '无效的资源类型，可选值：skill, data, compute, api, other',
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: '资源标题不能为空',
      });
      return;
    }

    // 验证积分
    const points = points_required || 0;
    if (points < 0) {
      res.status(400).json({
        success: false,
        error: '所需积分不能为负数',
      });
      return;
    }

    // 如果是 request 类型，检查积分是否足够
    if (exchange_type === 'request') {
      const agent = db.prepare('SELECT points FROM agents WHERE id = ?').get(agentId) as { points: number };
      if (agent.points < points) {
        res.status(400).json({
          success: false,
          error: '积分不足',
        });
        return;
      }
    }

    // 创建资源
    const resourceId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO resources (
        id, agent_id, exchange_type, resource_type, title,
        description, points_required, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', datetime('now'))
    `);

    stmt.run(
      resourceId,
      agentId,
      exchange_type,
      resource_type,
      title.trim(),
      description || null,
      points
    );

    // 如果是 request，扣除积分
    if (exchange_type === 'request' && points > 0) {
      db.prepare('UPDATE agents SET points = points - ? WHERE id = ?').run(points, agentId);
    }

    // 获取创建的资源
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId) as Record<string, unknown>;

    // 获取 Agent 信息
    const agent = db.prepare('SELECT name, avatar FROM agents WHERE id = ?').get(agentId) as {
      name: string;
      avatar: string;
    };

    res.status(201).json({
      success: true,
      data: {
        id: resource.id,
        agent_id: resource.agent_id,
        agent_name: agent.name,
        agent_avatar: agent.avatar,
        exchange_type: resource.exchange_type,
        resource_type: resource.resource_type,
        title: resource.title,
        description: resource.description,
        points_required: resource.points_required,
        status: resource.status,
        created_at: resource.created_at,
      },
      message: '资源创建成功',
    });
  } catch (error) {
    console.error('创建资源错误:', error);
    res.status(500).json({
      success: false,
      error: '创建失败，请稍后重试',
    });
  }
});

/**
 * GET /api/resource/list
 * 获取资源列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    // 筛选条件
    const agentId = req.query.agent_id as string;
    const exchangeType = req.query.exchange_type as string;
    const resourceType = req.query.resource_type as string;
    const status = req.query.status as string;

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (agentId) {
      whereClause += ' AND r.agent_id = ?';
      params.push(agentId);
    }

    if (exchangeType && isValidExchangeType(exchangeType)) {
      whereClause += ' AND r.exchange_type = ?';
      params.push(exchangeType);
    }

    if (resourceType && isValidResourceType(resourceType)) {
      whereClause += ' AND r.resource_type = ?';
      params.push(resourceType);
    }

    if (status && isValidResourceStatus(status)) {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM resources r 
      WHERE ${whereClause}
    `).get(...params) as { total: number };

    // 获取列表
    const resources = db.prepare(`
      SELECT 
        r.id, r.agent_id, r.exchange_type, r.resource_type, r.title,
        r.description, r.points_required, r.status, r.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM resources r
      JOIN agents a ON r.agent_id = a.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Record<string, unknown>[];

    const formattedResources = resources.map((r) => ({
      id: r.id,
      agent_id: r.agent_id,
      agent_name: r.agent_name,
      agent_avatar: r.agent_avatar,
      exchange_type: r.exchange_type,
      resource_type: r.resource_type,
      title: r.title,
      description: r.description,
      points_required: r.points_required,
      status: r.status,
      created_at: r.created_at,
    }));

    res.json({
      success: true,
      data: {
        resources: formattedResources,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取资源列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/resource/:id
 * 获取特定资源
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resource = db.prepare(`
      SELECT 
        r.id, r.agent_id, r.exchange_type, r.resource_type, r.title,
        r.description, r.points_required, r.status, r.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM resources r
      JOIN agents a ON r.agent_id = a.id
      WHERE r.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!resource) {
      res.status(404).json({
        success: false,
        error: '资源不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: resource.id,
        agent_id: resource.agent_id,
        agent_name: resource.agent_name,
        agent_avatar: resource.agent_avatar,
        exchange_type: resource.exchange_type,
        resource_type: resource.resource_type,
        title: resource.title,
        description: resource.description,
        points_required: resource.points_required,
        status: resource.status,
        created_at: resource.created_at,
      },
    });
  } catch (error) {
    console.error('获取资源错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * PUT /api/resource/:id/status
 * 更新资源状态
 */
router.put('/:id/status', authMiddleware, (req: Request, res: Response) => {
  try {
    const agentId = req.agent!.id;
    const { id } = req.params;
    const { status } = req.body;

    // 验证资源状态
    if (!status || !isValidResourceStatus(status)) {
      res.status(400).json({
        success: false,
        error: '无效的状态，可选值：open, closed, completed',
      });
      return;
    }

    // 获取资源
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!resource) {
      res.status(404).json({
        success: false,
        error: '资源不存在',
      });
      return;
    }

    // 验证是否是资源所有者
    if (resource.agent_id !== agentId) {
      res.status(403).json({
        success: false,
        error: '无权限修改此资源',
      });
      return;
    }

    // 更新状态
    db.prepare('UPDATE resources SET status = ? WHERE id = ?').run(status, id);

    res.json({
      success: true,
      data: {
        id: resource.id,
        status,
      },
      message: '状态更新成功',
    });
  } catch (error) {
    console.error('更新资源状态错误:', error);
    res.status(500).json({
      success: false,
      error: '更新失败，请稍后重试',
    });
  }
});

export default router;
