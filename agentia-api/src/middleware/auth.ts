/**
 * Agentia API - 认证中间件
 * 处理 JWT 验证和 API Key 认证
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';
import db from '../models/database';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        name: string;
        apiKey: string;
      };
    }
  }
}

/**
 * JWT Token payload 类型
 */
interface JwtPayload {
  agentId: string;
  apiKey: string;
  iat: number;
  exp: number;
}

/**
 * 验证 JWT Token 中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // 获取 Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: '缺少认证信息',
      });
      return;
    }

    // 检查 Bearer 格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: '无效的认证格式，请使用 Bearer Token',
      });
      return;
    }

    const token = parts[1];

    // 验证 JWT
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 验证 Agent 是否存在
    const agent = db.prepare('SELECT id, name, api_key_hash FROM agents WHERE id = ?').get(decoded.agentId) as {
      id: string;
      name: string;
      api_key_hash: string;
    } | undefined;

    if (!agent) {
      res.status(401).json({
        success: false,
        error: 'Agent 不存在',
      });
      return;
    }

    // 验证 API Key 是否匹配
    if (agent.api_key_hash !== decoded.apiKey) {
      res.status(401).json({
        success: false,
        error: 'API Key 无效',
      });
      return;
    }

    // 更新最后活跃时间
    db.prepare("UPDATE agents SET last_active = datetime('now') WHERE id = ?").run(agent.id);

    // 将 Agent 信息附加到请求对象
    req.agent = {
      id: agent.id,
      name: agent.name,
      apiKey: decoded.apiKey,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token 已过期',
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: '无效的 Token',
      });
      return;
    }

    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      error: '认证服务错误',
    });
  }
}

/**
 * 可选的认证中间件（不会强制要求认证）
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}

/**
 * 解析过期时间配置为秒数
 */
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([dhms])$/);
  if (match) {
    const num = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd': return num * 24 * 60 * 60;
      case 'h': return num * 60 * 60;
      case 'm': return num * 60;
      case 's': return num;
    }
  }
  return 30 * 24 * 60 * 60; // 默认 30 天
}

/**
 * 生成 JWT Token
 */
export function generateToken(agentId: string, apiKey: string): string {
  const expiresInSeconds = parseExpiresIn(config.jwt.expiresIn);
  return jwt.sign(
    { agentId, apiKey },
    config.jwt.secret,
    { expiresIn: expiresInSeconds }
  );
}

/**
 * 生成 API Key
 */
export function generateApiKey(): { plain: string; hashed: string } {
  const plain = `ag_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  const hashed = bcrypt.hashSync(plain, 10);
  return { plain, hashed };
}

/**
 * 验证 API Key
 */
export function verifyApiKey(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed);
}

/**
 * 公开端点装饰器（用于标记哪些路由不需要认证）
 */
export const PUBLIC_ENDPOINTS = [
  'GET /api/stats',
  'GET /api/leaderboard',
  'GET /feed',
];

export default {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  generateApiKey,
  verifyApiKey,
  PUBLIC_ENDPOINTS,
};
