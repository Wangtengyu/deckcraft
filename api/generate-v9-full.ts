/**
 * PPT生成API - Laf云函数 V8.0
 * 基于火山方舟API的高质量PPT生成
 * 
 * 核心特性：
 * 1. 火山方舟图片生成：doubao-seedream-4-5-251228
 * 2. 火山方舟内容生成：doubao-seed-1-8-251228
 * 3. Gamma风格设计：背景纯净，文字层清晰可读
 * 4. 多样化布局：居中大标题、左标题+右内容、大字要点等
 * 5. 3次重试机制确保图片生成稳定
 * 
 * 品牌：FDeck（英文）/ 秒演（中文）
 */

const cloud = require('@lafjs/cloud')

// ============ 火山方舟API配置 ============
const ARK_IMAGE_API = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
const ARK_CHAT_API = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_IMAGE_MODEL = 'doubao-seedream-4-5-251128'
const ARK_CHAT_MODEL = 'doubao-seed-1-8-251228'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'

// ============ 图片库配置（V9新增）============
const IMAGE_LIBRARY_ENABLED = true
const MIN_MATCH_SCORE = 65

// ============ 品牌配置 ============
const BRAND_EN = 'FDeck'
const BRAND_CN = '秒演'

// ============ 平台尺寸配置 ============
const PLATFORM_SIZES = {
  ppt: { width: 1024, height: 576, name: 'PPT标准' },
  xiaohongshu: { width: 540, height: 720, name: '小红书' },
  wechat: { width: 540, height: 960, name: '微信' }
}

// ============ Gamma风格配置 ============
const GAMMA_STYLES = {
  // 党政红金风格
  party_red: {
    name: '党政红金',
    keywords: ['党建', '党课', '主题党日', '表彰大会', '党委', '党支部', '红色'],
    palette: {
      primary: '#C41E3A',      // 中国红
      secondary: '#FFD700',    // 金色
      accent: '#8B0000',        // 深红
      text: '#FFFFFF',
      light: '#FFF8DC'
    },
    mood: '庄重大气、庄严肃穆、红色主题'
  },
  
  // 科技蓝风格
  tech_blue: {
    name: '科技蓝',
    keywords: ['科技', '互联网', 'AI', '数字化', '创新', '未来'],
    palette: {
      primary: '#1E90FF',
      secondary: '#00CED1',
      accent: '#191970',
      text: '#FFFFFF',
      light: '#E6F3FF'
    },
    mood: '科技感、未来感、专业严谨'
  },
  
  // 商务蓝白风格
  business: {
    name: '商务蓝白',
    keywords: ['商务', '企业', '汇报', '方案', '计划'],
    palette: {
      primary: '#2C5282',
      secondary: '#4A90D9',
      accent: '#1A365D',
      text: '#FFFFFF',
      light: '#EDF2F7'
    },
    mood: '简洁专业、清爽大气'
  },
  
  // 温暖米色风格
  warm: {
    name: '温暖米色',
    keywords: ['培训', '教育', '生活', '健康', '家庭'],
    palette: {
      primary: '#D4A574',
      secondary: '#F5DEB3',
      accent: '#8B7355',
      text: '#2D2D2D',
      light: '#FFFAF0'
    },
    mood: '温暖舒适、亲切自然'
  },
  
  // 清新绿色风格
  nature: {
    name: '清新绿色',
    keywords: ['环保', '自然', '健康', '有机', '生态'],
    palette: {
      primary: '#228B22',
      secondary: '#90EE90',
      accent: '#006400',
      text: '#FFFFFF',
      light: '#F0FFF0'
    },
    mood: '清新自然、生机勃勃'
  },
  
  // 简约黑白风格
  minimal: {
    name: '简约黑白',
    keywords: ['极简', '设计', '艺术', '创意'],
    palette: {
      primary: '#1A1A1A',
      secondary: '#333333',
      accent: '#666666',
      text: '#FFFFFF',
      light: '#F5F5F5'
    },
    mood: '简约大气、高端品质'
  },
  
  // 插画童趣风格
  illustration: {
    name: '插画童趣',
    keywords: ['儿童', '幼儿', '绘本', '趣味', '可爱'],
    palette: {
      primary: '#FF69B4',
      secondary: '#87CEEB',
      accent: '#FFD700',
      text: '#333333',
      light: '#FFF0F5'
    },
    mood: '活泼可爱、童趣盎然'
  },
  
  // 古典文化风格
  classical: {
    name: '古典文化',
    keywords: ['历史', '文化', '国学', '传统', '古典'],
    palette: {
      primary: '#8B4513',
      secondary: '#DAA520',
      accent: '#654321',
      text: '#2D1B0E',
      light: '#FAEBD7'
    },
    mood: '典雅古朴、文化底蕴'
  }
}

// ============ 内容结构模板 ============
const NARRATIVE_STRUCTURES = {
  report: {
    name: '工作汇报',
    pages: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'toc', section: '目录', layout: 'grid' },
      { type: 'content', section: '背景与目标', points: 3, layout: 'left_title' },
      { type: 'content', section: '执行过程', points: 4, layout: 'numbered' },
      { type: 'content', section: '关键成果', points: 3, layout: 'big_points' },
      { type: 'content', section: '问题与挑战', points: 2, layout: 'quote' },
      { type: 'content', section: '下一步计划', points: 3, layout: 'two_column' },
      { type: 'ending', section: '感谢聆听', layout: 'center' }
    ]
  },
  proposal: {
    name: '项目方案',
    pages: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'toc', section: '目录', layout: 'grid' },
      { type: 'content', section: '问题与机会', points: 3, layout: 'left_title' },
      { type: 'content', section: '解决方案', points: 4, layout: 'big_points' },
      { type: 'content', section: '核心优势', points: 3, layout: 'two_column' },
      { type: 'content', section: '实施计划', points: 4, layout: 'numbered' },
      { type: 'ending', section: '期待合作', layout: 'center' }
    ]
  },
  training: {
    name: '培训课件',
    pages: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'toc', section: '目录', layout: 'grid' },
      { type: 'content', section: '培训目标', points: 3, layout: 'big_points' },
      { type: 'content', section: '基础知识', points: 4, layout: 'left_title' },
      { type: 'content', section: '核心技能', points: 3, layout: 'numbered' },
      { type: 'content', section: '实操演练', points: 3, layout: 'two_column' },
      { type: 'ending', section: '培训总结', layout: 'center' }
    ]
  },
  science: {
    name: '知识科普',
    pages: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'toc', section: '目录', layout: 'grid' },
      { type: 'content', section: '核心概念', points: 3, layout: 'left_title' },
      { type: 'content', section: '关键原理', points: 4, layout: 'big_points' },
      { type: 'content', section: '实践应用', points: 3, layout: 'two_column' },
      { type: 'ending', section: '总结回顾', layout: 'center' }
    ]
  },
  other: {
    name: '通用模板',
    pages: [
      { type: 'cover', section: '封面', layout: 'center' },
      { type: 'content', section: '内容一', points: 3, layout: 'left_title' },
      { type: 'content', section: '内容二', points: 3, layout: 'numbered' },
      { type: 'content', section: '内容三', points: 3, layout: 'big_points' },
      { type: 'ending', section: '感谢聆听', layout: 'center' }
    ]
  }
}

// ============ 辅助函数 ============

/**
 * 匹配最适合的风格
 */
function matchStyle(topic, scene) {
  const combined = `${topic} ${scene}`.toLowerCase()
  
  for (const [key, style] of Object.entries(GAMMA_STYLES)) {
    const hasKeyword = style.keywords.some(kw => combined.includes(kw.toLowerCase()))
    if (hasKeyword) {
      return { key, config: style }
    }
  }
  
  // 默认商务风格
  return { key: 'business', config: GAMMA_STYLES.business }
}

/**
 * 生成图片Prompt - Gamma风格
 * 背景只负责氛围，不包含任何文字
 */
function generateImagePrompt(page, styleConfig, platform, pageIndex, totalPages) {
  const { palette, mood } = styleConfig
  const aspectRatio = platform === 'xiaohongshu' ? '9:12' : (platform === 'wechat' ? '9:16' : '16:9')
  
  let bgStyle = ''
  
  if (page.type === 'cover') {
    // 封面页 - 品牌感强
    bgStyle = `
创意${palette.primary}与${palette.secondary}渐变背景，中心区域留白70%用于放置标题。
柔和光晕效果从右上角延伸，左下角有细微纹理。
整体氛围：${mood}
设计风格：Apple Keynote风格，极简主义。
画面纯净：纯装饰性渐变和光效，无任何文字、图标、人像、照片。
`
  } else if (page.type === 'ending') {
    // 结尾页 - 简洁大气
    bgStyle = `
深色${palette.accent}至${palette.primary}渐变背景，中心留白60%用于感谢语。
四周有微弱光晕，中央偏上区域纯净留白。
整体氛围：${mood}
设计风格：极简优雅，禅意风格。
画面纯净：纯渐变和光效，无任何文字、图标、人像、照片。
`
  } else if (page.type === 'toc') {
    // 目录页 - 清晰分区
    bgStyle = `
浅色${palette.light}渐变背景，顶部10%为${palette.primary}色块。
整体留白充足，适合放置目录列表。
整体氛围：${mood}
设计风格：清晰的网格布局暗示。
画面纯净：纯色块和渐变，无任何文字、图标、人像、照片。
`
  } else {
    // 内容页 - 多样化但统一
    const layouts = ['left_accent', 'top_gradient', 'radial_glow', 'corner_light']
    const layoutHint = layouts[pageIndex % layouts.length]
    
    if (layoutHint === 'left_accent') {
      bgStyle = `
垂直渐变背景：左侧${palette.primary}渐变至右侧${palette.light}。
左侧15%有${palette.primary}色条作为装饰。
顶部20%区域纯净留白用于标题。
整体氛围：${mood}
画面纯净：纯色块和渐变，无任何文字、图标、人像、照片。
`
    } else if (layoutHint === 'top_gradient') {
      bgStyle = `
上下渐变背景：顶部${palette.primary}向下渐变为${palette.light}。
顶部区域有柔和光效。
整体氛围：${mood}
画面纯净：纯渐变和光效，无任何文字、图标、人像、照片。
`
    } else if (layoutHint === 'radial_glow') {
      bgStyle = `
径向渐变背景，从中心${palette.secondary}向边缘${palette.accent}过渡。
中心区域有柔和光晕。
整体氛围：${mood}
画面纯净：纯渐变和光效，无任何文字、图标、人像、照片。
`
    } else {
      bgStyle = `
对角线渐变：左下角${palette.primary}向右上帝都渐变为${palette.light}。
角落有微弱光晕装饰。
整体氛围：${mood}
画面纯净：纯渐变和光效，无任何文字、图标、人像、照片。
`
    }
  }
  
  return bgStyle.trim()
}

/**
 * 图片库匹配（V9新增）
 * 优先从图片库匹配，匹配度不足时返回needAI=true
 */
async function matchImageFromLibrary(db, params) {
  if (!IMAGE_LIBRARY_ENABLED) {
    return { image: null, score: 0, needAI: true }
  }
  
  const { type, style, topic, mood } = params
  
  try {
    const collection = db.collection('image_library')
    
    const candidates = await collection
      .where({
        type: type === 'toc' ? 'content' : type,
        quality_score: db.command.gte(3.5)
      })
      .limit(20)
      .get()
    
    if (!candidates.data || candidates.data.length === 0) {
      console.log('[图片库] 无匹配图片')
      return { image: null, score: 0, needAI: true }
    }
    
    // 计算匹配分数
    const scored = candidates.data.map(img => {
      let score = 0
      
      // 风格匹配 (40%)
      if (img.style === style) score += 40
      else {
        // 兼容风格
        const compatibleGroups = [
          ['tech_blue', 'business'],
          ['party_red', 'warm'],
          ['nature', 'warm'],
          ['business', 'warm']
        ]
        if (compatibleGroups.some(g => g.includes(img.style) && g.includes(style))) {
          score += 20
        }
      }
      
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
    
    // 排序取最佳
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
      console.log(`[图片库] 匹配度${best.score}低于阈值${MIN_MATCH_SCORE}，使用AI生图`)
      return { image: null, score: best.score, needAI: true }
    }
    
  } catch (error) {
    console.error('[图片库] 匹配失败:', error.message)
    return { image: null, score: 0, needAI: true }
  }
}

/**
 * 火山方舟图片生成API（带3次重试）
 */
async function generateImageWithArk(prompt, platform, retryCount = 3) {
  const size = platform === 'xiaohongshu' ? "768x1024" : (platform === 'wechat' ? "768x1344" : "1024x576")
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[图片生成] 第${attempt}次尝试...`)
      
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
        console.log(`[图片生成] 成功: ${result.data[0].url}`)
        return { url: result.data[0].url, error: null }
      }
      
      // 检查错误类型
      if (result.error) {
        console.error(`[图片生成] 错误: ${JSON.stringify(result.error)}`)
        
        // 如果是内容安全错误，不重试
        if (result.error.code === 'content_policy_violation') {
          return { url: '', error: '内容包含敏感词，请调整主题或风格' }
        }
      }
      
      console.log(`[图片生成] 第${attempt}次失败，${attempt < retryCount ? '重试中...' : '已达最大重试次数'}`)
      
    } catch (error) {
      console.error(`[图片生成] 异常: ${error.message}`)
    }
    
    // 重试前等待
    if (attempt < retryCount) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
  
  return { url: '', error: '图片生成失败，已达最大重试次数' }
}

/**
 * 火山方舟内容生成API
 */
async function generateContentWithArk(topic, section, count, scene, style) {
  const sceneContext = {
    report: '工作汇报场景',
    proposal: '项目方案场景',
    training: '培训课件场景',
    science: '知识科普场景',
    other: '通用内容场景'
  }[scene] || '通用内容场景'
  
  const prompt = `你是一位专业的PPT内容策划专家。请为"${topic}"主题的"${section}"章节生成${count}个高质量要点。

场景：${sceneContext}
风格：${style?.name || '商务'}

要求：
1. 每个要点必须具体、有洞察力，避免空泛表述
2. 要点之间逻辑清晰，层次分明
3. 语言简洁有力，适合PPT展示
4. 直接输出要点，每行一个，不要序号、不要任何前缀符号

示例格式（仅供参考风格，实际内容要贴合主题）：
通过数据驱动决策，提升运营效率30%以上
建立用户画像体系，实现精准营销触达
优化用户体验流程，降低流失率至5%以下

请生成${count}个具体要点：`

  try {
    const response = await fetch(ARK_CHAT_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ARK_CHAT_MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    })
    
    const result = await response.json()
    
    if (result.choices?.[0]?.message?.content) {
      const lines = result.choices[0].message.content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.match(/^[0-9\.\-\*\d]+/))
        .slice(0, count)
      
      console.log(`[内容生成] 成功生成${lines.length}个要点`)
      return lines
    }
    
    console.log('[内容生成] API返回格式异常')
    return null
    
  } catch (error) {
    console.error(`[内容生成] 异常: ${error.message}`)
    return null
  }
}

/**
 * Base64图片上传到免费图床
 */
async function uploadToImgBed(base64Data) {
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!matches) {
    return { url: base64Data, error: null }
  }
  
  const ext = matches[1]
  const base64 = matches[2]
  
  try {
    const buffer = Buffer.from(base64, 'base64')
    const formData = new FormData()
    const blob = new Blob([buffer], { type: `image/${ext}` })
    formData.append('smfile', blob, `image.${ext}`)
    
    const response = await fetch('https://api.sm.ms/api/v2/upload', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    if (result.success && result.data?.url) {
      return { url: result.data.url, error: null }
    } else if (result.code === 'image_repeated') {
      return { url: result.images, error: null }
    }
    
    return { url: '', error: result.message || '上传失败' }
    
  } catch (error) {
    console.error(`[上传图床] 异常: ${error.message}`)
    return { url: '', error: error.message }
  }
}

/**
 * 处理参考图（Base64转URL）
 */
async function processRefImages(refImages) {
  if (!refImages || refImages.length === 0) return []
  
  const urls = []
  for (const img of refImages) {
    if (img.startsWith('http')) {
      urls.push(img)
    } else {
      const result = await uploadToImgBed(img)
      if (result.url) {
        urls.push(result.url)
      }
    }
  }
  
  return urls
}

/**
 * 进度管理
 */
const PROGRESS_TTL = 300

async function updateProgress(taskId, updates) {
  try {
    let progress = await cloud.cache.get(`progress_${taskId}`)
    if (!progress) {
      progress = { taskId, totalSteps: 5, totalPages: 0 }
    }
    progress = { ...progress, ...updates, updatedAt: Date.now() }
    
    if (progress.totalSteps > 0) {
      progress.progress = Math.min(99, Math.round(progress.currentStep * (100 / progress.totalSteps)))
    }
    
    await cloud.cache.set(`progress_${taskId}`, progress, PROGRESS_TTL)
    return progress
  } catch (e) {
    console.error('[进度更新] 失败:', e)
    return null
  }
}

// ============ PPTX生成 ============

/**
 * 布局设计生成器
 */
function generateLayoutDesign(slide, page, palette, pageIndex, title, subtitle) {
  const { type, section, points = [], layout = 'left_title' } = page
  
  // 文本阴影效果
  const textShadow = { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.35 }
  
  if (type === 'cover') {
    // ========== 封面布局 - 居中大标题 ==========
    
    // 顶部装饰线
    slide.addShape('rect', {
      x: 4.5, y: 2.0, w: 4.33, h: 0.02,
      fill: { color: palette.secondary }
    })
    
    // 主标题
    slide.addText(title, {
      x: 0.5, y: 2.2, w: 12.33, h: 2,
      align: 'center', valign: 'middle',
      fontSize: 54, bold: true,
      color: palette.text,
      fontFace: 'Microsoft YaHei',
      shadow: textShadow
    })
    
    // 副标题
    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.5, y: 4.3, w: 12.33, h: 0.6,
        align: 'center', valign: 'middle',
        fontSize: 20,
        color: palette.secondary,
        fontFace: 'Microsoft YaHei',
        transparency: 20
      })
    }
    
    // 底部装饰线
    slide.addShape('rect', {
      x: 4.5, y: 5.2, w: 4.33, h: 0.02,
      fill: { color: palette.secondary }
    })
    
    // 品牌标识
    slide.addText(`${BRAND_CN} · ${BRAND_EN}`, {
      x: 0.5, y: 6.6, w: 12.33, h: 0.5,
      align: 'center', valign: 'middle',
      fontSize: 12,
      color: palette.text,
      fontFace: 'Microsoft YaHei',
      transparency: 50
    })
    
  } else if (type === 'ending') {
    // ========== 结尾布局 - 居中感谢 ==========
    
    // 装饰圆环
    slide.addShape('ellipse', {
      x: 5.91, y: 2.0, w: 1.5, h: 1.5,
      fill: { type: 'none' },
      line: { color: palette.secondary, width: 1.5, transparency: 40 }
    })
    
    // 结语
    slide.addText(section || '感谢聆听', {
      x: 0.5, y: 2.8, w: 12.33, h: 1.5,
      align: 'center', valign: 'middle',
      fontSize: 48, bold: true,
      color: palette.text,
      fontFace: 'Microsoft YaHei',
      shadow: textShadow
    })
    
    // 底部装饰
    slide.addShape('rect', {
      x: 5.16, y: 4.8, w: 3, h: 0.02,
      fill: { color: palette.secondary }
    })
    
    // 品牌
    slide.addText(`${BRAND_EN}`, {
      x: 0.5, y: 5.2, w: 12.33, h: 0.5,
      align: 'center', valign: 'middle',
      fontSize: 14,
      color: palette.text,
      fontFace: 'Arial',
      transparency: 60
    })
    
  } else if (type === 'toc') {
    // ========== 目录布局 - 网格展示 ==========
    
    // 标题
    slide.addText(section, {
      x: 0.5, y: 0.3, w: 12.33, h: 0.8,
      align: 'left', valign: 'middle',
      fontSize: 28, bold: true,
      color: palette.text,
      fontFace: 'Microsoft YaHei'
    })
    
    // 装饰线
    slide.addShape('rect', {
      x: 0.5, y: 1.1, w: 2, h: 0.03,
      fill: { color: palette.secondary }
    })
    
    // 目录项
    const tocItems = points.length > 0 ? points : ['内容一', '内容二', '内容三', '内容四']
    const startY = 1.6
    const cols = 2
    
    tocItems.forEach((item, idx) => {
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = 0.8 + col * 6
      const y = startY + row * 2.2
      
      // 序号圆点
      slide.addShape('ellipse', {
        x: x, y: y + 0.2, w: 0.5, h: 0.5,
        fill: { color: palette.primary }
      })
      
      slide.addText(`${idx + 1}`, {
        x: x, y: y + 0.2, w: 0.5, h: 0.5,
        align: 'center', valign: 'middle',
        fontSize: 14, bold: true,
        color: palette.text,
        fontFace: 'Arial'
      })
      
      // 目录文字
      slide.addText(item, {
        x: x + 0.7, y: y + 0.2, w: 5, h: 0.5,
        align: 'left', valign: 'middle',
        fontSize: 16,
        color: palette.text,
        fontFace: 'Microsoft YaHei'
      })
    })
    
  } else {
    // ========== 内容页布局 ==========
    
    const startY = 1.4
    const usableHeight = 5.5
    
    // 左侧装饰条
    slide.addShape('rect', {
      x: 0, y: 0, w: 0.06, h: 7.5,
      fill: { color: palette.primary }
    })
    
    // 标题
    slide.addText(section, {
      x: 0.5, y: 0.3, w: 12.33, h: 0.8,
      align: 'left', valign: 'middle',
      fontSize: 26, bold: true,
      color: palette.text,
      fontFace: 'Microsoft YaHei'
    })
    
    // 标题下装饰线
    slide.addShape('rect', {
      x: 0.5, y: 1.05, w: 1.5, h: 0.02,
      fill: { color: palette.secondary }
    })
    
    // 根据布局类型绘制内容
    if (layout === 'center' || layout === 'big_points') {
      // ========== 大字要点布局 ==========
      const itemHeight = usableHeight / points.length
      
      points.forEach((point, idx) => {
        const y = startY + idx * itemHeight
        
        // 要点背景
        slide.addShape('rect', {
          x: 0.5, y: y + 0.1, w: 12.33, h: itemHeight - 0.3,
          fill: { color: palette.primary, transparency: 85 },
          line: { width: 0 }
        })
        
        // 序号
        slide.addText(`${idx + 1}`, {
          x: 0.7, y: y + 0.3, w: 0.6, h: 0.6,
          align: 'center', valign: 'middle',
          fontSize: 24, bold: true,
          color: palette.secondary,
          fontFace: 'Arial'
        })
        
        // 内容
        slide.addText(point, {
          x: 1.5, y: y + 0.2, w: 11, h: itemHeight - 0.5,
          align: 'left', valign: 'middle',
          fontSize: 18,
          color: palette.text,
          fontFace: 'Microsoft YaHei'
        })
      })
      
    } else if (layout === 'left_title') {
      // ========== 左标题右内容布局 ==========
      const leftWidth = 4.5
      const rightWidth = 7.83
      
      // 左侧标题区背景
      slide.addShape('rect', {
        x: 0.5, y: startY, w: leftWidth, h: usableHeight,
        fill: { color: palette.primary, transparency: 70 }
      })
      
      // 左侧大标题
      slide.addText(section, {
        x: 0.7, y: startY + usableHeight/2 - 0.5, w: leftWidth - 0.4, h: 1,
        align: 'center', valign: 'middle',
        fontSize: 22, bold: true,
        color: palette.secondary,
        fontFace: 'Microsoft YaHei'
      })
      
      // 右侧要点
      points.forEach((point, idx) => {
        const y = startY + 0.3 + idx * (usableHeight / points.length - 0.1)
        
        slide.addShape('ellipse', {
          x: leftWidth + 0.7, y: y + 0.15, w: 0.3, h: 0.3,
          fill: { color: palette.secondary }
        })
        
        slide.addText(point, {
          x: leftWidth + 1.2, y: y, w: rightWidth - 0.8, h: usableHeight / points.length,
          align: 'left', valign: 'middle',
          fontSize: 15,
          color: palette.text,
          fontFace: 'Microsoft YaHei'
        })
      })
      
    } else if (layout === 'two_column') {
      // ========== 两栏布局 ==========
      const colWidth = 5.8
      const colGap = 0.73
      
      points.forEach((point, idx) => {
        const col = idx % 2
        const row = Math.floor(idx / 2)
        const x = 0.5 + col * (colWidth + colGap)
        const y = startY + row * (usableHeight / Math.ceil(points.length / 2))
        
        // 要点卡片
        slide.addShape('roundRect', {
          x: x, y: y + 0.1, w: colWidth, h: usableHeight / Math.ceil(points.length / 2) - 0.3,
          fill: { color: palette.light, transparency: 60 },
          line: { color: palette.primary, width: 0.5, transparency: 50 }
        })
        
        // 序号
        slide.addText(`${idx + 1}`, {
          x: x + 0.2, y: y + 0.3, w: 0.5, h: 0.5,
          align: 'center', valign: 'middle',
          fontSize: 18, bold: true,
          color: palette.primary,
          fontFace: 'Arial'
        })
        
        // 内容
        slide.addText(point, {
          x: x + 0.2, y: y + 0.9, w: colWidth - 0.4, h: usableHeight / Math.ceil(points.length / 2) - 1.2,
          align: 'left', valign: 'top',
          fontSize: 14,
          color: palette.text,
          fontFace: 'Microsoft YaHei'
        })
      })
      
    } else if (layout === 'numbered') {
      // ========== 序号列表布局 ==========
      const itemHeight = usableHeight / points.length
      
      points.forEach((point, idx) => {
        const y = startY + idx * itemHeight
        
        // 序号大数字
        slide.addText(`${idx + 1}`, {
          x: 0.5, y: y + 0.2, w: 1, h: itemHeight - 0.4,
          align: 'center', valign: 'middle',
          fontSize: 36, bold: true,
          color: palette.primary,
          fontFace: 'Arial'
        })
        
        // 分隔线
        slide.addShape('rect', {
          x: 1.7, y: y + 0.3, w: 0.02, h: itemHeight - 0.6,
          fill: { color: palette.secondary, transparency: 50 }
        })
        
        // 内容
        slide.addText(point, {
          x: 2, y: y + 0.2, w: 10.8, h: itemHeight - 0.4,
          align: 'left', valign: 'middle',
          fontSize: 16,
          color: palette.text,
          fontFace: 'Microsoft YaHei'
        })
      })
      
    } else if (layout === 'quote') {
      // ========== 引用式布局 ==========
      
      // 引用装饰
      slide.addText('"', {
        x: 0.3, y: startY - 0.3, w: 1, h: 1.5,
        fontSize: 80, bold: true,
        color: palette.primary,
        fontFace: 'Georgia'
      })
      
      points.forEach((point, idx) => {
        const y = startY + 0.8 + idx * (usableHeight / points.length)
        
        // 要点
        slide.addText(point, {
          x: 1, y: y, w: 11.33, h: usableHeight / points.length,
          align: 'left', valign: 'top',
          fontSize: 17,
          color: palette.text,
          fontFace: 'Microsoft YaHei',
          italic: true
        })
      })
      
    } else {
      // ========== 默认布局 - 标准列表 ==========
      const itemHeight = usableHeight / points.length
      
      points.forEach((point, idx) => {
        const y = startY + idx * itemHeight
        
        // 序号圆点
        slide.addShape('ellipse', {
          x: 0.6, y: y + 0.25, w: 0.4, h: 0.4,
          fill: { color: palette.secondary }
        })
        
        // 序号
        slide.addText(`${idx + 1}`, {
          x: 0.6, y: y + 0.25, w: 0.4, h: 0.4,
          align: 'center', valign: 'middle',
          fontSize: 12, bold: true,
          color: palette.accent,
          fontFace: 'Arial'
        })
        
        // 内容
        slide.addText(point, {
          x: 1.2, y: y + 0.1, w: 11.6, h: itemHeight - 0.3,
          align: 'left', valign: 'middle',
          fontSize: 15,
          color: palette.text,
          fontFace: 'Microsoft YaHei'
        })
      })
    }
  }
}

/**
 * 生成PPTX文件
 */
async function generatePPTX(pages, images, title, subtitle, styleConfig) {
  console.log('[PPTX] 开始生成...')
  
  let PptxGenJS, pptx
  try {
    PptxGenJS = require('pptxgenjs')
    pptx = new PptxGenJS()
  } catch (e) {
    console.error('[PPTX] 加载失败:', e.message)
    return null
  }
  
  try {
    // 设置属性
    pptx.author = BRAND_EN
    pptx.title = title
    pptx.subject = `由${BRAND_CN}生成的PPT`
    
    // 设置16:9布局
    pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 })
    pptx.layout = 'CUSTOM'
    
    // 生成每页
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const img = images[i]
      const slide = pptx.addSlide()
      
      // 添加背景
      if (img?.url) {
        try {
          const response = await fetch(img.url)
          const buffer = Buffer.from(await response.arrayBuffer())
          const base64 = buffer.toString('base64')
          const contentType = response.headers.get('content-type') || 'image/png'
          
          slide.addImage({
            data: `data:${contentType};base64,${base64}`,
            x: 0, y: 0, w: '100%', h: '100%',
            sizing: { type: 'cover', w: '100%', h: '100%' }
          })
        } catch (err) {
          console.error(`[PPTX] 背景添加失败: ${err.message}`)
          slide.background = { color: styleConfig?.palette?.primary?.replace('#', '') || '1E3A5F' }
        }
      } else {
        slide.background = { color: styleConfig?.palette?.primary?.replace('#', '') || '1E3A5F' }
      }
      
      // 绘制布局
      generateLayoutDesign(slide, page, styleConfig?.palette || {
        primary: '1E3A5F',
        secondary: '4A90D9',
        text: 'FFFFFF',
        light: 'E8F4FC'
      }, i, title, subtitle)
    }
    
    const pptxData = await pptx.write({ outputType: 'base64' })
    console.log(`[PPTX] 生成成功: ${(pptxData.length / 1024).toFixed(2)}KB`)
    
    return {
      filename: `${title}.pptx`,
      data: pptxData,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    
  } catch (error) {
    console.error('[PPTX] 生成异常:', error.message)
    return null
  }
}

// ============ 图片库初始化数据 ============
const INITIAL_IMAGES = [
  {
    "_id": "tpl_guobao_001_cover",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image1.png",
    "type": "cover",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示", "高端", "党政"],
    "colors": ["#C41E3A", "#FFD700", "#8B0000"],
    "layout": "center",
    "mood": "庄重大气、华贵典雅",
    "usage_count": 0,
    "quality_score": 4.8,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_content_01",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image2.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "left_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_content_02",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image3.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "right_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_content_03",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image4.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_content_04",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image5.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_content_05",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image6.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_toc",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image7.png",
    "type": "toc",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.6,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_001_end",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_001/image8.png",
    "type": "end",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.6,
    "source": "template_tpl_guobao_001"
  },
  {
    "_id": "tpl_guobao_002_cover",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image1.png",
    "type": "cover",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示", "高端", "党政"],
    "colors": ["#C41E3A", "#FFD700", "#8B0000"],
    "layout": "center",
    "mood": "庄重大气、华贵典雅",
    "usage_count": 0,
    "quality_score": 4.8,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_content_01",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image2.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "left_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_content_02",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image3.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "right_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_content_03",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image4.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_content_04",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image5.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_content_05",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image6.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_toc",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image7.png",
    "type": "toc",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.6,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_002_end",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_002/image8.png",
    "type": "end",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.6,
    "source": "template_tpl_guobao_002"
  },
  {
    "_id": "tpl_guobao_003_cover",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image1.png",
    "type": "cover",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示", "高端", "党政"],
    "colors": ["#C41E3A", "#FFD700", "#8B0000"],
    "layout": "center",
    "mood": "庄重大气、华贵典雅",
    "usage_count": 0,
    "quality_score": 4.8,
    "source": "template_tpl_guobao_003"
  },
  {
    "_id": "tpl_guobao_003_content_01",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image2.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "left_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_003"
  },
  {
    "_id": "tpl_guobao_003_content_02",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image3.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFD700"],
    "layout": "right_title",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_003"
  },
  {
    "_id": "tpl_guobao_003_content_03",
    "path": "https://wangtengyu.github.io/deckcraft/templates-assets/images/tpl_guobao_003/image4.png",
    "type": "content",
    "style": "party_red",
    "keywords": ["国宝", "文化", "展示"],
    "colors": ["#C41E3A", "#FFF8DC"],
    "layout": "center",
    "mood": "庄重典雅",
    "usage_count": 0,
    "quality_score": 4.5,
    "source": "template_tpl_guobao_003"
  }
]

/**
 * 初始化图片库（自动检测并插入初始数据）
 */
async function initImageLibrary(db) {
  try {
    const collection = db.collection('image_library')
    const count = await collection.count()
    
    if (count.total === 0) {
      console.log('[图片库] 检测到空库，开始初始化...')
      await collection.add(INITIAL_IMAGES)
      console.log(`[图片库] 成功初始化 ${INITIAL_IMAGES.length} 张图片`)
    } else {
      console.log(`[图片库] 已有 ${count.total} 张图片，跳过初始化`)
    }
  } catch (error) {
    console.log('[图片库] 初始化跳过:', error.message)
  }
}

// ============ 主函数 ============
export default async function (ctx) {
  console.log(`=== ${BRAND_CN} V9.0 生成开始 ===`)
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  // 初始化图片库
  const db = cloud.database()
  await initImageLibrary(db)
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'auto'
  const scene = ctx.body?.scene || 'other'
  const pageCount = parseInt(ctx.body?.pageCount) || 5
  const userOutline = ctx.body?.outline
  const subtitle = ctx.body?.subtitle || ''
  
  // 内容参数
  const contentDensity = ctx.body?.contentDensity || 'medium'
  const pointsPerSection = contentDensity === 'low' ? 2 : (contentDensity === 'high' ? 4 : 3)
  
  // 页面结构选项
  const hasCover = ctx.body?.hasCover !== false
  const hasCatalog = ctx.body?.hasCatalog === true
  const hasContent = ctx.body?.hasContent !== false
  const hasEnding = ctx.body?.hasEnding !== false
  
  // 处理参考图
  const refImages = await processRefImages(ctx.body?.refImages || [])
  
  // 获取平台尺寸
  const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
  
  // 自动匹配风格
  const { key: styleKey, config: styleConfig } = style === 'auto' 
    ? matchStyle(topic, scene)
    : { key: style, config: GAMMA_STYLES[style] || GAMMA_STYLES.business }
  
  console.log(`[配置] 风格: ${styleConfig.name}, 场景: ${scene}, 页数: ${pageCount}`)
  
  try {
    // ========== 生成内容大纲 ==========
    await updateProgress(taskId, {
      status: 'generating',
      currentStep: 1,
      message: '正在生成内容结构...',
      totalSteps: pageCount + 3,
      totalPages: pageCount,
      style: styleKey
    })
    
    let pages = []
    let pptTitle = topic
    
    if (userOutline?.outline?.length > 0) {
      // 使用用户大纲
      pptTitle = userOutline.title || topic
      
      if (hasCover) {
        pages.push({ type: 'cover', section: '封面', layout: 'center' })
      }
      if (hasCatalog) {
        pages.push({ type: 'toc', section: '目录', layout: 'grid', points: userOutline.outline.map(o => o.section) })
      }
      if (hasContent) {
        userOutline.outline.forEach((section, idx) => {
          pages.push({
            type: 'content',
            section: section.section,
            points: section.points || [],
            layout: ['left_title', 'big_points', 'two_column', 'numbered'][idx % 4]
          })
        })
      }
      if (hasEnding) {
        pages.push({ type: 'ending', section: userOutline.ending || '感谢聆听', layout: 'center' })
      }
    } else {
      // 使用默认结构
      const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other
      let filteredPages = structure.pages.filter(p => {
        if (p.type === 'cover' && !hasCover) return false
        if (p.type === 'toc' && !hasCatalog) return false
        if (p.type === 'content' && !hasContent) return false
        if (p.type === 'ending' && !hasEnding) return false
        return true
      })
      pages = filteredPages.slice(0, pageCount)
      
      // AI生成内容要点
      const contentPages = pages.filter(p => p.type === 'content')
      for (const page of contentPages) {
        const aiPoints = await generateContentWithArk(topic, page.section, pointsPerSection, scene, styleConfig)
        if (aiPoints && aiPoints.length > 0) {
          page.points = aiPoints
        } else {
          page.points = Array.from({ length: pointsPerSection }, (_, i) => `${page.section}要点${i + 1}`)
        }
      }
    }
    
    console.log(`[大纲] 生成${pages.length}页`)
    
    // ========== 生成背景图片 ==========
    await updateProgress(taskId, {
      currentStep: 2,
      message: `正在生成${pages.length}页背景...`
    })
    
    const images = []
    let libraryCount = 0  // 图片库使用次数统计
    let aiCount = 0       // AI生图次数统计
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      
      // V9优化：优先从图片库匹配
      const matchResult = await matchImageFromLibrary(cloud.database(), {
        type: page.type,
        style: styleKey,
        topic: topic,
        mood: styleConfig.mood
      })
      
      let imageUrl = ''
      let imageError = null
      let imageSource = 'none'
      
      if (!matchResult.needAI && matchResult.image) {
        // 使用图片库图片
        imageUrl = matchResult.image.url || matchResult.image.path
        imageSource = 'library'
        libraryCount++
        console.log(`[图片 ${i + 1}/${pages.length}] 使用库图，分数=${matchResult.score}`)
      } else {
        // AI生成图片
        const prompt = generateImagePrompt(page, styleConfig, platform, i, pages.length)
        console.log(`\n[Prompt ${i + 1}/${pages.length}]:\n${prompt.substring(0, 200)}...\n`)
        
        const result = await generateImageWithArk(prompt, platform)
        imageUrl = result.url
        imageError = result.error
        imageSource = result.url ? 'ai' : 'none'
        aiCount++
        console.log(`[图片 ${i + 1}/${pages.length}] AI生图${result.url ? '成功' : '失败'}`)
      }
      
      images.push({
        page: i + 1,
        type: page.type,
        url: imageUrl,
        error: imageError,
        source: imageSource,  // V9新增：图片来源标记
        matchScore: matchResult.score  // V9新增：匹配分数
      })
      
      // 更新进度
      await updateProgress(taskId, {
        currentStep: 2 + i,
        message: `已生成${i + 1}/${pages.length}页背景`
      })
    }
    
    console.log(`[图片统计] 库图=${libraryCount}, AI生图=${aiCount}, 总计=${images.length}`)
    console.log(`[成本节省] ${Math.round(libraryCount / images.length * 100)}%`)
    
    
    // ========== 生成PPTX ==========
    await updateProgress(taskId, {
      currentStep: pages.length + 2,
      message: '正在生成PPTX文件...'
    })
    
    const pptxResult = await generatePPTX(pages, images, pptTitle, subtitle, styleConfig)
    
    // ========== 完成 ==========
    const finalProgress = await updateProgress(taskId, {
      status: 'completed',
      currentStep: pages.length + 3,
      progress: 100,
      message: '生成完成'
    })
    
    return {
      code: 0,
      message: 'success',
      data: {
        taskId: taskId,
        topic: topic,
        title: pptTitle,
        style: styleKey,
        styleName: styleConfig.name,
        pages: pages,
        images: images,
        pptx: pptxResult,
        progress: finalProgress,
        // V9新增：图片库统计
        stats: {
          totalPages: pages.length,
          libraryImages: libraryCount,
          aiImages: aiCount,
          costSaving: Math.round(libraryCount / images.length * 100) + '%'
        },
        // V9新增：演讲稿询问
        askSpeechScript: true,  // 前端收到此字段后询问用户
        pptContent: {  // 用于演讲稿生成
          title: pptTitle,
          pages: pages.map(p => ({
            title: p.section || p.title || '',
            content: p.points ? p.points.join('、') : (p.content || '')
          }))
        },
        brand: { en: BRAND_EN, cn: BRAND_CN }
      }
    }
    
  } catch (error) {
    console.error('[主流程] 异常:', error)
    
    await updateProgress(taskId, {
      status: 'failed',
      message: error.message,
      progress: 0
    })
    
    return {
      code: -1,
      message: error.message,
      data: { taskId, error: error.message }
    }
  }
}
