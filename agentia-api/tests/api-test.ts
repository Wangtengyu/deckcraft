/**
 * Agentia API - API 测试脚本
 * 使用 Node.js 内置 http 模块，无需额外依赖
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * 简易 HTTP 请求封装
 */
async function request(method, path, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`请求失败: ${method} ${path}`, error.message);
    throw error;
  }
}

/**
 * 测试工具函数
 */
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ ${name}`);
    if (error.message) console.error(`   错误: ${error.message}`);
    return false;
  }
}

/**
 * 颜色输出
 */
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * 主测试函数
 */
async function runTests() {
  console.log(colors.bold('\n═══════════════════════════════════════════'));
  console.log(colors.bold('    Agentia API - 测试脚本'));
  console.log(colors.bold('═══════════════════════════════════════════\n'));
  console.log(`测试地址: ${colors.blue(BASE_URL)}\n`);

  let token = null;
  let agentId = null;
  let taskId = null;
  let knowledgeId = null;
  let resourceId = null;
  let results = [];

  // 1. 健康检查
  results.push(await test('健康检查 - GET /health', async () => {
    const res = await request('GET', '/health');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!res.data.success) throw new Error('响应失败');
    console.log(`   ${colors.green('✓')} 服务器版本: ${res.data.version}`);
  }));

  // 2. 获取统计
  results.push(await test('获取统计 - GET /api/stats', async () => {
    const res = await request('GET', '/api/stats');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!res.data.data?.agents) throw new Error('缺少数据');
    console.log(`   ${colors.green('✓')} Agent 总数: ${res.data.data.agents.total}`);
  }));

  // 3. Agent 注册
  results.push(await test('Agent 注册 - POST /api/agent/register', async () => {
    const res = await request('POST', '/api/agent/register', {
      name: `TestAgent_${Date.now()}`,
      avatar: '🤖',
      capabilities: ['coding', 'analysis'],
    });
    if (res.status !== 201) throw new Error(`状态码: ${res.status}`);
    if (!res.data.data?.agent) throw new Error('缺少 agent 数据');
    if (!res.data.data?.token) throw new Error('缺少 token');
    token = res.data.data.token;
    agentId = res.data.data.agent.id;
    console.log(`   ${colors.green('✓')} Agent ID: ${agentId}`);
    console.log(`   ${colors.green('✓')} 初始积分: ${res.data.data.agent.points}`);
  }));

  // 4. 获取 Agent 信息
  results.push(await test('获取 Agent 信息 - GET /api/agent/:id', async () => {
    const res = await request('GET', `/api/agent/${agentId}`);
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (res.data.data.id !== agentId) throw new Error('ID 不匹配');
    console.log(`   ${colors.green('✓')} Agent 名称: ${res.data.data.name}`);
  }));

  // 5. 获取 Agent 列表
  results.push(await test('获取 Agent 列表 - GET /api/agent/list', async () => {
    const res = await request('GET', '/api/agent/list');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.agents)) throw new Error('缺少 agents 数组');
    console.log(`   ${colors.green('✓')} 列表长度: ${res.data.data.agents.length}`);
  }));

  // 6. 创建任务
  results.push(await test('创建任务 - POST /api/task/create', async () => {
    const res = await request('POST', '/api/task/create', {
      task_type: 'coding',
      title: '测试任务 - 分析数据',
      description: '使用 Python 分析销售数据',
      result_summary: '完成了数据分析任务，识别出关键销售趋势和客户行为模式',
      tags: ['python', '数据分析', '机器学习'],
    }, { Authorization: `Bearer ${token}` });
    if (res.status !== 201) throw new Error(`状态码: ${res.status}`);
    taskId = res.data.data.id;
    console.log(`   ${colors.green('✓')} 任务 ID: ${taskId}`);
    console.log(`   ${colors.green('✓')} 获得积分: ${res.data.data.points_change}`);
  }));

  // 7. 获取任务列表
  results.push(await test('获取任务列表 - GET /api/task/list', async () => {
    const res = await request('GET', '/api/task/list');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.tasks)) throw new Error('缺少 tasks 数组');
    console.log(`   ${colors.green('✓')} 列表长度: ${res.data.data.tasks.length}`);
  }));

  // 8. 创建知识
  results.push(await test('创建知识 - POST /api/knowledge/create', async () => {
    const res = await request('POST', '/api/knowledge/create', {
      knowledge_type: 'code',
      title: 'Python 数据分析代码模板',
      content: '# 数据分析模板\nimport pandas as pd\nimport numpy as np\n\ndef analyze_data(df):\n    """分析数据的基本统计信息"""\n    return df.describe()',
      language: 'python',
      tags: ['python', '数据分析', '模板'],
    }, { Authorization: `Bearer ${token}` });
    if (res.status !== 201) throw new Error(`状态码: ${res.status}`);
    knowledgeId = res.data.data.id;
    console.log(`   ${colors.green('✓')} 知识 ID: ${knowledgeId}`);
  }));

  // 9. 获取知识列表
  results.push(await test('获取知识列表 - GET /api/knowledge/list', async () => {
    const res = await request('GET', '/api/knowledge/list');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.knowledge)) throw new Error('缺少 knowledge 数组');
    console.log(`   ${colors.green('✓')} 列表长度: ${res.data.data.knowledge.length}`);
  }));

  // 10. 创建资源
  results.push(await test('创建资源 - POST /api/resource/create', async () => {
    const res = await request('POST', '/api/resource/create', {
      exchange_type: 'offer',
      resource_type: 'skill',
      title: '提供数据分析服务',
      description: '可帮助进行数据清洗、可视化和建模',
      points_required: 50,
    }, { Authorization: `Bearer ${token}` });
    if (res.status !== 201) throw new Error(`状态码: ${res.status}`);
    resourceId = res.data.data.id;
    console.log(`   ${colors.green('✓')} 资源 ID: ${resourceId}`);
  }));

  // 11. 获取资源列表
  results.push(await test('获取资源列表 - GET /api/resource/list', async () => {
    const res = await request('GET', '/api/resource/list');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.resources)) throw new Error('缺少 resources 数组');
    console.log(`   ${colors.green('✓')} 列表长度: ${res.data.data.resources.length}`);
  }));

  // 12. 获取动态
  results.push(await test('获取动态 - GET /api/feed', async () => {
    const res = await request('GET', '/api/feed');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.feed)) throw new Error('缺少 feed 数组');
    console.log(`   ${colors.green('✓')} 动态数量: ${res.data.data.feed.length}`);
  }));

  // 13. 获取排行榜
  results.push(await test('获取排行榜 - GET /api/leaderboard', async () => {
    const res = await request('GET', '/api/leaderboard?type=reputation');
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data?.leaders)) throw new Error('缺少 leaders 数组');
    console.log(`   ${colors.green('✓')} 排行榜人数: ${res.data.data.leaders.length}`);
  }));

  // 14. 获取积分历史
  results.push(await test('获取积分历史 - GET /api/agent/:id/points-history', async () => {
    const res = await request('GET', `/api/agent/${agentId}/points-history`, null, {
      Authorization: `Bearer ${token}`,
    });
    if (res.status !== 200) throw new Error(`状态码: ${res.status}`);
    if (!Array.isArray(res.data.data)) throw new Error('缺少历史数据');
    console.log(`   ${colors.green('✓')} 历史记录: ${res.data.data.length} 条`);
  }));

  // 测试总结
  console.log(colors.bold('\n═══════════════════════════════════════════'));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`    测试结果: ${colors.green(passed)}/${total} 通过`);
  if (passed === total) {
    console.log(colors.green('    🎉 所有测试通过！'));
  } else {
    console.log(colors.yellow(`    ⚠️  ${total - passed} 个测试失败`));
  }
  console.log(colors.bold('═══════════════════════════════════════════\n'));

  process.exit(passed === total ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});
