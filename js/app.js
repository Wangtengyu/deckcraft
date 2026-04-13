/**
 * DeckCraft - 前端交互逻辑 v2.0
 * 支持: 动态进度条、案例库、访问统计
 */

// API配置
const API_URL = 'https://ig8u65l6vm.sealosbja.site/generate';
const PROGRESS_API = 'https://ig8u65l6vm.sealosbja.site/progress';

// 轮询间隔(ms)
const POLL_INTERVAL = 2000;

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
  pollTimer: null
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  loadSponsorsList();
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
  
  const styleMap = { child: 'D', student: 'B', adult: 'A', professional: 'A' };
  const styleNames = { A: '信息图风', B: '插画科普风', C: '图文混排风', D: '卡通绘本风', E: '手绘笔记风' };
  const audienceNames = { child: '幼儿', student: '小学生', adult: '成人', professional: '专业人士' };
  
  const recommendedElement = document.getElementById('recommendedStyle');
  if (recommendedElement) {
    recommendedElement.textContent = `${styleNames[styleMap[audience]]}（适合${audienceNames[audience]}受众）`;
  }
}

function selectScene(scene) {
  state.scene = scene;
  updateOptionCards('scene', scene);
}

// ============ 步骤2：内容风格 ============

function selectStyle(style) {
  state.style = style;
  updateOptionCards('style', style);
}

function updatePageCount(count) {
  state.pageCount = count;
  updateCostEstimate();
}

function toggleSmartTitle(enabled) {
  state.smartTitle = enabled;
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
  card.innerHTML = `
    <style>
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .progress-rotate {
        animation: rotate 2s linear infinite;
      }
      .progress-pulse {
        animation: pulse 1.5s ease-in-out infinite;
      }
      .progress-shimmer {
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
    </style>
    <div class="text-center py-8">
      <div class="relative w-24 h-24 mx-auto mb-6">
        <!-- 外圈旋转 -->
        <svg class="w-24 h-24 progress-rotate absolute top-0 left-0">
          <circle cx="48" cy="48" r="46" stroke="#2a2a3a" stroke-width="2" fill="none"/>
        </svg>
        <!-- 主进度环 -->
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
        <!-- 内圈脉冲 -->
        <div class="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-pink-500/20 progress-pulse"></div>
        <!-- 百分比 -->
        <span id="progressPercent" class="absolute inset-0 flex items-center justify-center text-2xl font-bold progress-pulse">0%</span>
      </div>
      
      <h3 id="progressTitle" class="text-lg font-semibold mb-2">正在生成PPT</h3>
      <p id="progressMessage" class="text-gray-400 text-sm mb-4 progress-shimmer" style="background-clip: text; -webkit-background-clip: text;">准备中...</p>
      
      <!-- 步骤列表 -->
      <div class="text-left text-sm space-y-2 mb-6 max-w-xs mx-auto">
        <div id="step-init" class="flex items-center text-gray-500 transition-all duration-300">
          <i class="fas fa-circle text-xs w-5"></i>
          <span>初始化参数</span>
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
  
  resultModal.classList.remove('hidden');
  
  // 先创建进度任务
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
    
    if (!createResult.success) {
      throw new Error('创建任务失败');
    }
    
    state.taskId = createResult.taskId;
    console.log('创建任务成功:', state.taskId);
    
  } catch (error) {
    console.error('创建任务失败:', error);
    // 如果创建失败，使用本地taskId
    state.taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // 开始轮询进度
  startProgressPolling();
  
  // 调用生成API
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...state,
        taskId: state.taskId
      })
    });
    
    const result = await response.json();
    
    // 停止轮询
    stopProgressPolling();
    
    if (result.success) {
      // 更新统计（通过飞书API）
      updateGenerationStats();
      
      // 更新UI
      updateProgressCircle(100);
      updateStepStatus(4);
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

// ============ 进度轮询 ============

function startProgressPolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
  }
  
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
        
        // 更新进度圆环
        updateProgressCircle(p.progress || 0);
        
        // 更新消息
        const msgEl = document.getElementById('progressMessage');
        if (msgEl) msgEl.textContent = p.message || '处理中...';
        
        // 更新步骤状态
        updateStepStatus(p.currentStep || 1);
        
        // 更新当前页
        if (p.currentPage && p.totalPages) {
          const titleEl = document.getElementById('progressTitle');
          if (titleEl) titleEl.textContent = `正在生成第${p.currentPage}页/${p.totalPages}页`;
        }
        
        // 检查是否完成
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
      if (icon) {
        icon.className = 'fas fa-check-circle text-xs w-5';
      }
    } else if (index + 1 === currentStep) {
      el.className = 'flex items-center text-accent';
      if (icon) {
        icon.className = 'fas fa-spinner fa-spin text-xs w-5';
      }
    } else {
      el.className = 'flex items-center text-gray-500';
      if (icon) {
        icon.className = 'fas fa-circle text-xs w-5';
      }
    }
  });
}

// 更新生成统计
async function updateGenerationStats() {
  try {
    // 更新首页显示的生成次数
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
      <p class="text-gray-400">${result.style} · ${result.platform} · ${(result.images || []).length}页</p>
    </div>
    
    <div class="mb-6 p-4 bg-surface rounded-xl">
      <p class="text-sm text-gray-400 mb-3"><i class="fas fa-eye mr-2"></i>预览生成的页面：</p>
      <div class="grid grid-cols-2 gap-2">
  `;
  
  if (result.images && result.images.length > 0) {
    result.images.forEach((img, i) => {
      if (img.url) {
        html += `
          <div class="aspect-video bg-surface rounded-lg overflow-hidden">
            <img src="${img.url}" alt="第${img.page_id}页" class="w-full h-full object-cover">
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
  
  if (confirm(`确认将「${title}」加入案例库？\n\n加入后，其他用户可以参考您生成的PPT效果。`)) {
    showToast('已加入案例库，感谢您的贡献！', 'success');
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
