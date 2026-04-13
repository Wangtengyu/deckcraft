/**
 * DeckCraft - 前端交互逻辑 V2.0 (优化版)
 * 新增功能：
 * 1. 专业化Prompt模板支持
 * 2. 预设模板库选择
 * 3. 内容智能生成
 * 4. 场景化推荐
 */

// API配置
const API_URL = 'https://ig8u65l6vm.sealosbja.site/generate';
const PROGRESS_API = 'https://ig8u65l6vm.sealosbja.site/progress';
const TEMPLATE_API = 'https://ig8u65l6vm.sealosbja.site/templates';

// 轮询间隔(ms)
const POLL_INTERVAL = 2000;

// ============ 场景与模板配置 ============
const SCENE_TEMPLATES = {
  report: {
    name: '工作汇报',
    icon: 'fa-chart-line',
    description: '项目进度、述职报告、季度总结',
    recommended: 'A',
    color: '#4A90D9'
  },
  proposal: {
    name: '项目方案',
    icon: 'fa-lightbulb',
    description: '商业计划、解决方案、产品提案',
    recommended: 'A',
    color: '#2C3E50'
  },
  training: {
    name: '培训课件',
    icon: 'fa-graduation-cap',
    description: '员工培训、技能教学、流程说明',
    recommended: 'B',
    color: '#4ECDC4'
  },
  science: {
    name: '知识科普',
    icon: 'fa-atom',
    description: '科普宣传、教育讲解、技术介绍',
    recommended: 'B',
    color: '#FF6B6B'
  },
  process: {
    name: '流程说明',
    icon: 'fa-tasks',
    description: '操作指南、步骤演示、流程梳理',
    recommended: 'A',
    color: '#FFE66D'
  }
};

const STYLE_OPTIONS = {
  A: { name: '信息图风', desc: '专业商务', icon: 'fa-chart-pie', audience: 'adult' },
  B: { name: '插画科普风', desc: '生动易懂', icon: 'fa-palette', audience: 'student' },
  C: { name: '图文混排风', desc: '照片为主', icon: 'fa-image', audience: 'adult' },
  D: { name: '卡通绘本风', desc: '活泼有趣', icon: 'fa-child', audience: 'child' },
  E: { name: '手绘笔记风', desc: '轻松手绘', icon: 'fa-pen', audience: 'adult' }
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
  style: null,
  pageCount: 10,
  topic: '',
  generatedImages: [],
  taskId: null,
  pollTimer: null,
  templates: null,  // 模板库缓存
  smartContent: true  // 智能内容生成开关
};

// ============ 模板库加载 ============

async function loadTemplates() {
  if (state.templates) return state.templates;
  
  try {
    const response = await fetch(TEMPLATE_API);
    if (response.ok) {
      state.templates = await response.json();
      return state.templates;
    }
  } catch (e) {
    console.log('加载模板库失败，使用内置配置');
  }
  
  // 使用内置默认模板
  state.templates = {
    scene_templates: SCENE_TEMPLATES,
    style_presets: STYLE_OPTIONS
  };
  return state.templates;
}

// ============ 页面初始化 ============

document.addEventListener('DOMContentLoaded', async function() {
  loadSponsorsList();
  
  // 预加载模板库
  await loadTemplates();
  
  // 根据场景推荐风格
  updateStyleRecommendation();
});

// ============ 赞助者列表 ============

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

// ============ 步骤1：基本信息 ============

function selectMode(mode) {
  state.createMode = mode;
  updateOptionCards('mode', mode);
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
    materialUpload.classList.toggle('hidden', source !== 'material');
  }
}

function selectDensity(density) {
  state.contentDensity = density;
  updateOptionCards('density', density);
}

function selectAudience(audience) {
  state.audience = audience;
  updateOptionCards('audience', audience);
  
  // 自动更新场景推荐
  updateStyleRecommendation();
}

function selectScene(scene) {
  state.scene = scene;
  updateOptionCards('scene', scene);
  
  // 更新风格推荐
  updateStyleRecommendation();
  
  // 更新页数建议
  updatePageCountSuggestion(scene);
}

// ============ 智能推荐 ============

function updateStyleRecommendation() {
  const recommendedElement = document.getElementById('recommendedStyle');
  if (!recommendedElement) return;
  
  // 根据受众和场景推荐风格
  let recommended = 'A';
  
  // 受众映射
  const audienceMap = { child: 'D', student: 'B', adult: 'A', professional: 'A' };
  
  // 场景覆盖
  if (SCENE_TEMPLATES[state.scene]) {
    recommended = SCENE_TEMPLATES[state.scene].recommended;
  }
  
  // 受众优先级
  if (state.audience === 'child') recommended = 'D';
  else if (state.audience === 'student') recommended = 'B';
  else if (state.audience !== 'adult') {
    recommended = audienceMap[state.audience] || 'A';
  }
  
  const styleInfo = STYLE_OPTIONS[recommended];
  const sceneInfo = SCENE_TEMPLATES[state.scene];
  
  recommendedElement.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-400">推荐：</span>
      <span class="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-white">
        <i class="fas ${styleInfo.icon} mr-1"></i>${styleInfo.name}
      </span>
      <span class="text-xs text-gray-500">适合${sceneInfo.name}</span>
    </div>
  `;
  
  // 自动选中推荐风格
  state.style = recommended;
  updateOptionCards('style', recommended);
}

function updatePageCountSuggestion(scene) {
  // 不同场景建议不同的页数
  const suggestions = {
    report: 8,
    proposal: 10,
    training: 12,
    science: 8,
    process: 6
  };
  
  const suggested = suggestions[scene] || 8;
  const pageCountSlider = document.getElementById('pageCount');
  const pageCountDisplay = document.getElementById('pageCountDisplay');
  
  if (pageCountSlider && pageCountDisplay) {
    // 如果用户未修改过页数，则自动更新
    if (state.pageCount === 10) {
      pageCountSlider.value = suggested;
      pageCountDisplay.textContent = suggested + ' 页';
      state.pageCount = suggested;
    }
  }
}

// ============ 步骤2：内容风格 ============

function selectStyle(style) {
  state.style = style;
  updateOptionCards('style', style);
  
  // 显示风格预览提示
  const stylePreview = document.getElementById('stylePreview');
  if (stylePreview) {
    const info = STYLE_OPTIONS[style];
    stylePreview.innerHTML = `
      <div class="p-4 bg-surface rounded-xl">
        <h4 class="font-medium mb-2"><i class="fas ${info.icon} mr-2"></i>${info.name}</h4>
        <p class="text-sm text-gray-400">${info.desc}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          ${getStyleKeywords(style)}
        </div>
      </div>
    `;
  }
}

function getStyleKeywords(style) {
  const keywords = {
    A: ['商务', '简洁', '数据', '专业'],
    B: ['科普', '插画', '易懂', '趣味'],
    C: ['照片', '图文', '视觉', '创意'],
    D: ['可爱', '卡通', '儿童', '活泼'],
    E: ['手绘', '笔记', '轻松', '文艺']
  };
  return (keywords[style] || []).map(k => 
    `<span class="px-2 py-0.5 bg-white/10 rounded text-xs">${k}</span>`
  ).join('');
}

function updatePageCount(count) {
  state.pageCount = count;
  updateCostEstimate();
}

function toggleSmartTitle(enabled) {
  state.smartTitle = enabled;
}

// ============ 内容预览 ============

function updateContentPreview() {
  const preview = document.getElementById('contentPreview');
  if (!preview) return;
  
  const topic = document.getElementById('topic')?.value || state.topic;
  const scene = state.scene;
  
  // 根据场景生成内容大纲预览
  const outline = generateContentOutline(topic, scene, state.pageCount);
  
  preview.innerHTML = `
    <div class="bg-surface rounded-xl p-4">
      <h4 class="font-medium mb-3">
        <i class="fas fa-list-alt mr-2 text-accent"></i>
        内容大纲预览
      </h4>
      <div class="space-y-2 text-sm">
        ${outline.map((item, i) => `
          <div class="flex items-start gap-2">
            <span class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-xs flex-shrink-0">
              ${i + 1}
            </span>
            <div>
              <span class="font-medium">${item.title}</span>
              ${item.type !== 'cover' && item.type !== 'ending' ? 
                `<span class="text-gray-500 ml-2">(${item.points || ''})</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 根据场景生成内容大纲
function generateContentOutline(topic, scene, pageCount) {
  const structures = {
    report: ['背景与目标', '执行过程', '关键成果', '数据分析', '问题与挑战', '下一步计划'],
    proposal: ['问题与机会', '解决方案', '核心优势', '成功案例', '实施计划', '预期成果'],
    training: ['培训目标', '基础知识', '核心技能', '实操演练', '案例分析', '行动计划'],
    science: ['核心概念', '关键原理', '重要知识点', '数据展示', '实践应用'],
    process: ['流程概述', '准备工作', '步骤详解', '注意事项', '常见问题']
  };
  
  const sections = structures[scene] || structures.report;
  const outline = [{ type: 'cover', title: '封面页' }];
  
  // 分配内容页
  const contentPages = pageCount - 2;
  const sectionsPerPage = Math.ceil(sections.length / contentPages);
  
  for (let i = 0; i < sections.length && outline.length < pageCount - 1; i++) {
    outline.push({
      type: 'content',
      title: sections[i],
      points: '3个要点'
    });
  }
  
  outline.push({ type: 'ending', title: '感谢聆听' });
  
  return outline.slice(0, pageCount);
}

// ============ 步骤导航 ============

function goToStep2() {
  const topic = document.getElementById('topic').value.trim();
  if (!topic) {
    showToast('请输入PPT主题', 'error');
    return;
  }
  
  state.topic = topic;
  state.currentStep = 2;
  updateStepIndicator();
  
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  
  // 更新内容预览
  updateContentPreview();
}

function goToStep3() {
  state.currentStep = 3;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  
  startGeneration();
}

function goBack() {
  if (state.currentStep === 2) {
    state.currentStep = 1;
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
  } else if (state.currentStep === 3) {
    state.currentStep = 2;
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
  }
  updateStepIndicator();
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

// ============ PPT生成（带进度条） ============

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

async function startGeneration() {
  const resultModal = document.getElementById('resultModal');
  const card = resultModal?.querySelector('.card');
  
  if (!card) {
    showToast('页面元素错误', 'error');
    return;
  }
  
  // 显示进度条loading
  card.innerHTML = generateProgressHTML();
  
  resultModal.classList.remove('hidden');
  
  // 创建任务
  try {
    const createResponse = await fetch(PROGRESS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        totalPages: state.pageCount
      })
    });
    
    const createResult = await createResponse.json();
    state.taskId = createResult.success ? createResult.taskId : `task_${Date.now()}`;
  } catch (error) {
    state.taskId = `task_${Date.now()}`;
  }
  
  // 开始轮询
  startProgressPolling();
  
  // 调用生成API（使用V4优化版）
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: state.topic,
        platform: state.platform,
        style: state.style,
        scene: state.scene,
        audience: state.audience,
        pageCount: state.pageCount,
        taskId: state.taskId
      })
    });
    
    const result = await response.json();
    
    stopProgressPolling();
    
    if (result.success) {
      updateGenerationStats();
      updateProgressCircle(100);
      updateStepStatus(result.totalPages + 2);
      
      const msgEl = document.getElementById('progressMessage');
      if (msgEl) msgEl.textContent = '生成完成！';
      
      setTimeout(() => displayResult(result, card), 500);
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    stopProgressPolling();
    card.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
        <p class="text-red-400">${error.message}</p>
        <button onclick="closeResultModal()" class="mt-4 btn-secondary px-6 py-2 rounded-lg">关闭</button>
      </div>
    `;
  }
}

function generateProgressHTML() {
  return `
    <style>
      @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      .progress-rotate { animation: rotate 2s linear infinite; }
      .progress-pulse { animation: pulse 1.5s ease-in-out infinite; }
      .progress-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2s infinite; }
    </style>
    <div class="text-center py-8">
      <div class="relative w-24 h-24 mx-auto mb-6">
        <svg class="w-24 h-24 progress-rotate absolute top-0 left-0">
          <circle cx="48" cy="48" r="46" stroke="#2a2a3a" stroke-width="2" fill="none"/>
        </svg>
        <svg class="w-24 h-24 absolute top-0 left-0" style="transform: -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#2a2a3a" stroke-width="6" fill="none"/>
          <circle id="progressCircle" cx="48" cy="48" r="40" stroke="url(#gradient)" stroke-width="6" fill="none"
            stroke-dasharray="251.2" stroke-dashoffset="251.2" stroke-linecap="round"
            style="transition: stroke-dashoffset 0.5s ease"/>
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00d4ff"/>
              <stop offset="50%" stop-color="#a855f7"/>
              <stop offset="100%" stop-color="#ff6b9d"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 progress-pulse"></div>
        <span id="progressPercent" class="absolute inset-0 flex items-center justify-center text-2xl font-bold progress-pulse">0%</span>
      </div>
      
      <h3 id="progressTitle" class="text-lg font-semibold mb-2">正在生成PPT</h3>
      <p id="progressMessage" class="text-gray-400 text-sm mb-4 progress-shimmer" style="background-clip: text; -webkit-background-clip: text;">准备中...</p>
      
      <div class="text-left text-sm space-y-2 mb-6 max-w-xs mx-auto">
        <div id="step-init" class="flex items-center text-gray-500 transition-all duration-300">
          <i class="fas fa-circle text-xs w-5"></i>
          <span>生成内容大纲</span>
        </div>
        <div id="step-cover" class="flex items-center text-gray-500 transition-all duration-300">
          <i class="fas fa-circle text-xs w-5"></i>
          <span>生成封面背景</span>
        </div>
        <div id="step-content" class="flex items-center text-gray-500 transition-all duration-300">
          <i class="fas fa-circle text-xs w-5"></i>
          <span>生成内容页背景</span>
        </div>
        <div id="step-complete" class="flex items-center text-gray-500 transition-all duration-300">
          <i class="fas fa-circle text-xs w-5"></i>
          <span>完成打包</span>
        </div>
      </div>
      
      <p class="text-xs text-gray-500">AI正在努力创作中，预计需要1-2分钟</p>
    </div>
  `;
}

// ============ 进度轮询 ============

function startProgressPolling() {
  if (state.pollTimer) clearInterval(state.pollTimer);
  
  state.pollTimer = setInterval(async () => {
    if (!state.taskId) return;
    
    try {
      const response = await fetch(`${PROGRESS_API}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', taskId: state.taskId })
      });
      
      const result = await response.json();
      
      if (result.success && result.progress) {
        const p = result.progress;
        
        updateProgressCircle(p.progress || 0);
        
        const msgEl = document.getElementById('progressMessage');
        if (msgEl) msgEl.textContent = p.message || '处理中...';
        
        updateStepStatus(p.currentStep || 1);
        
        if (p.currentPage && p.totalPages) {
          const titleEl = document.getElementById('progressTitle');
          if (titleEl) titleEl.textContent = `正在生成第${p.currentPage}页/${p.totalPages}页`;
        }
        
        if (p.status === 'completed' || p.status === 'failed') {
          stopProgressPolling();
        }
      }
    } catch (error) {
      console.log('轮询进度失败:', error);
    }
  }, POLL_INTERVAL);
}

function stopProgressPolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

function updateProgressCircle(percent) {
  const circle = document.getElementById('progressCircle');
  const percentEl = document.getElementById('progressPercent');
  
  if (circle) {
    const circumference = 251.2;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }
  
  if (percentEl) {
    percentEl.textContent = `${Math.round(percent)}%`;
  }
}

function updateStepStatus(currentStep) {
  const steps = ['init', 'cover', 'content', 'complete'];
  
  steps.forEach((step, index) => {
    const el = document.getElementById(`step-${step}`);
    if (!el) return;
    
    const icon = el.querySelector('i');
    
    if (index + 1 < currentStep) {
      el.className = 'flex items-center text-green-400';
      if (icon) icon.className = 'fas fa-check-circle text-xs w-5';
    } else if (index + 1 === currentStep) {
      el.className = 'flex items-center text-accent';
      if (icon) icon.className = 'fas fa-spinner fa-spin text-xs w-5';
    } else {
      el.className = 'flex items-center text-gray-500';
      if (icon) icon.className = 'fas fa-circle text-xs w-5';
    }
  });
}

async function updateGenerationStats() {
  try {
    const genCountEl = document.getElementById('genCount');
    if (genCountEl) {
      const current = parseInt(genCountEl.textContent.replace(/,/g, '')) || 15000;
      genCountEl.textContent = (current + 1).toLocaleString();
    }
  } catch (e) {
    console.log('更新统计失败');
  }
}

// ============ 结果展示 ============

function displayResult(result, card) {
  state.generatedImages = result.images || [];
  
  let html = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-check text-3xl text-green-400"></i>
      </div>
      <h3 class="text-xl font-bold mb-2">${result.ppt_title}</h3>
      <p class="text-gray-400">${result.style} · ${result.scene || result.platform} · ${(result.images || []).length}页</p>
    </div>
    
    <div class="mb-6 p-4 bg-surface rounded-xl">
      <p class="text-sm text-gray-400 mb-3"><i class="fas fa-eye mr-2"></i>预览生成的页面：</p>
      <div class="grid grid-cols-2 gap-2">
  `;
  
  if (result.images && result.images.length > 0) {
    result.images.forEach((img, i) => {
      if (img.url) {
        html += `
          <div class="aspect-video bg-surface rounded-lg overflow-hidden relative group">
            <img src="${img.url}" alt="第${img.page_id}页" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="text-white text-sm">${img.title || `第${img.page_id}页`}</span>
            </div>
          </div>
        `;
      }
    });
  } else {
    html += `
      <div class="col-span-2 text-center py-8">
        <i class="fas fa-exclamation-triangle text-3xl text-yellow-400 mb-2"></i>
        <p class="text-gray-400">生成成功，但图片加载失败</p>
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
    
    <div class="space-y-3 mb-4">
      <p class="text-sm text-gray-400">选择下载格式：</p>
  `;
  
  if (result.images && result.images.length > 0) {
    html += `
      <button onclick="downloadImages()" class="btn-primary text-white py-3 rounded-xl font-medium w-full">
        <i class="fas fa-images mr-2"></i>
        下载所有图片
      </button>
      <button onclick="showPptxDownload()" class="btn-secondary py-3 rounded-xl font-medium w-full">
        <i class="fas fa-file-powerpoint mr-2"></i>
        下载PPTX文件
      </button>
      <hr class="border-white/10 my-4">
      <button onclick="confirmAddToGallery('${result.ppt_title}', '${result.style}', '${result.platform}')" class="text-gray-400 py-2 w-full hover:text-white transition">
        <i class="fas fa-plus mr-2"></i>
        加入案例库
      </button>
    `;
  }
  
  html += `
      <button onclick="closeResultModal()" class="text-gray-400 py-2 w-full hover:text-white transition">
        创建新PPT
      </button>
    </div>
  `;
  
  card.innerHTML = html;
}

// ============ 工具函数 ============

function updateOptionCards(group, selectedValue) {
  const containers = {
    mode: '[data-mode]',
    platform: '[data-platform]',
    source: '[data-source]',
    density: '[data-density]',
    audience: '[data-audience]',
    scene: '[data-scene]',
    style: '[data-style]'
  };
  
  const selector = containers[group];
  if (!selector) return;
  
  document.querySelectorAll(selector).forEach(card => {
    const value = card.getAttribute(`data-${group === 'mode' ? 'mode' : group}`);
    if (value === selectedValue) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all ${
    type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : 'bg-gray-800'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

async function downloadImages() {
  const imgList = state.generatedImages || [];
  
  if (imgList.length === 0) {
    showToast('没有可下载的图片', 'error');
    return;
  }
  
  showToast('正在打开图片...', 'info');
  
  for (let i = 0; i < imgList.length; i++) {
    const img = imgList[i];
    if (img.url) {
      window.open(img.url, '_blank');
    }
  }
  
  showToast(`已打开${imgList.length}张图片，请右键保存`, 'success');
}

async function showPptxDownload() {
  if (!state.generatedImages || state.generatedImages.length === 0) {
    showToast('没有可下载的图片', 'error');
    return;
  }
  
  showToast('正在生成PPTX文件...', 'info');
  
  try {
    const response = await fetch('https://ig8u65l6vm.sealosbja.site/generate-pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: state.generatedImages,
        title: state.topic,
        style: state.style
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      const link = document.createElement('a');
      link.href = `data:${result.mimeType};base64,${result.data}`;
      link.download = result.filename;
      link.click();
      
      showToast('PPTX文件已开始下载', 'success');
    } else {
      throw new Error(result.error || '生成失败');
    }
  } catch (error) {
    showToast('PPTX生成失败：' + error.message, 'error');
  }
}

async function confirmAddToGallery(title, style, platform) {
  const thumbnailUrl = state.generatedImages?.[0]?.url || '';
  
  if (!confirm(`确认将「${title}」加入案例库？\n\n加入后，其他用户可以参考您生成的PPT效果。`)) {
    return;
  }
  
  try {
    showToast('正在提交案例...', 'info');
    
    const response = await fetch('https://ig8u65l6vm.sealosbja.site/add-case', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title,
        style: style,
        platform: platform,
        thumbnailUrl: thumbnailUrl
      })
    });
    
    const result = await response.json();
    
    if (result.ok) {
      showToast('✅ 已加入案例库，感谢您的贡献！审核通过后将在首页展示。', 'success');
    } else {
      showToast('❌ 加入失败：' + result.error, 'error');
    }
  } catch (error) {
    console.error('加入案例库失败:', error);
    showToast('❌ 加入失败，请稍后重试', 'error');
  }
}

function openGallery(caseId) {
  const modal = document.getElementById('galleryModal');
  if (modal) modal.classList.remove('hidden');
}

function closeGallery() {
  const modal = document.getElementById('galleryModal');
  if (modal) modal.classList.add('hidden');
}

function goToPage(pageNum) {
  document.querySelectorAll('#galleryModal button[onclick^="goToPage"]').forEach((btn, i) => {
    if (i + 1 === pageNum) {
      btn.classList.add('bg-accent/20', 'border-2', 'border-accent');
      btn.classList.remove('bg-white/5', 'border', 'border-white/10');
    } else {
      btn.classList.remove('bg-accent/20', 'border-2', 'border-accent');
      btn.classList.add('bg-white/5', 'border', 'border-white/10');
    }
  });
}

function selectCase(caseName) {
  localStorage.setItem('pptCase', caseName);
  location.href = 'create.html';
}

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', () => {
  // 检查预选案例
  const preselectedCase = localStorage.getItem('pptCase');
  if (preselectedCase && document.getElementById('topic')) {
    document.getElementById('topic').value = preselectedCase;
    localStorage.removeItem('pptCase');
  }
  
  // 页数滑块
  const pageCountSlider = document.getElementById('pageCount');
  const pageCountDisplay = document.getElementById('pageCountDisplay');
  if (pageCountSlider && pageCountDisplay) {
    pageCountSlider.addEventListener('input', (e) => {
      pageCountDisplay.textContent = e.target.value + ' 页';
      updatePageCount(parseInt(e.target.value));
      updateContentPreview();
    });
  }
  
  // 主题输入时更新预览
  const topicInput = document.getElementById('topic');
  if (topicInput) {
    topicInput.addEventListener('input', () => {
      state.topic = topicInput.value;
      updateContentPreview();
    });
  }
});

function updateCostEstimate() {}
function changePages(delta) {
  const input = document.getElementById('pages');
  if (!input) return;
  
  let value = Math.max(5, Math.min(20, parseInt(input.value) + delta));
  input.value = value;
  state.pageCount = value;
}

function goToStep1() {
  state.currentStep = 1;
  updateStepIndicator();
  
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step1').classList.remove('hidden');
}

function closeResultModal() {
  document.getElementById('resultModal')?.classList.add('hidden');
  document.getElementById('step3')?.classList.add('hidden');
  document.getElementById('step1')?.classList.remove('hidden');
  state.currentStep = 1;
  updateStepIndicator();
}
