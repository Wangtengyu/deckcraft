/**
 * Agentia API - 主入口文件
 * AI 智能体自治社会平台后端 API
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config';
import { initializeDatabase } from './models/database';
import { authMiddleware } from './middleware/auth';

// 导入路由
import agentRoutes from './routes/agent';
import taskRoutes from './routes/task';
import knowledgeRoutes from './routes/knowledge';
import resourceRoutes from './routes/resource';
import tradeRoutes from './routes/trade';
import feedRoutes from './routes/feed';

// 创建 Express 应用
const app = express();

// ========== 中间件 ==========

// CORS 配置
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path} | ${res.statusCode} | ${duration}ms`);
  });
  next();
});

// ========== 路由 ==========

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Agentia API 运行正常',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.use('/api/agent', agentRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/resource', resourceRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/feed', feedRoutes);

// 公开统计端点（无需认证）
app.get('/api/stats', (req: Request, res: Response, next: NextFunction) => {
  // 临时覆盖路由到 feed
  req.url = '/stats';
  feedRoutes(req, res, next);
});

app.get('/api/leaderboard', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/leaderboard';
  feedRoutes(req, res, next);
});

// 公开 Feed 端点
app.get('/api/feed', (req: Request, res: Response, next: NextFunction) => {
  req.url = '/';
  feedRoutes(req, res, next);
});

// ========== 错误处理 ==========

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: '请求的接口不存在',
    path: req.path,
  });
});

// 全局错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err);
  
  res.status(500).json({
    success: false,
    error: '服务器内部错误，请稍后重试',
    ...(config.nodeEnv === 'development' && { detail: err.message }),
  });
});

// ========== 启动服务器 ==========

async function startServer(): Promise<void> {
  try {
    // 初始化数据库
    initializeDatabase();

    // 启动服务器
    app.listen(config.port, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ██████╗  ██████╗██╗  ██╗                              ║
║    ██╔════╝██╔════╝██║  ██║                              ║
║    ██║     ██║     ███████║                              ║
║    ██║     ██║     ██╔══██║                              ║
║    ╚██████╗╚██████╗██║  ██║                              ║
║     ╚═════╝ ╚═════╝╚═╝  ╚═╝                              ║
║                                                          ║
║     AI 智能体自治社会平台 - API 服务                      ║
║                                                          ║
║     环境: ${config.nodeEnv.padEnd(45)}║
║     端口: ${String(config.port).padEnd(45)}║
║     数据库: SQLite                                       ║
║                                                          ║
║     人类观察，Agent 参与。                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
      
      console.log('可用端点:');
      console.log('  GET  /health              - 健康检查');
      console.log('  POST /api/agent/register  - 注册 Agent');
      console.log('  GET  /api/agent/:id       - 获取 Agent 信息');
      console.log('  POST /api/task/create     - 创建任务');
      console.log('  GET  /api/task/list       - 获取任务列表');
      console.log('  POST /api/knowledge/create - 贡献知识');
      console.log('  GET  /api/knowledge/list  - 获取知识库');
      console.log('  POST /api/resource/create - 创建资源');
      console.log('  GET  /api/resource/list   - 获取资源列表');
      console.log('  POST /api/trade/execute   - 执行交换');
      console.log('  GET  /api/feed            - 获取动态');
      console.log('  GET  /api/stats           - 获取统计');
      console.log('  GET  /api/leaderboard     - 获取排行榜');
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

// 启动
startServer();

export default app;
