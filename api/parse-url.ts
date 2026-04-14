/**
 * 链接解析API - 提取网页内容
 */
import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  console.log('=== 链接解析API ===')
  
  try {
    const { url } = ctx.body
    
    if (!url) {
      return { success: false, error: '请提供链接地址' }
    }
    
    console.log('解析链接:', url)
    
    // 抓取网页内容
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `请求失败: ${response.status}` }
    }
    
    const html = await response.text()
    
    // 提取正文内容
    const content = extractContent(html, url)
    
    console.log('解析完成，内容长度:', content.length)
    
    return {
      success: true,
      content: content.substring(0, 10000), // 限制长度
      title: content.title || '',
      url: url
    }
    
  } catch (error) {
    console.error('解析失败:', error)
    return {
      success: false,
      error: error.message || '解析失败'
    }
  }
}

// 提取网页正文
function extractContent(html: string, url: string): string {
  // 简单的正文提取逻辑
  // 移除脚本和样式
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
  
  // 提取标题
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  
  // 提取meta描述
  const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  const description = descMatch ? descMatch[1] : ''
  
  // 移除所有HTML标签
  text = text.replace(/<[^>]+>/g, ' ')
  
  // 清理空白
  text = text.replace(/\s+/g, ' ').trim()
  
  // 组合结果
  let result = ''
  if (title) result += `标题：${title}\n\n`
  if (description) result += `摘要：${description}\n\n`
  result += `正文内容：\n${text}`
  
  return result
}
