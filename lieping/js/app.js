// ============================================
// 人生躺平计算器 - 核心应用逻辑 (优化版)
// ============================================

// 应用状态
let appState = {
    user: {
        name: '财务追梦人',
        currentSavings: 0,
        registrationDate: null
    },
    profile: {
        city: null,
        income: {
            self: 0,
            bonus: 0,
            partner: 0,
            partnerBonus: 0,
            rent: 0,
            invest: 0,
            side: 0
        },
        expense: {
            mortgage: 0,
            car: 0,
            insurance: 0,
            utility: 0,
            food: 0,
            transport: 0,
            communication: 0,
            daily: 0,
            social: 0,
            shopping: 0,
            entertainment: 0,
            travel: 0,
            medical: 0
        },
        plan: null,
        monthlyRecords: [],
        children: null,
        hasPartner: false
    },
    ui: {
        currentPage: 'home',
        returnRate: 0.06,
        theme: 'dark'
    }
};

// 复利图表实例
let compoundChart = null;

// ============================================
// 人性化文案配置
// ============================================
const CARING_MESSAGES = {
    // 单人用户
    single: {
        icon: '💪',
        texts: [
            '一个人在外打拼，挣钱重要，身体更重要',
            '记得给自己留点时间休息，健康是最大的财富'
        ]
    },
    // 双人用户（有伴侣）
    couple: {
        icon: '💕',
        texts: [
            '婚姻需要双方共同维护',
            '互相想着彼此，比财富更重要',
            '一起努力，未来会更好'
        ]
    },
    // 有孩子的用户
    parent: {
        icon: '👨‍👩‍👧',
        texts: [
            '孩子是最好的投资',
            '陪伴成长比物质更重要',
            '教育基金是为了更好的未来'
        ]
    }
};

// ============================================
// 页面导航
// ============================================
function showPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航状态
    appState.ui.currentPage = pageId;
    updateBottomNav();
    
    // 页面特定初始化
    if (pageId === 'result') {
        calculateResults();
    } else if (pageId === 'profile') {
        updateProfile();
    } else if (pageId === 'share') {
        updateShareCard();
    } else if (pageId === 'pyramid') {
        updatePyramidPage();
    } else if (pageId === 'savings') {
        updateSavingsPage();
    } else if (pageId === 'goals') {
        updateGoalsPage();
    } else if (pageId === 'onboarding') {
        // 引导流程
        if (!appState.profile.city) {
            showPage('city');
        } else if (Object.values(appState.profile.income).every(v => !v)) {
            showPage('income');
        } else {
            showPage('expense');
        }
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBottomNav() {
    const nav = document.getElementById('bottom-nav');
    const showNavPages = ['result', 'profile', 'share'];
    
    if (showNavPages.includes(appState.ui.currentPage)) {
        nav.classList.remove('hidden');
    } else {
        nav.classList.add('hidden');
    }
    
    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
        const page = item.dataset.page;
        if (page === appState.ui.currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ============================================
// Toast 通知
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-sky-600',
        warning: 'bg-amber-500'
    };
    
    toast.className = `toast ${colors[type]} text-white`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// 主题切换
// ============================================
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (appState.ui.theme === 'dark') {
        body.classList.add('light-theme');
        themeIcon.textContent = '☀️';
        appState.ui.theme = 'light';
    } else {
        body.classList.remove('light-theme');
        themeIcon.textContent = '🌙';
        appState.ui.theme = 'dark';
    }
    
    saveState();
}

document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

// ============================================
// 城市选择
// ============================================
function initCitySelector() {
    const hotCitiesContainer = document.getElementById('hot-cities');
    const cityListContainer = document.getElementById('city-list');
    
    // 渲染热门城市
    hotCitiesContainer.innerHTML = HOT_CITIES.map(key => {
        const city = CITY_DATA[key];
        return `
            <button onclick="selectCity('${key}')" 
                class="glass-card p-3 text-center hover:border-sky-500 transition text-sm"
                id="hot-${key}">
                <div class="font-semibold">${city.name}</div>
                <div class="text-xs text-slate-400">${city.level === 1 ? '一线' : '新一线'}</div>
            </button>
        `;
    }).join('');
    
    // 按等级渲染所有城市
    const citiesByLevel = getCitiesByLevel();
    const levelNames = { 1: '一线城市', 2: '新一线', 3: '二线', 4: '三线', 5: '四线及以下' };
    
    cityListContainer.innerHTML = Object.entries(citiesByLevel)
        .filter(([level]) => level <= 4)
        .map(([level, cities]) => `
            <div class="mb-4">
                <div class="text-sm text-slate-400 mb-2">${levelNames[level]}</div>
                <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                    ${cities.map(city => `
                        <button onclick="selectCity('${city.key}')" 
                            class="city-item p-2 rounded-lg hover:bg-sky-500/20 transition text-sm"
                            id="city-${city.key}">
                            ${city.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `).join('');
    
    // 如果已有选择，恢复状态
    if (appState.profile.city) {
        selectCity(appState.profile.city, false);
    }
}

function filterCities() {
    const keyword = document.getElementById('city-search').value;
    const cities = searchCities(keyword);
    const cityListContainer = document.getElementById('city-list');
    
    if (keyword.length === 0) {
        initCitySelector();
        return;
    }
    
    cityListContainer.innerHTML = `
        <div class="mb-4">
            <div class="text-sm text-slate-400 mb-2">搜索结果</div>
            <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
                ${cities.map(city => `
                    <button onclick="selectCity('${city.key}')" 
                        class="city-item p-2 rounded-lg hover:bg-sky-500/20 transition text-sm"
                        id="city-${city.key}">
                        ${city.name}
                        <span class="text-xs text-slate-500 block">${['一线', '新一线', '二线', '三线', '四线'][city.level - 1]}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function selectCity(cityKey, autoNext = true) {
    const city = CITY_DATA[cityKey];
    if (!city) return;
    
    appState.profile.city = cityKey;
    
    // 更新UI
    document.getElementById('current-city').classList.remove('hidden');
    document.getElementById('selected-city-name').textContent = city.name;
    document.getElementById('city-next-btn').disabled = false;
    
    // 高亮选中城市
    document.querySelectorAll('.city-item').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll(`[id^="hot-"]`).forEach(el => el.classList.remove('selected'));
    
    const hotBtn = document.getElementById(`hot-${cityKey}`);
    const cityBtn = document.getElementById(`city-${cityKey}`);
    
    if (hotBtn) hotBtn.classList.add('selected');
    if (cityBtn) cityBtn.classList.add('selected');
    
    // 显示城市数据预览
    document.getElementById('city-data-preview').classList.remove('hidden');
    document.getElementById('preview-city-name').textContent = city.name;
    document.getElementById('preview-salary').textContent = city.avgSalary.toLocaleString();
    document.getElementById('preview-rent').textContent = city.avgRent.toLocaleString();
    document.getElementById('preview-cost').textContent = (city.costIndex * 100).toFixed(0) + '%';
    
    saveState();
}

function clearCity() {
    appState.profile.city = null;
    document.getElementById('current-city').classList.add('hidden');
    document.getElementById('city-next-btn').disabled = true;
    document.getElementById('city-data-preview').classList.add('hidden');
    
    document.querySelectorAll('.city-item').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll(`[id^="hot-"]`).forEach(el => el.classList.remove('selected'));
    
    saveState();
}

function goNextFromCity() {
    if (!appState.profile.city) {
        showToast('请先选择城市', 'warning');
        return;
    }
    showPage('income');
}

// ============================================
// 收入计算
// ============================================
document.getElementById('has-partner')?.addEventListener('change', function() {
    const partnerSection = document.getElementById('partner-income');
    appState.profile.hasPartner = this.checked;
    
    if (this.checked) {
        partnerSection.classList.remove('hidden');
    } else {
        partnerSection.classList.add('hidden');
        document.getElementById('income-partner').value = '';
        document.getElementById('income-partner-bonus').value = '';
    }
    calculateIncome();
});

function calculateIncome() {
    const income = {
        self: parseFloat(document.getElementById('income-self').value) || 0,
        bonus: parseFloat(document.getElementById('income-bonus').value) || 0,
        partner: parseFloat(document.getElementById('income-partner').value) || 0,
        partnerBonus: parseFloat(document.getElementById('income-partner-bonus').value) || 0,
        rent: parseFloat(document.getElementById('income-rent').value) || 0,
        invest: parseFloat(document.getElementById('income-invest').value) || 0,
        side: parseFloat(document.getElementById('income-side').value) || 0
    };
    
    // 月薪转年收入
    const yearlySalary = (income.self + income.partner) * 12;
    const yearlyBonus = income.bonus + income.partnerBonus;
    const yearlyPassive = (income.rent + income.invest + income.side) * 12;
    
    const totalYearly = yearlySalary + yearlyBonus + yearlyPassive;
    const totalMonthly = totalYearly / 12;
    
    // 更新UI
    document.getElementById('total-monthly-income').textContent = Math.round(totalMonthly).toLocaleString();
    document.getElementById('total-yearly-income').textContent = Math.round(totalYearly).toLocaleString();
    
    // 保存到状态
    appState.profile.income = income;
    appState.profile.hasPartner = document.getElementById('has-partner')?.checked || false;
    saveState();
}

function goNextFromIncome() {
    const totalIncome = parseFloat(document.getElementById('total-monthly-income').textContent.replace(/,/g, '')) || 0;
    
    if (totalIncome === 0) {
        showToast('请至少填写一项收入', 'warning');
        return;
    }
    
    showPage('expense');
}

// ============================================
// 养娃支出模块
// ============================================
function toggleChildrenSection(show) {
    const section = document.getElementById('children-section');
    const ageHint = document.getElementById('age-hint');
    
    if (show) {
        section.classList.remove('hidden');
        updateAgeHint();
    } else {
        section.classList.add('hidden');
        document.getElementById('expense-children').value = '';
        document.getElementById('include-education-fund').checked = true;
    }
    
    calculateExpense();
}

function updateAgeHint() {
    const ageSelect = document.getElementById('children-age');
    const ageHint = document.getElementById('age-hint');
    
    const hints = {
        '0-3': '💡 婴幼儿期：奶粉、尿不湿、疫苗、早教等，约 3000-5000 元/月',
        '3-6': '💡 幼儿园期：学费、兴趣班、托管等，约 2000-4000 元/月',
        '6-12': '💡 小学期：学费、培训班、兴趣班等，约 2000-5000 元/月',
        '12-18': '💡 中学期：补习班、特长培训等，约 3000-8000 元/月',
        '18+': '💡 大学/已独立：生活费、学费支持等，约 2000-5000 元/月'
    };
    
    if (ageHint) {
        ageHint.textContent = hints[ageSelect.value] || '';
    }
}

// ============================================
// 支出计算
// ============================================
function calculateExpense() {
    const expense = {
        mortgage: parseFloat(document.getElementById('expense-mortgage').value) || 0,
        car: parseFloat(document.getElementById('expense-car').value) || 0,
        insurance: parseFloat(document.getElementById('expense-insurance').value) || 0,
        utility: parseFloat(document.getElementById('expense-utility').value) || 0,
        food: parseFloat(document.getElementById('expense-food').value) || 0,
        transport: parseFloat(document.getElementById('expense-transport').value) || 0,
        communication: parseFloat(document.getElementById('expense-communication').value) || 0,
        daily: parseFloat(document.getElementById('expense-daily').value) || 0,
        social: parseFloat(document.getElementById('expense-social').value) || 0,
        shopping: parseFloat(document.getElementById('expense-shopping').value) || 0,
        entertainment: parseFloat(document.getElementById('expense-entertainment').value) || 0,
        travel: parseFloat(document.getElementById('expense-travel').value) || 0,
        medical: parseFloat(document.getElementById('expense-medical').value) || 0
    };
    
    // 获取养娃支出
    const hasChildren = document.querySelector('input[name="has-children"]:checked')?.value === 'yes';
    const childrenExpense = hasChildren ? (parseFloat(document.getElementById('expense-children').value) || 0) : 0;
    expense.children = childrenExpense;
    
    // 如果有孩子，更新年龄段提示
    if (hasChildren) {
        updateAgeHint();
    }
    
    const totalMonthly = Object.values(expense).reduce((a, b) => a + b, 0);
    
    // 获取月收入
    const totalIncome = parseFloat(document.getElementById('total-monthly-income')?.textContent?.replace(/,/g, '')) || 0;
    
    // 计算储蓄率
    const savings = totalIncome - totalMonthly;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome * 100) : 0;
    
    // 更新UI
    document.getElementById('total-monthly-expense').textContent = Math.round(totalMonthly).toLocaleString();
    document.getElementById('savings-rate').textContent = Math.round(savingsRate);
    
    // 保存到状态
    appState.profile.expense = expense;
    
    // 保存养娃信息到状态
    if (hasChildren) {
        appState.profile.children = {
            count: parseInt(document.getElementById('children-count').value) || 1,
            age: document.getElementById('children-age').value,
            includeEducationFund: document.getElementById('include-education-fund').checked
        };
    } else {
        appState.profile.children = null;
    }
    
    saveState();
}

function goNextFromExpense() {
    const totalExpense = parseFloat(document.getElementById('total-monthly-expense').textContent.replace(/,/g, '')) || 0;
    
    if (totalExpense === 0) {
        showToast('请至少填写一项支出', 'warning');
        return;
    }
    
    showPage('result');
}

// ============================================
// 躺平计算核心逻辑
// ============================================

// 计算教育基金需求（分摊到每月）
function calculateEducationFund(children, cityMultiplier) {
    if (!children || !children.includeEducationFund) return 0;
    
    const baseEducationCost = {
        '0-3': 0,
        '3-6': 150000,
        '6-12': 200000,
        '12-18': 300000,
        '18+': 100000
    };
    
    const marriageFund = 200000;
    
    const baseCost = baseEducationCost[children.age] || 150000;
    const childCount = children.count || 1;
    
    let totalFund = (baseCost + marriageFund) * childCount;
    
    // 考虑通胀折现到当前价值
    const inflationDiscount = Math.pow(1 / 1.025, 10);
    totalFund = totalFund * inflationDiscount;
    
    return totalFund;
}

// ============================================
// 人性化文案更新
// ============================================
function updateCaringMessage() {
    const container = document.getElementById('caring-message');
    const iconEl = container?.querySelector('.icon');
    const textEl = container?.querySelector('.text');
    
    if (!container || !iconEl || !textEl) return;
    
    // 判断用户类型
    let messageType = 'single'; // 默认单人
    
    if (appState.profile.children) {
        messageType = 'parent'; // 有孩子
    } else if (appState.profile.hasPartner || appState.profile.income.partner > 0) {
        messageType = 'couple'; // 有伴侣
    }
    
    const message = CARING_MESSAGES[messageType];
    iconEl.textContent = message.icon;
    textEl.innerHTML = message.texts.join('<br>');
}

function calculateResults() {
    const { income, expense, city, children } = appState.profile;
    
    // 计算月收入
    const monthlyIncome = (
        (income.self || 0) + (income.partner || 0) +
        ((income.bonus || 0) + (income.partnerBonus || 0)) / 12 +
        (income.rent || 0) + (income.invest || 0) + (income.side || 0)
    );
    
    // 计算月支出
    const monthlyExpense = Object.values(expense).reduce((a, b) => a + b, 0);
    
    // 月储蓄
    const monthlySavings = monthlyIncome - monthlyExpense;
    
    // 年支出（考虑通胀）
    const inflationRate = 0.025;
    let annualExpense = monthlyExpense * 12;
    
    // 城市生活成本调整
    const cityMultiplier = city ? CITY_DATA[city].costIndex : 1;
    
    // 计算教育基金需求
    let educationFund = 0;
    let childrenInfo = '';
    if (children) {
        educationFund = calculateEducationFund(children, cityMultiplier);
        const ageNames = {
            '0-3': '婴幼儿',
            '3-6': '幼儿园',
            '6-12': '小学',
            '12-18': '中学',
            '18+': '大学/已独立'
        };
        childrenInfo = ` | 👶 ${children.count}个孩子(${ageNames[children.age] || ''}) | 教育基金 ¥${Math.round(educationFund).toLocaleString()}`;
    }
    
    // 三种方案计算 - 城市系数调整购买力
    const plans = {
        minimal: Math.round(60000 * 25 * cityMultiplier),
        comfortable: Math.round(120000 * 25 * cityMultiplier),
        rich: Math.round(240000 * 25 * cityMultiplier)
    };
    
    // 当前实际年支出对应的躺平本金（用户支出已反映城市成本，不再乘系数）
    const targetAmount = Math.round(annualExpense * 25 + educationFund);
    
    // 更新UI - 核心数据
    document.getElementById('result-target').textContent = targetAmount.toLocaleString();
    document.getElementById('result-minimal').textContent = plans.minimal.toLocaleString();
    document.getElementById('result-comfortable').textContent = plans.comfortable.toLocaleString();
    document.getElementById('result-rich').textContent = plans.rich.toLocaleString();
    
    // 财务分析
    document.getElementById('analysis-savings').textContent = '¥' + appState.user.currentSavings.toLocaleString();
    document.getElementById('analysis-monthly').textContent = '¥' + Math.round(monthlySavings).toLocaleString();
    
    const progress = appState.user.currentSavings > 0 ? 
        Math.min(100, Math.round(appState.user.currentSavings / targetAmount * 100)) : 0;
    document.getElementById('analysis-progress').textContent = progress + '%';
    
    // 击败同龄人
    const beatPercent = calculateBeatPercent(monthlySavings, monthlyIncome);
    document.getElementById('analysis-beat').textContent = beatPercent + '%';
    
    // 保存计划
    appState.profile.plan = {
        targetAmount,
        plans,
        educationFund,
        childrenInfo,
        monthlyIncome,
        monthlyExpense,
        monthlySavings,
        annualExpense,
        progress,
        beatPercent,
        cityMultiplier
    };
    
    // 更新养娃信息显示
    updateChildrenInfoDisplay(children, educationFund);
    
    // 更新人性化文案
    updateCaringMessage();
    
    // 计算达成年限
    calculateYearsToGoal(targetAmount);
    
    // 绘制复利曲线
    drawCompoundChart();
    
    // 生成路线图
    generateRoadmap(targetAmount, monthlySavings);
    
    saveState();
}

// 更新养娃信息显示
function updateChildrenInfoDisplay(children, educationFund) {
    const section = document.getElementById('children-info-section');
    const fundNote = document.getElementById('education-fund-note');
    const resultDesc = document.getElementById('result-description');
    
    if (!children) {
        section.classList.add('hidden');
        if (fundNote) fundNote.classList.add('hidden');
        resultDesc.textContent = '基于 4% 法则 = 年支出 × 25';
        return;
    }
    
    section.classList.remove('hidden');
    if (fundNote) fundNote.classList.remove('hidden');
    resultDesc.textContent = '基于 4% 法则 = 年支出 × 25 + 教育基金';
    
    // 更新孩子数量
    const countDisplay = document.getElementById('children-count-display');
    const countText = { 1: '1个孩子', 2: '2个孩子', 3: '3个及以上' };
    countDisplay.textContent = countText[children.count] || '1个孩子';
    
    // 更新阶段
    const stageDisplay = document.getElementById('children-stage-display');
    const ageNames = {
        '0-3': '婴幼儿期',
        '3-6': '幼儿园期',
        '6-12': '小学期',
        '12-18': '中学期',
        '18+': '大学/已独立'
    };
    stageDisplay.textContent = ageNames[children.age] || '未知';
    
    // 更新教育基金
    const fundDisplay = document.getElementById('education-fund-display');
    fundDisplay.textContent = '¥' + Math.round(educationFund).toLocaleString();
}

function calculateBeatPercent(monthlySavings, monthlyIncome) {
    if (monthlyIncome <= 0) return 0;
    
    const savingsRate = monthlySavings / monthlyIncome;
    
    if (savingsRate >= 0.7) return 90 + Math.round((savingsRate - 0.7) * 30);
    if (savingsRate >= 0.5) return 75 + Math.round((savingsRate - 0.5) * 75);
    if (savingsRate >= 0.3) return 50 + Math.round((savingsRate - 0.3) * 125);
    if (savingsRate >= 0.1) return 20 + Math.round((savingsRate - 0.1) * 150);
    return Math.round(savingsRate * 200);
}

function calculateYearsToGoal(targetAmount) {
    const { monthlySavings } = appState.profile.plan || {};
    const currentSavings = appState.user.currentSavings || 0;
    const returnRate = appState.ui.returnRate || 0.06;
    
    if (!monthlySavings || monthlySavings <= 0) {
        document.getElementById('years-to-goal').textContent = '∞';
        return null;
    }
    
    let years = 0;
    let current = currentSavings;
    const annualSavings = monthlySavings * 12;
    
    // 按年计算复利
    while (current < targetAmount && years < 100) {
        current = current * (1 + returnRate) + annualSavings;
        years++;
    }
    
    document.getElementById('years-to-goal').textContent = years >= 100 ? '100+' : years;
    
    return years;
}

// ============================================
// 复利曲线 - 优化版（显示三条线）
// ============================================
function setReturnRate(rate) {
    appState.ui.returnRate = rate;
    
    // 更新按钮状态
    document.querySelectorAll('[id^="rate-btn-"]').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    });
    
    const activeBtn = document.getElementById(`rate-btn-${rate}`);
    if (activeBtn) {
        activeBtn.classList.remove('btn-secondary');
        activeBtn.classList.add('btn-primary');
    }
    
    // 重新绘制
    calculateYearsToGoal(appState.profile.plan?.targetAmount);
    drawCompoundChart();
    saveState();
}

function drawCompoundChart() {
    const ctx = document.getElementById('compoundChart');
    if (!ctx) return;
    
    const { targetAmount, monthlySavings } = appState.profile.plan || {};
    const currentSavings = appState.user.currentSavings;
    const returnRate = appState.ui.returnRate;
    
    if (!targetAmount || monthlySavings <= 0) {
        if (compoundChart) {
            compoundChart.destroy();
        }
        ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400 text-sm">请填写收支数据后查看曲线</div>';
        return;
    }
    
    // 计算年份范围
    const years = Math.min(50, Math.ceil((targetAmount - currentSavings) / monthlySavings / 12) + 10);
    
    // 生成三条曲线数据
    const labels = [];
    const dataConservative = [];  // 保守 3%
    const dataStable = [];        // 稳健 6%
    const dataAggressive = [];    // 进取 9%
    
    const rates = [0.03, 0.06, 0.09];
    const datasets = [dataConservative, dataStable, dataAggressive];
    
    for (let i = 0; i <= years; i++) {
        labels.push(i === 0 ? '现在' : `第${i}年`);
        
        rates.forEach((rate, idx) => {
            let value = currentSavings;
            for (let m = 0; m < i * 12; m++) {
                value = value * (1 + rate / 12) + monthlySavings;
            }
            datasets[idx].push(Math.round(value));
        });
    }
    
    // 目标线
    const targetData = labels.map(() => targetAmount);
    
    if (compoundChart) {
        compoundChart.destroy();
    }
    
    // 获取当前主题颜色
    const isLight = document.body.classList.contains('light-theme');
    const textColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(148, 163, 184, 0.1)';
    
    compoundChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: '保守 3%',
                    data: dataConservative,
                    borderColor: '#64748b',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#64748b'
                },
                {
                    label: '稳健 6%',
                    data: dataStable,
                    borderColor: '#0891b2',
                    backgroundColor: 'rgba(8, 145, 178, 0.15)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#0891b2'
                },
                {
                    label: '进取 9%',
                    data: dataAggressive,
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#059669'
                },
                {
                    label: '目标金额',
                    data: targetData,
                    borderColor: '#f59e0b',
                    borderDash: [8, 4],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#f59e0b'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false // 使用自定义图例
                },
                tooltip: {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(30,41,59,0.95)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: isLight ? '#e2e8f0' : '#334155',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.raw;
                            let prefix = '';
                            if (context.datasetIndex === 3) {
                                prefix = '🎯 ';
                            }
                            return `${prefix}${context.dataset.label}: ¥${value.toLocaleString()}`;
                        },
                        afterBody: function(context) {
                            // 显示距离目标的差距
                            const currentRateIdx = context.length - 2; // 稳健曲线索引
                            if (context[currentRateIdx]) {
                                const diff = targetAmount - context[currentRateIdx].raw;
                                if (diff > 0) {
                                    return [`\n距离目标还差 ¥${diff.toLocaleString()}`];
                                } else if (diff <= 0) {
                                    return ['\n🎉 已达成目标！'];
                                }
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor,
                        callback: value => {
                            if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿';
                            if (value >= 10000) return (value / 10000).toFixed(0) + '万';
                            return '¥' + value;
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });
}

// ============================================
// 路线图生成
// ============================================
function generateRoadmap(targetAmount, monthlySavings) {
    const container = document.getElementById('roadmap');
    if (!container) return;
    
    const years = calculateYearsToGoal(targetAmount) || 50;
    const currentSavings = appState.user.currentSavings;
    
    // 确定当前阶段
    const currentPhase = years <= 2 ? 'phase1' : 
                         years <= 5 ? 'phase2' : 
                         years <= 10 ? 'phase3' : 'phase4';
    
    const milestones = [
        {
            years: Math.min(2, years),
            phase: 'phase1',
            title: '建立基础',
            emoji: '📚',
            progress: Math.min(100, currentSavings / 100000 * 100)
        },
        {
            years: Math.min(5, years),
            phase: 'phase2',
            title: '复利加速',
            emoji: '⚡',
            progress: Math.min(100, currentSavings / (targetAmount * 0.25) * 100)
        },
        {
            years: Math.min(10, years),
            phase: 'phase3',
            title: '被动收入构建',
            emoji: '💵',
            progress: Math.min(100, currentSavings / (targetAmount * 0.5) * 100)
        },
        {
            years: years,
            phase: 'phase4',
            title: '财务自由达成',
            emoji: '🎉',
            progress: Math.min(100, currentSavings / targetAmount * 100)
        }
    ];
    
    container.innerHTML = milestones.map((m, i) => {
        const isActive = m.phase === currentPhase;
        const completedIdx = milestones.findIndex(x => x.phase === currentPhase);
        const isCompleted = i < completedIdx || (i === completedIdx && appState.profile.plan?.progress >= 50);
        
        return `
            <div class="roadmap-item ${isCompleted ? 'completed' : ''}">
                <div class="roadmap-dot ${isActive ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''}"></div>
                <div class="glass-card p-4 ${isActive ? 'border-sky-500/50' : ''}">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${m.emoji}</span>
                            <span class="font-semibold">${m.title}</span>
                        </div>
                        <span class="text-sm text-slate-400">${m.years}年内</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${Math.min(100, m.progress)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// 个人中心
// ============================================
function updateProfile() {
    const plan = appState.profile.plan;
    
    // 更新进度
    if (plan) {
        document.getElementById('progress-percent').textContent = plan.progress + '%';
        document.getElementById('progress-saved').textContent = '¥' + appState.user.currentSavings.toLocaleString();
        document.getElementById('progress-target').textContent = '¥' + plan.targetAmount.toLocaleString();
        document.getElementById('progress-remain').textContent = '¥' + Math.max(0, plan.targetAmount - appState.user.currentSavings).toLocaleString();
        
        // 更新进度环
        const circle = document.getElementById('progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 64;
            const offset = circumference * (1 - plan.progress / 100);
            circle.style.strokeDashoffset = Math.max(0, offset);
        }
    }
    
    // 更新里程碑
    updateMilestones();
    
    // 更新月度记录
    updateMonthlyRecords();
}

function updateMilestones() {
    const plan = appState.profile.plan;
    const data = {
        currentSavings: appState.user.currentSavings,
        savingsRate: plan?.monthlySavings && plan?.monthlyIncome ? 
            plan.monthlySavings / plan.monthlyIncome * 100 : 0,
        monthlyPassiveIncome: (appState.profile.income.rent || 0) + 
                             (appState.profile.income.invest || 0) + 
                             (appState.profile.income.side || 0),
        progress: plan?.progress || 0
    };
    
    const conditions = {
        'first10k': data.currentSavings >= 100000,
        'save50': data.savingsRate >= 50,
        'passive1k': data.monthlyPassiveIncome >= 1000,
        'halfway': data.progress >= 50
    };
    
    document.querySelectorAll('.milestone-item').forEach(item => {
        const key = item.dataset.milestone;
        const isCompleted = conditions[key];
        
        if (isCompleted) {
            item.classList.remove('opacity-50');
            item.classList.add('border-emerald-500/50');
            item.querySelector('.text-slate-500').textContent = '✓ 已达成';
        }
    });
}

function updateMonthlyRecords() {
    const container = document.getElementById('monthly-records');
    const records = appState.profile.monthlyRecords;
    
    if (!records || records.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-400 py-8 text-sm">
                暂无月度记录<br>
                <span class="text-xs">开始记录你的财务成长吧</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = records.slice().reverse().slice(0, 6).map(record => `
        <div class="glass-card p-4 flex justify-between items-center">
            <div>
                <div class="font-semibold">${record.month}</div>
                <div class="text-sm text-slate-400">${record.note || ''}</div>
            </div>
            <div class="text-emerald-400 font-bold">+¥${record.savings.toLocaleString()}</div>
        </div>
    `).join('');
}

// ============================================
// 月度记录
// ============================================
function showAddMonthModal() {
    const modal = document.getElementById('add-month-modal');
    modal.classList.remove('hidden');
    
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    document.getElementById('record-month').value = month;
}

function closeAddMonthModal() {
    document.getElementById('add-month-modal').classList.add('hidden');
}

function saveMonthRecord() {
    const month = document.getElementById('record-month').value;
    const savings = parseFloat(document.getElementById('record-savings').value) || 0;
    const note = document.getElementById('record-note').value;
    
    if (!month || savings <= 0) {
        showToast('请填写月份和存款金额', 'warning');
        return;
    }
    
    appState.profile.monthlyRecords.push({
        month,
        savings,
        note,
        date: new Date().toISOString()
    });
    
    appState.user.currentSavings += savings;
    
    closeAddMonthModal();
    updateProfile();
    saveState();
    
    showToast('记录已保存 🎉', 'success');
    
    if (appState.user.currentSavings >= 100000) {
        showToast('🎉 达成里程碑：首个10万！', 'success');
    }
}

// ============================================
// 分享卡片
// ============================================
function generateShareCard() {
    const plan = appState.profile.plan;
    const city = appState.profile.city;
    
    if (!plan) {
        showToast('请先完成测算', 'warning');
        return;
    }
    
    document.getElementById('share-city').textContent = city ? CITY_DATA[city].name : '未知城市';
    document.getElementById('share-target').textContent = plan.targetAmount.toLocaleString();
    document.getElementById('share-progress').textContent = plan.progress + '%';
    document.getElementById('share-years').textContent = document.getElementById('years-to-goal').textContent + '年';
    document.getElementById('share-monthly').textContent = '¥' + Math.round(plan.monthlySavings).toLocaleString();
    
    document.getElementById('share-achievement').textContent = 
        `储蓄率击败${plan.beatPercent}%的年轻人`;
    
    document.getElementById('share-progress-bar').textContent = plan.progress + '%';
    document.getElementById('share-progress-fill').style.width = plan.progress + '%';
    
    showPage('share');
}

function updateShareCard() {
    generateShareCard();
}

// ============================================
// 财富金字塔页面
// ============================================
function updatePyramidPage() {
    // 使用固定演示数据：每月3000，让用户理解复利威力
    const monthlySavings = 3000;
    const years = 10;
    const principal = monthlySavings * 12 * years; // 36万本金
    
    // 场景A: 立即复利，年化6%，每月定投
    let totalA = 0;
    for (let i = 0; i < years * 12; i++) {
        totalA = (totalA + monthlySavings) * (1 + 0.06 / 12);
    }
    const gainA = totalA - principal;
    
    // 场景B: 延迟3年，前3年只存不投，后7年才复利
    let totalB = 0;
    // 前3年只存钱不投资
    for (let i = 0; i < 3 * 12; i++) {
        totalB += monthlySavings;
    }
    // 后7年复利
    for (let i = 0; i < 7 * 12; i++) {
        totalB = (totalB + monthlySavings) * (1 + 0.06 / 12);
    }
    const gainB = totalB - principal;
    
    // 更新显示
    document.getElementById('scene-a-result').textContent = '¥' + Math.round(totalA).toLocaleString();
    document.getElementById('scene-a-gain').textContent = '¥' + Math.round(gainA).toLocaleString();
    document.getElementById('scene-b-result').textContent = '¥' + Math.round(totalB).toLocaleString();
    document.getElementById('scene-b-gain').textContent = '¥' + Math.round(gainB).toLocaleString();
    document.getElementById('compound-loss').textContent = '¥' + Math.round(gainA - gainB).toLocaleString();
    
    // 渲染存款里程碑科普
    renderSavingsMilestones();
    
    // 渲染财富金字塔
    renderWealthPyramid();
}

function renderSavingsMilestones() {
    const container = document.getElementById('milestones-container');
    if (!container || typeof SAVINGS_MILESTONES === 'undefined') return;
    
    const currentSavings = appState.user.currentSavings || 0;
    
    container.innerHTML = SAVINGS_MILESTONES.map((m, i) => {
        const isReached = currentSavings >= m.amount;
        const isClose = currentSavings >= m.amount * 0.7;
        
        return `
            <div class="milestone-item flex items-center gap-4 p-4 mb-3 rounded-xl ${isReached ? 'bg-emerald-500/10 border border-emerald-500/30' : isClose ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-700/30'}">
                <div class="text-3xl">${m.emoji}</div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-lg">${m.title}</span>
                        ${isReached ? '<span class="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">已达成</span>' : ''}
                    </div>
                    <div class="text-sm text-amber-400 mb-1">⚠️ ${m.warning}</div>
                    <div class="text-xs text-slate-400">${m.advice}</div>
                    <div class="text-xs text-red-400 mt-1">💸 ${m.loss}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderWealthPyramid() {
    const container = document.getElementById('wealth-pyramid');
    if (!container) return;
    
    const pyramidData = [
        { level: '躺平期', emoji: '🛋️', desc: '被动收入覆盖支出', width: 'w-40' },
        { level: '配置期', emoji: '📊', desc: '多元资产配置', width: 'w-52' },
        { level: '复利期', emoji: '📈', desc: '投资收益加速', width: 'w-64' },
        { level: '储蓄期', emoji: '💰', desc: '积累本金阶段', width: 'w-72' },
        { level: '收入期', emoji: '💼', desc: '主动收入为主', width: 'w-80' }
    ];
    
    container.innerHTML = pyramidData.map((item, i) => `
        <div class="pyramid-level ${item.width} py-4 rounded-xl text-center ${i === 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : i === 4 ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-cyan-700 to-blue-700'}">
            <div class="text-2xl mb-1">${item.emoji}</div>
            <div class="font-bold">${item.level}</div>
            <div class="text-xs opacity-80">${item.desc}</div>
        </div>
    `).join('');
}

// ============================================
// 省钱攻略页面
// ============================================
function updateSavingsPage() {
    // 计算节省潜力
    calculateSavingsPotential();
    // 渲染建议
    renderSavingsTips();
}

function calculateSavingsPotential() {
    const expense = appState.profile.expense;
    let monthlyPotential = 0;
    
    // 根据各项支出计算可节省金额
    if (expense.food > 1500) {
        monthlyPotential += Math.round((expense.food - 1500) * 0.5); // 餐饮可省50%
    }
    if (expense.shopping > 800) {
        monthlyPotential += Math.round((expense.shopping - 800) * 0.6); // 购物可省60%
    }
    if (expense.entertainment > 400) {
        monthlyPotential += Math.round((expense.entertainment - 400) * 0.7); // 娱乐可省70%
    }
    if (expense.transport > 600) {
        monthlyPotential += Math.round((expense.transport - 600) * 0.4); // 交通可省40%
    }
    if (expense.social > 500) {
        monthlyPotential += Math.round((expense.social - 500) * 0.5); // 社交可省50%
    }
    
    const yearlyPotential = monthlyPotential * 12;
    const decadePotential = yearlyPotential * 10;
    
    // 更新显示
    document.getElementById('total-savings-potential').textContent = monthlyPotential.toLocaleString();
    document.getElementById('yearly-savings-potential').textContent = '¥' + yearlyPotential.toLocaleString();
    document.getElementById('decade-savings-potential').textContent = '¥' + decadePotential.toLocaleString();
}

function renderSavingsTips() {
    const container = document.getElementById('savings-suggestions');
    if (!container) return;
    
    // 基于用户支出给出建议
    const expense = appState.profile.expense;
    const tips = [];
    
    if (expense.food > 2000) {
        tips.push({ icon: '🍜', title: '餐饮支出偏高', tip: '考虑自己做饭，每月可节省¥' + Math.round((expense.food - 1500) * 0.6), color: 'bg-orange-500/20' });
    }
    if (expense.shopping > 1000) {
        tips.push({ icon: '👗', title: '购物支出较高', tip: '区分需要与想要，设置购物冷静期', color: 'bg-pink-500/20' });
    }
    if (expense.entertainment > 500) {
        tips.push({ icon: '🎮', title: '娱乐支出可优化', tip: '寻找免费替代方案，如图书馆、公园活动', color: 'bg-purple-500/20' });
    }
    if (expense.transport > 800) {
        tips.push({ icon: '🚌', title: '交通支出较多', tip: '优先公共交通，考虑办月卡', color: 'bg-blue-500/20' });
    }
    
    // 如果没有特定建议，给出通用建议
    if (tips.length === 0) {
        tips.push({ icon: '✨', title: '支出结构良好', tip: '继续保持良好的消费习惯', color: 'bg-green-500/20' });
    }
    
    // 添加消费对比警醒
    if (typeof SAVING_COMPARISONS !== 'undefined') {
        const comparison = SAVING_COMPARISONS[Math.floor(Math.random() * SAVING_COMPARISONS.length)];
        tips.push({ 
            icon: comparison.icon, 
            title: comparison.title, 
            tip: `<div class="text-red-400">❌ ${comparison.bad}</div><div class="text-green-400 mt-1">✅ ${comparison.good}</div><div class="text-yellow-400 mt-1">💡 ${comparison.difference}</div>`,
            color: 'bg-slate-600/30',
            isComparison: true
        });
    }
    
    container.innerHTML = tips.map(tip => `
        <div class="glass-card p-5 mb-4">
            <div class="flex items-start gap-4">
                <div class="text-3xl">${tip.icon}</div>
                <div class="flex-1">
                    <h4 class="font-bold mb-2">${tip.title}</h4>
                    <p class="text-sm text-slate-300 ${tip.isComparison ? '' : 'leading-relaxed'}">${tip.tip}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// 目标规划页面
// ============================================
function updateGoalsPage() {
    renderGoalsPlan();
    renderUserTags();
    renderAchievements();
}

function renderUserTags() {
    const plan = appState.profile.plan;
    if (!plan) return;
    
    const savingsRate = plan.savingsRate || 0;
    const progress = plan.progress || 0;
    
    // 确定用户标签
    let mainTag = '攒钱新手';
    if (savingsRate >= 60) mainTag = '储蓄大师';
    else if (savingsRate >= 40) mainTag = '攒钱达人';
    else if (savingsRate >= 20) mainTag = '理财小能手';
    
    document.getElementById('user-tag').textContent = mainTag;
    
    // 生成标签列表
    const tags = [];
    if (savingsRate >= 50) tags.push({ emoji: '💰', text: '储蓄率超50%' });
    if (progress >= 10) tags.push({ emoji: '🎯', text: '进度10%+' });
    if (plan.monthlySavings >= 5000) tags.push({ emoji: '📈', text: '月存5000+' });
    if (plan.monthlySavings >= 10000) tags.push({ emoji: '🚀', text: '月存过万' });
    if (progress >= 50) tags.push({ emoji: '🏆', text: '半程达成' });
    
    // 如果标签太少，添加基础标签
    if (tags.length < 3) {
        tags.push({ emoji: '💪', text: '坚持储蓄中' });
        tags.push({ emoji: '🌟', text: '潜力股' });
    }
    
    const container = document.getElementById('user-tags-list');
    if (container) {
        container.innerHTML = tags.map(tag => `
            <span class="px-3 py-1 bg-sky-500/20 rounded-full text-sm text-sky-300">
                ${tag.emoji} ${tag.text}
            </span>
        `).join('');
    }
}

function renderAchievements() {
    const plan = appState.profile.plan;
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    
    const currentSavings = appState.user.currentSavings || 0;
    const savingsRate = plan?.savingsRate || 0;
    const progress = plan?.progress || 0;
    
    const achievements = [
        { 
            id: 'first-10k',
            emoji: '🎯',
            name: '首金',
            desc: '存下第一个10万',
            unlocked: currentSavings >= 100000
        },
        { 
            id: 'save-50',
            emoji: '💎',
            name: '半壁',
            desc: '储蓄率达50%',
            unlocked: savingsRate >= 50
        },
        { 
            id: 'progress-25',
            emoji: '🌟',
            name: '启程',
            desc: '进度达25%',
            unlocked: progress >= 25
        },
        { 
            id: 'progress-50',
            emoji: '🏆',
            name: '半程',
            desc: '进度达50%',
            unlocked: progress >= 50
        },
        { 
            id: 'progress-75',
            emoji: '🚀',
            name: '冲刺',
            desc: '进度达75%',
            unlocked: progress >= 75
        },
        { 
            id: 'fire',
            emoji: '🛋️',
            name: '躺平',
            desc: '达成目标',
            unlocked: progress >= 100
        },
        { 
            id: 'monthly-5k',
            emoji: '💰',
            name: '勤俭',
            desc: '月存5000+',
            unlocked: (plan?.monthlySavings || 0) >= 5000
        },
        { 
            id: 'monthly-10k',
            emoji: '💵',
            name: '致富',
            desc: '月存过万',
            unlocked: (plan?.monthlySavings || 0) >= 10000
        }
    ];
    
    container.innerHTML = achievements.map(a => `
        <div class="text-center p-3 rounded-xl ${a.unlocked ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-slate-700/30 opacity-50'}">
            <div class="text-3xl mb-1">${a.emoji}</div>
            <div class="font-bold text-sm">${a.name}</div>
            <div class="text-xs text-slate-400">${a.desc}</div>
        </div>
    `).join('');
}

function renderGoalsPlan() {
    const container = document.getElementById('goal-timeline');
    if (!container) return;
    
    const plan = appState.profile.plan;
    if (!plan) {
        container.innerHTML = '<div class="text-center text-slate-400 py-10">请先完成财务测算</div>';
        return;
    }
    
    const currentSavings = appState.user.currentSavings || 0;
    const targetAmount = plan.targetAmount;
    const monthlySavings = plan.monthlySavings;
    
    // 计算短期、中期、长期目标
    const shortTerm = Math.min(100000, targetAmount * 0.1);
    const midTerm = targetAmount * 0.5;
    
    const monthsToShortTerm = shortTerm > currentSavings ? Math.ceil((shortTerm - currentSavings) / monthlySavings) : 0;
    const monthsToMidTerm = midTerm > currentSavings ? Math.ceil((midTerm - currentSavings) / monthlySavings) : 0;
    const monthsToLongTerm = targetAmount > currentSavings ? Math.ceil((targetAmount - currentSavings) / monthlySavings) : 0;
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- 短期目标 -->
            <div class="glass-card p-5">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold">🎯 短期目标</h4>
                    <span class="text-xs text-emerald-400">${currentSavings >= shortTerm ? '已达成' : monthsToShortTerm + '个月后'}</span>
                </div>
                <div class="text-2xl font-bold text-emerald-400 mb-2">¥${shortTerm.toLocaleString()}</div>
                <p class="text-sm text-slate-400">建立应急基金，覆盖3-6个月支出</p>
                <div class="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: ${Math.min(100, currentSavings / shortTerm * 100)}%"></div>
                </div>
            </div>
            
            <!-- 中期目标 -->
            <div class="glass-card p-5">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold">🚀 中期目标</h4>
                    <span class="text-xs text-amber-400">${currentSavings >= midTerm ? '已达成' : Math.floor(monthsToMidTerm / 12) + '年后'}</span>
                </div>
                <div class="text-2xl font-bold text-amber-400 mb-2">¥${midTerm.toLocaleString()}</div>
                <p class="text-sm text-slate-400">达成50%躺平目标，被动收入初具规模</p>
                <div class="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-500 rounded-full" style="width: ${Math.min(100, currentSavings / midTerm * 100)}%"></div>
                </div>
            </div>
            
            <!-- 长期目标 -->
            <div class="glass-card p-5">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold">🏆 长期目标</h4>
                    <span class="text-xs text-sky-400">${currentSavings >= targetAmount ? '已达成' : Math.floor(monthsToLongTerm / 12) + '年后'}</span>
                </div>
                <div class="text-2xl font-bold text-sky-400 mb-2">¥${targetAmount.toLocaleString()}</div>
                <p class="text-sm text-slate-400">实现财务自由，开启躺平人生</p>
                <div class="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-sky-500 rounded-full" style="width: ${Math.min(100, currentSavings / targetAmount * 100)}%"></div>
                </div>
            </div>
            
            <!-- 核心理念金句 -->
            <div class="glass-card p-5 text-center">
                <div class="text-4xl mb-3">💡</div>
                <p class="text-lg font-medium text-yellow-400">${typeof CORE_MESSAGES !== 'undefined' ? CORE_MESSAGES[Math.floor(Math.random() * CORE_MESSAGES.length)] : '不要为欲望买单，要为自由储蓄'}</p>
            </div>
        </div>
    `;
}

function downloadShareCard() {
    const card = document.getElementById('share-card');
    
    html2canvas(card, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = '财务报告_' + new Date().toISOString().slice(0, 10) + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('图片已下载 📥', 'success');
    }).catch(err => {
        showToast('下载失败，请重试', 'error');
    });
}

// ============================================
// 数据导入导出
// ============================================
function exportData() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = '财务自由计算器数据_' + new Date().toISOString().slice(0, 10) + '.json';
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('数据已导出 📤', 'success');
}

function importData() {
    document.getElementById('import-file').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (!imported.profile || !imported.user) {
                throw new Error('Invalid data format');
            }
            
            appState = imported;
            saveState();
            restoreUIState();
            
            showToast('数据导入成功 🎉', 'success');
            showPage('profile');
            
        } catch (err) {
            showToast('导入失败：文件格式错误', 'error');
        }
    };
    reader.readAsText(file);
    
    event.target.value = '';
}

function restoreUIState() {
    const { income, expense, city, hasPartner } = appState.profile;
    
    // 恢复收入
    if (income) {
        document.getElementById('income-self').value = income.self || '';
        document.getElementById('income-bonus').value = income.bonus || '';
        document.getElementById('income-partner').value = income.partner || '';
        document.getElementById('income-partner-bonus').value = income.partnerBonus || '';
        document.getElementById('income-rent').value = income.rent || '';
        document.getElementById('income-invest').value = income.invest || '';
        document.getElementById('income-side').value = income.side || '';
        
        if (hasPartner || income.partner > 0) {
            document.getElementById('has-partner').checked = true;
            document.getElementById('partner-income').classList.remove('hidden');
        }
        
        calculateIncome();
    }
    
    // 恢复支出
    if (expense) {
        Object.entries(expense).forEach(([key, value]) => {
            const el = document.getElementById(`expense-${key}`);
            if (el) el.value = value || '';
        });
        calculateExpense();
    }
    
    // 恢复城市
    if (city) {
        initCitySelector();
        selectCity(city, false);
    }
    
    // 恢复主题
    if (appState.ui.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').textContent = '☀️';
    }
}

function resetData() {
    if (!confirm('确定要重置所有数据吗？此操作不可恢复。')) {
        return;
    }
    
    localStorage.removeItem('liepingState');
    location.reload();
}

// ============================================
// 本地存储
// ============================================
function saveState() {
    try {
        localStorage.setItem('liepingState', JSON.stringify(appState));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('liepingState');
        if (saved) {
            const parsed = JSON.parse(saved);
            
            appState = {
                ...appState,
                ...parsed,
                user: { ...appState.user, ...parsed.user },
                profile: {
                    ...appState.profile,
                    ...parsed.profile,
                    income: { ...appState.profile.income, ...parsed.profile?.income },
                    expense: { ...appState.profile.expense, ...parsed.profile?.expense }
                },
                ui: { ...appState.ui, ...parsed.ui }
            };
            
            return true;
        }
    } catch (e) {
        console.warn('Failed to load state:', e);
    }
    return false;
}

// ============================================
// 初始化
// ============================================
function init() {
    const hasData = loadState();
    
    initCitySelector();
    
    if (hasData) {
        restoreUIState();
    }
    
    if (appState.ui.theme === 'light') {
        document.body.classList.add('light-theme');
        document.getElementById('theme-icon').textContent = '☀️';
    }
    
    if (appState.user.name) {
        document.getElementById('user-name').textContent = appState.user.name;
        document.getElementById('profile-name').textContent = appState.user.name;
    }
}

document.addEventListener('DOMContentLoaded', init);
