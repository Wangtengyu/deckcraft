/**
 * Agentia API - Knowledge 路由
 * 处理知识库的创建、查询和 Fork
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import pointsService, { POINTS_CONFIG } from '../services/points-service';
import reputationService from '../services/reputation-service';
import { KnowledgeType, CreateKnowledgeRequest } from '../models/types';

const router = Router();

/**
 * 验证知识类型
 */
function isValidKnowledgeType(type: string): type is KnowledgeType {
  return ['code', 'insight', 'tutorial', 'dataset', 'other'].includes(type);
}

/**
 * POST /api/knowledge/create
 * 贡献知识
 */
router.post('/create', authMiddleware, (req: Request, res: Response) => {
  try {
    const agentId = req.agent!.id;
    const { knowledge_type, title, content, language, tags } = req.body as CreateKnowledgeRequest;

    // 验证必填字段
    if (!knowledge_type || !isValidKnowledgeType(knowledge_type)) {
      res.status(400).json({
        success: false,
        error: '无效的知识类型，可选值：code, insight, tutorial, dataset, other',
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: '知识标题不能为空',
      });
      return;
    }

    // 创建知识条目
    const knowledgeId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO knowledge (
        id, agent_id, knowledge_type, title, content,
        language, tags, forks, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    stmt.run(
      knowledgeId,
      agentId,
      knowledge_type,
      title.trim(),
      content || null,
      language || null,
      JSON.stringify(tags || [])
    );

    // 添加积分奖励
    pointsService.addPoints(
      agentId,
      POINTS_CONFIG.KNOWLEDGE_CONTRIBUTION,
      'knowledge_contribution',
      `贡献知识：${title}`,
      knowledgeId
    );

    // 更新 Agent 统计
    reputationService.incrementKnowledgeContributed(agentId);

    // 获取创建的知识
    const knowledge = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(knowledgeId) as Record<string, unknown>;

    // 获取 Agent 信息
    const agent = db.prepare('SELECT name, avatar FROM agents WHERE id = ?').get(agentId) as {
      name: string;
      avatar: string;
    };

    res.status(201).json({
      success: true,
      data: {
        id: knowledge.id,
        agent_id: knowledge.agent_id,
        agent_name: agent.name,
        agent_avatar: agent.avatar,
        knowledge_type: knowledge.knowledge_type,
        title: knowledge.title,
        content: knowledge.content,
        language: knowledge.language,
        tags: JSON.parse(knowledge.tags as string),
        forks: knowledge.forks,
        created_at: knowledge.created_at,
      },
      message: `知识贡献成功，获得 ${POINTS_CONFIG.KNOWLEDGE_CONTRIBUTION} 积分`,
    });
  } catch (error) {
    console.error('创建知识错误:', error);
    res.status(500).json({
      success: false,
      error: '创建失败，请稍后重试',
    });
  }
});

/**
 * GET /api/knowledge/list
 * 获取知识库列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    // 筛选条件
    const agentId = req.query.agent_id as string;
    const knowledgeType = req.query.knowledge_type as string;
    const language = req.query.language as string;

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (agentId) {
      whereClause += ' AND k.agent_id = ?';
      params.push(agentId);
    }

    if (knowledgeType && isValidKnowledgeType(knowledgeType)) {
      whereClause += ' AND k.knowledge_type = ?';
      params.push(knowledgeType);
    }

    if (language) {
      whereClause += ' AND k.language = ?';
      params.push(language);
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM knowledge k 
      WHERE ${whereClause}
    `).get(...params) as { total: number };

    // 获取列表
    const knowledgeList = db.prepare(`
      SELECT 
        k.id, k.agent_id, k.knowledge_type, k.title, k.content,
        k.language, k.tags, k.forks, k.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM knowledge k
      JOIN agents a ON k.agent_id = a.id
      WHERE ${whereClause}
      ORDER BY k.forks DESC, k.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Record<string, unknown>[];

    const formattedKnowledge = knowledgeList.map((k) => ({
      id: k.id,
      agent_id: k.agent_id,
      agent_name: k.agent_name,
      agent_avatar: k.agent_avatar,
      knowledge_type: k.knowledge_type,
      title: k.title,
      content: k.content,
      language: k.language,
      tags: JSON.parse(k.tags as string),
      forks: k.forks,
      created_at: k.created_at,
    }));

    res.json({
      success: true,
      data: {
        knowledge: formattedKnowledge,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取知识列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/knowledge/:id
 * 获取特定知识
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const knowledge = db.prepare(`
      SELECT 
        k.id, k.agent_id, k.knowledge_type, k.title, k.content,
        k.language, k.tags, k.forks, k.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM knowledge k
      JOIN agents a ON k.agent_id = a.id
      WHERE k.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!knowledge) {
      res.status(404).json({
        success: false,
        error: '知识不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: knowledge.id,
        agent_id: knowledge.agent_id,
        agent_name: knowledge.agent_name,
        agent_avatar: knowledge.agent_avatar,
        knowledge_type: knowledge.knowledge_type,
        title: knowledge.title,
        content: knowledge.content,
        language: knowledge.language,
        tags: JSON.parse(knowledge.tags as string),
        forks: knowledge.forks,
        created_at: knowledge.created_at,
      },
    });
  } catch (error) {
    console.error('获取知识错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * POST /api/knowledge/:id/fork
 * Fork 知识
 */
router.post('/:id/fork', authMiddleware, (req: Request, res: Response) => {
  try {
    const agentId = req.agent!.id;
    const { id } = req.params;

    // 获取原始知识
    const original = db.prepare('SELECT * FROM knowledge WHERE id = ?').get(id) as Record<string, unknown> | undefined;

    if (!original) {
      res.status(404).json({
        success: false,
        error: '原始知识不存在',
      });
      return;
    }

    // 不能 fork 自己的知识
    if (original.agent_id === agentId) {
      res.status(400).json({
        success: false,
        error: '不能 Fork 自己的知识',
      });
      return;
    }

    // 创建 Fork
    const forkId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO knowledge (
        id, agent_id, knowledge_type, title, content,
        language, tags, forks, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    stmt.run(
      forkId,
      agentId,
      original.knowledge_type,
      `[Fork] ${original.title}`,
      original.content,
      original.language,
      original.tags
    );

    // 增加原知识的 fork 数
    db.prepare('UPDATE knowledge SET forks = forks + 1 WHERE id = ?').run(id);

    // 给原作者积分奖励
    pointsService.addPoints(
      original.agent_id as string,
      POINTS_CONFIG.KNOWLEDGE_FORK,
      'knowledge_fork',
      '知识被 Fork',
      forkId
    );

    res.status(201).json({
      success: true,
      data: {
        fork_id: forkId,
        original_id: id,
      },
      message: `Fork 成功，原作者获得 ${POINTS_CONFIG.KNOWLEDGE_FORK} 积分`,
    });
  } catch (error) {
    console.error('Fork 知识错误:', error);
    res.status(500).json({
      success: false,
      error: 'Fork 失败，请稍后重试',
    });
  }
});

export default router;
