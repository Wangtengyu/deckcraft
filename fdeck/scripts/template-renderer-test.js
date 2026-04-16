/**
 * 模板渲染测试脚本
 * 使用配置文件生成PPT
 */

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// 加载模板配置
const configPath = path.join(__dirname, '../templates-assets/tpl_guobao_001-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 创建PPT实例
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = config.name;
pptx.author = 'FDeck';

// 定义配色
const colors = config.style.colors;

// 定义字体样式
const fonts = config.style.fonts;

// 测试数据 - 用国宝文物内容
const testData = {
  title: "国家文物展示",
  subtitle: "中华文明的瑰宝",
  items: [
    {
      title: "后母戊鼎",
      description: "出土于河南安阳，商代晚期青铜礼器。重达832.84公斤，是迄今世界最大青铜鼎。腹部铸后母戊铭文，纹饰狰狞威严，体现商王祭祀母辈的庄重，彰显商代青铜铸造巅峰技艺。",
      image: "image2.png"
    },
    {
      title: "四羊方尊", 
      description: "1938年湖南宁乡出土，商代青铜酒器。器身方形，四角各铸卷角羊首，羊身与器体浑然一体。浮雕与圆雕结合，纹饰繁复精美，是商代青铜铸造范铸法的典范之作。",
      image: "image3.png"
    },
    {
      title: "曾侯乙编钟",
      description: "湖北随州曾侯乙墓出土，战国早期乐器。由65件青铜钟组成，分三层悬挂于钟架。音域跨五个八度，能奏各类乐曲，钟架上的铭文记载音律知识，是古代音乐史奇迹。",
      image: "image4.png"
    },
    {
      title: "越王勾践剑",
      description: "1965年湖北江陵出土，春秋晚期青铜剑。长55.7厘米，剑身布满菱形暗纹，剑格嵌蓝玻璃与绿松石，刻越王勾践自作用剑铭文。千年不锈，锋利如新，展现高超铸剑工艺。",
      image: "image5.png"
    },
    {
      title: "马踏飞燕",
      description: "甘肃武威雷台汉墓出土，东汉青铜雕塑。高34.5厘米，骏马三足腾空，一足踏飞燕，飞燕回首惊视。利用重心平衡原理，造型动感十足，被誉为汉代青铜艺术的奇葩。",
      image: "image6.png"
    }
  ]
};

// 图片基础路径
const imageBasePath = path.join(__dirname, '../templates-assets/images/tpl_guobao_001/');

// 封面页
console.log('生成封面页...');
const coverSlide = pptx.addSlide();
coverSlide.addImage({
  path: path.join(imageBasePath, 'image1.png'),
  x: 0, y: 0, w: '100%', h: '100%',
  sizing: { type: 'cover', w: 10, h: 5.625 }
});
// 半透明遮罩
coverSlide.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: '100%', h: '100%',
  fill: { color: '000000', transparency: 60 }
});
// 标题
coverSlide.addText(testData.title, {
  x: 0.5, y: 2, w: 9, h: 1,
  fontSize: 48, fontFace: fonts.title.name, bold: true,
  color: 'FFFFFF', align: 'center'
});
// 副标题
coverSlide.addText(testData.subtitle, {
  x: 0.5, y: 3.2, w: 9, h: 0.5,
  fontSize: 24, fontFace: fonts.subtitle.name,
  color: colors.accent, align: 'center'
});

// 内容页 - 左图右文布局
console.log('生成内容页...');
testData.items.forEach((item, index) => {
  const slide = pptx.addSlide();
  
  // 左侧图片
  slide.addImage({
    path: path.join(imageBasePath, item.image),
    x: 0, y: 0, w: 5, h: 5.625,
    sizing: { type: 'cover', w: 5, h: 5.625 }
  });
  
  // 右侧背景
  slide.addShape(pptx.ShapeType.rect, {
    x: 5, y: 0, w: 5, h: 5.625,
    fill: { color: colors.light.replace('#', '') }
  });
  
  // 标题
  slide.addText(item.title, {
    x: 5.5, y: 1, w: 4, h: 0.8,
    fontSize: 36, fontFace: fonts.title.name, bold: true,
    color: colors.dark.replace('#', '')
  });
  
  // 分隔线
  slide.addShape(pptx.ShapeType.rect, {
    x: 5.5, y: 1.9, w: 1.5, h: 0.05,
    fill: { color: colors.accent.replace('#', '') }
  });
  
  // 描述文字
  slide.addText(item.description, {
    x: 5.5, y: 2.2, w: 4, h: 2.5,
    fontSize: 14, fontFace: fonts.body.name,
    color: colors.text.replace('#', ''),
    valign: 'top',
    wrap: true
  });
  
  // 页码
  slide.addText(`${index + 1}`, {
    x: 9, y: 5.2, w: 0.5, h: 0.3,
    fontSize: 12, color: colors.secondary.replace('#', ''),
    align: 'right'
  });
});

// 结尾页
console.log('生成结尾页...');
const endSlide = pptx.addSlide();
endSlide.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: '100%', h: '100%',
  fill: { color: colors.primary.replace('#', '') }
});
endSlide.addText('感谢观看', {
  x: 0, y: 2, w: '100%', h: 1,
  fontSize: 48, fontFace: fonts.title.name, bold: true,
  color: 'FFFFFF', align: 'center'
});
endSlide.addText('FDeck · 秒演', {
  x: 0, y: 3.5, w: '100%', h: 0.5,
  fontSize: 18, color: colors.accent.replace('#', ''),
  align: 'center'
});

// 保存文件
const outputPath = path.join(__dirname, '../test-output/template-test-output.pptx');
pptx.writeFile({ fileName: outputPath })
  .then(() => {
    console.log('✅ PPT生成成功！');
    console.log(`📁 文件路径: ${outputPath}`);
    
    // 计算文件大小
    const stats = fs.statSync(outputPath);
    console.log(`📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
  })
  .catch(err => {
    console.error('❌ 生成失败:', err);
  });
