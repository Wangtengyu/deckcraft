/**
 * FDeck 高质量PPT渲染引擎 V2.0
 * 优化目标：让PPT视觉效果达到Gamma水准
 */

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ============ 设计系统 ============
const DesignSystem = {
  // 幻灯片尺寸
  slideSize: { width: 10, height: 5.625, unit: 'inches' },
  
  // 标准间距
  spacing: {
    pageMargin: 0.5,      // 页边距
    elementGap: 0.3,      // 元素间距
    lineHeight: 1.5,      // 行高倍数
    paragraphGap: 0.2,    // 段落间距
  },
  
  // 字体系统（安全字体 + 降级策略）
  fonts: {
    // 安全字体列表（Windows/Mac都有）
    chinese: {
      primary: 'Microsoft YaHei',    // 微软雅黑
      fallback: 'SimHei',            // 黑体降级
      system: 'sans-serif'          // 系统默认
    },
    english: {
      primary: 'Arial',
      fallback: 'Helvetica',
      system: 'sans-serif'
    }
  },
  typography: {
    hero: { 
      size: 60, 
      font: 'Microsoft YaHei, SimHei, sans-serif',  // 降级链
      bold: true 
    },
    title: { 
      size: 36, 
      font: 'Microsoft YaHei, SimHei, sans-serif',
      bold: true 
    },
    subtitle: { 
      size: 24, 
      font: 'Microsoft YaHei, SimHei, sans-serif',
      bold: false 
    },
    body: { 
      size: 16, 
      font: 'Microsoft YaHei, SimHei, sans-serif',
      bold: false 
    },
    caption: { 
      size: 12, 
      font: 'Microsoft YaHei, SimHei, sans-serif',
      bold: false 
    },
  },
  
  // 阴影预设
  shadows: {
    text: { type: 'outer', blur: 3, offset: 2, angle: 45, color: '000000', opacity: 0.3 },
    card: { type: 'outer', blur: 10, offset: 4, angle: 90, color: '000000', opacity: 0.15 },
    image: { type: 'outer', blur: 15, offset: 6, angle: 90, color: '000000', opacity: 0.2 },
  },
  
  // 动画预设（高级版支持）
  animations: {
    fadeIn: { type: 'fade', speed: 'fast' },
    slideIn: { type: 'slide', direction: 'left', speed: 'medium' },
  }
};

// ============ 布局引擎 ============
const LayoutEngine = {
  
  /**
   * 封面布局 - 高端大气风格
   */
  cover: {
    name: 'cover',
    render: (slide, data, style) => {
      const { title, subtitle, image, brand } = data;
      const colors = style.colors;
      
      // 1. 全屏背景图 + 渐变蒙版
      if (image) {
        slide.addImage({
          path: image,
          x: 0, y: 0, w: '100%', h: '100%',
          sizing: { type: 'cover', w: 10, h: 5.625 }
        });
      }
      
      // 2. 渐变蒙版（从左下到右上）
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: {
          type: 'solid',
          color: '000000',
          transparency: 50
        }
      });
      
      // 3. 装饰线条（左上角）
      slide.addShape('rect', {
        x: 0.5, y: 0.5, w: 0.08, h: 1.5,
        fill: { color: colors.accent.replace('#', '') },
        shadow: DesignSystem.shadows.text
      });
      
      // 4. 大标题
      slide.addText(title, {
        x: 0.8, y: 1.8, w: 8.4, h: 1.2,
        fontSize: DesignSystem.typography.hero.size,
        fontFace: DesignSystem.typography.hero.font,
        bold: true,
        color: 'FFFFFF',
        shadow: DesignSystem.shadows.text,
        valign: 'middle'
      });
      
      // 5. 副标题
      if (subtitle) {
        slide.addText(subtitle, {
          x: 0.8, y: 3.1, w: 8.4, h: 0.6,
          fontSize: DesignSystem.typography.subtitle.size,
          fontFace: DesignSystem.typography.subtitle.font,
          color: colors.accent.replace('#', ''),
          valign: 'top'
        });
      }
      
      // 6. 底部品牌标识
      if (brand) {
        slide.addText(brand, {
          x: 0.5, y: 5, w: 3, h: 0.3,
          fontSize: DesignSystem.typography.caption.size,
          fontFace: DesignSystem.typography.caption.font,
          color: 'AAAAAA',
          valign: 'bottom'
        });
      }
      
      // 7. 装饰元素（右下角圆形）
      slide.addShape('ellipse', {
        x: 8.5, y: 4.5, w: 1, h: 1,
        fill: { color: colors.accent.replace('#', ''), transparency: 80 },
        line: { color: colors.accent.replace('#', ''), width: 2 }
      });
    }
  },
  
  /**
   * 内容页布局 - 左图右文（专业商务风）
   */
  leftImageRightText: {
    name: 'leftImageRightText',
    render: (slide, data, style) => {
      const { title, content, image, index } = data;
      const colors = style.colors;
      
      // 1. 左侧图片区域（占55%）
      const imageWidth = 5.5;
      if (image) {
        slide.addImage({
          path: image,
          x: 0, y: 0, w: imageWidth, h: 5.625,
          sizing: { type: 'cover', w: imageWidth, h: 5.625 }
        });
        
        // 图片底部渐变（用于衔接文字区）
        slide.addShape('rect', {
          x: imageWidth - 0.3, y: 0, w: 0.3, h: '100%',
          fill: {
            type: 'solid',
            color: colors.background.replace('#', ''),
            transparency: 0
          }
        });
      }
      
      // 2. 右侧内容区域背景
      slide.addShape('rect', {
        x: imageWidth, y: 0, w: 10 - imageWidth, h: '100%',
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 3. 序号标识
      if (index !== undefined) {
        slide.addText(`0${index + 1}`, {
          x: imageWidth + 0.5, y: 0.4, w: 1, h: 0.5,
          fontSize: 48,
          fontFace: DesignSystem.typography.hero.font,
          bold: true,
          color: colors.accent.replace('#', ''),
          transparency: 70
        });
      }
      
      // 4. 标题
      slide.addText(title, {
        x: imageWidth + 0.5, y: 1, w: 3.8, h: 0.8,
        fontSize: DesignSystem.typography.title.size,
        fontFace: DesignSystem.typography.title.font,
        bold: true,
        color: colors.dark.replace('#', ''),
        valign: 'middle'
      });
      
      // 5. 标题下装饰线
      slide.addShape('rect', {
        x: imageWidth + 0.5, y: 1.85, w: 2, h: 0.06,
        fill: { color: colors.accent.replace('#', '') }
      });
      
      // 6. 内容区域（卡片式）
      if (content && content.length > 0) {
        const contentY = 2.1;
        const cardHeight = 3;
        
        // 内容卡片背景
        slide.addShape('roundRect', {
          x: imageWidth + 0.4, y: contentY, w: 4, h: cardHeight,
          fill: { color: colors.light.replace('#', '') },
          shadow: DesignSystem.shadows.card,
          rectRadius: 0.1
        });
        
        // 内容文字
        const contentText = Array.isArray(content) 
          ? content.map(item => `• ${item}`).join('\n')
          : content;
        
        slide.addText(contentText, {
          x: imageWidth + 0.6, y: contentY + 0.2, w: 3.6, h: cardHeight - 0.4,
          fontSize: DesignSystem.typography.body.size,
          fontFace: DesignSystem.typography.body.font,
          color: colors.text.replace('#', ''),
          valign: 'top',
          wrap: true,
          lineSpacing: 22
        });
      }
    }
  },
  
  /**
   * 内容页布局 - 上图下文（展示风）
   */
  topImageBottomText: {
    name: 'topImageBottomText',
    render: (slide, data, style) => {
      const { title, content, image, index } = data;
      const colors = style.colors;
      
      // 1. 顶部图片（占60%高度）
      const imageHeight = 3.4;
      if (image) {
        slide.addImage({
          path: image,
          x: 0, y: 0, w: '100%', h: imageHeight,
          sizing: { type: 'cover', w: 10, h: imageHeight }
        });
        
        // 图片底部渐变遮罩
        slide.addShape('rect', {
          x: 0, y: imageHeight - 0.5, w: '100%', h: 0.5,
          fill: {
            type: 'solid',
            color: colors.background.replace('#', '')
          }
        });
      }
      
      // 2. 底部内容区域
      slide.addShape('rect', {
        x: 0, y: imageHeight, w: '100%', h: 5.625 - imageHeight,
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 3. 标题
      slide.addText(title, {
        x: 0.5, y: imageHeight + 0.2, w: 9, h: 0.6,
        fontSize: DesignSystem.typography.title.size,
        fontFace: DesignSystem.typography.title.font,
        bold: true,
        color: colors.dark.replace('#', '')
      });
      
      // 4. 内容
      if (content) {
        const contentText = Array.isArray(content) 
          ? content.map(item => `• ${item}`).join('\n')
          : content;
        
        slide.addText(contentText, {
          x: 0.5, y: imageHeight + 0.9, w: 9, h: 1,
          fontSize: DesignSystem.typography.body.size,
          fontFace: DesignSystem.typography.body.font,
          color: colors.text.replace('#', ''),
          lineSpacing: 20
        });
      }
    }
  },
  
  /**
   * 内容页布局 - 大字要点（演讲风）
   */
  bigPoints: {
    name: 'bigPoints',
    render: (slide, data, style) => {
      const { title, points, index } = data;
      const colors = style.colors;
      
      // 1. 左侧装饰色块
      slide.addShape('rect', {
        x: 0, y: 0, w: 0.15, h: '100%',
        fill: { color: colors.primary.replace('#', '') }
      });
      
      // 2. 背景渐变
      slide.addShape('rect', {
        x: 0.15, y: 0, w: 9.85, h: '100%',
        fill: { color: colors.background.replace('#', '') }
      });
      
      // 3. 大号序号
      if (index !== undefined) {
        slide.addText(`0${index + 1}`, {
          x: 0.5, y: 0.3, w: 2, h: 1,
          fontSize: 72,
          fontFace: DesignSystem.typography.hero.font,
          bold: true,
          color: colors.primary.replace('#', ''),
          transparency: 85
        });
      }
      
      // 4. 标题
      slide.addText(title, {
        x: 0.5, y: 1.3, w: 9, h: 0.8,
        fontSize: DesignSystem.typography.title.size,
        fontFace: DesignSystem.typography.title.font,
        bold: true,
        color: colors.dark.replace('#', '')
      });
      
      // 5. 大字要点（居中排列）
      if (points && points.length > 0) {
        const startY = 2.3;
        const itemHeight = 0.8;
        
        points.forEach((point, i) => {
          // 要点圆点
          slide.addShape('ellipse', {
            x: 0.6, y: startY + i * itemHeight + 0.15, w: 0.15, h: 0.15,
            fill: { color: colors.accent.replace('#', '') }
          });
          
          // 要点文字
          slide.addText(point, {
            x: 1, y: startY + i * itemHeight, w: 8.5, h: itemHeight,
            fontSize: 22,
            fontFace: DesignSystem.typography.body.font,
            color: colors.text.replace('#', ''),
            valign: 'middle'
          });
        });
      }
    }
  },
  
  /**
   * 结尾页布局
   */
  ending: {
    name: 'ending',
    render: (slide, data, style) => {
      const { title, subtitle, contact, brand } = data;
      const colors = style.colors;
      
      // 1. 渐变背景
      slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: colors.primary.replace('#', '') }
      });
      
      // 2. 装饰圆形（右上角）
      slide.addShape('ellipse', {
        x: 7, y: -1, w: 4, h: 4,
        fill: { color: 'FFFFFF', transparency: 90 }
      });
      
      // 3. 装饰圆形（左下角）
      slide.addShape('ellipse', {
        x: -1, y: 3, w: 3, h: 3,
        fill: { color: colors.accent.replace('#', ''), transparency: 70 }
      });
      
      // 4. 主标题
      slide.addText(title || '感谢观看', {
        x: 0, y: 2, w: '100%', h: 1,
        fontSize: DesignSystem.typography.hero.size,
        fontFace: DesignSystem.typography.hero.font,
        bold: true,
        color: 'FFFFFF',
        align: 'center',
        shadow: DesignSystem.shadows.text
      });
      
      // 5. 副标题
      if (subtitle) {
        slide.addText(subtitle, {
          x: 0, y: 3.2, w: '100%', h: 0.5,
          fontSize: DesignSystem.typography.subtitle.size,
          fontFace: DesignSystem.typography.subtitle.font,
          color: 'FFFFFF',
          align: 'center',
          transparency: 30
        });
      }
      
      // 6. 品牌标识
      if (brand) {
        slide.addText(brand, {
          x: 0, y: 4.5, w: '100%', h: 0.4,
          fontSize: DesignSystem.typography.caption.size,
          fontFace: DesignSystem.typography.caption.font,
          color: 'FFFFFF',
          align: 'center',
          transparency: 40
        });
      }
    }
  }
};

// ============ 配色方案 ============
const ColorSchemes = {
  // 党政红金
  partyRed: {
    name: '党政红金',
    colors: {
      primary: '#C41E3A',
      secondary: '#8B0000',
      accent: '#FFD700',
      dark: '#2D2D2D',
      light: '#FFF8DC',
      text: '#333333',
      background: '#FFFFFF'
    }
  },
  
  // 科技蓝
  techBlue: {
    name: '科技蓝',
    colors: {
      primary: '#1E90FF',
      secondary: '#00CED1',
      accent: '#00BFFF',
      dark: '#191970',
      light: '#E6F3FF',
      text: '#2D2D2D',
      background: '#F8FBFF'
    }
  },
  
  // 商务蓝白
  businessBlue: {
    name: '商务蓝白',
    colors: {
      primary: '#2C5282',
      secondary: '#4A90D9',
      accent: '#3182CE',
      dark: '#1A365D',
      light: '#EDF2F7',
      text: '#2D3748',
      background: '#FFFFFF'
    }
  },
  
  // 温暖米色
  warmBeige: {
    name: '温暖米色',
    colors: {
      primary: '#D4A574',
      secondary: '#C4956A',
      accent: '#B8860B',
      dark: '#8B7355',
      light: '#FFFAF0',
      text: '#4A4A4A',
      background: '#FFFAF0'
    }
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
      text: '#2D4A2D',
      background: '#FFFFFF'
    }
  },
  
  // 简约黑白
  minimalBW: {
    name: '简约黑白',
    colors: {
      primary: '#2D2D2D',
      secondary: '#4A4A4A',
      accent: '#FF6B6B',
      dark: '#1A1A1A',
      light: '#F5F5F5',
      text: '#333333',
      background: '#FFFFFF'
    }
  }
};

// ============ 主渲染器 ============
class PPTRenderer {
  constructor(options = {}) {
    this.pptx = new PptxGenJS();
    this.pptx.layout = 'LAYOUT_16x9';
    this.style = options.style || ColorSchemes.techBlue;
    this.brand = options.brand || 'FDeck · 秒演';
  }
  
  /**
   * 渲染封面
   */
  renderCover(data) {
    const slide = this.pptx.addSlide();
    LayoutEngine.cover.render(slide, {
      ...data,
      brand: this.brand
    }, this.style);
    return this;
  }
  
  /**
   * 渲染内容页
   */
  renderContent(data, layoutType = 'leftImageRightText') {
    const slide = this.pptx.addSlide();
    const layout = LayoutEngine[layoutType] || LayoutEngine.leftImageRightText;
    layout.render(slide, data, this.style);
    return this;
  }
  
  /**
   * 渲染结尾
   */
  renderEnding(data) {
    const slide = this.pptx.addSlide();
    LayoutEngine.ending.render(slide, {
      ...data,
      brand: this.brand
    }, this.style);
    return this;
  }
  
  /**
   * 智能布局选择
   */
  autoSelectLayout(content) {
    if (!content) return 'leftImageRightText';
    
    // 根据内容特征选择布局
    if (content.image) {
      return 'leftImageRightText';
    }
    
    if (content.points && content.points.length >= 3) {
      return 'bigPoints';
    }
    
    return 'leftImageRightText';
  }
  
  /**
   * 保存文件
   */
  async save(outputPath) {
    await this.pptx.writeFile({ fileName: outputPath });
    const stats = fs.statSync(outputPath);
    return {
      path: outputPath,
      size: (stats.size / 1024).toFixed(2) + ' KB'
    };
  }
}

// ============ 导出 ============
module.exports = {
  PPTRenderer,
  LayoutEngine,
  ColorSchemes,
  DesignSystem
};

// ============ 测试代码 ============
if (require.main === module) {
  async function test() {
    const renderer = new PPTRenderer({
      style: ColorSchemes.techBlue,
      brand: 'FDeck · 秒演'
    });
    
    // 封面
    renderer.renderCover({
      title: '人工智能发展趋势',
      subtitle: '从技术突破到产业落地',
      image: path.join(__dirname, '../templates-assets/images/tpl_guobao_001/image1.png')
    });
    
    // 内容页
    const contents = [
      {
        title: '技术突破',
        content: ['大模型技术快速发展', '多模态融合成为趋势', '推理能力显著提升'],
        image: path.join(__dirname, '../templates-assets/images/tpl_guobao_001/image2.png'),
        index: 0
      },
      {
        title: '产业应用',
        content: ['智能客服广泛应用', 'AI辅助设计普及', '自动驾驶逐步落地'],
        image: path.join(__dirname, '../templates-assets/images/tpl_guobao_001/image3.png'),
        index: 1
      },
      {
        title: '未来展望',
        points: ['AGI探索持续深入', 'AI伦理日趋重要', '人机协作成为主流'],
        index: 2
      }
    ];
    
    contents.forEach((item, i) => {
      const layoutType = item.points ? 'bigPoints' : 'leftImageRightText';
      renderer.renderContent(item, layoutType);
    });
    
    // 结尾
    renderer.renderEnding({
      title: '感谢观看',
      subtitle: '欢迎交流讨论'
    });
    
    // 保存
    const result = await renderer.save(path.join(__dirname, '../test-output/renderer-v2-test.pptx'));
    console.log('✅ V2渲染器测试完成！');
    console.log(`📁 文件: ${result.path}`);
    console.log(`📊 大小: ${result.size}`);
  }
  
  test().catch(console.error);
}
