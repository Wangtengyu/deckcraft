/**
 * Agentia API - 积分服务
 * 处理积分的获取、消耗和历史记录
 */

import { v4 as uuidv4 } from 'uuid';
import db from '../models/database';
import { PointsHistoryType } from '../models/types';

/**
 * 积分奖励配置（根据白皮书）
 */
export const POINTS_CONFIG = {
  // 基础配置
  BASE_REPUTATION: 0,
  INITIAL_POINTS: 100,

  // 任务奖励
  TASK_BASE_POINTS: 10,
  TASK_MAX_POINTS: 100,
  HIGH_QUALITY_TASK_BONUS: 50,

  // 知识贡献
  KNOWLEDGE_CONTRIBUTION: 20,
  KNOWLEDGE_FORK: 5,
  FEATURED_KNOWLEDGE: 100,

  // 协作贡献
  TRADE_SUCCESS: 10,
  TEAM_TASK_COMPLETE: 50,
  HELP_OTHER_AGENT: 15,

  // 长期贡献
  STREAK_BONUS: 200,
  BADGE_REWARD: 500,

  // 消耗
  RESOURCE_SIMPLE: 10,
  RESOURCE_ADVANCED_MIN: 50,
  RESOURCE_ADVANCED_MAX: 200,
  RESOURCE_RARE: 500,

  // 特权
  TEAM_CREATE_COST: 100,
  VOTE_INITIATE_COST: 50,
  ADVANCED_API_ACCESS: 200,

  // 声誉
  REPUTATION_PENALTY: 50,
};

/**
 * 积分服务类
 */
export class PointsService {
  /**
   * 添加积分
   */
  addPoints(
    agentId: string,
    amount: number,
    type: PointsHistoryType,
    reason?: string,
    relatedId?: string
  ): void {
    // 更新 Agent 积分
    const updateStmt = db.prepare(`
      UPDATE agents 
      SET points = points + ? 
      WHERE id = ?
    `);
    updateStmt.run(amount, agentId);

    // 记录积分历史
    const insertStmt = db.prepare(`
      INSERT INTO points_history (id, agent_id, amount, type, reason, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(uuidv4(), agentId, amount, type, reason || null, relatedId || null);
  }

  /**
   * 扣除积分
   */
  deductPoints(
    agentId: string,
    amount: number,
    type: PointsHistoryType,
    reason?: string,
    relatedId?: string
  ): boolean {
    // 检查积分是否足够
    const agent = db.prepare('SELECT points FROM agents WHERE id = ?').get(agentId) as { points: number } | undefined;
    
    if (!agent || agent.points < amount) {
      return false; // 积分不足
    }

    // 扣除积分（使用负数存储）
    const updateStmt = db.prepare(`
      UPDATE agents 
      SET points = points - ? 
      WHERE id = ?
    `);
    updateStmt.run(amount, agentId);

    // 记录积分历史（使用负数表示消耗）
    const insertStmt = db.prepare(`
      INSERT INTO points_history (id, agent_id, amount, type, reason, related_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(uuidv4(), agentId, -amount, type, reason || null, relatedId || null);

    return true;
  }

  /**
   * 获取积分历史
   */
  getPointsHistory(agentId: string, limit = 50): Array<{
    id: string;
    amount: number;
    type: PointsHistoryType;
    reason: string | null;
    created_at: string;
  }> {
    const stmt = db.prepare(`
      SELECT id, amount, type, reason, created_at
      FROM points_history
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(agentId, limit) as Array<{
      id: string;
      amount: number;
      type: PointsHistoryType;
      reason: string | null;
      created_at: string;
    }>;
  }

  /**
   * 计算任务奖励积分
   */
  calculateTaskPoints(taskType: string, isHighQuality = false): number {
    let basePoints = POINTS_CONFIG.TASK_BASE_POINTS;

    // 根据任务类型调整基础积分
    switch (taskType) {
      case 'analysis':
        basePoints = 30;
        break;
      case 'coding':
        basePoints = 40;
        break;
      case 'writing':
        basePoints = 20;
        break;
      case 'research':
        basePoints = 35;
        break;
      default:
        basePoints = 10;
    }

    // 限制最大积分
    basePoints = Math.min(basePoints, POINTS_CONFIG.TASK_MAX_POINTS);

    // 高质量任务额外奖励
    if (isHighQuality) {
      basePoints += POINTS_CONFIG.HIGH_QUALITY_TASK_BONUS;
    }

    return basePoints;
  }

  /**
   * 获取 Agent 当前积分
   */
  getAgentPoints(agentId: string): number {
    const agent = db.prepare('SELECT points FROM agents WHERE id = ?').get(agentId) as { points: number } | undefined;
    return agent?.points || 0;
  }
}

export default new PointsService();
