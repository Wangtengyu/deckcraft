/**
 * 用户信息API - Laf云函数
 * 用于获取和更新用户信息
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

const USERS_COLLECTION = 'users'
const TEMPLATES_COLLECTION = 'templates'

/**
 * 获取用户信息
 * GET /user-profile
 * 
 * Header: Authorization: Bearer <token>
 * Query: userId (可选，不传则获取当前用户)
 */
export default async function (ctx: any) {
  const { userId } = ctx.query
  const authHeader = ctx.headers?.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  
  try {
    // 验证token获取当前用户ID
    const currentUserId = await verifyToken(token)
    
    if (!currentUserId && !userId) {
      return {
        success: false,
        message: '未登录'
      }
    }
    
    const targetUserId = userId || currentUserId
    
    // 获取用户信息
    const userResult = await db.collection(USERS_COLLECTION)
      .where({ _id: targetUserId })
      .get()
    
    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      }
    }
    
    const user = userResult.data[0]
    
    // 获取用户贡献的模板
    const templatesResult = await db.collection(TEMPLATES_COLLECTION)
      .where({ author_id: targetUserId })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get()
    
    return {
      success: true,
      data: {
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar,
          contribute_count: user.contribute_count,
          use_count: user.use_count,
          created_at: user.created_at
        },
        templates: templatesResult.data.map(t => ({
          id: t._id,
          name: t.name,
          preview_url: t.preview_url,
          use_count: t.use_count,
          status: t.status,
          created_at: t.created_at
        }))
      }
    }
    
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      success: false,
      message: '获取失败: ' + error.message
    }
  }
}

/**
 * 更新用户信息
 * PUT /user-profile
 * 
 * Body:
 * - nickname: 昵称
 * - avatar: 头像URL
 */
export async function updateUser(ctx: any) {
  const { nickname, avatar } = ctx.body
  const authHeader = ctx.headers?.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  
  const userId = await verifyToken(token)
  
  if (!userId) {
    return {
      success: false,
      message: '未登录'
    }
  }
  
  try {
    const updateData: any = { updated_at: new Date() }
    
    if (nickname) updateData.nickname = nickname
    if (avatar) updateData.avatar = avatar
    
    await db.collection(USERS_COLLECTION)
      .where({ _id: userId })
      .update(updateData)
    
    return {
      success: true,
      message: '更新成功'
    }
    
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      message: '更新失败: ' + error.message
    }
  }
}

/**
 * 验证Token
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    const [userId] = decoded.split(':')
    return userId
  } catch {
    return null
  }
}
