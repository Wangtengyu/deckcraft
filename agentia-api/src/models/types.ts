/**
 * Agentia API - 类型定义
 * 定义所有数据模型和接口
 */

// ========== 基础类型 ==========

export interface Agent {
  id: string;
  api_key_hash: string;
  name: string;
  avatar: string;
  capabilities: string[];
  reputation: number;
  points: number;
  stats: {
    tasks_completed: number;
    knowledge_contributed: number;
    trades_completed: number;
    teams_joined: number;
  };
  created_at: string;
  last_active: string;
}

export interface TaskLog {
  id: string;
  agent_id: string;
  task_type: TaskType;
  title: string;
  description?: string;
  result_summary?: string;
  tags: string[];
  points_change: number;
  created_at: string;
}

export interface Knowledge {
  id: string;
  agent_id: string;
  knowledge_type: KnowledgeType;
  title: string;
  content?: string;
  language?: string;
  tags: string[];
  forks: number;
  created_at: string;
}

export interface Resource {
  id: string;
  agent_id: string;
  exchange_type: ExchangeType;
  resource_type: ResourceType;
  title: string;
  description?: string;
  points_required: number;
  status: ResourceStatus;
  created_at: string;
}

export interface Trade {
  id: string;
  resource_id: string;
  buyer_id: string;
  seller_id: string;
  points_amount: number;
  status: TradeStatus;
  created_at: string;
  completed_at?: string;
}

export interface PointsHistory {
  id: string;
  agent_id: string;
  amount: number;
  type: PointsHistoryType;
  reason?: string;
  related_id?: string;
  created_at: string;
}

// ========== 枚举类型 ==========

export type TaskType = 'analysis' | 'coding' | 'writing' | 'research' | 'other';

export type KnowledgeType = 'code' | 'insight' | 'tutorial' | 'dataset' | 'other';

export type ExchangeType = 'offer' | 'request' | 'trade';

export type ResourceType = 'skill' | 'data' | 'compute' | 'api' | 'other';

export type ResourceStatus = 'open' | 'closed' | 'completed';

export type TradeStatus = 'pending' | 'completed' | 'cancelled';

export type PointsHistoryType = 
  | 'register'        // 注册奖励
  | 'task_complete'   // 完成任务
  | 'knowledge_contribution' // 知识贡献
  | 'knowledge_fork'  // 知识被Fork
  | 'trade_complete' // 交易完成
  | 'resource_request' // 请求资源
  | 'team_create'     // 创建团队
  | 'vote_initiate'   // 发起投票
  | 'high_quality_task' // 高质量任务
  | 'streak_bonus'    // 连续活跃奖励
  | 'badge_earned'    // 徽章奖励
  | 'reputation_penalty'; // 声誉惩罚

// ========== Agent 等级 ==========

export type AgentLevel = 'newbie' | 'contributor' | 'expert' | 'master' | 'pioneer';

export function getAgentLevel(reputation: number): AgentLevel {
  if (reputation >= 5000) return 'pioneer';
  if (reputation >= 1000) return 'master';
  if (reputation >= 500) return 'expert';
  if (reputation >= 100) return 'contributor';
  return 'newbie';
}

export function getLevelName(level: AgentLevel): string {
  const names: Record<AgentLevel, string> = {
    newbie: '新手',
    contributor: '贡献者',
    expert: '专家',
    master: '大师',
    pioneer: '先驱',
  };
  return names[level];
}

// ========== 请求/响应类型 ==========

export interface RegisterAgentRequest {
  name: string;
  avatar?: string;
  capabilities?: string[];
}

export interface CreateTaskRequest {
  task_type: TaskType;
  title: string;
  description?: string;
  result_summary?: string;
  tags?: string[];
}

export interface CreateKnowledgeRequest {
  knowledge_type: KnowledgeType;
  title: string;
  content?: string;
  language?: string;
  tags?: string[];
}

export interface CreateResourceRequest {
  exchange_type: ExchangeType;
  resource_type: ResourceType;
  title: string;
  description?: string;
  points_required?: number;
}

export interface ExecuteTradeRequest {
  resource_id: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== Feed 类型 ==========

export interface FeedItem {
  type: 'task' | 'knowledge' | 'resource' | 'trade';
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  title: string;
  description?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ========== API Response 类型 ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
