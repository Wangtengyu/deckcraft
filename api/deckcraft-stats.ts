import cloud from '@lafjs/cloud'

// ============ 配置区 ============
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || ''
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || ''

// 飞书多维表格配置
const BITABLE_APP_TOKEN = process.env.BITABLE_APP_TOKEN || ''  // 案例库
const BITABLE_TABLE_ID = process.env.BITABLE_TABLE_ID || ''   // 案例表
const STATS_TABLE_ID = process.env.STATS_TABLE_ID || ''       // 统计表
const RATE_TABLE_ID = process.env.RATE_TABLE_ID || ''         // 限流表

// 限流配置
const RATE_LIMIT_WINDOW = 60 * 1000       // 1分钟窗口
const RATE_LIMIT_MAX_REQUESTS = 5        // 每分钟最多5次
const DAILY_LIMIT_MAX = 10000             // 每日上限10000次
const BAN_DURATION = 30 * 60 * 1000       // 封禁30分钟

// ============ 飞书API工具 ============

// 获取飞书访问令牌
async function getFeishuAccessToken() {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET
    })
  })
  const result = await response.json()
  return result.tenant_access_token
}

// 获取客户端IP
function getClientIP(ctx) {
  return ctx.headers?.['x-real-ip'] || 
         ctx.headers?.['x-forwarded-for']?.split(',')[0] || 
         'unknown'
}

// ============ 限流检查 ============

// 检查IP是否被封禁
async function isIPBanned(ip) {
  if (!BITABLE_APP_TOKEN || !RATE_TABLE_ID) return false
  
  try {
    const token = await getFeishuAccessToken()
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${RATE_TABLE_ID}/records`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const result = await response.json()
    
    if (result.data?.items) {
      const banned = result.data.items.find(item => 
        item.fields?.ip === ip && 
        item.fields?.banned_until && 
        new Date(item.fields.banned_until).getTime() > Date.now()
      )
      return banned ? true : false
    }
  } catch (e) {
    console.error('检查IP封禁失败:', e)
  }
  return false
}

// 封禁IP
async function banIP(ip, reason) {
  if (!BITABLE_APP_TOKEN || !RATE_TABLE_ID) return
  
  try {
    const token = await getFeishuAccessToken()
    const bannedUntil = new Date(Date.now() + BAN_DURATION).toISOString()
    
    await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${RATE_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          ip: ip,
          action: 'ban',
          reason: reason,
          banned_until: bannedUntil,
          created_at: new Date().toISOString()
        }
      })
    })
  } catch (e) {
    console.error('封禁IP失败:', e)
  }
}

// 检查限流
async function checkRateLimit(ip) {
  // 检查是否被封禁
  if (await isIPBanned(ip)) {
    return { allowed: false, reason: 'IP已被封禁，请30分钟后再试' }
  }
  
  // 简化版：使用内存记录
  const now = Date.now()
  const key = `rate_${ip}`
  
  // 获取当前计数
  let record = await cloud.cache.get(key)
  if (!record) {
    record = { count: 0, windowStart: now }
  }
  
  // 重置窗口
  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    record = { count: 0, windowStart: now }
  }
  
  // 检查限制
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // 触发封禁
    await banIP(ip, `超过限流阈值: ${record.count}次/分钟`)
    return { allowed: false, reason: '请求过于频繁，已暂时封禁' }
  }
  
  // 增加计数
  record.count++
  await cloud.cache.set(key, record, 60) // 60秒过期
  
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count }
}

// 记录API调用
async function recordAPICall(ip, endpoint, params) {
  try {
    const token = await getFeishuAccessToken()
    const dailyKey = `daily_${new Date().toISOString().split('T')[0]}`
    
    // 更新每日计数
    let dailyCount = await cloud.cache.get(dailyKey) || 0
    dailyCount++
    await cloud.cache.set(dailyKey, dailyCount, 86400)
    
    // 记录到飞书
    if (BITABLE_APP_TOKEN && STATS_TABLE_ID) {
      await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${STATS_TABLE_ID}/records`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            ip: ip,
            endpoint: endpoint,
            params: JSON.stringify(params).substring(0, 500),
            created_at: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
          }
        })
      })
    }
    
    return { success: true, dailyCount }
  } catch (e) {
    console.error('记录API调用失败:', e)
    return { success: false }
  }
}

// ============ 案例库操作 ============

// 添加案例
async function addCase(caseData) {
  if (!BITABLE_APP_TOKEN || !BITABLE_TABLE_ID) {
    return { success: false, error: '案例库未配置' }
  }
  
  try {
    const token = await getFeishuAccessToken()
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${BITABLE_TABLE_ID}/records`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          title: caseData.title,
          style: caseData.style,
          platform: caseData.platform,
          thumbnail: caseData.thumbnailUrl,
          author: caseData.author || '匿名用户',
          page_count: caseData.pageCount || 0,
          created_at: new Date().toISOString()
        }
      })
    })
    
    const result = await response.json()
    return { success: true, recordId: result.data?.record?.record_id }
  } catch (e) {
    console.error('添加案例失败:', e)
    return { success: false, error: e.message }
  }
}

// 获取案例列表
async function getCases(limit = 10, offset = 0) {
  if (!BITABLE_APP_TOKEN || !BITABLE_TABLE_ID) {
    // 返回模拟数据
    return { 
      success: true, 
      cases: [
        { id: 1, title: '2026年度工作汇报', style: '信息图风', platform: 'PPT', thumbnail: '' },
        { id: 2, title: '产品发布会方案', style: '插画科普风', platform: 'PPT', thumbnail: '' }
      ],
      total: 2 
    }
  }
  
  try {
    const token = await getFeishuAccessToken()
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${BITABLE_TABLE_ID}/records?page_size=${limit}&offset=${offset}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const result = await response.json()
    
    if (result.data?.items) {
      const cases = result.data.items.map(item => ({
        id: item.record_id,
        title: item.fields?.title || '未命名',
        style: item.fields?.style || '',
        platform: item.fields?.platform || '',
        thumbnail: item.fields?.thumbnail || '',
        author: item.fields?.author || '匿名',
        created_at: item.fields?.created_at || ''
      }))
      return { success: true, cases, total: result.data.total }
    }
    
    return { success: true, cases: [], total: 0 }
  } catch (e) {
    console.error('获取案例失败:', e)
    return { success: false, error: e.message }
  }
}

// ============ 访问统计 ============

// 记录访问
async function recordVisit(ip, page) {
  try {
    // 更新缓存中的访问计数
    const pvKey = `pv_${new Date().toISOString().split('T')[0]}`
    const uvKey = `uv_${new Date().toISOString().split('T')[0]}`
    
    // PV +1
    let pv = await cloud.cache.get(pvKey) || 0
    pv++
    await cloud.cache.set(pvKey, pv, 86400)
    
    // UV 记录IP去重
    let uvSet = await cloud.cache.get(uvKey) || []
    if (!Array.isArray(uvSet)) uvSet = []
    if (!uvSet.includes(ip)) {
      uvSet.push(ip)
      await cloud.cache.set(uvKey, uvSet, 86400)
    }
    
    // 获取今日统计
    const todayPV = await cloud.cache.get(pvKey) || 0
    const todayUV = uvSet.length
    
    // 获取总生成次数
    const genKey = 'total_generations'
    let totalGen = await cloud.cache.get(genKey) || 0
    
    return { 
      success: true, 
      stats: { todayPV, todayUV, totalGenerations: totalGen } 
    }
  } catch (e) {
    console.error('记录访问失败:', e)
    return { success: false }
  }
}

// 获取统计数据
async function getStats() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const pvKey = `pv_${today}`
    const uvKey = `uv_${today}`
    const genKey = 'total_generations'
    
    const todayPV = await cloud.cache.get(pvKey) || 0
    const todayUV = (await cloud.cache.get(uvKey))?.length || 0
    const totalGen = await cloud.cache.get(genKey) || 0
    
    return {
      success: true,
      stats: {
        todayPV,
        todayUV,
        totalGenerations: totalGen
      }
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

// 增加生成次数
async function incrementGenerations() {
  const genKey = 'total_generations'
  let count = await cloud.cache.get(genKey) || 0
  count++
  await cloud.cache.set(genKey, count, 0) // 永不过期
  return count
}

// ============ 主函数 ============

export default async function (ctx) {
  const { body } = ctx
  const action = body?.action || 'stats'
  const ip = getClientIP(ctx)
  
  console.log('=== API请求 ===')
  console.log('操作:', action)
  console.log('IP:', ip)
  
  try {
    switch (action) {
      // 限流检查
      case 'check_rate':
        const limitResult = await checkRateLimit(ip)
        return limitResult
      
      // 记录API调用
      case 'record_api':
        const recordResult = await recordAPICall(ip, body.endpoint, body.params)
        return recordResult
      
      // 添加案例
      case 'add_case':
        const addResult = await addCase(body)
        return addResult
      
      // 获取案例列表
      case 'get_cases':
        const casesResult = await getCases(body.limit || 10, body.offset || 0)
        return casesResult
      
      // 记录访问
      case 'record_visit':
        const visitResult = await recordVisit(ip, body.page)
        return visitResult
      
      // 获取统计
      case 'get_stats':
        const statsResult = await getStats()
        return statsResult
      
      // 增加生成次数
      case 'increment_gen':
        const newCount = await incrementGenerations()
        return { success: true, totalGenerations: newCount }
      
      default:
        return { success: false, error: '未知操作' }
    }
  } catch (error) {
    console.error('API执行失败:', error)
    return { success: false, error: error.message }
  }
}
