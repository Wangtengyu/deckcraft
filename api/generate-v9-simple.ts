/**
 * FDeck PPT生成API V9
 * 图片库优先 + AI生图兜底
 */

const cloud = require('@lafjs/cloud')

// ============ 配置 ============
const ARK_IMAGE_API = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const ARK_CHAT_API = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_IMAGE_MODEL = 'doubao-seedream-4-5-251128'
const ARK_CHAT_MODEL = 'doubao-seed-1-8-251228'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'

const MIN_MATCH_SCORE = 65  // 库图匹配阈值

// ============ 风格配置 ============
const GAMMA_STYLES = {
  party_red: {
    name: '党政红金',
    keywords: ['党建', '党课', '红色', '党政', '表彰'],
    palette: { primary: '#C41E3A', secondary: '#FFD700', accent: '#8B0000', text: '#FFFFFF', light: '#FFF8DC' },
    mood: '庄重大气'
  },
  tech_blue: {
    name: '科技蓝',
    keywords: ['科技', 'AI', '数字化', '互联网', '创新', '人工智能', '技术'],
    palette: { primary: '#1E90FF', secondary: '#00CED1', accent: '#191970', text: '#FFFFFF', light: '#E6F3FF' },
    mood: '科技感'
  },
  business: {
    name: '商务蓝白',
    keywords: ['商务', '企业', '汇报', '方案', '计划', '总结', '工作'],
    palette: { primary: '#2C5282', secondary: '#4A90D9', accent: '#1A365D', text: '#FFFFFF', light: '#EDF2F7' },
    mood: '简洁专业'
  },
  warm: {
    name: '温暖米色',
    keywords: ['培训', '教育', '生活', '健康'],
    palette: { primary: '#D4A574', secondary: '#F5DEB3', accent: '#8B7355', text: '#2D2D2D', light: '#FFFAF0' },
    mood: '温暖舒适'
  },
  nature: {
    name: '清新绿色',
    keywords: ['环保', '自然', '健康', '生态'],
    palette: { primary: '#228B22', secondary: '#90EE90', accent: '#006400', text: '#FFFFFF', light: '#F0FFF0' },
    mood: '自然清新'
  }
}

// ============ 图片库匹配器 ============
async function matchImageFromLibrary(db, params) {
  const { type, style, topic, mood } = params
  
  try {
    const collection = db.collection('image_library')
    
    // 查询候选图片
    const candidates = await collection
      .where({
        type: type === 'toc' ? 'content' : type,
        quality_score: db.command.gte(3.5)
      })
      .limit(20)
      .get()
    
    if (!candidates.data || candidates.data.length === 0) {
      return { image: null, score: 0, needAI: true }
    }
    
    // 计算匹配分数
    const scored = candidates.data.map(img => {
      let score = 0
      
      // 风格匹配 (40%)
      if (img.style === style) score += 40
      else if (isStyleCompatible(img.style, style)) score += 20
      
      // 关键词匹配 (30%)
      const topicKeywords = topic.toLowerCase().split(/[,，、\s]+/)
      const matched = (img.keywords || []).filter(kw =>
        topicKeywords.some(t => t.includes(kw) || kw.includes(t))
      )
      score += (matched.length / Math.max(img.keywords?.length || 1, 1)) * 30
      
      // 情绪匹配 (20%)
      if (mood && img.mood?.includes(mood)) score += 20
      
      // 质量和使用频率 (10%)
      score += (img.quality_score / 5) * 5
      score += Math.min((img.usage_count || 0) * 0.5, 5)
      
      return { image: img, score: Math.round(score) }
    })
    
    // 排序
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]
    
    // 判断是否使用库图
    if (best.score >= MIN_MATCH_SCORE) {
      // 更新使用次数
      await collection.doc(best.image._id).update({
        usage_count: (best.image.usage_count || 0) + 1
      })
      
      console.log(`[图片库] 匹配成功: ${best.image._id}, 分数=${best.score}`)
      return { image: best.image, score: best.score, needAI: false }
    } else {
      console.log(`[图片库] 匹配度${best.score}不足，需AI生图`)
      return { image: null, score: best.score, needAI: true }
    }
    
  } catch (error) {
    console.error('[图片库] 匹配失败:', error.message)
    return { image: null, score: 0, needAI: true }
  }
}

function isStyleCompatible(style1, style2) {
  const compatibleGroups = [
    ['tech_blue', 'business'],
    ['party_red', 'warm'],
    ['nature', 'warm'],
    ['business', 'warm']
  ]
  return compatibleGroups.some(g => g.includes(style1) && g.includes(style2))
}

// ============ AI生图 ============
async function generateImageWithArk(prompt, platform) {
  const size = platform === 'xiaohongshu' ? "768x1024" : 
               (platform === 'wechat' ? "768x1344" : "1024x576")
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(ARK_IMAGE_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ARK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: ARK_IMAGE_MODEL,
          prompt: prompt,
          size: size,
          n: 1,
          watermark: false,
          response_format: "url"
        })
      })
      
      const result = await response.json()
      
      if (result.data?.[0]?.url) {
        console.log(`[AI生图] 成功`)
        return { url: result.data[0].url, error: null }
      }
      
      if (result.error?.code === 'content_policy_violation') {
        return { url: '', error: '内容敏感' }
      }
      
    } catch (error) {
      console.error(`[AI生图] 第${attempt}次失败:`, error.message)
    }
    
    if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt))
  }
  
  return { url: '', error: '生成失败' }
}

function generateImagePrompt(page, styleConfig, platform) {
  const { palette, mood } = styleConfig
  
  if (page.type === 'cover') {
    return `${palette.primary}与${palette.secondary}渐变背景，中心留白70%。${mood}，极简风格，无文字图标。`
  } else if (page.type === 'ending') {
    return `${palette.accent}至${palette.primary}渐变背景，中心留白60%。${mood}，无文字图标。`
  } else {
    const layouts = [
      `左侧${palette.primary}渐变至右侧${palette.light}背景，${mood}，无文字图标。`,
      `顶部${palette.primary}向下渐变为${palette.light}背景，${mood}，无文字图标。`,
      `径向渐变，中心${palette.secondary}向边缘${palette.accent}过渡，${mood}，无文字图标。`
    ]
    return layouts[Math.floor(Math.random() * layouts.length)]
  }
}

// ============ 内容生成 ============
async function generateContentWithArk(topic, section, count) {
  try {
    const response = await fetch(ARK_CHAT_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ARK_CHAT_MODEL,
        messages: [{
          role: 'user',
          content: `为"${topic}"的"${section}"章节生成${count}个PPT要点，每行一个，不要序号。`
        }]
      })
    })
    
    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || ''
    
    return content.split('\n').filter(line => line.trim()).slice(0, count)
    
  } catch (error) {
    console.error('[内容生成] 失败:', error.message)
    return []
  }
}

// ============ PPTX生成 ============
async function generatePPTX(pages, images, title, styleConfig) {
  const pptxgen = require('pptxgenjs')
  const pptx = new pptxgen()
  
  pptx.author = 'FDeck'
  pptx.title = title
  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 })
  pptx.layout = 'CUSTOM'
  
  const { palette } = styleConfig
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const imageData = images[i]
    const slide = pptx.addSlide()
    
    // 背景
    if (imageData?.url) {
      try {
        const response = await fetch(imageData.url)
        const buffer = Buffer.from(await response.arrayBuffer())
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'
        
        slide.addImage({
          data: `data:${contentType};base64,${base64}`,
          x: 0, y: 0, w: '100%', h: '100%',
          sizing: { type: 'cover', w: '100%', h: '100%' }
        })
      } catch (e) {
        slide.background = { color: palette.light.replace('#', '') }
      }
    } else {
      slide.background = { color: palette.light.replace('#', '') }
    }
    
    // 文字
    if (page.type === 'cover') {
      slide.addText(page.title || title, {
        x: 0.5, y: 2.5, w: 12.33, h: 1.5,
        align: 'center', fontSize: 48, bold: true,
        color: palette.text.replace('#', ''),
        fontFace: 'Microsoft YaHei'
      })
      
      if (page.subtitle) {
        slide.addText(page.subtitle, {
          x: 0.5, y: 4.2, w: 12.33, h: 0.8,
          align: 'center', fontSize: 24,
          color: palette.secondary.replace('#', ''),
          fontFace: 'Microsoft YaHei'
        })
      }
      
      slide.addText('FDeck · 秒演', {
        x: 0.5, y: 6.8, w: 12.33, h: 0.4,
        align: 'center', fontSize: 12,
        color: '999999', fontFace: 'Arial'
      })
      
    } else if (page.type === 'ending') {
      slide.addText('感谢聆听', {
        x: 0.5, y: 2.8, w: 12.33, h: 1.2,
        align: 'center', fontSize: 56, bold: true,
        color: palette.text.replace('#', ''),
        fontFace: 'Microsoft YaHei'
      })
      
      slide.addText('秒演', {
        x: 0.5, y: 5.5, w: 12.33, h: 0.5,
        align: 'center', fontSize: 18,
        color: palette.accent.replace('#', ''),
        fontFace: 'Microsoft YaHei'
      })
      
    } else {
      slide.addText(page.section || '', {
        x: 0.5, y: 0.5, w: 12.33, h: 1,
        align: 'left', fontSize: 32, bold: true,
        color: palette.primary.replace('#', ''),
        fontFace: 'Microsoft YaHei'
      })
      
      const points = page.points || []
      points.forEach((point, idx) => {
        slide.addText(`• ${point}`, {
          x: 1, y: 2.0 + idx * 1.2, w: 11, h: 0.8,
          align: 'left', fontSize: 22,
          color: '333333', fontFace: 'Microsoft YaHei'
        })
      })
    }
  }
  
  return await pptx.write({ outputType: 'base64' })
}

// ============ 主函数 ============
export default async function (ctx) {
  const { body } = ctx
  const db = cloud.database()
  
  try {
    const {
      topic,
      scene = 'report',
      pageCount = 10,
      platform = 'ppt'
    } = body || {}
    
    if (!topic) {
      return { code: 400, message: '缺少主题参数' }
    }
    
    console.log('=== PPT生成开始 ===')
    console.log('主题:', topic)
    
    // 1. 匹配风格
    const styleKey = matchStyle(topic, scene)
    const styleConfig = GAMMA_STYLES[styleKey]
    console.log('风格:', styleConfig.name)
    
    // 2. 生成页面结构
    const pages = generatePageStructure(scene, pageCount)
    
    // 3. 生成内容
    for (const page of pages) {
      if (page.type === 'content' && page.points > 0) {
        page.points = await generateContentWithArk(topic, page.section, page.points)
        await new Promise(r => setTimeout(r, 500))
      }
      
      if (page.type === 'cover') {
        page.title = topic.split('，')[0].substring(0, 20)
        page.subtitle = topic.length > 20 ? topic.substring(0, 40) : ''
      }
    }
    
    // 4. 图片匹配与生成（核心优化）
    const images = []
    let libraryCount = 0
    let aiCount = 0
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      let imageData = { url: '', source: 'none' }
      
      // 尝试从图片库匹配
      const match = await matchImageFromLibrary(db, {
        type: page.type,
        style: styleKey,
        topic: topic,
        mood: styleConfig.mood
      })
      
      if (!match.needAI && match.image) {
        // 使用库图
        imageData = {
          url: match.image.url || match.image.path,
          source: 'library',
          score: match.score
        }
        libraryCount++
        console.log(`[页${i + 1}] 使用库图`)
      } else {
        // AI生图
        const prompt = generateImagePrompt(page, styleConfig, platform)
        const result = await generateImageWithArk(prompt, platform)
        
        if (result.url) {
          imageData = { url: result.url, source: 'ai' }
          aiCount++
          console.log(`[页${i + 1}] AI生图成功`)
        } else {
          console.log(`[页${i + 1}] AI生图失败: ${result.error}`)
        }
      }
      
      images.push(imageData)
      page.image = imageData
    }
    
    console.log(`=== 图片统计: 库图=${libraryCount}, AI=${aiCount} ===`)
    
    // 5. 生成PPTX
    const pptxData = await generatePPTX(pages, images, topic, styleConfig)
    
    console.log('=== PPT生成完成 ===')
    
    return {
      code: 0,
      message: 'success',
      data: {
        taskId: `task_${Date.now()}`,
        topic: topic,
        title: topic.split('，')[0].substring(0, 30),
        style: styleKey,
        styleName: styleConfig.name,
        pages: pages,
        images: images,
        pptx: {
          filename: `${topic.split('，')[0].substring(0, 30)}.pptx`,
          data: pptxData,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        },
        stats: {
          totalPages: pages.length,
          libraryImages: libraryCount,
          aiImages: aiCount,
          costSaving: Math.round(libraryCount / pages.length * 100) + '%'
        }
      },
      brand: { en: 'FDeck', cn: '秒演' }
    }
    
  } catch (error) {
    console.error('PPT生成失败:', error)
    return { code: 500, message: error.message }
  }
}

// ============ 辅助函数 ============
function matchStyle(topic, scene) {
  const combined = `${topic} ${scene}`.toLowerCase()
  
  for (const [key, config] of Object.entries(GAMMA_STYLES)) {
    if (config.keywords.some(kw => combined.includes(kw.toLowerCase()))) {
      return key
    }
  }
  
  return 'business'
}

function generatePageStructure(scene, pageCount) {
  const structures = {
    report: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'toc', section: '目录', layout: 'split' },
      { type: 'content', section: '背景与目标', points: 3 },
      { type: 'content', section: '执行过程', points: 3 },
      { type: 'content', section: '关键成果', points: 3 },
      { type: 'content', section: '问题与挑战', points: 3 },
      { type: 'content', section: '下一步计划', points: 3 },
      { type: 'ending', section: '感谢聆听', layout: 'center' }
    ],
    proposal: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'content', section: '问题与机会', points: 3 },
      { type: 'content', section: '解决方案', points: 3 },
      { type: 'content', section: '价值主张', points: 3 },
      { type: 'content', section: '实施计划', points: 3 },
      { type: 'ending', section: '期待合作', layout: 'center' }
    ],
    science: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'content', section: '引入话题', points: 3 },
      { type: 'content', section: '核心概念', points: 3 },
      { type: 'content', section: '详细讲解', points: 3 },
      { type: 'content', section: '案例分析', points: 3 },
      { type: 'ending', section: '感谢聆听', layout: 'center' }
    ],
    other: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'content', section: '内容一', points: 3 },
      { type: 'content', section: '内容二', points: 3 },
      { type: 'content', section: '内容三', points: 3 },
      { type: 'ending', section: '感谢聆听', layout: 'center' }
    ]
  }
  
  const structure = structures[scene] || structures.other
  return structure.slice(0, pageCount)
}
