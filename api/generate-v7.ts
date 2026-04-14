/**
 * PPT生成API - Laf云函数 V7.0 (完整版)
 * Phase 8: 集成PPTX导出功能
 * 
 * 新增功能：
 * - 生成背景图片后自动生成PPTX文件
 * - PPTX包含可编辑的文字图层
 * - 返回图片预览 + PPTX下载链接
 */

const cloud = require('@lafjs/cloud')

const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run'
const WORKFLOW_ID = '7584118159226241076'
const COZE_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw'

// ============ 禁用词列表 ============
const FORBIDDEN_WORDS = [
  '商务', '现代', '专业', '商业', '咨询', '高端', '大气', 
  '童趣', '稳重', '政务', '正式', '规范', '精英', '职场'
]

// ============ 细分风格配置 ============
const SUB_STYLE_CONFIG = {
  A: {
    name: '信息图风',
    description: '汇报导向内容，几何图形承载文字',
    subStyles: {
      'party_red': {
        name: '党政红金',
        keywords: ['党建', '党课', '主题党日', '表彰大会', '党委', '党支部'],
        visualStyle: '红金配色风格，深红色背景，金色线条装饰。标题金色粗体，正文白色。整体庄重大气。不要出现人像。',
        bgColor: '#8B0000',
        textColor: 'FFD700'
      },
      'gov_blue': {
        name: '政务蓝',
        keywords: ['政务', '政策', '政府', '机关', '汇报', '政策解读'],
        visualStyle: '政务蓝风格，深蓝色背景，白色线条装饰。标题白色粗体，正文浅蓝。整体严肃规范。不要出现人像。',
        bgColor: '#1E3A5F',
        textColor: 'FFFFFF'
      },
      'culture': {
        name: '文化古典',
        keywords: ['历史', '国学', '传统文化', '古典', '文化', '遗产'],
        visualStyle: '古典文化风格，米黄色宣纸肌理背景，深棕色边框装饰。标题深棕色书法感，正文深灰。整体典雅古朴。不要出现人像。',
        bgColor: '#F5DEB3',
        textColor: '4A3728'
      },
      'tech_warm': {
        name: '米白暖色',
        keywords: ['互联网', '科技', '创意', '教育培训', '年轻', '创业'],
        visualStyle: '米色图纸感的背景，整体呈低饱和暖色系。标题的字号小，正文的字号非常小，保持留白充足，搭配少量扁平化插画。不要出现人像。',
        bgColor: '#F5F5DC',
        textColor: '333333'
      },
      'general_blue': {
        name: '通用蓝白',
        keywords: [],
        visualStyle: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。标题的字号小，正文的字号非常小，保持留白充足，适当搭配少量扁平的图解元素。不要出现人像。',
        bgColor: '#E8F4FC',
        textColor: '1A5276'
      }
    }
  },
  
  B: {
    name: '插画科普风',
    description: '插画/图标辅助解释概念，增强理解',
    subStyles: {
      'blackboard': {
        name: '黑板粉笔',
        keywords: ['课堂', '教学', '知识竞赛', '数学', '物理', '公式'],
        visualStyle: '黑板粉笔风格，深绿色黑板背景。粉笔白色为主色调，线条带粉笔颗粒感。整体手绘自然、课堂板书感。',
        bgColor: '#2F4F4F',
        textColor: 'FFFFFF'
      },
      'flat_illustration': {
        name: '扁平插画',
        keywords: ['小学课件', '企业培训', '安全教育', '健康科普', '科普宣传'],
        visualStyle: '扁平插画风格，天蓝色背景。扁平矢量插画，几何化简化，色彩明亮。整体清爽、易理解。',
        bgColor: '#87CEEB',
        textColor: '1A5276'
      },
      'warm_yellow': {
        name: '暖黄亲切',
        keywords: ['生活技能', '健康', '育儿', '家庭'],
        visualStyle: '扁平插画风格，暖黄色背景。扁平矢量插画，几何化简化，色彩温暖。整体温暖、亲切。',
        bgColor: '#FFFACD',
        textColor: '5D4E37'
      }
    }
  },
  
  C: {
    name: '图文混排风',
    description: '实景照片是主要视觉元素',
    subStyles: {
      'nature': {
        name: '自然风光',
        keywords: ['旅游', '风景', '自然', '山水', '户外'],
        visualStyle: '极简艺术风格，全屏高清自然风景摄影图作为背景，中心叠加纯色矩形画框承载文字。整体构图对称、稳定、高级。无人物。',
        bgColor: '#F0F8FF',
        textColor: '2C3E50'
      },
      'city': {
        name: '城市建筑',
        keywords: ['建筑', '城市', '商务', '地标', '金融'],
        visualStyle: '商务科技风格，深蓝色纯色背景与高清城市实景图结合。文字清晰有力，配色为白金搭配。严禁大面积使用金色背景。无人物。',
        bgColor: '#1E3A5F',
        textColor: 'FFFFFF'
      },
      'food': {
        name: '美食摄影',
        keywords: ['美食', '餐饮', '菜品', '餐厅'],
        visualStyle: '美食摄影风格，高质量美食照片为主体，浅色背景衬托。文字简洁，配色为暖色调。无人物。',
        bgColor: '#FFF8DC',
        textColor: '5D4E37'
      }
    }
  },
  
  D: {
    name: '卡通绘本风',
    description: '卡通插画为主，文字大而少',
    subStyles: {
      'candy': {
        name: '糖果色',
        keywords: ['数字', '形状', '颜色', '认知', '幼儿安全', '日常生活'],
        visualStyle: '儿童绘本风格，浅黄色背景，糖果色装饰，可爱温馨。标题彩色圆润字体。',
        bgColor: '#FFFACD',
        textColor: 'FF69B4'
      },
      'watercolor': {
        name: '绘本水彩',
        keywords: ['故事', '童话', '动物', '绘本'],
        visualStyle: '绘本水彩风格，浅粉色背景，手绘水彩质感，温馨童话。标题深棕色圆润字体。',
        bgColor: '#FFF0F5',
        textColor: '8B4513'
      }
    }
  },
  
  E: {
    name: '手绘笔记风',
    description: '手绘线条 + 信息图结构',
    subStyles: {
      'hand_drawn': {
        name: '手绘信息图',
        keywords: ['知识分享', '生活常识', '产品科普', '经验总结', '读书笔记', '方法论'],
        visualStyle: '手绘信息图风格，米白色纸张肌理背景，黑色细描边，柔和马克笔平涂。标题的字号小，正文的字号非常小，保持留白充足，搭配简笔图标和符号化小人。',
        bgColor: '#FAF0E6',
        textColor: '2C3E50'
      }
    }
  }
}

// ============ 内容结构模板 ============
const NARRATIVE_STRUCTURES = {
  report: {
    name: '工作汇报',
    pages: [
      { type: 'cover', section: '封面', title: '标题' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '背景与目标', points: 3 },
      { type: 'content', section: '执行过程', points: 4 },
      { type: 'content', section: '关键成果', points: 3 },
      { type: 'content', section: '问题与挑战', points: 2 },
      { type: 'content', section: '下一步计划', points: 3 },
      { type: 'ending', section: '感谢聆听' }
    ]
  },
  proposal: {
    name: '项目方案',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '问题与机会', points: 3 },
      { type: 'content', section: '解决方案', points: 4 },
      { type: 'content', section: '核心优势', points: 3 },
      { type: 'content', section: '实施计划', points: 4 },
      { type: 'ending', section: '期待合作' }
    ]
  },
  training: {
    name: '培训课件',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '培训目标', points: 3 },
      { type: 'content', section: '基础知识', points: 4 },
      { type: 'content', section: '核心技能', points: 3 },
      { type: 'content', section: '实操演练', points: 3 },
      { type: 'ending', section: '培训总结' }
    ]
  },
  science: {
    name: '知识科普',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'toc', section: '目录' },
      { type: 'content', section: '核心概念', points: 3 },
      { type: 'content', section: '关键原理', points: 4 },
      { type: 'content', section: '实践应用', points: 3 },
      { type: 'ending', section: '总结回顾' }
    ]
  },
  other: {
    name: '通用模板',
    pages: [
      { type: 'cover', section: '封面' },
      { type: 'content', section: '内容一', points: 3 },
      { type: 'content', section: '内容二', points: 3 },
      { type: 'content', section: '内容三', points: 3 },
      { type: 'ending', section: '感谢聆听' }
    ]
  }
}

// ============ 平台尺寸配置 ============
const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, name: '小红书' },
  wechat: { width: 1080, height: 1920, name: '微信' }
}

// ============ 辅助函数 ============

// ============ AI内容生成（使用火山方舟）============
const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const ARK_API_KEY = process.env.ARK_API_KEY || '53316440-45a1-4b3d-bf07-c5a8a9d195ed'
const ARK_MODEL_ID = 'doubao-seed-1-8-251228'

// 生成内容要点（如果大纲中的内容不够具体）
async function enrichContentWithAI(topic, section, refDocument, refUrlContent) {
  const prompt = `为"${topic}"的"${section}"章节生成3个具体要点。
${refDocument ? `\n参考文档内容：\n${refDocument.substring(0, 2000)}` : ''}
${refUrlContent ? `\n参考链接内容：\n${refUrlContent.substring(0, 2000)}` : ''}

要求：
1. 要点要具体、有内容
2. 如果有参考素材，要基于素材内容生成
3. 每行一个要点，不要序号

示例：
市场调研数据显示用户需求集中在三个维度
竞争对手分析揭示差异化机会
产品定位策略需要调整`

  try {
    const response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: ARK_MODEL_ID,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    const result = await response.json()
    if (result.choices?.[0]?.message?.content) {
      const lines = result.choices[0].message.content.split('\n').filter(l => l.trim())
      return lines.slice(0, 3).map(l => l.replace(/^[\d\.\-\*]+\s*/, '').trim())
    }
  } catch (e) {
    console.error('AI内容生成失败:', e)
  }
  return null
}

// Base64 转 URL（上传到免费图床）
async function base64ToUrl(base64Data) {
  // 去掉 data:image/xxx;base64, 前缀
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) {
    return { url: base64Data, error: null }; // 可能已经是 URL
  }
  
  const ext = matches[1];
  const base64 = matches[2];
  
  try {
    // 使用 sm.ms 免费图床
    const buffer = Buffer.from(base64, 'base64');
    const formData = new FormData();
    const blob = new Blob([buffer], { type: `image/${ext}` });
    formData.append('smfile', blob, `image.${ext}`);
    
    const response = await fetch('https://api.sm.ms/api/v2/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success && result.data?.url) {
      console.log('图片上传成功:', result.data.url);
      return { url: result.data.url, error: null };
    } else if (result.code === 'image_repeated') {
      // 图片已存在，返回已有 URL
      return { url: result.images, error: null };
    } else {
      console.error('sm.ms 上传失败:', result.message);
      return { url: '', error: result.message || '上传失败' };
    }
  } catch (error) {
    console.error('上传图片到图床失败:', error);
    return { url: '', error: error.message };
  }
}

// 批量处理 Base64 图片
async function processRefImages(refImages) {
  if (!refImages || refImages.length === 0) return [];
  
  const urls = [];
  for (const img of refImages) {
    // 如果已经是 URL，直接使用
    if (img.startsWith('http')) {
      urls.push(img);
    } else {
      // Base64 转 URL
      const result = await base64ToUrl(img);
      if (result.url) {
        urls.push(result.url);
      } else {
        console.error('参考图处理失败:', result.error);
      }
    }
  }
  return urls;
}

function recommendSubStyle(mainStyle, scene, topic) {
  const styleConfig = SUB_STYLE_CONFIG[mainStyle]
  if (!styleConfig || !styleConfig.subStyles) {
    return { subStyleKey: null, subStyleConfig: null }
  }
  
  const combinedText = `${scene} ${topic}`.toLowerCase()
  
  for (const [key, subStyle] of Object.entries(styleConfig.subStyles)) {
    if (subStyle.keywords && subStyle.keywords.length > 0) {
      const hasKeyword = subStyle.keywords.some(kw => combinedText.includes(kw.toLowerCase()))
      if (hasKeyword) {
        return { subStyleKey: key, subStyleConfig: subStyle }
      }
    }
  }
  
  const keys = Object.keys(styleConfig.subStyles)
  const defaultKey = keys[keys.length - 1]
  return { subStyleKey: defaultKey, subStyleConfig: styleConfig.subStyles[defaultKey] }
}

function checkForbiddenWords(text) {
  const found = FORBIDDEN_WORDS.filter(word => text.includes(word))
  return found.length > 0 ? found : null
}

// ============ 参考图说明生成 ============
function generateRefImageDescription(refImages, refImageMode, refImageDescriptions = []) {
  if (!refImages || refImages.length === 0) return ''
  
  const modeTemplates = {
    embed: '照片主体内容必须保持不变，可以添加与页面风格协调的相框或边框装饰。',
    strict: '必须作为独立图层原样嵌入，不添加任何边框或装饰，保持原始比例不拉伸。',
    content_ref: '作为内容参考，提取其中的信息结构，用当前页面的视觉风格重新绘制，不要直接使用这张图。',
    style_ref: '作为风格参考，参考其配色和风格应用到当前页面内容，不要直接使用这张图。'
  }
  
  const mode = refImageMode || 'embed'
  const constraint = modeTemplates[mode] || modeTemplates.embed
  
  let description = '\n\n参考图说明（以下内容仅用于指导参考图的使用方式，不要把文字本身写进画面）：\n'
  
  if (refImages.length === 1) {
    // 使用用户描述或默认描述
    const imgDesc = refImageDescriptions[0] || '参考图片'
    description += `提供的参考图是${imgDesc}，放置在页面合适位置。${constraint}`
  } else {
    refImages.forEach((img, idx) => {
      const imgDesc = refImageDescriptions[idx] || `第${idx + 1}张参考图`
      description += `第${idx + 1}张参考图是${imgDesc}，放置在页面合适位置。${constraint}\n`
    })
  }
  
  return description
}

function generatePrompt(page, style, subStyleConfig, context, refImages = [], refImageMode = 'embed', refImageDescriptions = []) {
  const visualStyle = subStyleConfig?.visualStyle || SUB_STYLE_CONFIG[style]?.description || ''
  const textColor = subStyleConfig?.textColor || '1A1A1A'
  
  let prompt = ''
  
  // 恢复原skill的Prompt风格：描述布局，让AI生成有设计感的背景
  // 文字区域用装饰框表示，PPTX会叠加真实可编辑文字
  
  if (page.type === 'cover') {
    const title = page.title || context.topic
    prompt = `生成一张PPT封面页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面中央位置展示主标题区域，用装饰性矩形框或线条标示，框内留空。
主标题区域下方展示副标题区域，用较小的装饰框标示。
可以添加与主题相关的装饰性几何图形、图标、线条。
整体留白充足，聚焦标题区域。禁止任何人物、人像、照片。`
    
  } else if (page.type === 'ending') {
    const endingContent = page.content || '感谢聆听'
    prompt = `生成一张PPT结尾页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面中央位置展示结语区域，用装饰性元素标示。
整体简洁，可以添加点缀性装饰。
整体留白充足。禁止任何人物、人像、照片。`
    
  } else {
    // 内容页
    const sectionTitle = page.section || '内容'
    const points = page.points || []
    
    let contentDesc = ''
    if (points.length > 0) {
      contentDesc = points.map((p, i) => `要点${i + 1}区域：用卡片或装饰框标示`).join('\n')
    }
    
    prompt = `生成一张PPT内容页。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

页面顶部展示标题区域，用装饰性线条或色块标示。

${contentDesc}

可以添加与内容相关的装饰性图解元素、图标、分隔线。
整体留白充足，层次清晰。禁止任何人物、人像、照片。`
  }
  
  // 检查禁用词
  const forbiddenFound = checkForbiddenWords(prompt)
  if (forbiddenFound) {
    forbiddenFound.forEach(word => {
      prompt = prompt.replace(new RegExp(word, 'g'), '')
    })
  }
  
  // 追加参考图说明
  if (refImages && refImages.length > 0) {
    prompt += generateRefImageDescription(refImages, refImageMode, refImageDescriptions)
  }
  
  return prompt
}

// ============ AI内容生成 ============
async function generateSectionContent(topic, section, count, scene, apiKey) {
  console.log(`生成章节内容: ${section}, 要点数: ${count}`)
  
  const sceneContext = {
    report: '工作汇报',
    proposal: '项目方案',
    training: '培训课件',
    science: '知识科普',
    other: '通用内容'
  }[scene] || '通用内容'
  
  const prompt = `请为"${topic}"这个主题的"${section}"章节生成${count}个具体要点。

要求：
1. 每个要点要具体、有内容，不要空泛
2. 符合"${sceneContext}"场景
3. 直接输出要点，每行一个，不要序号和额外说明

示例格式：
市场现状与用户需求分析
竞争对手优劣势对比
产品定位与差异化策略`

  try {
    // 使用Coze Chat API生成内容
    const response = await fetch('https://api.coze.cn/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: '7584118159226241076', // 使用workflow的bot
        user_id: 'deckcraft_user',
        additional_messages: [{
          role: 'user',
          content: prompt,
          content_type: 'text'
        }],
        stream: false
      })
    })
    
    const result = await response.json()
    
    if (result.code === 0 && result.data?.messages) {
      // 提取AI回复的内容
      const assistantMsg = result.data.messages.find(m => m.role === 'assistant' && m.type === 'answer')
      if (assistantMsg?.content) {
        const lines = assistantMsg.content.split('\n').filter(l => l.trim())
        return lines.slice(0, count).map(l => l.replace(/^[\d\.\-\*]+\s*/, '').trim())
      }
    }
    
    console.log('AI生成失败，使用模板:', result.msg)
    return null
  } catch (error) {
    console.error('AI内容生成失败:', error)
    return null
  }
}

// 生成内容要点（优先AI，失败则用模板）
function generateContentPoints(section, count, topic, scene) {
  // 根据场景生成具体内容
  const contentTemplates = {
    '背景与目标': ['项目背景与现状分析', '核心目标与预期成果', '关键里程碑与时间节点'],
    '执行过程': ['前期调研与方案设计', '资源配置与团队分工', '实施步骤与关键动作', '风险识别与应对措施'],
    '关键成果': ['量化成果与数据表现', '质量提升与效率优化', '用户反馈与市场反响'],
    '问题与挑战': ['执行过程中的主要困难', '解决方案与经验总结'],
    '下一步计划': ['短期目标与行动计划', '资源配置与优先级', '预期成果与评估指标'],
    '培训目标': ['知识目标：掌握核心概念', '技能目标：提升实操能力', '态度目标：培养职业素养'],
    '基础知识': ['概念定义与核心原理', '发展历程与现状分析', '关键术语与专业概念', '相关法规与标准规范'],
    '核心技能': ['技能一：具体操作步骤', '技能二：注意事项要点', '技能三：常见问题解决']
  }
  
  return contentTemplates[section]?.slice(0, count) || 
    Array.from({ length: count }, (_, i) => `${section}要点${i + 1}：具体内容描述`)
}

// ============ 进度管理 ============
const PROGRESS_TTL = 300

async function updateProgress(taskId, updates) {
  try {
    let progress = await cloud.cache.get(`progress_${taskId}`)
    if (!progress) {
      progress = { taskId, totalSteps: 5, totalPages: 0 }
    }
    progress = { ...progress, ...updates, updatedAt: Date.now() }
    
    if (progress.totalSteps > 0) {
      const stepWeight = 100 / progress.totalSteps
      progress.progress = Math.min(99, Math.round(progress.currentStep * stepWeight))
    }
    
    await cloud.cache.set(`progress_${taskId}`, progress, PROGRESS_TTL)
    return progress
  } catch (e) {
    console.error('更新进度失败:', e)
    return null
  }
}

// ============ Coze API调用 ============
async function generateBackground(prompt, apiKey, size = '4096x2304', refImages = []) {
  console.log('=== 开始生成背景图片 ===')
  console.log('参考图数量:', refImages.length)
  
  try {
    const response = await fetch(COZE_WORKFLOW_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: {
          prompt: prompt,
          images_url: refImages,  // 参考图URL列表
          size: size,
          watermark: false
        }
      })
    })
    
    const result = await response.json()
    
    if (result.code !== 0) {
      console.error('Coze API错误:', result.msg)
      return { url: '', error: result.msg || 'API调用失败' }
    }
    
    const rawData = result.data
    let parsedData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
    
    const imageUrl = parsedData?.output?.data || ''
    const apiMsg = parsedData?.output?.msg || ''
    
    if (apiMsg !== 'success') {
      return { url: '', error: `Workflow错误: ${apiMsg}` }
    }
    
    if (imageUrl && imageUrl.startsWith('http')) {
      return { url: imageUrl, error: '' }
    }
    
    return { url: '', error: '无效的图片URL格式' }
    
  } catch (error) {
    console.error('Coze API调用失败:', error)
    return { url: '', error: error.message }
  }
}

// ============ PPTX生成 ============
async function generatePPTX(pages, images, title, subtitle, style, subStyleConfig) {
  console.log('=== 开始生成PPTX文件 ===')
  console.log('页数:', pages.length, '图片数:', images.length, '标题:', title, '副标题:', subtitle || '无')
  
  let pptxgen, pptx
  try {
    pptxgen = require('pptxgenjs')
    pptx = new pptxgen()
    console.log('pptxgenjs加载成功')
  } catch (e) {
    console.error('pptxgenjs加载失败:', e.message)
    return null
  }
  
  // 设置PPT属性
  pptx.author = 'DeckCraft AI'
  pptx.title = title
  pptx.subject = `由DeckCraft AI生成的${title}PPT`
  
  // 设置幻灯片尺寸 (16:9)
  pptx.defineLayout({ name: 'CUSTOM', width: 13.33, height: 7.5 })
  pptx.layout = 'CUSTOM'
  
  const textColor = subStyleConfig?.textColor || '1A1A1A'
  
  // 为每页创建幻灯片
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const img = images[i]
    const slide = pptx.addSlide()
    
    console.log(`处理第${i + 1}页: ${page.type}`)
    
    // 添加背景图片
    if (img && img.url) {
      try {
        const response = await fetch(img.url)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString('base64')
        const contentType = response.headers.get('content-type') || 'image/png'
        const dataUrl = `data:${contentType};base64,${base64}`
        
        slide.addImage({
          data: dataUrl,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          sizing: { type: 'cover', w: '100%', h: '100%' }
        })
        
      } catch (error) {
        console.error('添加背景图片失败:', error.message)
        slide.background = { color: subStyleConfig?.bgColor?.replace('#', '') || 'FFFFFF' }
      }
    } else {
      slide.background = { color: subStyleConfig?.bgColor?.replace('#', '') || 'FFFFFF' }
    }
    
    // 添加可编辑的文本框
    if (page.type === 'cover') {
      // 封面页 - 主标题
      slide.addText(title, {
        x: 0.5,
        y: 2.5,
        w: 12.33,
        h: 1.5,
        align: 'center',
        fontSize: 48,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei',
        valign: 'middle'
      })
      
      // 副标题 - 使用传入的副标题或显示提示
      const subtitleText = subtitle || ''
      if (subtitleText) {
        slide.addText(subtitleText, {
          x: 0.5,
          y: 4.2,
          w: 12.33,
          h: 0.8,
          align: 'center',
          fontSize: 24,
          color: textColor,
          fontFace: 'Microsoft YaHei'
        })
      }
      
    } else if (page.type === 'ending') {
      // 结尾页 - 使用大纲中的ending或默认感谢语
      const endingText = page.content || '感谢聆听'
      slide.addText(endingText, {
        x: 0.5,
        y: 3,
        w: 12.33,
        h: 1.5,
        align: 'center',
        fontSize: 48,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei'
      })
      
    } else {
      // 内容页
      slide.addText(page.section || `第${i}部分`, {
        x: 0.5,
        y: 0.5,
        w: 12.33,
        h: 1,
        align: 'left',
        fontSize: 32,
        bold: true,
        color: textColor,
        fontFace: 'Microsoft YaHei'
      })
      
      // 添加要点
      const points = page.points || generateContentPoints(page.section, 3)
      points.forEach((point, idx) => {
        slide.addText(`• ${point}`, {
          x: 1,
          y: 2.0 + idx * 1.2,
          w: 11,
          h: 0.8,
          align: 'left',
          fontSize: 20,
          color: textColor,
          fontFace: 'Microsoft YaHei'
        })
      })
    }
  }
  
  console.log('=== 开始生成PPTX文件 ===')
  
  const pptxData = await pptx.write({ outputType: 'base64' })
  
  console.log('PPTX生成成功，大小:', (pptxData.length / 1024).toFixed(2), 'KB')
  
  return {
    filename: `${title}.pptx`,
    data: pptxData,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
}

// ============ 主函数 ============
export default async function (ctx) {
  console.log('=== DeckCraft V7.0 生成开始 ===')
  console.log('请求参数:', JSON.stringify(ctx.body))
  
  const taskId = ctx.body?.taskId || `task_${Date.now()}`
  const topic = ctx.body?.topic || ctx.body?.userContent || '测试主题'
  const platform = ctx.body?.platform || 'ppt'
  const style = ctx.body?.style || 'A'
  const scene = ctx.body?.scene || 'report'
  const pageCount = parseInt(ctx.body?.pageCount) || 5
  const subStyleKey = ctx.body?.subStyle
  const userOutline = ctx.body?.outline
  const refImagesRaw = ctx.body?.refImages || []
  const refImageMode = ctx.body?.refImageMode || 'embed'
  const refImageDescriptions = ctx.body?.refImageDescriptions || []
  
  // 处理参考图：Base64 转 URL
  console.log('处理参考图:', refImagesRaw.length, '张')
  const refImages = await processRefImages(refImagesRaw)
  console.log('参考图 URL:', refImages)
  
  // 内容参数
  const contentDensity = ctx.body?.contentDensity || 'medium'
  const audience = ctx.body?.audience || 'adult'
  const userContent = ctx.body?.userContent || ''
  const smartTitle = ctx.body?.smartTitle !== false
  const subtitle = ctx.body?.subtitle || ''
  
  // 参考素材
  const refDocument = ctx.body?.refDocument || ''
  const refUrlContent = ctx.body?.refUrlContent || ''
  
  // 页面结构选项
  const hasCover = ctx.body?.hasCover !== false
  const hasCatalog = ctx.body?.hasCatalog === true
  const hasContent = ctx.body?.hasContent !== false
  const hasEnding = ctx.body?.hasEnding !== false
  
  const platformSize = PLATFORM_SIZES[platform] || PLATFORM_SIZES.ppt
  const apiKey = COZE_API_KEY
  
  // 根据内容密度调整要点数量
  const pointsPerSection = contentDensity === 'low' ? 2 : (contentDensity === 'high' ? 4 : 3)
  
  // 推荐或使用指定的细分风格
  const { subStyleKey: recommendedKey, subStyleConfig } = subStyleKey
    ? { subStyleKey, subStyleConfig: SUB_STYLE_CONFIG[style]?.subStyles?.[subStyleKey] }
    : recommendSubStyle(style, scene, topic)
  
  console.log(`主风格: ${style}, 细分风格: ${recommendedKey || '无'}`)
  console.log(`受众: ${audience}, 内容密度: ${contentDensity}, 每节要点: ${pointsPerSection}`)
  console.log(`页面结构: 封面=${hasCover}, 目录=${hasCatalog}, 内容=${hasContent}, 结尾=${hasEnding}`)
  console.log(`大纲数据: ${userOutline ? '有' : '无'}`)
  
  try {
    // ========== 生成内容大纲 ==========
    await updateProgress(taskId, {
      status: 'generating',
      currentStep: 1,
      message: '正在生成内容结构...',
      totalSteps: pageCount + 3,
      totalPages: pageCount,
      style: style,
      subStyle: recommendedKey
    })
    
    // 如果有用户大纲，使用大纲内容
    let pages = []
    let pptTitle = topic
    
    if (userOutline && userOutline.outline && userOutline.outline.length > 0) {
      // 使用用户大纲
      pptTitle = userOutline.title || topic
      
      // 封面页（根据选项）
      if (hasCover) {
        pages.push({
          type: 'cover',
          section: '封面',
          title: pptTitle
        })
      }
      
      // 目录页（根据选项）
      if (hasCatalog) {
        pages.push({
          type: 'toc',
          section: '目录'
        })
      }
      
      // 内容页（根据选项）
      if (hasContent) {
        userOutline.outline.forEach((section, idx) => {
          const points = section.points || []
          // 如果大纲中的内容不够具体（少于3个字），提示会基于参考素材生成
          const needEnrich = points.length === 0 || points.some(p => p.length < 5)
          
          pages.push({
            type: 'content',
            section: section.section,
            points: points,
            pageId: idx + 2,
            needEnrich: needEnrich // 标记需要充实
          })
        })
      }
      
      // 结尾页（根据选项）
      if (hasEnding && userOutline.ending) {
        pages.push({
          type: 'ending',
          section: '结尾',
          content: userOutline.ending
        })
      }
      
      console.log(`使用大纲生成 ${pages.length} 页`)
    } else {
      // 使用默认结构
      const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other
      let filteredPages = []
      
      // 根据选项过滤页面
      structure.pages.forEach(page => {
        if (page.type === 'cover' && hasCover) filteredPages.push(page)
        else if (page.type === 'toc' && hasCatalog) filteredPages.push(page)
        else if (page.type === 'content' && hasContent) filteredPages.push(page)
        else if (page.type === 'ending' && hasEnding) filteredPages.push(page)
      })
      
      // 按页数限制
      pages = filteredPages.slice(0, pageCount)
      
      // 为每个内容页生成具体内容
      pages.forEach(page => {
        if (page.type === 'content' && !page.points) {
          page.points = generateContentPoints(page.section, pointsPerSection)
        }
      })
      
      console.log(`使用默认结构生成 ${pages.length} 页`)
    }
    
    const images = []
    const context = { topic: topic }
    
    // ========== 并行生成所有页面背景（限制并发数为3）==========
    console.log(`开始生成 ${pages.length} 页背景（并发数: 3）...`)
    
    await updateProgress(taskId, {
      currentStep: 2,
      message: `正在生成 ${pages.length} 页背景...`,
      totalPages: pages.length
    })
    
    // 限制并发数的辅助函数
    async function limitConcurrency(tasks, limit) {
      const results = []
      const executing = []
      
      for (const task of tasks) {
        const p = task().then(result => {
          executing.splice(executing.indexOf(p), 1)
          return result
        })
        results.push(p)
        executing.push(p)
        
        if (executing.length >= limit) {
          await Promise.race(executing)
        }
      }
      
      return Promise.all(results)
    }
    
    // 创建图片生成任务
    const imageTasks = pages.map((page, i) => async () => {
      const prompt = generatePrompt(page, style, subStyleConfig, context, refImages, refImageMode, refImageDescriptions)
      console.log(`\n=== 第${i + 1}页 Prompt ===\n${prompt}\n`)
      
      const result = await generateBackground(prompt, apiKey, `${platformSize.width}x${platformSize.height}`, refImages)
      
      console.log(`第${i + 1}页生成${result.error ? '失败: ' + result.error : '成功'}`)
      
      return {
        page: i + 1,
        type: page.type,
        url: result.url,
        error: result.error
      }
    })
    
    // 执行（最多同时3个请求）
    const imageResults = await limitConcurrency(imageTasks, 3)
    images.push(...imageResults)
    
    console.log(`所有 ${images.length} 页背景生成完成`)
    
    // ========== 生成PPTX文件 ==========
    await updateProgress(taskId, {
      currentStep: pages.length + 2,
      message: '正在生成PPTX文件...'
    })
    
    // 从大纲或请求中获取副标题（优先级：传入参数 > 大纲 > 空）
    const pptSubtitle = subtitle || userOutline?.subtitle || ''
    
    let pptxResult = null
    try {
      pptxResult = await generatePPTX(pages, images, pptTitle, pptSubtitle, style, subStyleConfig)
    } catch (error) {
      console.error('PPTX生成失败:', error)
    }
    
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
        style: style,
        subStyle: recommendedKey,
        subStyleName: subStyleConfig?.name,
        pages: pages,
        images: images,
        pptx: pptxResult,
        progress: finalProgress,
        // 返回参数信息，便于调试
        params: {
          audience: audience,
          contentDensity: contentDensity,
          pointsPerSection: pointsPerSection,
          hasCover: hasCover,
          hasCatalog: hasCatalog,
          hasContent: hasContent,
          hasEnding: hasEnding
        }
      }
    }
    
  } catch (error) {
    console.error('生成失败:', error)
    
    await updateProgress(taskId, {
      status: 'failed',
      message: error.message,
      progress: 0
    })
    
    return {
      code: -1,
      message: error.message,
      data: {
        taskId: taskId,
        error: error.message
      }
    }
  }
}
