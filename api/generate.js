/**
 * PPT生成API - Laf云函数
 * 功能：接收用户需求，生成PPT
 */

const crypto = require('crypto');

// Coze API配置
const COZE_WORKFLOW_URL = 'https://api.coze.cn/v1/workflow/run';
const WORKFLOW_ID = '7584118159226241076';

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

// 叙事结构模板
const NARRATIVE_STRUCTURES = {
  report: ['背景', '成果', '问题', '计划'],
  proposal: ['痛点', '方案', '优势', '案例'],
  training: ['是什么', '为什么', '怎么做'],
  science: ['核心概念', '关键要点', '实践应用'],
  process: ['概述', '分步详解', '注意事项'],
  other: ['内容一', '内容二', '内容三']
};

// 根据受众推荐风格
function recommendStyle(audience) {
  const styleMap = {
    child: 'D',      // 幼儿 → 卡通绘本风
    student: 'B',    // 小学生 → 插画科普风
    adult: 'A',      // 成人 → 信息图风
    professional: 'A' // 专业人士 → 信息图风
  };
  return styleMap[audience] || 'A';
}

// 获取视觉风格描述
function getVisualStyle(styleCode, scene) {
  const style = STYLE_CONFIG[styleCode];
  if (!style) return STYLE_CONFIG.A.visual_styles.default;
  
  if (style.visual_style) {
    return style.visual_style;
  }
  
  // 信息图风有多个子风格
  if (styleCode === 'A') {
    const subStyleMap = {
      report: 'default',
      proposal: 'tech',
      training: 'tech',
      science: 'tech',
      process: 'default',
      other: 'default'
    };
    return style.visual_styles[subStyleMap[scene] || 'default'];
  }
  
  return style.visual_styles.default;
}

// 生成PPT内容结构
function generateContentStructure(topic, audience, scene, pageCount) {
  const structure = NARRATIVE_STRUCTURES[scene] || NARRATIVE_STRUCTURES.other;
  const pages = [];
  
  // 封面页
  pages.push({
    type: 'cover',
    title: topic.split('，')[0].substring(0, 20),
    subtitle: topic.length > 20 ? topic.substring(0, 40) : ''
  });
  
  // 内容页
  const contentPageCount = pageCount - 2; // 减去封面和结尾
  const sectionsPerStructure = Math.ceil(contentPageCount / structure.length);
  
  let pageIndex = 0;
  structure.forEach((section, i) => {
    const pagesForSection = Math.min(sectionsPerStructure, contentPageCount - pageIndex);
    for (let j = 0; j < pagesForSection && pageIndex < contentPageCount; j++) {
      pages.push({
        type: 'content',
        section: section,
        title: `${section}${j > 0 ? `（${j+1}）` : ''}`,
        points: [
          `要点一：相关内容描述`,
          `要点二：具体数据或案例`,
          `要点三：总结或建议`
        ]
      });
      pageIndex++;
    }
  });
  
  // 结尾页
  pages.push({
    type: 'ending',
    title: '感谢聆听'
  });
  
  return pages;
}

// 生成每页的prompt
function generatePrompt(page, styleCode, visualStyle) {
  if (page.type === 'cover') {
    return `生成一张PPT封面页。

${visualStyle}

页面中央位置展示主标题「${page.title}」，粗体，字号小，单行展示。
${page.subtitle ? `主标题下方展示副标题「${page.subtitle}」，字号更小。` : ''}

整体留白充足，聚焦标题。`;
  }
  
  if (page.type === 'ending') {
    return `生成一张PPT结尾页。

${visualStyle}

页面中央显示「${page.title}」，大号字。
整体简洁，大量留白。`;
  }
  
  // 内容页
  const pointsText = page.points.map(p => `- ${p}`).join('\n');
  
  return `生成一张信息图海报。

视觉风格（以下内容仅用于指导风格，不要把文字本身写进画面）：${visualStyle}

标题「${page.section}：${page.title}」位于页面左上角，粗体。

页面中央展示内容要点：
${pointsText}

整体布局清晰，信息层次分明。`;
}

// 调用Coze API生成图片
async function generateImage(prompt, apiKey, refImages = []) {
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
}

// 主函数
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { 
      topic, 
      audience = 'adult', 
      scene = 'report', 
      style, 
      pageCount = 10,
      apiKey,
      refImages = []
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: '缺少PPT主题' });
    }
    
    // 推荐风格
    const styleCode = style || recommendStyle(audience);
    const visualStyle = getVisualStyle(styleCode, scene);
    
    // 生成内容结构
    const pages = generateContentStructure(topic, audience, scene, pageCount);
    
    // 为每页生成prompt
    const pptContent = pages.map((page, index) => ({
      page_id: index + 1,
      prompt: generatePrompt(page, styleCode, visualStyle),
      ref_images: []
    }));
    
    // 如果用户提供了API Key，直接生成
    if (apiKey) {
      const imageUrls = [];
      for (const content of pptContent) {
        try {
          const imageUrl = await generateImage(content.prompt, apiKey, content.ref_images);
          imageUrls.push({ page_id: content.page_id, url: imageUrl });
        } catch (error) {
          imageUrls.push({ page_id: content.page_id, error: error.message });
        }
      }
      
      return res.json({
        success: true,
        ppt_title: topic.split('，')[0].substring(0, 30),
        style: STYLE_CONFIG[styleCode].name,
        pages: pptContent,
        images: imageUrls
      });
    }
    
    // 没有API Key，返回生成任务信息
    return res.json({
      success: true,
      ppt_title: topic.split('，')[0].substring(0, 30),
      style: STYLE_CONFIG[styleCode].name,
      visual_style: visualStyle,
      pages: pptContent,
      message: '请使用您的API Key进行生成'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
