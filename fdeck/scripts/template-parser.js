/**
 * PPT模板解析器
 * 用于解析PPTX文件，提取配色、布局、形状信息
 * 生成模板配置文件
 */

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const xml2js = require('xml2js');

/**
 * 解析PPTX文件
 * @param {string} pptxPath - PPTX文件路径
 * @returns {Object} 模板配置
 */
async function parseTemplate(pptxPath) {
  const zip = new AdmZip(pptxPath);
  const template = {
    id: generateId(),
    name: path.basename(pptxPath, '.pptx'),
    slides: [],
    colors: {},
    layouts: [],
    shapes: [],
    created_at: new Date().toISOString()
  };

  // 解析主题配色
  try {
    const themeXml = zip.readAsText('ppt/theme/theme1.xml');
    const themeColors = await extractColors(themeXml);
    template.colors = themeColors;
  } catch (e) {
    console.log('未找到主题文件，使用默认配色');
    template.colors = getDefaultColors();
  }

  // 解析每一页
  const slideEntries = zip.getEntries()
    .filter(entry => entry.entryName.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.entryName.match(/slide(\d+)\.xml$/)[1]);
      const numB = parseInt(b.entryName.match(/slide(\d+)\.xml$/)[1]);
      return numA - numB;
    });

  for (const entry of slideEntries) {
    const slideXml = zip.readAsText(entry.entryName);
    const slideInfo = await parseSlide(slideXml, template.colors);
    template.slides.push(slideInfo);
  }

  // 提取布局模式
  template.layouts = extractLayoutPatterns(template.slides);

  return template;
}

/**
 * 从主题XML提取配色
 */
async function extractColors(themeXml) {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(themeXml);
  
  const colors = {};
  try {
    const clrScheme = result['a:theme']['a:themeElements'][0]['a:clrScheme'][0];
    
    const colorMap = {
      'a:dk1': 'dark1',
      'a:lt1': 'light1',
      'a:dk2': 'dark2',
      'a:lt2': 'light2',
      'a:accent1': 'accent1',
      'a:accent2': 'accent2',
      'a:accent3': 'accent3',
      'a:accent4': 'accent4'
    };

    for (const [key, value] of Object.entries(colorMap)) {
      if (clrScheme[key]) {
        const colorNode = clrScheme[key][0];
        if (colorNode['a:srgbClr']) {
          colors[value] = '#' + colorNode['a:srgbClr'][0].$.val;
        } else if (colorNode['a:sysClr']) {
          colors[value] = '#' + colorNode['a:sysClr'][0].$.lastClr || '#000000';
        }
      }
    }
  } catch (e) {
    console.log('配色提取失败，使用默认值');
  }

  return colors;
}

/**
 * 解析单个幻灯片
 */
async function parseSlide(slideXml, themeColors) {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(slideXml);
  
  const slide = {
    shapes: [],
    texts: [],
    background: null
  };

  try {
    const spTree = result['p:sld']['p:cSld'][0]['p:spTree'][0];
    
    // 解析背景
    if (result['p:sld']['p:cSld'][0]['p:bg']) {
      const bg = result['p:sld']['p:cSld'][0]['p:bg'][0];
      if (bg['p:bgPr'] && bg['p:bgPr'][0]['a:solidFill']) {
        const fill = bg['p:bgPr'][0]['a:solidFill'][0];
        if (fill['a:srgbClr']) {
          slide.background = '#' + fill['a:srgbClr'][0].$.val;
        }
      }
    }

    // 解析形状和文本
    const shapes = spTree['p:sp'] || [];
    for (const shape of shapes) {
      const shapeInfo = parseShape(shape);
      if (shapeInfo) {
        if (shapeInfo.type === 'text') {
          slide.texts.push(shapeInfo);
        } else {
          slide.shapes.push(shapeInfo);
        }
      }
    }
  } catch (e) {
    console.log('幻灯片解析失败:', e.message);
  }

  return slide;
}

/**
 * 解析形状
 */
function parseShape(shape) {
  try {
    const spPr = shape['p:spPr']?.[0];
    if (!spPr) return null;

    const info = {
      type: 'shape',
      x: 0, y: 0, width: 0, height: 0,
      fill: null, stroke: null
    };

    // 位置和尺寸
    if (spPr['a:xfrm']) {
      const xfrm = spPr['a:xfrm'][0];
      if (xfrm['a:off']) {
        info.x = parseInt(xfrm['a:off'][0].$.x) / 914400; // EMU转英寸
        info.y = parseInt(xfrm['a:off'][0].$.y) / 914400;
      }
      if (xfrm['a:ext']) {
        info.width = parseInt(xfrm['a:ext'][0].$.cx) / 914400;
        info.height = parseInt(xfrm['a:ext'][0].$.cy) / 914400;
      }
    }

    // 填充颜色
    if (spPr['a:solidFill']) {
      const fill = spPr['a:solidFill'][0];
      if (fill['a:srgbClr']) {
        info.fill = '#' + fill['a:srgbClr'][0].$.val;
      }
    }

    // 检查是否有文本
    if (shape['p:txBody']) {
      info.type = 'text';
      const txBody = shape['p:txBody'][0];
      if (txBody['a:p'] && txBody['a:p'][0]['a:r']) {
        info.text = txBody['a:p'][0]['a:r'].map(r => r['a:t']?.[0] || '').join('');
      }
    }

    return info;
  } catch (e) {
    return null;
  }
}

/**
 * 提取布局模式
 */
function extractLayoutPatterns(slides) {
  const layouts = [];
  
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    
    // 判断布局类型
    let layoutType = 'content';
    const textCount = slide.texts.length;
    const shapeCount = slide.shapes.length;
    
    if (i === 0) {
      layoutType = 'cover';
    } else if (textCount <= 2 && slide.texts.some(t => t.text && t.text.length > 20)) {
      layoutType = 'big_title';
    } else if (textCount >= 3) {
      layoutType = 'multi_point';
    } else if (shapeCount > 5) {
      layoutType = 'graphic';
    }
    
    layouts.push({
      index: i,
      type: layoutType,
      textCount,
      shapeCount,
      background: slide.background
    });
  }
  
  return layouts;
}

/**
 * 生成模板ID
 */
function generateId() {
  return 'tpl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 默认配色
 */
function getDefaultColors() {
  return {
    dark1: '#000000',
    light1: '#FFFFFF',
    dark2: '#1a1a1a',
    light2: '#f5f5f5',
    accent1: '#00d4ff',
    accent2: '#ff6b9d',
    accent3: '#a855f7',
    accent4: '#22c55e'
  };
}

/**
 * 保存模板配置
 */
function saveTemplate(template, outputDir) {
  const configPath = path.join(outputDir, `${template.id}.json`);
  fs.writeFileSync(configPath, JSON.stringify(template, null, 2));
  console.log(`模板配置已保存: ${configPath}`);
  return configPath;
}

// 导出
module.exports = {
  parseTemplate,
  saveTemplate,
  extractColors,
  parseSlide,
  extractLayoutPatterns
};

// 命令行使用
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('用法: node template-parser.js <pptx文件路径> [输出目录]');
    process.exit(1);
  }
  
  const pptxPath = args[0];
  const outputDir = args[1] || './templates';
  
  parseTemplate(pptxPath)
    .then(template => {
      saveTemplate(template, outputDir);
      console.log('\n模板解析结果:');
      console.log('- ID:', template.id);
      console.log('- 名称:', template.name);
      console.log('- 页数:', template.slides.length);
      console.log('- 配色:', JSON.stringify(template.colors, null, 2));
    })
    .catch(err => {
      console.error('解析失败:', err);
      process.exit(1);
    });
}
