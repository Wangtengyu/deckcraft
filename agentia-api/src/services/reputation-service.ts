/**
 * Agentia API - 声誉服务
 * 处理 Agent 声誉的计算和管理
 */

import db from '../models/database';

/**
 * 声誉计算权重
 */
const REPUTATION_CONFIG = {
  // 加分项
  TASK_WEIGHT: 5,
  KNOWLEDGE_WEIGHT: 10,
  TRADE_SUCCESS_WEIGHT: 3,
  TEAM_CONTRIBUTION_WEIGHT: 15,

  // 减分项
  TRADE_FAILURE_PENALTY: 10,
  REPORT_PENALTY: 50,

  // 基础分
  BASE_REPUTATION: 0,
};

/**
 * 声誉服务类
 */
export class ReputationService {
  /**
   * 计算并更新 Agent 声誉
   * 声誉 = 基础分 + (任务数 × 5) + (知识贡献 × 10) + (成功交换 × 3) + (团队贡献 × 15) - (失败交换 × 10) - (被举报 × 50)
   */
  calculateReputation(agentId: string): number {
    const agent = db.prepare(`
      SELECT 
        stats_tasks_completed,
        stats_knowledge_contributed,
        stats_trades_completed,
        stats_teams_joined
      FROM agents 
      WHERE id = ?
    `).get(agentId) as {
      stats_tasks_completed: number;
      stats_knowledge_contributed: number;
      stats_trades_completed: number;
      stats_teams_joined: number;
    } | undefined;

    if (!agent) {
      return REPUTATION_CONFIG.BASE_REPUTATION;
    }

    const reputation = 
      REPUTATION_CONFIG.BASE_REPUTATION +
      (agent.stats_tasks_completed * REPUTATION_CONFIG.TASK_WEIGHT) +
      (agent.stats_knowledge_contributed * REPUTATION_CONFIG.KNOWLEDGE_WEIGHT) +
      (agent.stats_trades_completed * REPUTATION_CONFIG.TRADE_SUCCESS_WEIGHT) +
      (agent.stats_teams_joined * REPUTATION_CONFIG.TEAM_CONTRIBUTION_WEIGHT);

    return Math.max(0, reputation);
  }

  /**
   * 更新 Agent 声誉
   */
  updateReputation(agentId: string): number {
    const newReputation = this.calculateReputation(agentId);
    
    const stmt = db.prepare('UPDATE agents SET reputation = ? WHERE id = ?');
    stmt.run(newReputation, agentId);

    return newReputation;
  }

  /**
   * 增加任务完成数
   */
  incrementTasksCompleted(agentId: string): void {
    const stmt = db.prepare(`
      UPDATE agents 
      SET stats_tasks_completed = stats_tasks_completed + 1 
      WHERE id = ?
    `);
    stmt.run(agentId);
    this.updateReputation(agentId);
  }

  /**
   * 增加知识贡献数
   */
  incrementKnowledgeContributed(agentId: string): void {
    const stmt = db.prepare(`
      UPDATE agents 
      SET stats_knowledge_contributed = stats_knowledge_contributed + 1 
      WHERE id = ?
    `);
    stmt.run(agentId);
    this.updateReputation(agentId);
  }

  /**
   * 增加交易完成数
   */
  incrementTradesCompleted(agentId: string): void {
    const stmt = db.prepare(`
      UPDATE agents 
      SET stats_trades_completed = stats_trades_completed + 1 
      WHERE id = ?
    `);
    stmt.run(agentId);
    this.updateReputation(agentId);
  }

  /**
   * 增加团队参与数
   */
  incrementTeamsJoined(agentId: string): void {
    const stmt = db.prepare(`
      UPDATE agents 
      SET stats_teams_joined = stats_teams_joined + 1 
      WHERE id = ?
    `);
    stmt.run(agentId);
    this.updateReputation(agentId);
  }

  /**
   * 应用声誉惩罚
   */
  applyPenalty(agentId: string, penaltyType: 'trade_failure' | 'report'): void {
    const penalty = penaltyType === 'report' 
      ? REPUTATION_CONFIG.REPORT_PENALTY 
      : REPUTATION_CONFIG.TRADE_FAILURE_PENALTY;

    const stmt = db.prepare(`
      UPDATE agents 
      SET reputation = MAX(0, reputation - ?) 
      WHERE id = ?
    `);
    stmt.run(penalty, agentId);
  }

  /**
   * 获取 Agent 的声誉等级
   */
  getReputationLevel(agentId: string): {
    level: string;
    name: string;
    reputation: number;
    nextLevel: { name: string; requirement: number } | null;
  } {
    const agent = db.prepare('SELECT reputation FROM agents WHERE id = ?').get(agentId) as { reputation: number } | undefined;
    const reputation = agent?.reputation || 0;

    if (reputation >= 5000) {
      return {
        level: 'pioneer',
        name: '先驱',
        reputation,
        nextLevel: null,
      };
    } else if (reputation >= 1000) {
      return {
        level: 'master',
        name: '大师',
        reputation,
        nextLevel: { name: '先驱', requirement: 5000 },
      };
    } else if (reputation >= 500) {
      return {
        level: 'expert',
        name: '专家',
        reputation,
        nextLevel: { name: '大师', requirement: 1000 },
      };
    } else if (reputation >= 100) {
      return {
        level: 'contributor',
        name: '贡献者',
        reputation,
        nextLevel: { name: '专家', requirement: 500 },
      };
    } else {
      return {
        level: 'newbie',
        name: '新手',
        reputation,
        nextLevel: { name: '贡献者', requirement: 100 },
      };
    }
  }
}

export default new ReputationService();
