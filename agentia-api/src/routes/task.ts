/**
 * Agentia API - Task 路由
 * 处理任务日志的创建和查询
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { authMiddleware } from '../middleware/auth';
import pointsService from '../services/points-service';
import reputationService from '../services/reputation-service';
import { TaskType, CreateTaskRequest } from '../models/types';

const router = Router();

/**
 * 验证任务类型
 */
function isValidTaskType(type: string): type is TaskType {
  return ['analysis', 'coding', 'writing', 'research', 'other'].includes(type);
}

/**
 * POST /api/task/create
 * 创建新任务日志
 */
router.post('/create', authMiddleware, (req: Request, res: Response) => {
  try {
    const agentId = req.agent!.id;
    const { task_type, title, description, result_summary, tags } = req.body as CreateTaskRequest;

    // 验证必填字段
    if (!task_type || !isValidTaskType(task_type)) {
      res.status(400).json({
        success: false,
        error: '无效的任务类型，可选值：analysis, coding, writing, research, other',
      });
      return;
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: '任务标题不能为空',
      });
      return;
    }

    // 计算积分奖励
    const isHighQuality = !!(result_summary && result_summary.length > 100);
    const pointsEarned = pointsService.calculateTaskPoints(task_type, isHighQuality);

    // 创建任务
    const taskId = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO task_logs (
        id, agent_id, task_type, title, description,
        result_summary, tags, points_change, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      taskId,
      agentId,
      task_type,
      title.trim(),
      description || null,
      result_summary || null,
      JSON.stringify(tags || []),
      pointsEarned
    );

    // 添加积分奖励
    pointsService.addPoints(
      agentId,
      pointsEarned,
      isHighQuality ? 'high_quality_task' : 'task_complete',
      `完成任务：${title}`,
      taskId
    );

    // 更新 Agent 统计
    reputationService.incrementTasksCompleted(agentId);

    // 获取创建的任务
    const task = db.prepare('SELECT * FROM task_logs WHERE id = ?').get(taskId) as Record<string, unknown>;

    // 获取 Agent 信息
    const agent = db.prepare('SELECT name, avatar FROM agents WHERE id = ?').get(agentId) as {
      name: string;
      avatar: string;
    };

    res.status(201).json({
      success: true,
      data: {
        id: task.id,
        agent_id: task.agent_id,
        agent_name: agent.name,
        agent_avatar: agent.avatar,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        result_summary: task.result_summary,
        tags: JSON.parse(task.tags as string),
        points_change: task.points_change,
        created_at: task.created_at,
      },
      message: `任务创建成功，获得 ${pointsEarned} 积分`,
    });
  } catch (error) {
    console.error('创建任务错误:', error);
    res.status(500).json({
      success: false,
      error: '创建任务失败，请稍后重试',
    });
  }
});

/**
 * GET /api/task/list
 * 获取任务列表
 */
router.get('/list', (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 20), 100);
    const offset = (page - 1) * limit;

    // 筛选条件
    const agentId = req.query.agent_id as string;
    const taskType = req.query.task_type as string;

    let whereClause = '1=1';
    const params: unknown[] = [];

    if (agentId) {
      whereClause += ' AND t.agent_id = ?';
      params.push(agentId);
    }

    if (taskType && isValidTaskType(taskType)) {
      whereClause += ' AND t.task_type = ?';
      params.push(taskType);
    }

    // 获取总数
    const countResult = db.prepare(`
      SELECT COUNT(*) as total 
      FROM task_logs t 
      WHERE ${whereClause}
    `).get(...params) as { total: number };

    // 获取列表
    const tasks = db.prepare(`
      SELECT 
        t.id, t.agent_id, t.task_type, t.title, t.description,
        t.result_summary, t.tags, t.points_change, t.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM task_logs t
      JOIN agents a ON t.agent_id = a.id
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as Record<string, unknown>[];

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      agent_id: task.agent_id,
      agent_name: task.agent_name,
      agent_avatar: task.agent_avatar,
      task_type: task.task_type,
      title: task.title,
      description: task.description,
      result_summary: task.result_summary,
      tags: JSON.parse(task.tags as string),
      points_change: task.points_change,
      created_at: task.created_at,
    }));

    res.json({
      success: true,
      data: {
        tasks: formattedTasks,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取任务列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

/**
 * GET /api/task/:id
 * 获取特定任务
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const task = db.prepare(`
      SELECT 
        t.id, t.agent_id, t.task_type, t.title, t.description,
        t.result_summary, t.tags, t.points_change, t.created_at,
        a.name as agent_name, a.avatar as agent_avatar
      FROM task_logs t
      JOIN agents a ON t.agent_id = a.id
      WHERE t.id = ?
    `).get(id) as Record<string, unknown> | undefined;

    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: task.id,
        agent_id: task.agent_id,
        agent_name: task.agent_name,
        agent_avatar: task.agent_avatar,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        result_summary: task.result_summary,
        tags: JSON.parse(task.tags as string),
        points_change: task.points_change,
        created_at: task.created_at,
      },
    });
  } catch (error) {
    console.error('获取任务错误:', error);
    res.status(500).json({
      success: false,
      error: '获取失败，请稍后重试',
    });
  }
});

export default router;
