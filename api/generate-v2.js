/**
 * DeckCraft PPT生成API v2 - Laf云函数
 * 支持创建模式、目标平台、内容来源、内容密度等完整参数
 */

// Coze API配置
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run';
const WORKFLOW_ID = '7584118159226241076';

// 平台API配置（Laf环境变量中配置）
const PLATFORM_API_KEY = process.env.COZE_API_KEY || 'sat_DSVeqpk54mf7bvo10wQwXeP90ZrebyxjjYKUvg81GYa7e0NHtdG93dhCOkNYXmzw';

// 风格配置
const STYLE_CONFIG = {
  A: {
    name: '信息图风',
    visual_styles: {
      default: '线性扁平风格，白色工程图纸感的背景，整体呈浅蓝-白色调。标题的字号小，正文的字号非常小，保持留白充足，适当搭配少量扁平的图解元素。不要出现人像。',
      tech: '米色图纸感的背景，整体呈低饱和暖色系。标题的字号小，正文的字号非常小，保持留白充足，搭配少量扁平化插画。',
      government: '浅红色调背景，带有淡淡的金色纹理。标题字号小，正文字号非常小，整体庄重典雅。',
      classic: '浅黄色宣纸质感的背景，带有淡淡的传统纹样。标题字号小，正文字号非常小，整体古朴典雅。'
    }
  },
  B: {
    name: '插画科普风',
    visual_style: '扁平插画风格，天蓝色背景，搭配橙黄色强调色。标题字号小到中等，正文字号小，整体清爽易理解，配几何化扁平插画辅助说明。'
  },
  C: {
    name: '图文混排风',
    visual_style: '照片为主的排版风格，留白充足，文字简洁。标题字号小，正文字号更小。'
  },
  D: {
    name: '卡通绘本风',
    visual_style: '可爱卡通插画风格，柔和的暖色调背景。标题字号大，文字少，整体活泼有趣。'
  },
  E: {
    name: '手绘笔记风',
    visual_style: '手绘线条风格，米色笔记本背景，带有淡淡网格线。标题字号小，正文字号小，整体轻松易读，配简单手绘元素。'
  }
};

// 目标平台尺寸配置
const PLATFORM_SIZES = {
  ppt: { width: 4096, height: 2304, ratio: '16:9', name: 'PPT标准' },
  xiaohongshu: { width: 1080, height: 1440, ratio: '3:4', name: '小红书' },
  wechat: { width: 1080, height: 1920, ratio: '9:16', name: '微信' },
  mobile: { width: 1080, height: 1920, ratio: '9:16', name: '手机竖屏' },
  poster: { width: 2480, height: 3508, ratio: 'A4', name: '海报' }
};

// 平台内容密度配置（每页要点数）
const PLATFORM_DENSITY = {
  ppt: { high: 5, medium: 3, low: 2 },
  xiaohongshu: { high: 3, medium: 2, low: 1 },
  wechat: { high: 3, medium: 2, low: 1 },
  mobile: { high: 2, medium: 1, low: 1 },
  poster: { high: 6, medium: 4, low: 3 }
};

// 平台表达风格
const PLATFORM_TONE = {
  ppt: '专业、正式、数据驱动',
  xiaohongshu: '活泼、有趣、emoji友好',
  wechat: '亲切、简洁、易于分享',
  mobile: '简洁、直观、易于滑动浏览',
  poster: '醒目、吸引眼球、关键信息突出'
};

// 叙事结构模板
const NARRATIVE_STRUCTURES = {
  report: ['背景与目标', '执行过程', '关键成果', '问题与挑战', '下一步计划'],
  proposal: ['问题与机会', '解决方案', '价值主张', '实施计划', '预期成果'],
  training: ['培训目标', '基础知识', '核心技能', '实践案例', '行动计划'],
  science: ['引入话题', '核心概念', '详细讲解', '案例分析', '总结回顾'],
  process: ['流程概述', '准备工作', '详细步骤', '注意事项', '常见问题'],
  other: ['内容一', '内容二', '内容三', '内容四', '内容五']
};

// 根据受众推荐风格
function recommendStyle(audience) {
  const styleMap = {
    child: 'D',
    student: 'B',
    adult: 'A',
    professional: 'A'
  };
  return styleMap[audience] || 'A';
}

// 获取视觉风格描述
function getVisualStyle(styleCode, scene) {
  const style = STYLE_CONFIG[styleCode];
  if (!style) return STYLE_CONFIG.A.visual_styles.default;
  
  if (style.visual_style) return style.visual_style;
  
  if (styleCode === 'A') {
    const subStyleMap = {
      report: 'government',
      proposal: 'tech',
      training: 'tech',
      science: 'tech',
      process: 'default',
      other: 'classic'
    };
    return style.visual_styles[subStyleMap[scene] || 'default'];
  }
  
  return style.visual_styles.default;
}

// 生成PPT内容结构
function generateContentStructure(topic, audience, scene, pageCount, platform, density, customStructure) {
  const structure = customStructure || NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other;
  const pointsPerPage = PLATFORM_DENSITY[platform][density];
  const pages = [];
  
  // 封面页
  pages.push({
    type: 'cover',
    title: topic.split('，')[0].substring(0, 20),
    subtitle: topic.length > 20 ? topic.substring(0, 40) : ''
  });
  
  // 内容页
  const contentPageCount = pageCount - 2;
  const sectionsPerStructure = Math.ceil(contentPageCount / structure.length);
  
  let pageIndex = 0;
  structure.forEach((section, i) => {
    const pagesForSection = Math.min(sectionsPerStructure, contentPageCount - pageIndex);
    for (let j = 0; j < pagesForSection && pageIndex < contentPageCount; j++) {
      pages.push({
        type: 'content',
        section: section,
        title: `${section}${j > 0 ? `（${j+1}）` : ''}`,
        points: generatePoints(section, pointsPerPage, platform)
      });
      pageIndex++;
    }
  });
  
  // 结尾页
  pages.push({
    type: 'ending',
    title: platform === 'xiaohongshu' ? '关注获取更多' : '感谢聆听'
  });
  
  return pages;
}

// 生成内容要点
function generatePoints(section, count, platform) {
  const basePoints = [
    `${section}相关背景介绍`,
    `关键数据与案例分析`,
    `核心观点与结论`,
    `实践建议与行动指南`,
    `总结与未来展望`
  ];
  
  let points = basePoints.slice(0, count);
  
  // 小红书风格优化
  if (platform === 'xiaohongshu') {
    points = points.map(p => p.replace(/。/g, '✨'));
  }
  
  return points;
}

// 生成每页的prompt
function generatePrompt(page, styleCode, visualStyle, platform) {
  const platformSize = PLATFORM_SIZES[platform];
  
  if (page.type === 'cover') {
    return `生成一张${platformSize.name}封面页。

${visualStyle}

尺寸：${platformSize.width}x${platformSize.height}，比例：${platformSize.ratio}

页面中央展示主标题「${page.title}」，粗体，字号适中，单行展示。
${page.subtitle ? `主标题下方展示副标题「${page.subtitle}」，字号更小。` : ''}

整体留白充足，聚焦标题。`;
  }
  
  if (page.type === 'ending') {
    return `生成一张${platformSize.name}结尾页。

${visualStyle}

尺寸：${platformSize.width}x${platformSize.height}

页面中央显示「${page.title}」，大号字。
整体简洁，大量留白。`;
  }
  
  // 内容页
  const pointsText = page.points.map(p => `- ${p}`).join('\n');
  
  return `生成一张${platformSize.name}内容页。

视觉风格：${visualStyle}

尺寸：${platformSize.width}x${platformSize.height}

标题「${page.section}：${page.title}」位于页面左上角，粗体。

页面中央展示内容要点：
${pointsText}

整体布局清晰，信息层次分明。`;
}

// 调用Coze API生成图片
async function generateImage(prompt, apiKey, refImages = []) {
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
          images_url: refImages,
          size: '4096x2304',
          watermark: false
        }
      })
    });
    
    const result = await response.json();
    
    if (result.code !== 0) {
      throw new Error(result.msg || 'API调用失败');
    }
    
    return result.data?.image_url || '';
  } catch (error) {
    throw new Error(`图片生成失败: ${error.message}`);
  }
}

// 主函数
export default async function handler(req, res) {
  // CORS设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { 
      topic,
      createMode = 'scratch',
      platform = 'ppt',
      contentSource = 'idea',
      contentDensity = 'medium',
      audience = 'adult',
      scene = 'report',
      style,
      pageCount = 10,
      pageStructure,
      smartTitle = true,
      refImages = [],
      userContent = '',
      apiKey,
      usePlatformApi = false
    } = req.body;
    
    // 参数验证
    if (!topic) {
      return res.status(400).json({ 
        success: false,
        error: '缺少PPT主题' 
      });
    }
    
    if (pageCount < 5 || pageCount > 20) {
      return res.status(400).json({ 
        success: false,
        error: '页数必须在5-20之间' 
      });
    }
    
    // 推荐风格
    const styleCode = style || recommendStyle(audience);
    const visualStyle = getVisualStyle(styleCode, scene);
    const platformSize = PLATFORM_SIZES[platform];
    
    // 智能优化标题
    let optimizedTopic = topic;
    if (smartTitle && topic.length > 30) {
      optimizedTopic = topic.substring(0, 30) + '...';
    }
    
    // 生成内容结构
    const pages = generateContentStructure(
      optimizedTopic, 
      audience, 
      scene, 
      pageCount, 
      platform, 
      contentDensity,
      pageStructure ? pageStructure.split(',').map(s => s.trim()) : null
    );
    
    // 为每页生成prompt
    const pptContent = pages.map((page, index) => ({
      page_id: index + 1,
      page_type: page.type,
      prompt: generatePrompt(page, styleCode, visualStyle, platform),
      ref_images: refImages,
      platform: platform,
      size: platformSize
    }));
    
    // 使用平台API生成图片（完全免费，自愿赞助）
    const imageUrls = [];
    const errors = [];
    
    for (const content of pptContent) {
      try {
        const imageUrl = await generateImage(content.prompt, PLATFORM_API_KEY, content.ref_images);
        imageUrls.push({ 
          page_id: content.page_id, 
          page_type: content.page_type,
          url: imageUrl 
        });
      } catch (error) {
        errors.push({ 
          page_id: content.page_id, 
          error: error.message 
        });
      }
    }
    
    return res.json({
      success: true,
      ppt_title: optimizedTopic.split('，')[0].substring(0, 30),
      style: STYLE_CONFIG[styleCode].name,
      platform: platformSize.name,
      platform_size: platformSize,
      pages: pptContent,
      images: imageUrls,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}
