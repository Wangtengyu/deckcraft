/**
 * DeckCraft - 从飞书多维表格读取案例库
 * 返回所有已发布的案例，用于首页展示
 */

import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  // 飞书应用配置
  const APP_ID = 'cli_a9560fb481f81bca'
  const APP_SECRET = process.env.FEISHU_APP_SECRET || ''
  const BASE_TOKEN = 'M4Ueb4EpRaSQFhsHd2ecCaNVneb'
  const TABLE_ID = 'tblKypFEX3Xrb3H9'
  
  try {
    // 1. 获取tenant_access_token
    const tokenRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET
      })
    })
    
    const tokenData = await tokenRes.json()
    
    if (tokenData.code !== 0) {
      console.error('获取token失败:', tokenData)
      return {
        ok: false,
        error: '获取飞书token失败'
      }
    }
    
    const accessToken = tokenData.tenant_access_token
    
    // 2. 查询已发布的案例
    const recordRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        view_id: 'vewDlT4HrC', // 默认视图ID
        field_names: ['标题', '风格', '平台', '缩略图', '状态', 'ID'],
        page_size: 100
      })
    })
    
    const recordData = await recordRes.json()
    
    if (recordData.code !== 0) {
      console.error('查询记录失败:', recordData)
      return {
        ok: false,
        error: recordData.msg || '查询记录失败'
      }
    }
    
    // 3. 格式化返回数据
    const cases = (recordData.data?.items || [])
      .filter((item: any) => item.fields['状态'] === '已发布')
      .map((item: any) => ({
        id: item.fields['ID'] || item.record_id,
        title: item.fields['标题'] || '',
        style: item.fields['风格'] || '',
        platform: item.fields['平台'] || '',
        thumbnail: item.fields['缩略图'] || '',
        status: item.fields['状态'] || '待审核'
      }))
    
    return {
      ok: true,
      total: cases.length,
      cases: cases
    }
    
  } catch (error) {
    console.error('获取案例失败:', error)
    return {
      ok: false,
      error: error.message || '获取案例失败'
    }
  }
}
