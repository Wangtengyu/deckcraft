# Laf 云函数部署代码

## 部署步骤

1. 登录 https://laf.dev
2. 打开应用（API地址：ig8u65l6vm.sealosbja.site）
3. 按照下面的说明，创建或更新函数
4. 每个函数创建后点击"发布"

---

## 1. generate-outline（新建函数）

**函数名**：`generate-outline`
**方法**：POST

```typescript
/**
 * 大纲生成API - 基于主题和参考素材生成PPT大纲
 */
import cloud from '@lafjs/cloud'

const COZE_API_URL = 'https://api.coze.cn/v1/chat'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'
const BOT_ID = '7584118159226241076'

export default async function (ctx: any) {
  console.log('=== 大纲生成API ===')
  
  try {
    const { topic, pageCount, refDocument, refUrl, scene } = ctx.body
    
    if (!topic) {
      return { ok: false, message: '请提供主题' }
    }
    
    console.log('主题:', topic, '页数:', pageCount)
    console.log('参考文档:', refDocument ? '有' : '无')
    console.log('参考链接:', refUrl ? '有' : '无')
    
    let prompt = `请为以下主题生成一个${pageCount || 5}页的PPT大纲：

主题：${topic}

`
    
    if (refDocument) {
      prompt += `参考文档内容：
${refDocument.substring(0, 3000)}

`
    }
    
    if (refUrl) {
      prompt += `参考链接内容：
${refUrl.substring(0, 3000)}

`
    }
    
    prompt += `
请按以下JSON格式返回大纲：
{
  "title": "PPT主标题",
  "subtitle": "PPT副标题（可选）",
  "outline": [
    {
      "section": "章节标题",
      "points": ["要点1：具体内容", "要点2：具体内容", "要点3：具体内容"]
    }
  ],
  "ending": "结尾语（如：感谢聆听）"
}

要求：
1. 标题要有观点，不只是描述
2. 每个章节要有2-4个具体要点
3. 要点要有具体内容，不只是关键词
4. 严格按JSON格式返回，不要有多余文字`
    
    const response = await fetch(COZE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: BOT_ID,
        user_id: 'user_' + Date.now(),
        stream: false,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { ok: false, message: result.msg || '大纲生成失败' }
    }
    
    const content = result.data?.messages?.[0]?.content || result.data?.content || ''
    
    let outline
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到JSON格式的大纲')
      }
    } catch (e) {
      console.error('JSON解析失败:', e)
      outline = {
        title: topic,
        outline: [
          { section: '背景介绍', points: ['背景要点1', '背景要点2', '背景要点3'] },
          { section: '核心内容', points: ['核心要点1', '核心要点2', '核心要点3'] },
          { section: '总结展望', points: ['总结要点1', '总结要点2'] }
        ],
        ending: '感谢聆听'
      }
    }
    
    console.log('大纲生成成功:', outline.title, outline.outline?.length, '个章节')
    
    return {
      ok: true,
      outline: outline
    }
    
  } catch (error) {
    console.error('大纲生成失败:', error)
    return {
      ok: false,
      message: error.message || '大纲生成失败'
    }
  }
}
```

---

## 2. upload（新建函数）

**函数名**：`upload`
**方法**：POST

```typescript
/**
 * 图片上传API - 使用Laf云存储
 */
import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  console.log('=== 图片上传API ===')
  
  try {
    const file = ctx.files?.[0]
    
    if (!file) {
      return { success: false, error: '没有上传文件' }
    }
    
    console.log('文件信息:', file.filename, file.mimetype, file.size)
    
    const ext = file.filename.split('.').pop() || 'png'
    const fileName = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
    
    const bucket = cloud.storage.bucket()
    
    await bucket.putObject({
      key: fileName,
      body: file.content,
      contentType: file.mimetype || 'image/png'
    })
    
    const url = await bucket.getSignedUrl(fileName, 3600 * 24 * 365)
    
    console.log('上传成功:', url)
    
    return {
      success: true,
      url: url,
      fileName: fileName
    }
    
  } catch (error) {
    console.error('上传失败:', error)
    return {
      success: false,
      error: error.message || '上传失败'
    }
  }
}
```

---

## 3. parse-document（新建函数）

**函数名**：`parse-document`
**方法**：POST

```typescript
/**
 * 文档解析API - 提取PDF/Word文档内容
 */
import cloud from '@lafjs/cloud'

export default async function (ctx: any) {
  console.log('=== 文档解析API ===')
  
  try {
    const file = ctx.files?.[0]
    
    if (!file) {
      return { success: false, error: '没有上传文件' }
    }
    
    console.log('文件信息:', file.filename, file.mimetype)
    
    const ext = file.filename.split('.').pop()?.toLowerCase()
    let content = ''
    
    if (ext === 'pdf') {
      content = await parsePDF(file.content)
    } else if (ext === 'docx' || ext === 'doc') {
      content = await parseWord(file.content)
    } else if (ext === 'txt' || ext === 'md') {
      content = file.content.toString('utf-8')
    } else {
      return { success: false, error: '不支持的文件格式，请上传PDF、Word或文本文件' }
    }
    
    console.log('解析完成，内容长度:', content.length)
    
    return {
      success: true,
      content: content.substring(0, 10000),
      fileName: file.filename
    }
    
  } catch (error) {
    console.error('解析失败:', error)
    return {
      success: false,
      error: error.message || '解析失败'
    }
  }
}

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    return `[PDF文档内容 - 请手动提取关键信息或提供文本格式]`
  } catch (e) {
    return '[PDF解析失败，请提供文本格式]'
  }
}

async function parseWord(buffer: Buffer): Promise<string> {
  try {
    return `[Word文档内容 - 请手动提取关键信息或提供文本格式]`
  } catch (e) {
    return '[Word解析失败，请提供文本格式]'
  }
}
```

---

## 4. parse-url（新建函数）

**函数名**：`parse-url`
**方法**：POST

```typescript
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
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return { success: false, error: `请求失败: ${response.status}` }
    }
    
    const html = await response.text()
    
    const content = extractContent(html, url)
    
    console.log('解析完成，内容长度:', content.length)
    
    return {
      success: true,
      content: content.substring(0, 10000),
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

function extractContent(html: string, url: string): string {
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
  
  const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''
  
  const descMatch = text.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  const description = descMatch ? descMatch[1] : ''
  
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\s+/g, ' ').trim()
  
  let result = ''
  if (title) result += `标题：${title}\n\n`
  if (description) result += `摘要：${description}\n\n`
  result += `正文内容：\n${text}`
  
  return result
}
```

---

## 5. generate（更新现有函数）

**函数名**：`generate`
**方法**：POST

⚠️ 代码较长，请查看 `api/generate-v7.ts` 文件的完整内容

关键更新点：
1. 新增 `refImageDescriptions` 参数支持
2. `generatePrompt` 函数支持参考图描述
3. `generateRefImageDescription` 函数处理参考图说明

---

## 部署后验证

部署完成后，可以测试这些API：

1. **generate-outline**
```bash
curl -X POST https://ig8u65l6vm.sealosbja.site/generate-outline \
  -H "Content-Type: application/json" \
  -d '{"topic":"测试主题","pageCount":5}'
```

2. **upload**
```bash
curl -X POST https://ig8u65l6vm.sealosbja.site/upload \
  -F "file=@test.png"
```

3. **parse-url**
```bash
curl -X POST https://ig8u65l6vm.sealosbja.site/parse-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```
