/**
 * 主入口文件 (main.js)
 * 
 * 这个文件是整个麻将训练应用的"大脑"和"调度中心"
 * 
 * 主要功能：
 * 1. 管理所有训练模式的配置（记牌、听牌、何切等）
 * 2. 处理页面之间的切换（就像切换不同的房间）
 * 3. 加载和初始化各个训练模块
 * 4. 保持全局状态（当前在哪个模式、哪些模块已加载）
 */

// 从计时器工具文件中导入 formatTime 函数，用于格式化时间显示
// formatTime 可以把秒数转换成 "MM:SS" 格式，比如 65 秒显示为 "01:05"
import { formatTime } from './utils/timer.js';

/**
 * 训练模式配置对象
 * 
 * 这个对象定义了所有可用的训练模式，每个模式包括：
 * - name: 显示给用户看的名称（如"记牌训练"）
 * - sectionId: 页面上对应的区域ID（HTML元素的id属性）
 * - module: 训练器的文件路径（按需加载）
 * 
 * 就像一本菜单，列出了所有可以选择的训练项目
 */
const TRAINING_MODES = {
  home: {
    name: '首页',
    sectionId: 'home-section'
  },
  memory: {
    name: '记牌训练',
    sectionId: 'memory-section',
    module: './trainers/memory-trainer.js'
  },
  tenpai: {
    name: '听牌训练',
    sectionId: 'tenpai-section',
    module: './trainers/tenpai-trainer.js'
  },
  heqie: {
    name: '何切训练',
    sectionId: 'heqie-section',
    module: './trainers/heqie-trainer.js'
  },
  shanten: {
    name: '向听数训练',
    sectionId: 'shanten-section',
    module: './trainers/shanten-trainer.js'
  },
  'one-shanten': {
    name: '一向听训练',
    sectionId: 'one-shanten-section',
    module: './trainers/one-shanten-trainer.js'
  },
  analysis: {
    name: '牌型分析',
    sectionId: 'analysis-section',
    module: './trainers/analysis.js'
  },
  match: {
    name: '连连看',
    sectionId: 'match-section',
    module: './trainers/match-trainer.js'
  }
};

/**
 * 全局应用状态对象
 * 
 * 用来记住应用当前的"状态"，就像人的记忆一样
 * - currentMode: 当前显示哪个模式（默认是'home'首页）
 * - trainers: 已经加载过的训练器（避免重复加载，提高性能）
 *   格式：{ 'memory': memoryTrainer对象, 'tenpai': tenpaiTrainer对象, ... }
 */
const appState = {
  currentMode: 'home',  // 当前模式，'home'表示在首页
  trainers: {} // 已加载的训练器实例，用对象存储，键是模式名，值是训练器对象
};

/**
 * 切换训练模式函数
 * 
 * 这是应用的核心函数，负责切换到不同的训练模式
 * 就像换电视频道一样，切换到不同的训练内容
 * 
 * @param {string} mode - 要切换到的模式名称（如 'memory', 'tenpai' 等）
 * 
 * 工作原理：
 * 1. 检查模式是否存在
 * 2. 更新导航按钮的高亮状态（让用户知道当前在哪个模式）
 * 3. 隐藏所有内容区域，显示目标区域
 * 4. 如果训练器还没加载，就去加载它（懒加载，需要时才加载）
 * 5. 初始化训练器
 */
async function switchMode(mode) {
  // 第一步：检查这个模式是否在配置中存在
  // 如果不存在，打印错误信息并退出
  if (!TRAINING_MODES[mode]) {
    console.error(`Unknown mode: ${mode}`);  // 在控制台输出错误
    return;  // 停止执行
  }
  
  // 第二步：更新导航按钮的视觉效果
  // 找到所有导航按钮，移除'active'类（去掉高亮），然后给当前模式的按钮加上'active'类（加上高亮）
  // querySelectorAll('.nav-btn') 找到所有class包含'nav-btn'的按钮
  // forEach 是遍历数组的方法，对每个按钮执行操作
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');  // 移除高亮样式
    // 检查这个按钮是否对应我们要切换到的模式
    if (btn.dataset.mode === mode) {  // dataset.mode 是按钮上 data-mode 属性的值
      btn.classList.add('active');  // 添加高亮样式
    }
  });
  
  // 第三步：更新内容区域的显示
  // 隐藏所有内容区域（移除'active'类），然后显示目标区域（添加'active'类）
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');  // 隐藏所有区域
  });
  
  // 找到目标内容区域并显示它
  const targetSection = document.getElementById(TRAINING_MODES[mode].sectionId);
  if (targetSection) {
    targetSection.classList.add('active');  // 显示目标区域
  }
  
  // 第四步：加载训练器模块（如果需要）
  // 只有当：1. 这个模式有对应的模块文件 2. 这个模块还没加载过 的时候才加载
  if (TRAINING_MODES[mode].module && !appState.trainers[mode]) {
    try {
      // 使用动态导入（import）加载训练器模块
      // await 表示等待加载完成，async/await 用于处理异步操作
      const module = await import(TRAINING_MODES[mode].module);
      
      // 检查模块是否导出默认对象，并且有 init 方法
      // module.default 是 ES6 模块的默认导出
      // typeof ... === 'function' 检查是否是函数
      if (module.default && typeof module.default.init === 'function') {
        // 保存到全局状态，避免重复加载
        appState.trainers[mode] = module.default;
        // 调用训练器的初始化方法，传入目标区域元素
        await module.default.init(targetSection);
      }
    } catch (error) {
      // 如果加载失败，在控制台输出错误，并显示占位内容
      console.error(`Failed to load trainer module for ${mode}:`, error);
      
      // 显示占位内容，告诉用户这个模块正在开发中
      if (targetSection) {
        targetSection.innerHTML = `
          <div class="card">
            <h2>${TRAINING_MODES[mode].name}</h2>
            <p>该训练模块正在开发中，敬请期待...</p>
          </div>
        `;
      }
    }
  } else if (appState.trainers[mode] && typeof appState.trainers[mode].onShow === 'function') {
    // 如果训练器已经加载过，不需要重新初始化，只需调用 onShow 方法
    // onShow 用于处理模式重新显示时的逻辑（比如重新绑定事件）
    appState.trainers[mode].onShow();
  }
  
  // 第五步：更新全局状态，记住当前模式
  appState.currentMode = mode;
}

/**
 * 初始化应用函数
 * 
 * 这是应用的启动函数，在页面加载完成后执行
 * 主要做三件事：
 * 1. 给导航按钮绑定点击事件（点击后切换模式）
 * 2. 给首页的训练卡片绑定点击事件（点击后进入对应训练）
 * 3. 显示首页
 */
function initApp() {
  // 第一步：绑定导航按钮的点击事件
  // 找到所有导航按钮，给每个按钮添加点击监听器
  // 当用户点击按钮时，切换到对应的模式
  document.querySelectorAll('.nav-btn').forEach(btn => {
    // addEventListener 给元素添加事件监听器
    // 'click' 是事件类型，第二个参数是回调函数（点击时执行的代码）
    btn.addEventListener('click', () => {
      // 从按钮的 data-mode 属性获取模式名称
      const mode = btn.dataset.mode;
      // 如果有模式名称，就切换到该模式
      if (mode) {
        switchMode(mode);
      }
    });
  });
  
  // 第二步：绑定首页训练卡片的点击事件
  // 首页可能有多个训练卡片，每个卡片对应一个训练模式
  // 点击卡片后，直接进入对应的训练模式
  document.querySelectorAll('.trainer-card').forEach(card => {
    card.addEventListener('click', () => {
      // 从卡片的 data-mode 属性获取模式名称
      const mode = card.dataset.mode;
      if (mode) {
        switchMode(mode);  // 切换到对应模式
      }
    });
  });
  
  // 第三步：初始化并显示首页
  // 默认显示首页，让用户看到所有可用的训练选项
  switchMode('home');
  
  // 在控制台输出初始化成功的信息（开发者调试用）
  console.log('Mahjong Trainer App initialized');
}

/**
 * 页面加载完成后的初始化逻辑
 * 
 * 这里使用了两种方式确保页面加载完成后再初始化：
 * 1. 如果页面还在加载中（readyState === 'loading'），等待 DOMContentLoaded 事件
 * 2. 如果页面已经加载完成，直接执行初始化
 * 
 * 为什么要这样？因为如果在页面还没加载完时操作DOM元素会出错
 */
if (document.readyState === 'loading') {
  // 页面还在加载，等待 DOM 内容加载完成的事件
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // 页面已经加载完成，直接执行初始化
  initApp();
}

/**
 * 导出函数和变量供其他模块使用
 * 
 * 在 JavaScript 模块系统中，使用 export 导出内容，其他文件可以用 import 导入
 * - switchMode: 切换模式的函数，其他模块可能需要切换模式
 * - appState: 全局状态对象，其他模块可能需要读取或修改状态
 * - TRAINING_MODES: 训练模式配置，其他模块可能需要查看配置信息
 */
export { switchMode, appState, TRAINING_MODES };

