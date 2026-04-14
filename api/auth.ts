/**
 * 用户认证API - Laf云函数
 * 支持微信扫码登录
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

const USERS_COLLECTION = 'users'

// 微信开放平台配置（需要替换为实际值）
const WX_APPID = process.env.WX_APPID || ''
const WX_SECRET = process.env.WX_SECRET || ''

/**
 * 微信登录
 * POST /auth
 * 
 * Body:
 * - code: 微信授权码（小程序）或 扫码后的临时票据
 */
export default async function (ctx: any) {
  const { code } = ctx.body
  
  if (!code) {
    return {
      success: false,
      message: '缺少授权码'
    }
  }

  try {
    // 获取微信用户信息
    const wxUserInfo = await getWxUserInfo(code)
    
    if (!wxUserInfo || !wxUserInfo.openid) {
      return {
        success: false,
        message: '微信授权失败'
      }
    }
    
    // 查找或创建用户
    let user = await db.collection(USERS_COLLECTION)
      .where({ openid: wxUserInfo.openid })
      .get()
    
    if (user.data.length === 0) {
      // 创建新用户
      const newUser = {
        _id: `user_${Date.now()}`,
        openid: wxUserInfo.openid,
        nickname: wxUserInfo.nickname || '用户' + Math.random().toString(36).substr(2, 6),
        avatar: wxUserInfo.headimgurl || '',
        contribute_count: 0,
        use_count: 0,
        templates: [],
        created_at: new Date(),
        last_login: new Date()
      }
      
      await db.collection(USERS_COLLECTION).add(newUser)
      user = { data: [newUser] }
    } else {
      // 更新最后登录时间
      await db.collection(USERS_COLLECTION)
        .where({ openid: wxUserInfo.openid })
        .update({
          last_login: new Date()
        })
    }
    
    // 生成token（简化版，实际应使用JWT）
    const token = generateToken(user.data[0]._id)
    
    return {
      success: true,
      data: {
        user: {
          id: user.data[0]._id,
          nickname: user.data[0].nickname,
          avatar: user.data[0].avatar,
          contribute_count: user.data[0].contribute_count,
          use_count: user.data[0].use_count
        },
        token
      }
    }
    
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: '登录失败: ' + error.message
    }
  }
}

/**
 * 获取微信用户信息
 */
async function getWxUserInfo(code: string): Promise<any> {
  try {
    // 小程序登录
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.errcode) {
      console.error('微信API错误:', data)
      return null
    }
    
    return {
      openid: data.openid,
      unionid: data.unionid
    }
  } catch (error) {
    console.error('获取微信用户信息失败:', error)
    return null
  }
}

/**
 * 生成Token
 */
function generateToken(userId: string): string {
  // 简化版，实际应使用JWT
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 8)
  return Buffer.from(`${userId}:${timestamp}:${random}`).toString('base64')
}

/**
 * 验证Token（供其他函数调用）
 */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [userId] = decoded.split(':')
    return userId
  } catch {
    return null
  }
}
