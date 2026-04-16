/**
 * FDeck 高质量PPT渲染引擎 V3.0
 * 基于40张高端模板预览图学习优化
 */

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ============ 设计系统 V3 ============
const DesignSystemV3 = {
  // 幻灯片尺寸
  slideSize: { width: 10, height: 5.625 },
  
  // 间距系统
  spacing: {
    pageMargin: 0.5,
    elementGap: 0.35,
    lineHeight: 1.6,
  },
  
  // 字体系统（安全字体 + 降级）
  fonts: {
    chinese: { primary: 'Microsoft YaHei', fallback: 'SimHei', system: 'sans-serif' },
    english: { primary: 'Arial', fallback: 'Helvetica', system: 'sans-serif' }
  },
  
  typography: {
    // 书法风格大标题（封面用）
    calligraphy: { size: 72, font: 'Microsoft YaHei, SimHei, sans-serif', bold: true },
    // 英雄大标题
    hero: { size: 60, font: 'Microsoft YaHei, SimHei, sans-serif', bold: true },
    // 主标题
    title: { size: 36, font: 'Microsoft YaHei, SimHei, sans-serif', bold: true },
    // 副标题
    subtitle: { size: 24, font: 'Microsoft YaHei, SimHei, sans-serif', bold: false },
    // 正文
    body: { size: 16, font: 'Microsoft YaHei, SimHei, sans-serif', bold: false },
    // 小字
    caption: { size: 12, font: 'Microsoft YaHei, SimHei, sans-serif', bold: false },
    // 英文装饰字
    english: { size: 48, font: 'Arial, Helvetica, sans-serif', bold: false },
  },
  
  // 阴影效果
  shadows: {
    text: { type: 'outer', blur: 4, offset: 2, angle: 45, color: '000000', opacity: 0.4 },
    card: { type: 'outer', blur: 12, offset: 5, angle: 90, color: '000000', opacity: 0.12 },
    image: { type: 'outer', blur: 20, offset: 8, angle: 90, color: '000000', opacity: 0.15 },
    glow: { type: 'outer', blur: 15, offset: 0, angle: 0, color: 'FFFFFF', opacity: 0.3 },
  }
};

// ============ 配色方案库 ============
const ColorSchemesV3 = {
  // 党政红金（从模板学到）
  partyRed: {
    name: '党政红金',
    colors: {
      primary: '#C41E3A',      // 中国红
      secondary: '#8B0000',    // 深红
      accent: '#FFD700',       // 金色
      dark: '#2D2D2D',
      light: '#FFF8DC',
      text: '#333333',
      textLight: '#FFFFFF',
      background: '#FFFFFF',
      overlay: 'rgba(196, 30, 58, 0.85)'
    },
    mood: '庄重、热烈、正式',
    keywords: ['党建', '党课', '汇报', '红色', '党']
  },
  
  // 商务深蓝
  businessDeep: {
    name: '商务深蓝',
    colors: {
      primary: '#1E3A5F',      // 深海蓝
      secondary: '#2C5282',    // 中蓝
      accent: '#4A90D9',       // 亮蓝
      dark: '#0D1B2A',
      light: '#E8F0F8',
      text: '#1A1A2E',
      textLight: '#FFFFFF',
      background: '#F8FBFF',
      overlay: 'rgba(30, 58, 95, 0.75)'
    },
    mood: '专业、稳重、可靠',
    keywords: ['商务', '企业', '汇报', '总结', '计划']
  },
  
  // 自然大地色
  naturalEarth: {
    name: '自然大地',
    colors: {
      primary: '#8B7355',      // 大地棕
      secondary: '#A0937D',    // 沙色
      accent: '#D4A574',       // 暖棕
      dark: '#4A3728',
      light: '#FFF8F0',
      text: '#3D3D3D',
      textLight: '#FFFFFF',
      background: '#FFFBF5',
      overlay: 'rgba(139, 115, 85, 0.6)'
    },
    mood: '温暖、自然、亲和',
    keywords: ['生活', '培训', '教育', '自然']
  },
  
  // 科技渐变
  techGradient: {
    name: '科技渐变',
    colors: {
      primary: '#667EEA',      // 渐变蓝紫
      secondary: '#764BA2',    // 紫色
      accent: '#00D4FF',       // 青色
      dark: '#1A1A2E',
      light: '#E8E8FF',
      text: '#2D2D3A',
      textLight: '#FFFFFF',
      background: '#0F0F23',
      overlay: 'rgba(102, 126, 234, 0.7)'
    },
    mood: '未来、科技、创新',
    keywords: ['科技', 'AI', '数字化', '创新', '未来']
  },
  
  // 极简黑白
  minimalBlack: {
    name: '极简黑白',
    colors: {
      primary: '#1A1A1A',
      secondary: '#333333',
      accent: '#FF6B6B',       // 点缀红
      dark: '#000000',
      light: '#F5F5F5',
      text: '#1A1A1A',
      textLight: '#FFFFFF',
      background: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.6)'
    },
    mood: '简约、高级、现代',
    keywords: ['设计', '艺术', '创意', '简约']
  },
  
  // 清新绿色
  freshGreen: {
    name: '清新绿色',
    colors: {
      primary: '#228B22',
      secondary: '#32CD32',
      accent: '#90EE90',
      dark: '#006400',
      light: '#F0FFF0',
      text: '#1B4D1B',
      textLight: '#FFFFFF',
      background: '#FFFFFF',
      overlay: 'rgba(34, 139, 34, 0.5)'
    },
    mood: '生机、活力、健康',
    keywords: ['环保', '健康', '生态', '绿色']
  }
};

// ============ 布局引擎 V3 ============
const LayoutEngineV3 = {
  
  /**
   * 封面布局 - 大气动态风（从模板学习）
   */
  coverDynamic: {
    name: 'coverDynamic',
    render: (slide, data, style) => {
      const { title, subtitle, englishTitle, image, tag, brand } = data;
      const colors = style.colors;
      
      // 1. 全屏背景图
      if (image) {
        slide.addImage({
          path: image,
          x: 0, y: 0, w: '100%', h: '100%',
          sizing: { type: 'cover', w: 10, h: 5.625 }
        });
      }
      
      // 2. 渐变遮罩（从底到顶渐变）
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: {
          type: 'solid',
          color: '000000',
          transparency: 55
        }
      });
      
      // 3. 左侧装饰线（金/亮色）
      slide.addShape('rect', {
        x: 0.4, y: 1.5, w: 0.06, h: 2.5,
        fill: { color: colors.accent.replace('#', '') },
        shadow: DesignSystemV3.shadows.glow
      });
      
      // 4. 顶部标签（红底金字）
      if (tag) {
        slide.addShape('roundRect', {
          x: 8.2, y: 0.3, w: 1.4, h: 0.4,
          fill: { color: colors.primary.replace('#', '') },
          rectRadius: 0.05
        });
        slide.addText(tag, {
          x: 8.2, y: 0.3, w: 1.4, h: 0.4,
          fontSize: 11,
          fontFace: DesignSystemV3.typography.caption.font,
          color: colors.textLight.replace('#', ''),
          align: 'center',
          valign: 'middle'
        });
      }
      
      // 5. 主标题（大字+阴影）
      slide.addText(title, {
        x: 0.6, y: 1.8, w: 8.8, h: 1.4,
        fontSize: DesignSystemV3.typography.calligraphy.size,
        fontFace: DesignSystemV3.typography.calligraphy.font,
        bold: true,
        color: 'FFFFFF',
        shadow: DesignSystemV3.shadows.text,
        valign: 'middle'
      });
      
      // 6. 副标题
      if (subtitle) {
        slide.addText(subtitle, {
          x: 0.6, y: 3.3, w: 8.8, h: 0.6,
          fontSize: DesignSystemV3.typography.subtitle.size,
          fontFace: DesignSystemV3.typography.subtitle.font,
          color: colors.accent.replace('#', '')
        });
      }
      
      // 7. 英文装饰字（底层大字）
      if (englishTitle) {
        slide.addText(englishTitle, {
          x: 0.6, y: 4.2, w: 8.8, h: 0.5,
          fontSize: DesignSystemV3.typography.caption.size,
          fontFace: 'Arial, Helvetica, sans-serif',
          color: 'AAAAAA',
          transparency: 50
        });
      }
      
      // 8. 底部品牌
      if (brand) {
        slide.addText(brand, {
          x: 0.4, y: 5.1, w: 3, h: 0.3,
          fontSize: 10,
          color: 'CCCCCC',
          transparency: 30
        });
      }
      
      // 9. 右下角装饰圆
      slide.addShape('ellipse', {
        x: 8.8, y: 4.5, w: 0.8, h: 0.8,
        fill: { color: colors.accent.replace('#', ''), transparency: 75 },
        line: { color: colors.accent.replace('#', ''), width: 1.5 }
      });
    }
  },
  
  /**
   * 目录页 - 分割式（从模板学习）
   */
  tocSplit: {
    name: 'tocSplit',
    render: (slide, data, style) => {
      const { items } = data;
      const colors = style.colors;
      
      // 背景渐变
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 左侧装饰区
      slide.addShape('rect', {
        x: 0, y: 0, w: 2.5, h: '100%',
        fill: { color: colors.primary.replace('#', '') }
      });
      
      // 目录标题
      slide.addText('CONTENTS', {
        x: 0.3, y: 0.8, w: 2, h: 0.8,
        fontSize: 24,
        fontFace: 'Arial, Helvetica, sans-serif',
        bold: true,
        color: 'FFFFFF',
        rotate: 0
      });
      
      slide.addText('目录', {
        x: 0.3, y: 1.5, w: 2, h: 0.5,
        fontSize: 16,
        fontFace: DesignSystemV3.typography.body.font,
        color: colors.accent.replace('#', '')
      });
      
      // 目录项
      if (items && items.length > 0) {
        const startY = 0.8;
        const itemHeight = 1;
        
        items.forEach((item, i) => {
          const y = startY + i * itemHeight;
          
          // 序号
          slide.addText(`0${i + 1}`, {
            x: 3, y: y, w: 0.8, h: 0.8,
            fontSize: 48,
            fontFace: DesignSystemV3.typography.hero.font,
            bold: true,
            color: colors.primary.replace('#', ''),
            transparency: 80
          });
          
          // 标题
          slide.addText(item.title, {
            x: 3.8, y: y + 0.15, w: 5.5, h: 0.5,
            fontSize: DesignSystemV3.typography.subtitle.size,
            fontFace: DesignSystemV3.typography.title.font,
            bold: true,
            color: colors.dark.replace('#', '')
          });
          
          // 英文标签
          if (item.english) {
            slide.addText(item.english, {
              x: 3.8, y: y + 0.6, w: 5.5, h: 0.3,
              fontSize: 12,
              fontFace: 'Arial, Helvetica, sans-serif',
              color: colors.secondary.replace('#', ''),
              transparency: 40
            });
          }
          
          // 分隔线
          if (i < items.length - 1) {
            slide.addShape('rect', {
              x: 3, y: y + itemHeight - 0.1, w: 6.5, h: 0.01,
              fill: { color: colors.light.replace('#', '') }
            });
          }
        });
      }
    }
  },
  
  /**
   * 内容页 - 左图右文卡片式
   */
  contentCard: {
    name: 'contentCard',
    render: (slide, data, style) => {
      const { title, subtitle, content, image, index } = data;
      const colors = style.colors;
      
      const imageWidth = 5.2;
      
      // 左侧图片
      if (image) {
        slide.addImage({
          path: image,
          x: 0, y: 0, w: imageWidth, h: 5.625,
          sizing: { type: 'cover', w: imageWidth, h: 5.625 }
        });
        
        // 图片暗角
        slide.addShape('rect', {
          x: imageWidth - 0.2, y: 0, w: 0.2, h: '100%',
          fill: {
            type: 'solid',
            color: colors.background.replace('#', '')
          }
        });
      }
      
      // 右侧背景
      slide.addShape('rect', {
        x: imageWidth, y: 0, w: 10 - imageWidth, h: '100%',
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 大号序号（装饰）
      if (index !== undefined) {
        slide.addText(`0${index + 1}`, {
          x: imageWidth + 0.3, y: 0.2, w: 1.5, h: 1,
          fontSize: 64,
          fontFace: DesignSystemV3.typography.hero.font,
          bold: true,
          color: colors.primary.replace('#', ''),
          transparency: 85
        });
      }
      
      // 英文装饰字（底层）
      if (subtitle) {
        slide.addText(subtitle.toUpperCase(), {
          x: imageWidth + 0.4, y: 0.5, w: 4, h: 0.8,
          fontSize: 36,
          fontFace: 'Arial, Helvetica, sans-serif',
          bold: false,
          color: colors.light.replace('#', ''),
          transparency: 60
        });
      }
      
      // 标题
      slide.addText(title, {
        x: imageWidth + 0.4, y: 1.2, w: 4.2, h: 0.7,
        fontSize: DesignSystemV3.typography.title.size,
        fontFace: DesignSystemV3.typography.title.font,
        bold: true,
        color: colors.dark.replace('#', '')
      });
      
      // 标题下装饰线
      slide.addShape('rect', {
        x: imageWidth + 0.4, y: 2, w: 1.5, h: 0.05,
        fill: { color: colors.accent.replace('#', '') }
      });
      
      // 内容卡片
      if (content) {
        const cardY = 2.2;
        const cardH = 2.8;
        
        // 卡片背景
        slide.addShape('roundRect', {
          x: imageWidth + 0.3, y: cardY, w: 4.3, h: cardH,
          fill: { color: colors.light.replace('#', '') },
          shadow: DesignSystemV3.shadows.card,
          rectRadius: 0.1
        });
        
        // 内容文字
        const contentText = Array.isArray(content) 
          ? content.map(item => `• ${item}`).join('\n\n')
          : content;
        
        slide.addText(contentText, {
          x: imageWidth + 0.5, y: cardY + 0.2, w: 3.9, h: cardH - 0.4,
          fontSize: DesignSystemV3.typography.body.size,
          fontFace: DesignSystemV3.typography.body.font,
          color: colors.text.replace('#', ''),
          valign: 'top',
          wrap: true,
          lineSpacing: 24
        });
      }
    }
  },
  
  /**
   * 内容页 - 大字要点式（演讲风）
   */
  contentPoints: {
    name: 'contentPoints',
    render: (slide, data, style) => {
      const { title, points, index } = data;
      const colors = style.colors;
      
      // 背景
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 左侧装饰条
      slide.addShape('rect', {
        x: 0, y: 0, w: 0.12, h: '100%',
        fill: { color: colors.primary.replace('#', '') }
      });
      
      // 大号序号
      if (index !== undefined) {
        slide.addText(`0${index + 1}`, {
          x: 0.4, y: 0.2, w: 2, h: 1.2,
          fontSize: 80,
          fontFace: DesignSystemV3.typography.hero.font,
          bold: true,
          color: colors.primary.replace('#', ''),
          transparency: 88
        });
      }
      
      // 标题
      slide.addText(title, {
        x: 0.5, y: 1.4, w: 9, h: 0.8,
        fontSize: DesignSystemV3.typography.title.size,
        fontFace: DesignSystemV3.typography.title.font,
        bold: true,
        color: colors.dark.replace('#', '')
      });
      
      // 要点列表
      if (points && points.length > 0) {
        const startY = 2.4;
        const itemHeight = 0.9;
        
        points.forEach((point, i) => {
          const y = startY + i * itemHeight;
          
          // 圆点
          slide.addShape('ellipse', {
            x: 0.6, y: y + 0.3, w: 0.18, h: 0.18,
            fill: { color: colors.accent.replace('#', '') }
          });
          
          // 要点文字
          slide.addText(point, {
            x: 1, y: y, w: 8.5, h: itemHeight,
            fontSize: 20,
            fontFace: DesignSystemV3.typography.body.font,
            color: colors.text.replace('#', ''),
            valign: 'middle'
          });
        });
      }
    }
  },
  
  /**
   * 时间轴页 - 曲线型
   */
  timeline: {
    name: 'timeline',
    render: (slide, data, style) => {
      const { title, events } = data;
      const colors = style.colors;
      
      // 背景
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: colors.dark.replace('#', '') }
      });
      
      // 标题
      slide.addText(title || '发展历程', {
        x: 0.5, y: 0.3, w: 9, h: 0.6,
        fontSize: DesignSystemV3.typography.title.size,
        fontFace: DesignSystemV3.typography.title.font,
        bold: true,
        color: 'FFFFFF'
      });
      
      // 时间轴线
      slide.addShape('rect', {
        x: 0.8, y: 2.8, w: 8.4, h: 0.03,
        fill: { color: colors.accent.replace('#', '') }
      });
      
      // 事件节点
      if (events && events.length > 0) {
        const startX = 1;
        const gap = 8 / events.length;
        
        events.forEach((event, i) => {
          const x = startX + i * gap;
          
          // 节点圆
          slide.addShape('ellipse', {
            x: x - 0.15, y: 2.65, w: 0.3, h: 0.3,
            fill: { color: colors.accent.replace('#', '') },
            shadow: DesignSystemV3.shadows.glow
          });
          
          // 年份
          slide.addText(event.year || `20${10 + i}`, {
            x: x - 0.5, y: 3.1, w: 1, h: 0.4,
            fontSize: 14,
            fontFace: 'Arial, Helvetica, sans-serif',
            bold: true,
            color: colors.accent.replace('#', ''),
            align: 'center'
          });
          
          // 描述
          slide.addText(event.text || '描述内容', {
            x: x - 0.8, y: 3.5, w: 1.6, h: 1.2,
            fontSize: 11,
            fontFace: DesignSystemV3.typography.body.font,
            color: 'CCCCCC',
            align: 'center',
            wrap: true
          });
        });
      }
    }
  },
  
  /**
   * 结尾页 - 极简大气
   */
  endingMinimal: {
    name: 'endingMinimal',
    render: (slide, data, style) => {
      const { title, subtitle, brand } = data;
      const colors = style.colors;
      
      // 纯黑背景
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: '000000' }
      });
      
      // 装饰元素
      slide.addShape('ellipse', {
        x: -0.5, y: 3.5, w: 2, h: 2,
        fill: { color: colors.primary.replace('#', ''), transparency: 80 }
      });
      
      slide.addShape('ellipse', {
        x: 8.5, y: -0.5, w: 2.5, h: 2.5,
        fill: { color: colors.accent.replace('#', ''), transparency: 85 }
      });
      
      // 主标题
      slide.addText(title || '感谢观看', {
        x: 0, y: 2, w: '100%', h: 1,
        fontSize: DesignSystemV3.typography.hero.size,
        fontFace: DesignSystemV3.typography.hero.font,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        shadow: DesignSystemV3.shadows.text
      });
      
      // 副标题
      if (subtitle) {
        slide.addText(subtitle, {
          x: 0, y: 3.2, w: '100%', h: 0.5,
          fontSize: DesignSystemV3.typography.subtitle.size,
          fontFace: DesignSystemV3.typography.subtitle.font,
          color: 'AAAAAA',
          align: 'center'
        });
      }
      
      // 品牌
      if (brand) {
        slide.addText(brand, {
          x: 0, y: 4.8, w: '100%', h: 0.3,
          fontSize: 12,
          fontFace: DesignSystemV3.typography.caption.font,
          color: colors.accent.replace('#', ''),
          align: 'center'
        });
      }
    }
  }
};

// ============ 智能配色匹配 ============
function matchColorScheme(topic) {
  const keywords = topic.toLowerCase();
  
  for (const [key, scheme] of Object.entries(ColorSchemesV3)) {
    if (scheme.keywords && scheme.keywords.some(kw => keywords.includes(kw))) {
      return scheme;
    }
  }
  
  // 默认返回商务深蓝
  return ColorSchemesV3.businessDeep;
}

// ============ 智能布局选择 ============
function autoSelectLayout(content) {
  if (!content) return 'contentCard';
  
  // 时间轴内容
  if (content.events || content.timeline) {
    return 'timeline';
  }
  
  // 多要点内容
  if (content.points && content.points.length >= 3) {
    return 'contentPoints';
  }
  
  // 图文内容
  if (content.image) {
    return 'contentCard';
  }
  
  return 'contentCard';
}

// ============ 主渲染器 V3 ============
class PPTRendererV3 {
  constructor(options = {}) {
    this.pptx = new PptxGenJS();
    this.pptx.layout = 'LAYOUT_16x9';
    this.style = options.style || ColorSchemesV3.businessDeep;
    this.brand = options.brand || 'FDeck · 秒演';
  }
  
  /**
   * 设置配色方案
   */
  setStyle(styleName) {
    if (ColorSchemesV3[styleName]) {
      this.style = ColorSchemesV3[styleName];
    }
    return this;
  }
  
  /**
   * 智能匹配配色
   */
  autoMatchStyle(topic) {
    this.style = matchColorScheme(topic);
    return this;
  }
  
  /**
   * 渲染封面
   */
  renderCover(data) {
    const slide = this.pptx.addSlide();
    LayoutEngineV3.coverDynamic.render(slide, {
      ...data,
      brand: this.brand
    }, this.style);
    return this;
  }
  
  /**
   * 渲染目录
   */
  renderTOC(items) {
    const slide = this.pptx.addSlide();
    LayoutEngineV3.tocSplit.render(slide, { items }, this.style);
    return this;
  }
  
  /**
   * 渲染内容页
   */
  renderContent(data, layoutType) {
    const slide = this.pptx.addSlide();
    const layout = layoutType || autoSelectLayout(data);
    
    if (LayoutEngineV3[layout]) {
      LayoutEngineV3[layout].render(slide, data, this.style);
    } else {
      LayoutEngineV3.contentCard.render(slide, data, this.style);
    }
    return this;
  }
  
  /**
   * 渲染时间轴
   */
  renderTimeline(data) {
    const slide = this.pptx.addSlide();
    LayoutEngineV3.timeline.render(slide, data, this.style);
    return this;
  }
  
  /**
   * 渲染结尾
   */
  renderEnding(data) {
    const slide = this.pptx.addSlide();
    LayoutEngineV3.endingMinimal.render(slide, {
      ...data,
      brand: this.brand
    }, this.style);
    return this;
  }
  
  /**
   * 保存文件
   */
  async save(outputPath) {
    await this.pptx.writeFile({ fileName: outputPath });
    const stats = fs.statSync(outputPath);
    return {
      path: outputPath,
      size: (stats.size / 1024).toFixed(2) + ' KB',
      style: this.style.name
    };
  }
}

// ============ 导出 ============
module.exports = {
  PPTRendererV3,
  LayoutEngineV3,
  ColorSchemesV3,
  DesignSystemV3,
  matchColorScheme,
  autoSelectLayout
};

// ============ 测试 ============
if (require.main === module) {
  async function test() {
    console.log('🎨 FDeck PPT渲染引擎 V3 测试\n');
    
    // 测试不同配色
    const styles = ['partyRed', 'businessDeep', 'techGradient'];
    
    for (const styleName of styles) {
      const renderer = new PPTRendererV3({
        style: ColorSchemesV3[styleName],
        brand: 'FDeck · 秒演'
      });
      
      // 封面
      renderer.renderCover({
        title: styleName === 'partyRed' ? '2024年度工作总结' : '人工智能发展趋势',
        subtitle: '从技术突破到产业落地',
        englishTitle: 'ANNUAL WORK SUMMARY 2024',
        tag: '工作报告',
        image: path.join(__dirname, '../templates-assets/images/tpl_guobao_001/image1.png')
      });
      
      // 目录
      renderer.renderTOC([
        { title: '工作总结', english: 'WORK SUMMARY' },
        { title: '工作成果', english: 'ACHIEVEMENTS' },
        { title: '存在问题', english: 'PROBLEMS' },
        { title: '工作计划', english: 'WORK PLAN' }
      ]);
      
      // 内容页
      renderer.renderContent({
        title: '核心技术突破',
        subtitle: 'TECHNOLOGY',
        content: ['大模型技术快速发展', '多模态融合成为趋势', '推理能力显著提升'],
        image: path.join(__dirname, '../templates-assets/images/tpl_guobao_001/image2.png'),
        index: 0
      });
      
      renderer.renderContent({
        title: '关键成果',
        points: ['完成核心算法优化', '用户满意度提升30%', '获得行业认可'],
        index: 1
      }, 'contentPoints');
      
      // 结尾
      renderer.renderEnding({
        title: '感谢观看',
        subtitle: '欢迎交流讨论'
      });
      
      const outputPath = path.join(__dirname, `../test-output/renderer-v3-${styleName}.pptx`);
      const result = await renderer.save(outputPath);
      console.log(`✅ ${result.style}: ${result.size}`);
    }
    
    console.log('\n📁 测试文件保存在 test-output/ 目录');
  }
  
  test().catch(console.error);
}
