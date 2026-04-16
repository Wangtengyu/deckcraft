/**
 * Agentia API - 数据库初始化脚本
 * 用于手动初始化数据库
 */

import { initializeDatabase } from '../src/models/database';

console.log('开始初始化 Agentia 数据库...\n');

try {
  initializeDatabase();
  console.log('\n✅ 数据库初始化成功！');
  console.log('数据库文件位置: ./data/agentia.db');
  console.log('\n您现在可以启动 API 服务器了：');
  console.log('  npm run dev');
} catch (error) {
  console.error('\n❌ 数据库初始化失败:', error);
  process.exit(1);
}
