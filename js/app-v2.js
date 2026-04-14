/**
 * DeckCraft - 前端交互逻辑 V2.0
 * Phase 2: 添加细分风格选择
 * Phase 3: 添加参考图处理
 */

// API配置
const API_URL = 'https://ig8u65l6vm.sealosbja.site/generate';
const MODIFY_API_URL = 'https://ig8u65l6vm.sealosbja.site/modify';

// 细分风格配置（与后端 generate-v6.ts 保持一致）
const SUB_STYLE_CONFIG = {
  A: {
    name: '信息图风',
    subStyles: {
      'party_red': { name: '党政红金', keywords: ['党建', '党课', '主题党日', '表彰大会'] },
      'gov_blue': { name: '政务蓝', keywords: ['政务', '政策', '政府', '机关'] },
      'culture': { name: '文化古典', keywords: ['历史', '国学', '传统文化', '古典'] },
      'tech_warm': { name: '米白暖色', keywords: ['互联网', '科技', '创意', '教育培训'] },
      'general_blue': { name: '通用蓝白', keywords: [] }
    }
  },
  B: {
    name: '插画科普风',
    subStyles: {
      'blackboard': { name: '黑板粉笔', keywords: ['课堂', '教学', '数学', '物理'] },
      'flat_illustration': { name: '扁平插画', keywords: ['小学课件', '培训', '安全教育', '科普'] },
      'warm_yellow': { name: '暖黄亲切', keywords: ['生活技能', '健康', '育儿', '家庭'] }
    }
  },
  C: {
    name: '图文混排风',
    subStyles: {
      'nature': { name: '自然风光', keywords: ['旅游', '风景', '自然', '山水'] },
      'city': { name: '城市建筑', keywords: ['建筑', '城市', '商务', '地标'] },
      'food': { name: '美食摄影', keywords: ['美食', '餐饮', '菜品', '餐厅'] }
    }
  },
  D: {
    name: '卡通绘本风',
    subStyles: {
      'candy': { name: '糖果色', keywords: ['数字', '形状', '颜色', '认知', '幼儿'] },
      'watercolor': { name: '绘本水彩', keywords: ['故事', '童话', '动物', '绘本'] }
    }
  },
  E: {
    name: '手绘笔记风',
    subStyles: {
      'hand_drawn': { name: '手绘信息图', keywords: ['知识分享', '生活常识', '科普', '笔记'] }
    }
  }
};

// 参考图模式配置
const REF_IMAGE_MODES = {
  embed: { name: '配图嵌入', desc: '人物照、风景照、活动照', allowDecor: true },
  strict: { name: '严格原样', desc: 'Logo、产品图、证件照', allowDecor: false },
  content_ref: { name: '内容参考', desc: '图表、架构图（重绘）', allowDecor: false },
  style_ref: { name: '风格参考', desc: '设计稿（参考风格）', allowDecor: false }
};

// 状态管理
let state = {
  currentStep: 1,
  createMode: 'create',
  platform: 'ppt',
  contentSource: 'topic',
  contentDensity: 'medium',
  audience: 'adult',
  scene: 'report',
  style: 'B',
  subStyle: null,  // 新增：细分风格
  pageCount: 10,
  pageStructure: '',
  smartTitle: true,
  refImages: [],  // 参考图URL列表
  refImageFiles: [],  // 参考图文件列表
  refImageMode: 'embed',  // 参考图模式
  userContent: '',
  apiKey: '',
  usePlatformApi: true,
  contentMode: 'custom',
  outline: null,
  generatedImages: []
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadSponsorsList();
  initSubStyleSelector();
  initRefImageUploader();
});

// 加载赞助者列表
async function loadSponsorsList() {
  const sponsorsListEl = document.getElementById('sponsorsList');
  if (!sponsorsListEl) return;
  
  try {
    const response = await fetch('data/sponsors.json');
    const data = await response.json();
    
    sponsorsListEl.innerHTML = data.sponsors.map(s => 
      `<span class="px-2 py-1 bg-accent/20 text-accent rounded">${s.name} ¥${s.amount}</span>`
    ).join('');
  } catch (error) {
    console.log('加载赞助者列表失败');
  }
}

// ============ 细分风格选择器 ============

function initSubStyleSelector() {
  const styleContainer = document.getElementById('styleSelector');
  if (!styleContainer) {
    console.log('风格选择器容器未找到');
    return;
  }
  
  // 初始化时显示当前默认风格的细分选择器
  if (state.style) {
    updateSubStyleSelector(state.style);
  }
}

// 更新细分风格选择器
function updateSubStyleSelector(mainStyle) {
  const subStyleContainer = document.getElementById('subStyleSelector');
  if (!subStyleContainer) return;
  
  const config = SUB_STYLE_CONFIG[mainStyle];
  if (!config) {
    subStyleContainer.innerHTML = '';
    return;
  }
  
  // 根据场景关键词自动推荐细分风格
  const recommendedKey = recommendSubStyle(mainStyle, state.scene, state.topic || '');
  
  let html = `
    <label class="block text-sm font-medium mb-3 mt-6">
      细分风格
      <span class="text-gray-500 text-xs ml-2">根据场景自动推荐</span>
    </label>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
  `;
  
  for (const [key, subStyle] of Object.entries(config.subStyles)) {
    const isRecommended = key === recommendedKey;
    html += `
      <button onclick="selectSubStyle('${key}')" 
              class="option-card ${isRecommended || (!state.subStyle && isRecommended) ? 'selected' : ''} rounded-xl p-3 cursor-pointer text-left"
              data-substyle="${key}">
        <div class="flex items-center justify-between">
          <span class="font-medium text-sm">${subStyle.name}</span>
          ${isRecommended ? '<span class="text-xs text-accent">推荐</span>' : ''}
        </div>
      </button>
    `;
  }
  
  html += '</div>';
  subStyleContainer.innerHTML = html;
  
  // 自动选择推荐风格
  if (recommendedKey && !state.subStyle) {
    state.subStyle = recommendedKey;
  }
}

// 推荐细分风格
function recommendSubStyle(mainStyle, scene, topic) {
  const config = SUB_STYLE_CONFIG[mainStyle];
  if (!config || !config.subStyles) return null;
  
  const combinedText = `${scene} ${topic}`.toLowerCase();
  
  for (const [key, subStyle] of Object.entries(config.subStyles)) {
    if (subStyle.keywords && subStyle.keywords.length > 0) {
      const hasKeyword = subStyle.keywords.some(kw => combinedText.includes(kw.toLowerCase()));
      if (hasKeyword) return key;
    }
  }
  
  // 返回最后一个作为默认
  const keys = Object.keys(config.subStyles);
  return keys[keys.length - 1];
}

// 选择细分风格
function selectSubStyle(subStyle) {
  state.subStyle = subStyle;
  
  // 更新UI
  const buttons = document.querySelectorAll('[data-substyle]');
  buttons.forEach(btn => {
    if (btn.dataset.substyle === subStyle) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// ============ 参考图上传 ============

function initRefImageUploader() {
  const refImagesInput = document.getElementById('refImages');
  if (!refImagesInput) return;
  
  refImagesInput.addEventListener('change', handleRefImageUpload);
}

// 处理参考图上传
async function handleRefImageUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  
  state.refImageFiles = Array.from(files);
  
  // 显示预览
  const previewContainer = document.getElementById('refImagePreview');
  if (!previewContainer) return;
  
  previewContainer.innerHTML = '';
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = 'relative inline-block mr-2 mb-2';
      div.innerHTML = `
        <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border border-border">
        <button onclick="removeRefImage(${i})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
          <i class="fas fa-times"></i>
        </button>
      `;
      previewContainer.appendChild(div);
    };
    
    reader.readAsDataURL(file);
  }
  
  // 显示参考图模式选择
  showRefImageModeSelector();
}

// 显示参考图模式选择器
function showRefImageModeSelector() {
  const modeContainer = document.getElementById('refImageModeSelector');
  if (!modeContainer) return;
  
  let html = `
    <label class="block text-sm font-medium mb-3 mt-4">
      参考图使用方式
    </label>
    <div class="grid grid-cols-2 gap-3">
  `;
  
  for (const [key, mode] of Object.entries(REF_IMAGE_MODES)) {
    const isSelected = key === state.refImageMode;
    html += `
      <button onclick="selectRefImageMode('${key}')" 
              class="option-card ${isSelected ? 'selected' : ''} rounded-xl p-3 cursor-pointer text-left"
              data-refmode="${key}">
        <div class="font-medium text-sm">${mode.name}</div>
        <div class="text-xs text-gray-500">${mode.desc}</div>
      </button>
    `;
  }
  
  html += '</div>';
  modeContainer.innerHTML = html;
}

// 选择参考图模式
function selectRefImageMode(mode) {
  state.refImageMode = mode;
  
  const buttons = document.querySelectorAll('[data-refmode]');
  buttons.forEach(btn => {
    if (btn.dataset.refmode === mode) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

// 移除参考图
function removeRefImage(index) {
  state.refImageFiles.splice(index, 1);
  
  // 重新触发预览更新
  const previewContainer = document.getElementById('refImagePreview');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    state.refImageFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const div = document.createElement('div');
        div.className = 'relative inline-block mr-2 mb-2';
        div.innerHTML = `
          <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border border-border">
          <button onclick="removeRefImage(${i})" class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
            <i class="fas fa-times"></i>
          </button>
        `;
        previewContainer.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  }
  
  // 如果没有参考图了，隐藏模式选择器
  if (state.refImageFiles.length === 0) {
    const modeContainer = document.getElementById('refImageModeSelector');
    if (modeContainer) modeContainer.innerHTML = '';
  }
}

// ============ 步骤1：基本信息 ============

function selectMode(mode) {
  state.createMode = mode;
  updateOptionCards('mode', mode);
  
  // 如果是修改模式，显示文件上传
  const modifyUpload = document.getElementById('modifyUpload');
  if (modifyUpload) {
    if (mode === 'modify') {
      modifyUpload.classList.remove('hidden');
    } else {
      modifyUpload.classList.add('hidden');
    }
  }
  
  // 如果是模板复刻模式，显示模板上传
  const templateUpload = document.getElementById('templateUpload');
  if (templateUpload) {
    if (mode === 'template') {
      templateUpload.classList.remove('hidden');
    } else {
      templateUpload.classList.add('hidden');
    }
  }
}

function selectPlatform(platform) {
  state.platform = platform;
  updateOptionCards('platform', platform);
  
  const titleTip = document.getElementById('titleTip');
  if (titleTip) {
    if (platform === 'xiaohongshu') {
      titleTip.classList.remove('hidden');
    } else {
      titleTip.classList.add('hidden');
    }
  }
}

function selectContentSource(source) {
  state.contentSource = source;
  updateOptionCards('source', source);
  
  const materialUpload = document.getElementById('materialUpload');
  if (materialUpload) {
    if (source === 'material') {
      materialUpload.classList.remove('hidden');
    } else {
      materialUpload.classList.add('hidden');
    }
  }
}

function selectDensity(density) {
  state.contentDensity = density;
  updateOptionCards('density', density);
}

function selectContentMode(mode) {
  state.contentMode = mode;
  updateOptionCards('contentMode', mode);
  
  const outlinePreview = document.getElementById('outlinePreview');
  if (outlinePreview) {
    if (mode === 'ai') {
      outlinePreview.classList.remove('hidden');
    } else {
      outlinePreview.classList.add('hidden');
      state.outline = null;
    }
  }
}

function selectAudience(audience) {
  state.audience = audience;
  updateOptionCards('audience', audience);
  
  // 自动推荐风格
  const styleMap = { child: 'D', student: 'B', adult: 'A', professional: 'A' };
  const recommendedStyle = styleMap[audience];
  
  if (recommendedStyle && recommendedStyle !== state.style) {
    selectStyle(recommendedStyle);
    showToast(`已自动推荐「${SUB_STYLE_CONFIG[recommendedStyle].name}」风格`, 'info');
  }
}

function selectScene(scene) {
  state.scene = scene;
  updateOptionCards('scene', scene);
  
  // 更新细分风格推荐
  if (state.style) {
    updateSubStyleSelector(state.style);
  }
}

// ============ 步骤2：内容风格 ============

function selectStyle(style) {
  state.style = style;
  updateOptionCards('style', style);
  updateSubStyleSelector(style);
}

// ============ 通用函数 ============

function updateOptionCards(type, selected) {
  const attrMap = {
    mode: 'data-mode',
    platform: 'data-platform',
    source: 'data-source',
    density: 'data-density',
    audience: 'data-audience',
    scene: 'data-scene',
    style: 'data-style',
    contentMode: 'data-contentmode'
  };
  
  const attr = attrMap[type];
  if (!attr) return;
  
  const cards = document.querySelectorAll(`[${attr}]`);
  cards.forEach(card => {
    if (card.getAttribute(attr) === selected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function changePages(delta) {
  const input = document.getElementById('pages');
  if (!input) return;
  
  let value = parseInt(input.value) + delta;
  value = Math.max(5, Math.min(20, value));
  input.value = value;
  state.pageCount = value;
  updateCostEstimate();
}

function updateCostEstimate() {
  // 更新费用预估（如果有的话）
}

// ============ 步骤导航 ============

async function goToStep2() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) {
    showToast('请输入PPT主题', 'error');
    return;
  }
  
  state.topic = topic;
  
  // 显示大纲生成loading
  const step1Content = document.getElementById('step1');
  const originalContent = step1Content.innerHTML;
  
  // 在step1中显示loading
  const loadingHtml = `
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">正在生成内容大纲...</p>
      <p class="text-xs text-gray-500 mt-2">AI正在为您规划PPT结构</p>
    </div>
  `;
  
  // 保存原始内容并显示loading
  step1Content.dataset.originalContent = originalContent;
  
  try {
    // 调用大纲生成API
    const response = await fetch('https://ig8u65l6vm.sealosbja.site/generate-outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: topic,
        pageCount: state.pageCount
      })
    });
    
    const result = await response.json();
    
    if (result.ok && result.outline) {
      state.outline = result.outline;
      
      // 显示大纲确认界面
      showOutlineConfirm(result.outline);
    } else {
      throw new Error(result.message || '大纲生成失败');
    }
  } catch (error) {
    console.error('大纲生成失败:', error);
    showToast('大纲生成失败，使用默认结构', 'warning');
    
    // 使用默认大纲
    state.outline = null;
    
    // 恢复步骤1内容
    step1Content.innerHTML = step1Content.dataset.originalContent;
    
    // 直接进入步骤2
    state.currentStep = 2;
    updateStepIndicator();
    document.getElementById('step2').classList.remove('hidden');
    updateSubStyleSelector(state.style);
  }
}

// 显示大纲确认界面
function showOutlineConfirm(outline) {
  const step1 = document.getElementById('step1');
  
  let outlineHtml = `
    <div class="card rounded-2xl p-6 md:p-8">
      <div class="mb-6">
        <h2 class="text-2xl font-bold mb-2">内容大纲</h2>
        <p class="text-gray-400 text-sm">AI已为您生成大纲，确认后继续选择风格</p>
      </div>
      
      <div class="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/10 to-accent2/10 border border-accent/20">
        <div class="flex items-center">
          <i class="fas fa-lightbulb text-accent mr-3"></i>
          <span class="font-medium">${outline.title}</span>
        </div>
      </div>
      
      <div class="space-y-4 mb-8 max-h-80 overflow-y-auto">
  `;
  
  outline.outline.forEach((section, idx) => {
    outlineHtml += `
      <div class="p-4 bg-surface rounded-xl border border-border">
        <div class="flex items-start">
          <span class="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">${idx + 1}</span>
          <div class="flex-1">
            <h3 class="font-medium mb-2">${section.section}</h3>
            <ul class="text-sm text-gray-400 space-y-1">
              ${section.points.map(p => `<li class="flex items-start"><span class="text-accent mr-2">•</span>${p}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  });
  
  if (outline.ending) {
    outlineHtml += `
      <div class="p-4 bg-surface rounded-xl border border-border">
        <div class="flex items-start">
          <span class="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-sm mr-3 flex-shrink-0"><i class="fas fa-flag text-xs"></i></span>
          <div class="flex-1">
            <h3 class="font-medium mb-1">结尾</h3>
            <p class="text-sm text-gray-400">${outline.ending}</p>
          </div>
        </div>
      </div>
    `;
  }
  
  outlineHtml += `
      </div>
      
      <div class="flex gap-4">
        <button onclick="regenerateOutline()" class="flex-1 btn-secondary text-white py-3 rounded-xl font-medium flex items-center justify-center">
          <i class="fas fa-refresh mr-2"></i>
          重新生成
        </button>
        <button onclick="confirmOutline()" class="flex-1 btn-primary text-white py-3 rounded-xl font-medium flex items-center justify-center">
          确认大纲
          <i class="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  `;
  
  step1.innerHTML = outlineHtml;
}

// 重新生成大纲
async function regenerateOutline() {
  state.outline = null;
  
  // 重新触发大纲生成
  const step1 = document.getElementById('step1');
  step1.innerHTML = step1.dataset.originalContent;
  
  await goToStep2();
}

// 确认大纲，进入步骤2
function confirmOutline() {
  state.currentStep = 2;
  updateStepIndicator();
  
  // 恢复步骤1内容
  const step1 = document.getElementById('step1');
  step1.innerHTML = step1.dataset.originalContent;
  step1.classList.add('hidden');
  
  document.getElementById('step2').classList.remove('hidden');
  
  // 初始化细分风格选择器
  updateSubStyleSelector(state.style);
}

function goToStep1() {
  state.currentStep = 1;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

function updateStepIndicator() {
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`step${i}-dot`);
    const text = document.getElementById(`step${i}-text`);
    
    if (i < state.currentStep) {
      dot.className = 'step-dot completed';
      text.className = 'ml-3 text-sm font-medium text-green-400';
    } else if (i === state.currentStep) {
      dot.className = 'step-dot active';
      text.className = 'ml-3 text-sm font-medium text-white';
    } else {
      dot.className = 'step-dot inactive';
      text.className = 'ml-3 text-sm font-medium text-gray-500';
    }
  }
}

// ============ PPT生成 ============

async function generatePPT() {
  showSponsorModal();
}

function showSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.remove('hidden');
}

function closeSponsorModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.add('hidden');
  
  startGeneration();
}

// 实际生成PPT
async function startGeneration() {
  const resultModal = document.getElementById('resultModal');
  const card = resultModal?.querySelector('.card');
  
  if (!card) {
    showToast('页面元素错误', 'error');
    return;
  }
  
  // 显示loading
  card.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
      <p class="text-gray-400">正在生成PPT，请稍候...</p>
      <p class="text-xs text-gray-500 mt-2">风格: ${SUB_STYLE_CONFIG[state.style]?.name || state.style} · ${state.subStyle ? SUB_STYLE_CONFIG[state.style]?.subStyles[state.subStyle]?.name : ''}</p>
    </div>
  `;
  
  resultModal.classList.remove('hidden');
  
  try {
    // 构建请求数据
    const requestData = {
      style: state.style,
      subStyle: state.subStyle,
      topic: state.topic,
      platform: state.platform,
      scene: state.scene,
      pageCount: state.pageCount,
      outline: state.outline,  // 传递大纲数据
      refImageMode: state.refImageFiles.length > 0 ? state.refImageMode : null
    };
    
    // 如果有参考图，先上传
    if (state.refImageFiles.length > 0) {
      // TODO: 实现图片上传到云存储
      // requestData.refImages = uploadedUrls;
    }
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (result.code === 0 || result.success) {
      displayResult(result.data || result, card);
    } else {
      throw new Error(result.message || result.error || '生成失败');
    }
  } catch (error) {
    card.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
        <p class="text-red-400">${error.message}</p>
        <button onclick="closeResultModal()" class="mt-4 btn-secondary px-6 py-2 rounded-lg">关闭</button>
      </div>
    `;
  }
}

function displayResult(result, card) {
  state.generatedImages = result.images || [];
  
  const styleName = SUB_STYLE_CONFIG[result.style]?.name || result.style;
  const subStyleName = result.subStyle && SUB_STYLE_CONFIG[result.style]?.subStyles[result.subStyle]?.name;
  const pageCount = result.images?.length || result.pages?.length || 0;
  
  // 检查是否有PPTX数据
  const hasPptx = result.pptx && result.pptx.data;
  
  let html = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h3 class="text-xl font-bold mb-2">${result.topic || 'PPT生成完成'}</h3>
      <p class="text-gray-400">${styleName}${subStyleName ? ' · ' + subStyleName : ''} · ${pageCount}页</p>
    </div>
    
    <div class="mb-6 p-4 bg-surface rounded-xl max-h-60 overflow-y-auto">
      <p class="text-sm text-gray-400 mb-3"><i class="fas fa-eye mr-2"></i>预览生成的页面：</p>
      <div class="grid grid-cols-2 gap-2">
  `;
  
  // 显示生成的图片预览
  if (result.images && result.images.length > 0) {
    result.images.forEach(img => {
      if (img.url) {
        html += `
          <div class="aspect-video bg-surface rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition" onclick="window.open('${img.url}', '_blank')">
            <img src="${img.url}" alt="第${img.page}页" class="w-full h-full object-cover">
          </div>
        `;
      }
    });
  }
  
  html += `
      </div>
    </div>
    
    <div class="space-y-3">
  `;
  
  // PPTX下载按钮
  if (hasPptx) {
    html += `
      <button onclick="downloadPptx('${result.pptx.filename}', '${result.pptx.data}')" class="w-full btn-primary text-white py-3 rounded-xl font-medium flex items-center justify-center">
        <i class="fas fa-download mr-2"></i>
        下载PPT文件 (${result.pptx.filename})
      </button>
    `;
  }
  
  // 图片预览按钮
  html += `
    <button onclick="previewImages()" class="w-full btn-secondary py-3 rounded-xl font-medium flex items-center justify-center">
      <i class="fas fa-images mr-2"></i>
      预览所有图片
    </button>
  `;
  
  html += `
      <button onclick="closeResultModal()" class="w-full text-gray-400 py-3 rounded-xl font-medium hover:text-white transition">
        继续生成
      </button>
    </div>
  `;
  
  card.innerHTML = html;
}

// 下载PPTX文件
function downloadPptx(filename, base64Data) {
  try {
    // 将base64转换为Blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('PPT文件下载成功！', 'success');
  } catch (error) {
    console.error('下载失败:', error);
    showToast('下载失败: ' + error.message, 'error');
  }
}

// 预览所有图片
function previewImages() {
  if (!state.generatedImages || state.generatedImages.length === 0) {
    showToast('没有可预览的图片', 'error');
    return;
  }
  
  // 在新窗口打开第一张图片
  const firstImg = state.generatedImages.find(img => img.url);
  if (firstImg) {
    window.open(firstImg.url, '_blank');
  }
}

function closeResultModal() {
  const modal = document.getElementById('resultModal');
  if (modal) modal.classList.add('hidden');
}

// Toast提示
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    type === 'info' ? 'bg-blue-500' : 'bg-gray-500'
  } text-white text-sm`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle mr-2"></i>${message}`;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
