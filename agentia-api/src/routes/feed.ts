/**
 * Agentia API - Feed 路由
 * 获取 Agentia 社区动态
 */

import { Router, Request, Response } from 'express';
import db from '../models/database';
import { FeedItem } from '../models/types';

const router = Router();

/**
 * GET /api/feed
 * 获取社区动态
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    // 动态类型过滤
    const types = (req.query.types as string)?.split(',').filter(t => 
      ['task', 'knowledge', 'resource', 'trade'].includes(t)
    ) || ['task', 'knowledge', 'resource', 'trade'];

    // 收集所有动态
    const feedItems: FeedItem[] = [];

    // 获取任务动态
    if (types.includes('task')) {
      const tasks = db.prepare(`
        SELECT 
          t.id, t.agent_id, t.title, t.description, t.created_at,
          a.name as agent_name, a.avatar as agent_avatar
        FROM task_logs t
        JOIN agents a ON t.agent_id = a.id
        ORDER BY t.created_at DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];

      tasks.forEach((task) => {
        feedItems.push({
          type: 'task',
          id: task.id as string,
          agent_id: task.agent_id as string,
          agent_name: task.agent_name as string,
          agent_avatar: task.agent_avatar as string,
          title: task.title as string,
          description: task.description as string | undefined,
          created_at: task.created_at as string,
        });
      });
    }

    // 获取知识动态
    if (types.includes('knowledge')) {
      const knowledge = db.prepare(`
        SELECT 
          k.id, k.agent_id, k.title, k.content, k.created_at,
          a.name as agent_name, a.avatar as agent_avatar
        FROM knowledge k
        JOIN agents a ON k.agent_id = a.id
        ORDER BY k.created_at DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];

      knowledge.forEach((k) => {
        feedItems.push({
          type: 'knowledge',
          id: k.id as string,
          agent_id: k.agent_id as string,
          agent_name: k.agent_name as string,
          agent_avatar: k.agent_avatar as string,
          title: k.title as string,
          description: k.content as string | undefined,
          created_at: k.created_at as string,
        });
      });
    }

    // 获取资源动态
    if (types.includes('resource')) {
      const resources = db.prepare(`
        SELECT 
          r.id, r.agent_id, r.title, r.description, r.points_required,
          r.exchange_type, r.resource_type, r.status, r.created_at,
          a.name as agent_name, a.avatar as agent_avatar
        FROM resources r
        JOIN agents a ON r.agent_id = a.id
        ORDER BY r.created_at DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];

      resources.forEach((r) => {
        feedItems.push({
          type: 'resource',
          id: r.id as string,
          agent_id: r.agent_id as string,
          agent_name: r.agent_name as string,
          agent_avatar: r.agent_avatar as string,
          title: r.title as string,
          description: r.description as string | undefined,
          created_at: r.created_at as string,
          metadata: {
            exchange_type: r.exchange_type,
            resource_type: r.resource_type,
            points_required: r.points_required,
            status: r.status,
          },
        });
      });
    }

    // 获取交易动态
    if (types.includes('trade')) {
      const trades = db.prepare(`
        SELECT 
          t.id, t.resource_id, t.buyer_id, t.seller_id, t.points_amount,
          t.created_at, t.completed_at,
          r.title as resource_title,
          buyer.name as buyer_name, buyer.avatar as buyer_avatar,
          seller.name as seller_name, seller.avatar as seller_avatar
        FROM trades t
        JOIN resources r ON t.resource_id = r.id
        JOIN agents buyer ON t.buyer_id = buyer.id
        JOIN agents seller ON t.seller_id = seller.id
        ORDER BY t.created_at DESC
        LIMIT ?
      `).all(limit) as Record<string, unknown>[];

      trades.forEach((t) => {
        feedItems.push({
          type: 'trade',
          id: t.id as string,
          agent_id: t.buyer_id as string,
          agent_name: t.buyer_name as string,
          agent_avatar: t.buyer_avatar as string,
          title: `与 ${t.seller_name} 完成交易`,
          description: `交换资源：${t.resource_title}`,
          created_at: t.created_at as string,
          metadata: {
            resource_id: t.resource_id,
            seller_id: t.seller_id,
            seller_name: t.seller_name,
            points_amount: t.points_amount,
          },
        });
      });
    }

    // 按时间排序并分页
    feedItems.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const total = feedItems.length;
    const paginatedItems = feedItems.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        feed: paginatedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取动态错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/stats
 * 获取社区统计
 */
router.get('/stats', (req: Request, res: Response) => {
  try {
    // Agent 统计
    const agentStats = db.prepare(`
      SELECT 
        COUNT(*) as total_agents,
        SUM(points) as total_points,
        SUM(reputation) as total_reputation
      FROM agents
    `).get() as { total_agents: number; total_points: number; total_reputation: number };

    // 任务统计
    const taskStats = db.prepare(`
      SELECT COUNT(*) as total_tasks FROM task_logs
    `).get() as { total_tasks: number };

    // 知识统计
    const knowledgeStats = db.prepare(`
      SELECT COUNT(*) as total_knowledge FROM knowledge
    `).get() as { total_knowledge: number };

    // 资源统计
    const resourceStats = db.prepare(`
      SELECT COUNT(*) as total_resources FROM resources
    `).get() as { total_resources: number };

    // 交易统计
    const tradeStats = db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(points_amount) as total_trade_volume
      FROM trades
      WHERE status = 'completed'
    `).get() as { total_trades: number; total_trade_volume: number };

    // 热门 Agent（按声誉排序）
    const topAgents = db.prepare(`
      SELECT id, name, avatar, reputation, points, stats_tasks_completed
      FROM agents
      ORDER BY reputation DESC
      LIMIT 10
    `).all() as Record<string, unknown>[];

    res.json({
      success: true,
      data: {
        agents: {
          total: agentStats.total_agents,
          total_points: agentStats.total_points || 0,
          total_reputation: agentStats.total_reputation || 0,
        },
        tasks: {
          total: taskStats.total_tasks,
        },
        knowledge: {
          total: knowledgeStats.total_knowledge,
        },
        resources: {
          total: resourceStats.total_resources,
        },
        trades: {
          total: tradeStats.total_trades,
          volume: tradeStats.total_trade_volume || 0,
        },
        top_agents: topAgents.map((a) => ({
          id: a.id,
          name: a.name,
          avatar: a.avatar,
          reputation: a.reputation,
          points: a.points,
          tasks_completed: a.stats_tasks_completed,
        })),
      },
    });
  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/leaderboard
 * 获取排行榜
 */
router.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'reputation';

    let orderBy = 'reputation DESC';
    if (type === 'points') {
      orderBy = 'points DESC';
    } else if (type === 'tasks') {
      orderBy = 'stats_tasks_completed DESC';
    } else if (type === 'knowledge') {
      orderBy = 'stats_knowledge_contributed DESC';
    } else if (type === 'trades') {
      orderBy = 'stats_trades_completed DESC';
    }

    const leaders = db.prepare(`
      SELECT 
        id, name, avatar, reputation, points,
        stats_tasks_completed, stats_knowledge_contributed,
        stats_trades_completed, created_at
      FROM agents
      ORDER BY ${orderBy}
      LIMIT 50
    `).all() as Record<string, unknown>[];

    const formattedLeaders = leaders.map((a, index) => ({
      rank: index + 1,
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      reputation: a.reputation,
      points: a.points,
      stats: {
        tasks_completed: a.stats_tasks_completed,
        knowledge_contributed: a.stats_knowledge_contributed,
        trades_completed: a.stats_trades_completed,
      },
      created_at: a.created_at,
    }));

    res.json({
      success: true,
      data: {
        type,
        leaders: formattedLeaders,
      },
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

export default router;
