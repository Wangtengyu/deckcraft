// 城市数据 - 包含中国各城市的生活成本数据
const CITY_DATA = {
    // 一线城市
    beijing: {
        name: "北京",
        level: 1,
        avgSalary: 13930,
        avgRent: 6000,
        costIndex: 1.3,
        salaryGrowth: 8
    },
    shanghai: {
        name: "上海",
        level: 1,
        avgSalary:13800,
        avgRent: 5800,
        costIndex: 1.28,
        salaryGrowth: 7.5
    },
    shenzhen: {
        name: "深圳",
        level: 1,
        avgSalary: 13500,
        avgRent: 5500,
        costIndex: 1.25,
        salaryGrowth: 9
    },
    guangzhou: {
        name: "广州",
        level: 1,
        avgSalary: 11200,
        avgRent: 4000,
        costIndex: 1.15,
        salaryGrowth: 7
    },
    
    // 新一线城市
    hangzhou: {
        name: "杭州",
        level: 2,
        avgSalary: 11000,
        avgRent: 3800,
        costIndex: 1.18,
        salaryGrowth: 9.5
    },
    nanjing: {
        name: "南京",
        level: 2,
        avgSalary: 10000,
        avgRent: 3200,
        costIndex: 1.12,
        salaryGrowth: 7.5
    },
    chengdu: {
        name: "成都",
        level: 2,
        avgSalary: 8500,
        avgRent: 2200,
        costIndex: 0.98,
        salaryGrowth: 8
    },
    wuhan: {
        name: "武汉",
        level: 2,
        avgSalary: 8200,
        avgRent: 2000,
        costIndex: 0.95,
        salaryGrowth: 8
    },
    xian: {
        name: "西安",
        level: 2,
        avgSalary: 7800,
        avgRent: 1800,
        costIndex: 0.92,
        salaryGrowth: 8
    },
    tianjin: {
        name: "天津",
        level: 2,
        avgSalary: 9500,
        avgRent: 2500,
        costIndex: 1.05,
        salaryGrowth: 7
    },
    chongqing: {
        name: "重庆",
        level: 2,
        avgSalary: 8000,
        avgRent: 1800,
        costIndex: 0.9,
        salaryGrowth: 8.5
    },
    suzhou: {
        name: "苏州",
        level: 2,
        avgSalary: 10200,
        avgRent: 3000,
        costIndex: 1.1,
        salaryGrowth: 8
    },
    zhengzhou: {
        name: "郑州",
        level: 2,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.88,
        salaryGrowth: 8
    },
    changsha: {
        name: "长沙",
        level: 2,
        avgSalary: 7800,
        avgRent: 1700,
        costIndex: 0.9,
        salaryGrowth: 8.5
    },
    
    // 二线城市
    zhuhai: {
        name: "珠海",
        level: 3,
        avgSalary: 8500,
        avgRent: 2500,
        costIndex: 1.05,
        salaryGrowth: 7.5
    },
    ningbo: {
        name: "宁波",
        level: 3,
        avgSalary: 9000,
        avgRent: 2800,
        costIndex: 1.08,
        salaryGrowth: 7.5
    },
    kunming: {
        name: "昆明",
        level: 3,
        avgSalary: 7200,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 7
    },
    qingdao: {
        name: "青岛",
        level: 3,
        avgSalary: 8500,
        avgRent: 2200,
        costIndex: 1.0,
        salaryGrowth: 7
    },
    dalian: {
        name: "大连",
        level: 3,
        avgSalary: 8000,
        avgRent: 2000,
        costIndex: 0.98,
        salaryGrowth: 6.5
    },
    shenyang: {
        name: "沈阳",
        level: 3,
        avgSalary: 7000,
        avgRent: 1400,
        costIndex: 0.85,
        salaryGrowth: 6.5
    },
    jinan: {
        name: "济南",
        level: 3,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.9,
        salaryGrowth: 7
    },
    fuzhou: {
        name: "福州",
        level: 3,
        avgSalary: 8000,
        avgRent: 2200,
        costIndex: 1.0,
        salaryGrowth: 7
    },
    xiamen: {
        name: "厦门",
        level: 3,
        avgSalary: 9000,
        avgRent: 3000,
        costIndex: 1.15,
        salaryGrowth: 7.5
    },
    harbin: {
        name: "哈尔滨",
        level: 3,
        avgSalary: 6500,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    changchun: {
        name: "长春",
        level: 3,
        avgSalary: 6200,
        avgRent: 1100,
        costIndex: 0.8,
        salaryGrowth: 6
    },
    nanchang: {
        name: "南昌",
        level: 3,
        avgSalary: 6800,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 7
    },
    hefei: {
        name: "合肥",
        level: 3,
        avgSalary: 7500,
        avgRent: 1600,
        costIndex: 0.92,
        salaryGrowth: 8
    },
    shijiazhuang: {
        name: "石家庄",
        level: 3,
        avgSalary: 6500,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6.5
    },
    
    // 三线城市
    foshan: {
        name: "佛山",
        level: 4,
        avgSalary: 7000,
        avgRent: 1600,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    wuxi: {
        name: "无锡",
        level: 4,
        avgSalary: 8000,
        avgRent: 2000,
        costIndex: 0.98,
        salaryGrowth: 7
    },
    dongguan: {
        name: "东莞",
        level: 4,
        avgSalary: 6800,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    huizhou: {
        name: "惠州",
        level: 4,
        avgSalary: 6200,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 6
    },
    wenzhou: {
        name: "温州",
        level: 4,
        avgSalary: 7000,
        avgRent: 1800,
        costIndex: 0.92,
        salaryGrowth: 6.5
    },
    jiaxing: {
        name: "嘉兴",
        level: 4,
        avgSalary: 7200,
        avgRent: 1700,
        costIndex: 0.9,
        salaryGrowth: 7
    },
    taizhou_zj: {
        name: "台州",
        level: 4,
        avgSalary: 6800,
        avgRent: 1500,
        costIndex: 0.88,
        salaryGrowth: 6.5
    },
    yantai: {
        name: "烟台",
        level: 4,
        avgSalary: 6500,
        avgRent: 1300,
        costIndex: 0.85,
        salaryGrowth: 6
    },
    weifang: {
        name: "潍坊",
        level: 4,
        avgSalary: 5800,
        avgRent: 1100,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    tangshan: {
        name: "唐山",
        level: 4,
        avgSalary: 6000,
        avgRent: 1100,
        costIndex: 0.82,
        salaryGrowth: 6
    },
    baoding: {
        name: "保定",
        level: 4,
        avgSalary: 5500,
        avgRent: 1000,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    langfang: {
        name: "廊坊",
        level: 4,
        avgSalary: 5800,
        avgRent: 1200,
        costIndex: 0.82,
        salaryGrowth: 6.5
    },
    zhuzhou: {
        name: "株洲",
        level: 4,
        avgSalary: 5500,
        avgRent: 1000,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    yichang: {
        name: "宜昌",
        level: 4,
        avgSalary: 5200,
        avgRent: 900,
        costIndex: 0.78,
        salaryGrowth: 6
    },
    baotou: {
        name: "包头",
        level: 4,
        avgSalary: 5500,
        avgRent: 900,
        costIndex: 0.78,
        salaryGrowth: 5.5
    },
    
    // 四线及以下城市
    luzhou: {
        name: "泸州",
        level: 5,
        avgSalary: 4500,
        avgRent: 700,
        costIndex: 0.72,
        salaryGrowth: 5.5
    },
    yibin: {
        name: "宜宾",
        level: 5,
        avgSalary: 4800,
        avgRent: 750,
        costIndex: 0.72,
        salaryGrowth: 5.5
    },
    nanyang: {
        name: "南阳",
        level: 5,
        avgSalary: 4200,
        avgRent: 600,
        costIndex: 0.7,
        salaryGrowth: 5
    },
    shangqiu: {
        name: "商丘",
        level: 5,
        avgSalary: 4000,
        avgRent: 550,
        costIndex: 0.68,
        salaryGrowth: 5
    },
    hezhou: {
        name: "贺州",
        level: 5,
        avgSalary: 3800,
        avgRent: 500,
        costIndex: 0.68,
        salaryGrowth: 5
    },
    qiandongnan: {
        name: "黔东南",
        level: 5,
        avgSalary: 4200,
        avgRent: 600,
        costIndex: 0.7,
        salaryGrowth: 5.5
    }
};

// 获取热门城市
const HOT_CITIES = ['beijing', 'shanghai', 'shenzhen', 'guangzhou', 'hangzhou', 'nanjing', 'chengdu', 'wuhan', 'xian', 'chongqing', 'tianjin', 'suzhou'];

// 获取所有城市列表（按等级分组）
function getCitiesByLevel() {
    const levels = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
    };
    
    Object.entries(CITY_DATA).forEach(([key, city]) => {
        levels[city.level].push({ key, ...city });
    });
    
    return levels;
}

// 根据关键词搜索城市
function searchCities(keyword) {
    if (!keyword) {
        return Object.entries(CITY_DATA).map(([key, city]) => ({ key, ...city }));
    }
    
    keyword = keyword.toLowerCase();
    return Object.entries(CITY_DATA)
        .filter(([key, city]) => 
            city.name.toLowerCase().includes(keyword) ||
            key.includes(keyword)
        )
        .map(([key, city]) => ({ key, ...city }));
}

// 计算城市生活成本系数
function getCostMultiplier(cityKey) {
    const city = CITY_DATA[cityKey];
    if (!city) return 1;
    return city.costIndex;
}

// 计算基于城市的合理月支出
function getReasonableExpense(cityKey, income) {
    const city = CITY_DATA[cityKey];
    if (!city) return income * 0.7;
    
    // 城市消费指数越高，可消费比例越低
    const consumptionRatio = Math.max(0.4, 0.8 - (city.costIndex - 1) * 0.5);
    return income * consumptionRatio;
}

// 获取城市生活成本报告
function getCityReport(cityKey) {
    const city = CITY_DATA[cityKey];
    if (!city) return null;
    
    const levelNames = {
        1: '一线城市',
        2: '新一线城市',
        3: '二线城市',
        4: '三线城市',
        5: '四线及以下'
    };
    
    return {
        name: city.name,
        level: levelNames[city.level],
        avgSalary: city.avgSalary,
        avgRent: city.avgRent,
        costIndex: city.costIndex,
        salaryGrowth: city.salaryGrowth
    };
}

// 躺平方案配置
const RETIREMENT_PLANS = {
    minimal: {
        name: '极简躺平',
        emoji: '🏕️',
        annualExpense: 60000,
        description: '控制欲望，精打细算'
    },
    comfortable: {
        name: '舒适躺平',
        emoji: '🏡',
        annualExpense: 120000,
        description: '适度消费，生活体面'
    },
    rich: {
        name: '富足躺平',
        emoji: '🏰',
        annualExpense: 240000,
        description: '品质生活，任性消费'
    }
};

// 复利方案配置
const RETURN_RATES = {
    conservative: {
        rate: 0.03,
        name: '保守',
        color: '#10b981',
        description: '国债、大额存单类'
    },
    moderate: {
        rate: 0.06,
        name: '稳健',
        color: '#6366f1',
        description: '混合基金、债券类'
    },
    aggressive: {
        rate: 0.09,
        name: '进取',
        color: '#f59e0b',
        description: '股票、指数基金类'
    }
};

// 阶段配置
const PHASES = {
    phase1: {
        name: '极端储蓄期',
        years: [0, 2],
        emoji: '⚡',
        color: '#ef4444',
        tips: [
            '控制非必要支出',
            '建立3-6个月应急基金',
            '关闭花呗/信用卡',
            '自己做饭，减少外卖'
        ]
    },
    phase2: {
        name: '复利加速期',
        years: [2, 5],
        emoji: '🚀',
        color: '#f59e0b',
        tips: [
            '开始指数基金定投',
            '提升年化收益至6%+',
            '提升职业技能加薪',
            '优化支出结构'
        ]
    },
    phase3: {
        name: '被动收入期',
        years: [5, 10],
        emoji: '💰',
        color: '#8b5cf6',
        tips: [
            '构建多元化收入',
            '被动收入覆盖50%支出',
            '考虑房产等实物投资',
            '降低投资风险'
        ]
    },
    phase4: {
        name: '躺平准备期',
        years: [10, 999],
        emoji: '🛋️',
        color: '#10b981',
        tips: [
            '资产配置优化',
            '建立风险对冲',
            '准备过渡方案',
            '心态调整'
        ]
    }
};

// 里程碑配置
const MILESTONES = {
    first10k: {
        name: '首个10万',
        emoji: '🎯',
        condition: (data) => data.currentSavings >= 100000
    },
    save50: {
        name: '储蓄率50%',
        emoji: '💰',
        condition: (data) => data.savingsRate >= 50
    },
    passive1k: {
        name: '被动收入过千',
        emoji: '📈',
        condition: (data) => data.monthlyPassiveIncome >= 1000
    },
    passive5k: {
        name: '被动收入过5千',
        emoji: '💵',
        condition: (data) => data.monthlyPassiveIncome >= 5000
    },
    halfway: {
        name: '达成50%',
        emoji: '🚀',
        condition: (data) => data.progress >= 50
    },
    fire: {
        name: '躺平达成',
        emoji: '🏆',
        condition: (data) => data.progress >= 100
    }
};

// ============================================
// 节省建议数据
// ============================================

// 支出类别节省建议
const SAVINGS_SUGGESTIONS = {
    food: {
        name: '餐饮',
        emoji: '🍜',
        avgCost: 1800,
        tips: [
            '自己做饭，每周省2次外卖',
            '带饭上班，健康又省钱',
            '减少奶茶咖啡，每月省300+',
            '团购优惠，周末特惠关注'
        ],
        potentialPercent: 30
    },
    transport: {
        name: '交通',
        emoji: '🚗',
        avgCost: 500,
        tips: [
            '公共交通代替打车',
            '拼车上下班',
            '自行车/电动车短途',
            '申请交通补贴'
        ],
        potentialPercent: 25
    },
    shopping: {
        name: '购物',
        emoji: '🛒',
        avgCost: 400,
        tips: [
            '设置购物冷静期',
            '使用比价软件',
            '关注二手平台',
            '等待折扣季集中购买'
        ],
        potentialPercent: 40
    },
    entertainment: {
        name: '娱乐',
        emoji: '🎮',
        avgCost: 300,
        tips: [
            '减少KTV/酒吧消费',
            '免费公园/博物馆代替付费娱乐',
            '视频会员共享',
            '游戏内购慎重'
        ],
        potentialPercent: 35
    },
    social: {
        name: '社交',
        emoji: '🎉',
        avgCost: 500,
        tips: [
            '减少无效社交',
            '在家请客代替外出聚餐',
            'AA制主动提议',
            '选择性参加活动'
        ],
        potentialPercent: 30
    },
    travel: {
        name: '旅行',
        emoji: '✈️',
        avgCost: 400,
        tips: [
            '淡季出行，机票便宜50%',
            '周边游代替远途',
            '民宿代替酒店',
            '提前规划，避免临时高价'
        ],
        potentialPercent: 35
    },
    daily: {
        name: '日用品',
        emoji: '🧴',
        avgCost: 200,
        tips: [
            '批发/囤货更划算',
            '替换装/大容量装',
            '关注超市特卖',
            '自制清洁剂'
        ],
        potentialPercent: 25
    },
    communication: {
        name: '通讯',
        emoji: '📱',
        avgCost: 150,
        tips: [
            '更换更便宜的套餐',
            '宽带融合套餐',
            '取消不必要的增值服务',
            '使用WiFi通话'
        ],
        potentialPercent: 30
    }
};

// 有趣的花费对比
const FUN_COMPARISONS = [
    { name: '奶茶', price: 25, emoji: '🧋', perMonth: 30 },
    { name: '电影', price: 60, emoji: '🎬', perMonth: 4 },
    { name: '外卖', price: 40, emoji: '🍔', perMonth: 20 },
    { name: '游戏', price: 100, emoji: '🎮', perMonth: 2 },
    { name: '口红', price: 200, emoji: '💄', perMonth: 1 },
    { name: '烟', price: 30, emoji: '🚬', perMonth: 30 },
    { name: '咖啡', price: 35, emoji: '☕', perMonth: 20 },
    { name: '美发', price: 200, emoji: '💇', perMonth: 1 }
];

// 用户标签配置
const USER_TAGS = {
    saver: {
        name: '攒钱小能手',
        color1: '#10b981',
        color2: '#34d399',
        emoji: '💰',
        condition: (data) => data.savingsRate >= 40
    },
    investor: {
        name: '复利信徒',
        color1: '#6366f1',
        color2: '#a855f7',
        emoji: '📈',
        condition: (data) => data.monthlyPassiveIncome > 0
    },
    minimalist: {
        name: '极简生活家',
        color1: '#64748b',
        color2: '#94a3b8',
        emoji: '🌿',
        condition: (data) => data.totalExpense < data.income * 0.5
    },
    lateStarter: {
        name: '躺平预备役',
        color1: '#f59e0b',
        color2: '#fbbf24',
        emoji: '😴',
        condition: (data) => data.progress >= 30
    },
    earlyBird: {
        name: '早起鸟',
        color1: '#ef4444',
        color2: '#f87171',
        emoji: '🌅',
        condition: (data) => data.yearsToGoal <= 10
    },
    highSaver: {
        name: '省钱达人',
        color1: '#8b5cf6',
        color2: '#c084fc',
        emoji: '🎯',
        condition: (data) => data.savingsRate >= 50
    },
    passiveMaster: {
        name: '被动收入大师',
        color1: '#0ea5e9',
        color2: '#38bdf8',
        emoji: '🏆',
        condition: (data) => data.monthlyPassiveIncome >= data.totalExpense * 0.5
    },
    fireFighter: {
        name: 'FIRE战士',
        color1: '#f97316',
        color2: '#fb923c',
        emoji: '🔥',
        condition: (data) => data.progress >= 50
    }
};

// 财富金字塔配置
const WEALTH_PYRAMID = [
    {
        name: '财务自由',
        emoji: '👑',
        color: 'from-yellow-400 to-amber-500',
        description: '被动收入覆盖全部支出',
        requirements: ['本金 ≥ 年支出×25', '多元化被动收入', '风险对冲配置']
    },
    {
        name: '资产配置',
        emoji: '⚖️',
        color: 'from-purple-400 to-pink-500',
        description: '分散投资，风险对冲',
        requirements: ['股票/基金配置', '债券/理财打底', '应急现金储备']
    },
    {
        name: '复利增长',
        emoji: '🌱',
        color: 'from-green-400 to-emerald-500',
        description: '让钱为你工作',
        requirements: ['年化收益6%+', '长期持有不动摇', '定期再投资']
    },
    {
        name: '强制储蓄',
        emoji: '💎',
        color: 'from-blue-400 to-cyan-500',
        description: '先存后花，月光可耻',
        requirements: ['储蓄率≥30%', '自动转账存钱', '专款专用账户']
    },
    {
        name: '收入基础',
        emoji: '💼',
        color: 'from-indigo-400 to-blue-500',
        description: '主动+被动双重收入',
        requirements: ['提升职业技能', '拓展收入来源', '增加被动收入']
    }
];

// 目标阶段配置
const GOAL_PHASES = {
    short: {
        name: '短期目标',
        emoji: '🎯',
        color: '#10b981',
        duration: '1年内',
        milestones: [
            '建立3-6个月应急基金',
            '还清高息债务',
            '养成记账习惯',
            '完成第一个10万'
        ]
    },
    medium: {
        name: '中期目标',
        emoji: '🚀',
        color: '#f59e0b',
        duration: '3-5年',
        milestones: [
            '攒够投资本金50万',
            '被动收入覆盖基本支出',
            '构建多元化收入结构',
            '达成躺平目标的50%'
        ]
    },
    long: {
        name: '长期目标',
        emoji: '🏆',
        color: '#6366f1',
        duration: '10年+',
        milestones: [
            '达成财务自由',
            '被动收入≥年支出×25',
            '可选择躺平或继续奋斗',
            '传承财富智慧'
        ]
    }
};

// 成就系统
const ACHIEVEMENTS = {
    firstStep: {
        name: '第一步',
        emoji: '👣',
        description: '完成首次测算',
        unlocked: true
    },
    week1: {
        name: '一周坚持',
        emoji: '📅',
        description: '连续记账7天'
    },
    month1: {
        name: '月度达人',
        emoji: '📆',
        description: '月度储蓄目标达成'
    },
    noWaste: {
        name: '零浪费',
        emoji: '🌱',
        description: '整月无非必要支出'
    },
    investPro: {
        name: '投资专家',
        emoji: '📈',
        description: '开始定投指数基金'
    },
    sideHustle: {
        name: '副业开启',
        emoji: '💼',
        description: '拥有稳定副业收入'
    },
    houseReady: {
        name: '首付就绪',
        emoji: '🏠',
        description: '攒够购房首付'
    },
    halfWay: {
        name: '半程冠军',
        emoji: '🏅',
        description: '达成躺平目标50%'
    }
};

// 游戏化等级
const LEVELS = [
    { name: '青铜', min: 0, emoji: '🥉' },
    { name: '白银', min: 10, emoji: '🥈' },
    { name: '黄金', min: 30, emoji: '🥇' },
    { name: '铂金', min: 50, emoji: '💎' },
    { name: '钻石', min: 75, emoji: '💠' },
    { name: '王者', min: 100, emoji: '👑' }
];

// ============================================
// 存款里程碑科普 - 不同阶段的消费诱惑
// ============================================
const SAVINGS_MILESTONES = [
    {
        amount: 10000,
        title: '1万',
        emoji: '🌱',
        temptation: '换个新手机',
        temptationCost: 5000,
        advice: '手机还能用2年，这5000元投资10年=9000元',
        reward: '应急基金起步',
        nextGoal: '3万 - 半年生活费'
    },
    {
        amount: 30000,
        title: '3万',
        emoji: '🌿',
        temptation: '买台游戏机/平板',
        temptationCost: 4000,
        advice: '娱乐可以等，复利不会等。4000元10年=7200元',
        reward: '3个月应急基金完成',
        nextGoal: '5万 - 投资本金门槛'
    },
    {
        amount: 50000,
        title: '5万',
        emoji: '🌳',
        temptation: '来趟说走就走的旅行',
        temptationCost: 8000,
        advice: '旅行回来还是穷，不如先让钱生钱',
        reward: '可开启稳健投资',
        nextGoal: '10万 - 第一个六位数'
    },
    {
        amount: 100000,
        title: '10万',
        emoji: '⭐',
        temptation: '换最新款手机+电脑',
        temptationCost: 15000,
        advice: '这是你的第一个10万！忍住消费，复利加速期来了',
        reward: '复利收益开始显现',
        nextGoal: '20万 - 资产配置起点'
    },
    {
        amount: 200000,
        title: '20万',
        emoji: '🌟',
        temptation: '买辆代步车',
        temptationCost: 100000,
        advice: '车是消费品，买了就贬值。20万投资年化6%=年赚1.2万',
        reward: '可开始资产配置',
        nextGoal: '30万 - 首付门槛'
    },
    {
        amount: 300000,
        title: '30万',
        emoji: '💫',
        temptation: '换辆好车/首付买房',
        temptationCost: 150000,
        advice: '房是刚需可以考虑，车能不换先别换',
        reward: '部分城市购房首付达标',
        nextGoal: '50万 - 安全感倍增'
    },
    {
        amount: 500000,
        title: '50万',
        emoji: '🔥',
        temptation: '改善住房/换豪车',
        temptationCost: 200000,
        advice: '50万投资年收益3万，相当于多一个月工资',
        reward: '被动收入初具规模',
        nextGoal: '100万 - 百万富翁'
    },
    {
        amount: 1000000,
        title: '100万',
        emoji: '👑',
        temptation: '换豪宅/环游世界',
        temptationCost: 500000,
        advice: '100万是复利的爆发点！年化6%=年赚6万',
        reward: '实现基础版躺平',
        nextGoal: '200万 - 舒适躺平'
    },
    {
        amount: 2000000,
        title: '200万',
        emoji: '🏆',
        temptation: '提前退休',
        temptationCost: 'all',
        advice: '200万年化6%=12万被动收入，舒适躺平达成！',
        reward: '舒适躺平',
        nextGoal: '500万 - 富足躺平'
    },
    {
        amount: 5000000,
        title: '500万',
        emoji: '💎',
        temptation: '随意消费',
        temptationCost: 'any',
        advice: '500万年化6%=30万被动收入，你可以选择躺平了',
        reward: '富足躺平',
        nextGoal: '恭喜！你已经财务自由'
    }
];


// ============================================
// 消费vs储蓄冲击对比 - 用于分享图和结果展示
// ============================================
const SAVING_COMPARISONS = [
    {
        title: '买车 vs 储蓄',
        scenario: '30万存款',
        option1: {
            action: '买辆代步车',
            result: 150000,
            reason: '车辆贬值+油费+保险+保养'
        },
        option2: {
            action: '坚持储蓄投资',
            result: 401500,
            reason: '年化6%复利增长'
        },
        difference: 251500,
        message: '一辆车，让你少存25万'
    },
    {
        title: '外卖 vs 带饭',
        scenario: '每天午餐',
        option1: {
            action: '点外卖50元/天',
            result: 91250,
            reason: '5年共花费'
        },
        option2: {
            action: '自己带饭15元/天',
            result: 27375,
            reason: '5年共花费'
        },
        difference: 63875,
        message: '懒惰让你5年多花6万'
    },
    {
        title: '奶茶 vs 白水',
        scenario: '每天一杯',
        option1: {
            action: '奶茶25元/杯',
            result: 45625,
            reason: '5年共花费'
        },
        option2: {
            action: '喝水/自制饮品',
            result: 0,
            reason: '0成本'
        },
        difference: 45625,
        message: '一杯奶茶的快乐，5年花掉4.5万'
    },
    {
        title: '打车 vs 地铁',
        scenario: '每天通勤',
        option1: {
            action: '打车30元/天',
            result: 54750,
            reason: '5年共花费'
        },
        option2: {
            action: '地铁5元/天',
            result: 9125,
            reason: '5年共花费'
        },
        difference: 45625,
        message: '5年多花4.5万，只为少走几步路'
    },
    {
        title: '换手机 vs 继续用',
        scenario: '手机还能用',
        option1: {
            action: '换新手机8000元',
            result: 8000,
            reason: '一次性支出'
        },
        option2: {
            action: '继续用旧手机',
            result: 10700,
            reason: '8000元投资5年(年化6%)'
        },
        difference: 2700,
        message: '一部手机，让你少赚2700元'
    },
    {
        title: '健身房 vs 居家锻炼',
        scenario: '健身习惯',
        option1: {
            action: '健身房年卡3000元',
            result: 15000,
            reason: '5年花费（平均每年去10次）'
        },
        option2: {
            action: '跑步/居家锻炼',
            result: 0,
            reason: '免费运动'
        },
        difference: 15000,
        message: '办的不是卡，是为冲动买单'
    },
    {
        title: '网购冲动 vs 等待3天',
        scenario: '看到就想买',
        option1: {
            action: '冲动下单500元/月',
            result: 30000,
            reason: '5年冲动消费'
        },
        option2: {
            action: '等待3天再决定',
            result: 6000,
            reason: '5年仅买真正需要的'
        },
        difference: 24000,
        message: '等待3天，让你少花2.4万'
    },
    {
        title: '品牌溢价 vs 平价替代',
        scenario: '日用品消费',
        option1: {
            action: '品牌货200元/月',
            result: 12000,
            reason: '5年品牌溢价'
        },
        option2: {
            action: '平价替代50元/月',
            result: 3000,
            reason: '5年省钱'
        },
        difference: 9000,
        message: '为logo多花9000元，值得吗？'
    }
];

// 核心理念金句
const CORE_MESSAGES = [
    '不要为欲望买单，要为自由储蓄',
    '不要为懒惰买单，要为未来投资',
    '今天的克制，是明天的自由',
    '消费的快乐是暂时的，储蓄的安全感是永恒的',
    '你花的每一分钱，都是未来的选择权',
    '复利不会背叛你，但消费会',
    '延迟满足，是富人思维的核心',
    '省钱不是抠门，是对自己负责'
];
