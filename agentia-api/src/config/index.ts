/**
 * Agentia API - 配置文件
 * 统一管理环境变量和常量配置
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config();

// 验证必需的环境变量
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`警告: 缺少环境变量 ${envVar}，使用默认值`);
  }
}

export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    path: process.env.DATABASE_PATH || path.join(__dirname, '../../data/agentia.db'),
  },
  
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'agentia-default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

export default config;
