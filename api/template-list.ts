/**
 * 模板列表API - Laf云函数
 * 用于获取模板列表、搜索、分类筛选
 */

const cloud = require('@lafjs/cloud')
const db = cloud.database()

const TEMPLATES_COLLECTION = 'templates'

/**
 * 获取模板列表
 * GET /template-list
 * 
 * Query:
 * - category: 分类筛选
 * - keyword: 搜索关键词
 * - page: 页码
 * - pageSize: 每页数量
 * - sort: 排序方式 (popular/newest)
 */
export default async function (ctx: any) {
  const { category, keyword, page = 1, pageSize = 20, sort = 'popular' } = ctx.query
  
  try {
    let query = db.collection(TEMPLATES_COLLECTION)
      .where({ status: 'approved' })
    
    // 分类筛选
    if (category && category !== 'all') {
      query = query.where({ category })
    }
    
    // 关键词搜索
    if (keyword) {
      query = query.where({
        $or: [
          { name: db.RegExp({ regexp: keyword, options: 'i' }) },
          { tags: db.RegExp({ regexp: keyword, options: 'i' }) }
        ]
      })
    }
    
    // 排序
    if (sort === 'newest') {
      query = query.orderBy('created_at', 'desc')
    } else {
      query = query.orderBy('use_count', 'desc')
    }
    
    // 分页
    const skip = (page - 1) * pageSize
    const result = await query.skip(skip).limit(pageSize).get()
    
    // 获取总数
    const countResult = await db.collection(TEMPLATES_COLLECTION)
      .where({ status: 'approved' })
      .count()
    
    return {
      success: true,
      data: {
        list: result.data,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
    
  } catch (error) {
    console.error('获取模板列表失败:', error)
    return {
      success: false,
      message: '获取失败: ' + error.message
    }
  }
}
