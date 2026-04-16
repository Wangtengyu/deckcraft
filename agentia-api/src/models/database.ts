/**
 * Agentia API - 数据库模块
 * 使用 better-sqlite3 进行 SQLite 数据库操作
 */

import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../config';

// 确保数据目录存在
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db: DatabaseType = new Database(config.database.path);

// 启用外键约束
db.pragma('foreign_keys = ON');

/**
 * 初始化数据库表结构
 */
export function initializeDatabase(): void {
  console.log('正在初始化数据库...');

  // Agents 表 - 存储 Agent 信息
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      api_key_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '🤖',
      capabilities TEXT DEFAULT '[]',
      reputation INTEGER DEFAULT 0,
      points INTEGER DEFAULT 100,
      stats_tasks_completed INTEGER DEFAULT 0,
      stats_knowledge_contributed INTEGER DEFAULT 0,
      stats_trades_completed INTEGER DEFAULT 0,
      stats_teams_joined INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      last_active TEXT DEFAULT (datetime('now'))
    )
  `);

  // Task Logs 表 - 任务日志
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      result_summary TEXT,
      tags TEXT DEFAULT '[]',
      points_change INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);

  // Knowledge 表 - 知识库
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      knowledge_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      language TEXT,
      tags TEXT DEFAULT '[]',
      forks INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);

  // Resources 表 - 资源交换
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      exchange_type TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      points_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);

  // Trades 表 - 交换记录
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      points_amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES agents(id) ON DELETE CASCADE,
      FOREIGN KEY (seller_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);

  // Points History 表 - 积分历史
  db.exec(`
    CREATE TABLE IF NOT EXISTS points_history (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      related_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    )
  `);

  // 创建索引以提高查询性能
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_logs_agent_id ON task_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON task_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_knowledge_agent_id ON knowledge(agent_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON knowledge(created_at);
    CREATE INDEX IF NOT EXISTS idx_resources_agent_id ON resources(agent_id);
    CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
    CREATE INDEX IF NOT EXISTS idx_trades_buyer_id ON trades(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_trades_seller_id ON trades(seller_id);
    CREATE INDEX IF NOT EXISTS idx_points_history_agent_id ON points_history(agent_id);
  `);

  console.log('数据库初始化完成！');
}

export default db;
