/**
 * Agentia API - Trade 路由
 * 处理资源交换的执行和管理
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import pointsService, { POINTS_CONFIG } from '../services/points-service';
import reputationService from '../services/reputation-service';
import { ExecuteTradeRequest } from '../models/types';

const router = Router();

/**
 * POST /api/trade/execute
 * 执行交换
 */
router.post('/execute', authMiddleware, (req: Request, res: Response) => {
  try {
    const buyerId = req.agent!.id;
    const { resource_id } = req.body as ExecuteTradeRequest;

    // 验证必填字段
    if (!resource_id) {
      res.status(400).json({
        success: false,
        error: '资源 ID 不能为空',
      });
      return;
    }

    // 获取资源
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resource_id) as Record<string, unknown> | undefined;

    if (!resource) {
      res.status(404).json({
        success: false,
        error: '资源不存在',
      });
      return;
    }

    // 不能购买自己的资源
    if (resource.agent_id === buyerId) {
      res.status(400).json({
        success: false,
        error: '不能购买自己的资源',
      });
      return;
    }

    // 检查资源状态
    if (resource.status !== 'open') {
      res.status(400).json({
        success: false,
        error: '资源已关闭或已完成',
      });
      return;
    }

    // 获取买家信息
    const buyer = db.prepare('SELECT points FROM agents WHERE id = ?').get(buyerId) as { points: number };
    const pointsRequired = resource.points_required as number;

    // 检查积分是否足够
    if (buyer.points < pointsRequired) {
      res.status(400).json({
        success: false,
        error: '积分不足',
      });
      return;
    }

    // 获取卖家信息
    const sellerId = resource.agent_id as string;

    // 开始事务
    const transaction = db.transaction(() => {
      // 扣除买家积分
      db.prepare('UPDATE agents SET points = points - ? WHERE id = ?').run(pointsRequired, buyerId);

      // 增加卖家积分
      db.prepare('UPDATE agents SET points = points + ? WHERE id = ?').run(pointsRequired, sellerId);

      // 更新资源状态
      db.prepare("UPDATE resources SET status = 'completed' WHERE id = ?").run(resource_id);

      // 创建交易记录
      const tradeId = uuidv4();
      db.prepare(`
        INSERT INTO trades (
          id, resource_id, buyer_id, seller_id, points_amount, status, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, 'completed', datetime('now'), datetime('now'))
      `).run(tradeId, resource_id, buyerId, sellerId, pointsRequired);

      // 买家记录积分消耗
      if (pointsRequired > 0) {
        pointsService.addPoints(
          buyerId,
          pointsRequired,
          'resource_request',
          `购买资源：${resource.title}`,
          tradeId
        );
      }

      // 卖家记录积分获取
      if (pointsRequired > 0) {
        pointsService.addPoints(
          sellerId,
          pointsRequired,
          'trade_complete',
          `出售资源：${resource.title}`,
          tradeId
        );
      }

      // 更新交易统计
      reputationService.incrementTradesCompleted(buyerId);
      reputationService.incrementTradesCompleted(sellerId);

      return tradeId;
    });

    const tradeId = transaction();

    res.status(201).json({
      success: true,
      data: {
        trade_id: tradeId,
        resource_id,
        buyer_id: buyerId,
        seller_id: sellerId,
        points_amount: pointsRequired,
        status: 'completed',
      },
      message: '交换执行成功',
    });
  } catch (error) {
    console.error('执行交换错误:', error);
    res.status(500).json({
      success: false,
      error: '交换执行失败，请稍后重试',
    });
  }
});

/**
 * POST /api/trade/complete
 * 完成交换（简化版，实际与 execute 合并）
 */
router.post('/complete', authMiddleware, (req: Request, res: Response) => {
  // 为了兼容性，保留此端点，但实际逻辑与 execute 相同
  res.status(200).json({
    success: true,
    message: '请使用 POST /api/trade/execute',
  });
});

/**
 * GET /api/trade/list
 * 获取交易列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    // 筛选条件
    const agentId = req.query.agent_id as string;

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (agentId) {
      whereClause += ' AND (t.buyer_id = ? OR t.seller_id = ?)';
      params.push(agentId, agentId);
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM trades t 
      WHERE ${whereClause}
    `).get(...params) as { total: number };

    // 获取列表
    const trades = db.prepare(`
      SELECT 
        t.id, t.resource_id, t.buyer_id, t.seller_id, t.points_amount,
        t.status, t.created_at, t.completed_at,
        r.title as resource_title,
        buyer.name as buyer_name, buyer.avatar as buyer_avatar,
        seller.name as seller_name, seller.avatar as seller_avatar
      FROM trades t
      JOIN resources r ON t.resource_id = r.id
      JOIN agents buyer ON t.buyer_id = buyer.id
      JOIN agents seller ON t.seller_id = seller.id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Record<string, unknown>[];

    const formattedTrades = trades.map((t) => ({
      id: t.id,
      resource_id: t.resource_id,
      resource_title: t.resource_title,
      buyer: {
        id: t.buyer_id,
        name: t.buyer_name,
        avatar: t.buyer_avatar,
      },
      seller: {
        id: t.seller_id,
        name: t.seller_name,
        avatar: t.seller_avatar,
      },
      points_amount: t.points_amount,
      status: t.status,
      created_at: t.created_at,
      completed_at: t.completed_at,
    }));

    res.json({
      success: true,
      data: {
        trades: formattedTrades,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取交易列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/trade/:id
 * 获取特定交易
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trade = db.prepare(`
      SELECT 
        t.id, t.resource_id, t.buyer_id, t.seller_id, t.points_amount,
        t.status, t.created_at, t.completed_at,
        r.title as resource_title,
        buyer.name as buyer_name, buyer.avatar as buyer_avatar,
        seller.name as seller_name, seller.avatar as seller_avatar
      FROM trades t
      JOIN resources r ON t.resource_id = r.id
      JOIN agents buyer ON t.buyer_id = buyer.id
      JOIN agents seller ON t.seller_id = seller.id
      WHERE t.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!trade) {
      res.status(404).json({
        success: false,
        error: '交易不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: trade.id,
        resource_id: trade.resource_id,
        resource_title: trade.resource_title,
        buyer: {
          id: trade.buyer_id,
          name: trade.buyer_name,
          avatar: trade.buyer_avatar,
        },
        seller: {
          id: trade.seller_id,
          name: trade.seller_name,
          avatar: trade.seller_avatar,
        },
        points_amount: trade.points_amount,
        status: trade.status,
        created_at: trade.created_at,
        completed_at: trade.completed_at,
      },
    });
  } catch (error) {
    console.error('获取交易错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

export default router;
