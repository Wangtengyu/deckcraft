/**
 * DeckCraft - 添加案例到飞书多维表格
 * 接收前端案例数据，写入飞书多维表格
 */

import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  const { title, style, platform, thumbnailUrl } = ctx.request.body
  
  // 参数验证
  if (!title || !style || !platform) {
    return {
      ok: false,
      error: '缺少必填参数：title, style, platform'
    }
  }
  
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
    
    // 2. 写入记录到多维表格
    const recordRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          '标题': title,
          '风格': style,
          '平台': platform,
          '缩略图': thumbnailUrl || '',
          '状态': '待审核'
        }
      })
    })
    
    const recordData = await recordRes.json()
    
    if (recordData.code !== 0) {
      console.error('写入记录失败:', recordData)
      return {
        ok: false,
        error: recordData.msg || '写入记录失败'
      }
    }
    
    // 3. 返回成功结果
    return {
      ok: true,
      message: '案例已成功加入案例库',
      record_id: recordData.data?.record?.record_id
    }
    
  } catch (error) {
    console.error('添加案例失败:', error)
    return {
      ok: false,
      error: error.message || '添加案例失败'
    }
  }
}
