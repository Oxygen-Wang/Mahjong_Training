/**
 * 记牌训练模块 (memory-trainer.js)
 * 
 * 这个文件实现了"记牌训练"功能
 * 
 * 训练内容：
 * 1. 显示一些已出现的牌（让用户记忆）
 * 2. 用户需要记住每种牌出现了几张
 * 3. 判断剩余牌数（每种牌最多4张，减去出现的数量就是剩余数量）
 * 
 * 训练模式：
 * - 训练模式：可以反复查看牌面，没有时间限制，适合学习
 * - 挑战模式：有时间限制，时间到了会隐藏牌面，测试真实记忆能力
 * 
 * 游戏流程：
 * 1. 配置阶段：选择牌型、难度、记忆时间
 * 2. 记忆阶段：显示已出现的牌，让用户记忆
 * 3. 答题阶段：用户输入每种牌的剩余数量
 * 4. 结果阶段：显示正确答案和得分
 */

// 导入需要的工具函数和组件
import { createTimer, formatTime } from '../utils/timer.js';  // 计时器工具
import { 
  getAllTileTypes,          // 获取所有牌类型
  calculateRemainingTiles,  // 计算剩余牌数
  countTiles,               // 统计牌的数量
  createTile,               // 创建牌对象
  SUITS,                    // 花色常量
  SUIT_NAMES,               // 花色名称
  HONOR_TILES,              // 字牌类型
  HONOR_NAMES               // 字牌名称
} from '../utils/tile-utils.js';
import { createTileElement } from '../components/tile-display.js';  // 牌的显示组件
import { saveScore, getConfig, saveConfig } from '../utils/storage.js';  // 存储工具

/**
 * 难度配置对象
 * 
 * 定义了不同难度级别的参数：
 * - tileCount: 已出现牌的数量范围 [最小值, 最大值]
 *   比如 [10, 15] 表示随机选择 10-15 张牌
 * - memoryTime: 记忆时间范围 [最小值, 最大值]（单位：秒）
 *   比如 [30, 60] 表示随机分配 30-60 秒的记忆时间
 * 
 * 难度越高：
 * - 牌的数量越多（需要记忆更多）
 * - 记忆时间越短（时间压力更大）
 */
const DIFFICULTY_CONFIG = {
  easy: { tileCount: [10, 15], memoryTime: [30, 60] },      // 简单：10-15张牌，30-60秒
  medium: { tileCount: [15, 25], memoryTime: [20, 40] },    // 中等：15-25张牌，20-40秒
  hard: { tileCount: [25, 35], memoryTime: [10, 20] },      // 困难：25-35张牌，10-20秒
  expert: { tileCount: [35, 45], memoryTime: [5, 10] }      // 专家：35-45张牌，5-10秒
};

/**
 * 牌型分组配置
 * 
 * 定义了不同牌型组的中文名称，用于界面显示
 * 比如在显示牌的时候，可以按组分类显示
 */
const TILE_TYPE_GROUPS = {
  wan: { name: '万子牌', types: ['wan'] },      // 万字牌组
  tong: { name: '筒子牌', types: ['tong'] },    // 筒子牌组
  tiao: { name: '条子牌', types: ['tiao'] },    // 条子牌组
  honor: { name: '字牌', types: ['honor'] }     // 字牌组
};

/**
 * 游戏状态对象
 * 
 * 这个对象保存了当前训练的所有状态信息
 * 就像游戏的"记忆"，记录了当前进行到哪里了
 * 
 * 状态字段说明：
 * - mode: 训练模式（'training' 训练模式 / 'challenge' 挑战模式）
 * - selectedTileTypes: 选中的牌型（如 ['wan', 'tong']）
 * - difficulty: 难度级别（'easy', 'medium', 'hard', 'expert'）
 * - memoryTime: 记忆时间（秒）
 * - appearedTiles: 已出现的牌数组（用户需要记忆的牌）
 * - allTileTypes: 所有牌类型数组（用于答题界面）
 * - correctRemaining: 正确答案（每种牌的剩余数量）
 * - userAnswers: 用户的答案（每种牌的剩余数量）
 * - currentPhase: 当前阶段（'config' 配置 / 'memory' 记忆 / 'answer' 答题 / 'result' 结果）
 * - selectedTileIndex: 当前选中的牌索引（用于键盘操作）
 * - timer: 计时器对象
 * - answerStartTime: 开始答题的时间（用于计算用时）
 */
let gameState = {
  mode: 'training',           // 训练模式
  selectedTileTypes: ['wan'], // 选中的牌型，默认只有万子
  difficulty: 'easy',         // 难度级别，默认简单
  memoryTime: 30,             // 记忆时间，默认30秒
  appearedTiles: [],          // 已出现的牌数组
  allTileTypes: [],           // 所有牌类型数组
  correctRemaining: {},       // 正确答案（对象格式，如 {tong1: 2, tong2: 4}）
  userAnswers: {},            // 用户答案（对象格式）
  currentPhase: 'config',     // 当前阶段，默认在配置阶段
  selectedTileIndex: 0,       // 当前选中的牌索引
  timer: null,                // 计时器对象
  answerStartTime: null       // 开始答题的时间戳
};

// 全局变量，用于存储容器元素和键盘事件处理器
let container = null;          // 容器元素（显示内容的区域）
let keyboardHandler = null;    // 键盘事件处理器函数

/**
 * 训练器模块导出对象
 * 
 * 这是模块的默认导出，main.js 会调用这个对象的方法
 * 必须包含 init 方法和可选的 onShow 方法
 */
export default {
  /**
   * 初始化训练器
   * 
   * 这个方法在切换到记牌训练模式时会被调用
   * 负责初始化界面和加载用户保存的配置
   * 
   * @param {HTMLElement} containerElement - 容器元素，训练器的内容会显示在这里
   */
  async init(containerElement) {
    // 保存容器元素到全局变量，方便其他函数使用
    container = containerElement;
    
    // 从本地存储加载用户之前保存的配置
    // getConfig('memory_trainer', {...}) 
    // 第一个参数是配置的键名
    // 第二个参数是默认值（如果之前没有保存过配置，就用这个默认值）
    const savedConfig = getConfig('memory_trainer', {
      mode: 'training',              // 默认训练模式
      selectedTileTypes: ['wan'],    // 默认选择万子
      difficulty: 'easy',            // 默认简单难度
      memoryTime: 30                 // 默认30秒记忆时间
    });
    
    // 把加载的配置应用到游戏状态
    // || 表示"或者"，如果 savedConfig.mode 为空，就用 'training'
    gameState.mode = savedConfig.mode || 'training';
    gameState.selectedTileTypes = savedConfig.selectedTileTypes || ['wan'];
    gameState.difficulty = savedConfig.difficulty || 'easy';
    gameState.memoryTime = savedConfig.memoryTime || 30;
    
    // 显示配置界面
    showConfigPhase();
  },
  
  /**
   * 当训练器显示时的回调函数
   * 
   * 当用户从其他模式切换回记牌训练时，这个方法会被调用
   * 可以用来重新绑定事件、刷新数据等
   */
  onShow() {
    // 如果当前在答题阶段，需要重新绑定键盘事件
    // 因为切换页面后，事件监听器可能会丢失
    if (gameState.currentPhase === 'answer') {
      bindKeyboardEvents();  // 重新绑定键盘事件
    }
  }
};

/**
 * 显示配置阶段
 */
function showConfigPhase() {
  gameState.currentPhase = 'config';
  container.innerHTML = '';
  
  const card = document.createElement('div');
  card.className = 'card memory-config-panel';
  
  card.innerHTML = `
    <h2>记牌训练</h2>
    <p class="subtitle">训练记忆场上已出现的牌，判断剩余牌数</p>
  `;
  
  // 模式选择
  const modeGroup = document.createElement('div');
  modeGroup.className = 'form-group';
  modeGroup.innerHTML = `
    <label class="label">训练模式</label>
    <div class="btn-group">
      <button class="btn btn-toggle ${gameState.mode === 'training' ? 'active' : ''}" data-mode="training">
        训练模式
      </button>
      <button class="btn btn-toggle ${gameState.mode === 'challenge' ? 'active' : ''}" data-mode="challenge">
        挑战模式
      </button>
    </div>
  `;
  
  modeGroup.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      modeGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.mode = btn.dataset.mode;
    });
  });
  
  // 牌型选择
  const tileTypeGroup = document.createElement('div');
  tileTypeGroup.className = 'form-group';
  tileTypeGroup.id = 'tile-type-group';
  
  // 难度选择
  const difficultyGroup = document.createElement('div');
  difficultyGroup.className = 'form-group';
  difficultyGroup.innerHTML = `
    <label class="label">难度级别</label>
    <div class="btn-group">
      <button class="btn btn-toggle ${gameState.difficulty === 'easy' ? 'active' : ''}" data-difficulty="easy">
        简单
      </button>
      <button class="btn btn-toggle ${gameState.difficulty === 'medium' ? 'active' : ''}" data-difficulty="medium">
        中等
      </button>
      <button class="btn btn-toggle ${gameState.difficulty === 'hard' ? 'active' : ''}" data-difficulty="hard">
        困难
      </button>
      <button class="btn btn-toggle ${gameState.difficulty === 'expert' ? 'active' : ''}" data-difficulty="expert">
        专家
      </button>
    </div>
  `;
  
  difficultyGroup.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      difficultyGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.difficulty = btn.dataset.difficulty;
      updateMemoryTime();
    });
  });
  
  // 记忆时间设置
  const timeGroup = document.createElement('div');
  timeGroup.className = 'form-group';
  timeGroup.innerHTML = `
    <label class="label">记忆时间（秒）</label>
    <div class="slider-row">
      <input type="range" id="memory-time-slider" min="5" max="360" value="${gameState.memoryTime}" step="5">
      <span class="slider-value">${gameState.memoryTime}</span>
    </div>
  `;
  
  const slider = timeGroup.querySelector('#memory-time-slider');
  const valueDisplay = timeGroup.querySelector('.slider-value');
  slider.addEventListener('input', () => {
    gameState.memoryTime = parseInt(slider.value);
    valueDisplay.textContent = gameState.memoryTime;
  });
  
  // 开始按钮
  const startBtn = document.createElement('button');
  startBtn.className = 'btn btn-primary';
  startBtn.textContent = '开始训练';
  startBtn.style.marginTop = 'var(--spacing-xl)';
  startBtn.style.marginBottom = 'var(--spacing-md)';
  startBtn.style.width = '100%';
  startBtn.style.padding = 'var(--spacing-md) var(--spacing-lg)';
  startBtn.style.fontSize = '18px';
  startBtn.style.fontWeight = '700';
  startBtn.addEventListener('click', startTraining);
  
  card.appendChild(modeGroup);
  card.appendChild(tileTypeGroup);
  card.appendChild(difficultyGroup);
  card.appendChild(timeGroup);
  card.appendChild(startBtn);
  
  container.appendChild(card);
  
  updateTileTypeSelection();
  updateMemoryTime();
}

/**
 * 更新牌型选择
 */
function updateTileTypeSelection() {
  const tileTypeGroup = document.getElementById('tile-type-group');
  if (!tileTypeGroup) return;
  
  tileTypeGroup.innerHTML = '';
  
  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = '选择牌型';
  tileTypeGroup.appendChild(label);
  
  const checkboxRow = document.createElement('div');
  checkboxRow.className = 'checkbox-row';
  
  const allTypes = ['wan', 'tong', 'tiao', 'honor'];
  const typeLabels = { wan: '万子', tong: '筒子', tiao: '条子', honor: '字牌' };
  
  allTypes.forEach(type => {
    const labelEl = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.checked = gameState.selectedTileTypes.includes(type);
    
    // 更新选择
    checkbox.addEventListener('change', () => {
      const checked = Array.from(checkboxRow.querySelectorAll('input:checked'));
      // 确保至少选择一种牌型
      if (checked.length === 0) {
        checkbox.checked = true;
        return;
      }
      gameState.selectedTileTypes = checked.map(cb => cb.value);
    });
    
    labelEl.appendChild(checkbox);
    labelEl.appendChild(document.createTextNode(` ${typeLabels[type]}`));
    checkboxRow.appendChild(labelEl);
  });
  
  tileTypeGroup.appendChild(checkboxRow);
  
  // 初始化选择：确保至少选择一种牌型
  if (gameState.selectedTileTypes.length === 0) {
    gameState.selectedTileTypes = ['wan'];
    checkboxRow.querySelector('input[value="wan"]').checked = true;
  }
}

/**
 * 更新记忆时间（根据难度）
 */
function updateMemoryTime() {
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  if (config) {
    const [min, max] = config.memoryTime;
    const avg = Math.floor((min + max) / 2);
    gameState.memoryTime = avg;
    
    const slider = document.getElementById('memory-time-slider');
    const valueDisplay = slider?.parentElement.querySelector('.slider-value');
    if (slider) {
      slider.value = avg;
      if (valueDisplay) {
        valueDisplay.textContent = avg;
      }
    }
  }
}

/**
 * 开始训练
 */
function startTraining() {
  try {
    // 保存配置
    saveConfig('memory_trainer', {
      mode: gameState.mode,
      selectedTileTypes: gameState.selectedTileTypes,
      difficulty: gameState.difficulty,
      memoryTime: gameState.memoryTime
    });
    
    // 确定要使用的牌型
    let enabledTypes = [...gameState.selectedTileTypes];
    
    // 确保至少有一种牌型
    if (enabledTypes.length === 0) {
      enabledTypes = ['wan'];
    }
    
    // 获取所有牌类型
    gameState.allTileTypes = getAllTileTypes(enabledTypes);
    
    if (!gameState.allTileTypes || gameState.allTileTypes.length === 0) {
      console.error('无法获取牌类型，enabledTypes:', enabledTypes);
      alert('错误：无法获取牌类型，请检查配置');
      return;
    }
    
    // 生成已出现的牌
    generateAppearedTiles(enabledTypes);
    
    if (!gameState.appearedTiles || gameState.appearedTiles.length === 0) {
      console.error('无法生成已出现的牌');
      alert('错误：无法生成已出现的牌');
      return;
    }
    
    // 计算正确答案
    gameState.correctRemaining = calculateRemainingTiles(enabledTypes, gameState.appearedTiles);
    
    // 重置用户答案（默认每张牌4张）
    gameState.userAnswers = {};
    gameState.allTileTypes.forEach(tile => {
      gameState.userAnswers[tile.id] = 4;
    });
    
    // 显示记忆阶段
    showMemoryPhase();
  } catch (error) {
    console.error('开始训练时出错:', error);
    alert('开始训练时出错: ' + error.message);
  }
}

/**
 * 生成已出现的牌
 */
function generateAppearedTiles(enabledTypes) {
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  const [minCount, maxCount] = config.tileCount;
  const targetCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
  
  // 生成所有可能的牌（每种4张）
  const allTiles = [];
  enabledTypes.forEach(type => {
    if (type === 'honor') {
      HONOR_TILES.forEach(honorTile => {
        for (let i = 0; i < 4; i++) {
          allTiles.push(createTile(SUITS.HONOR, honorTile));
        }
      });
    } else {
      for (let rank = 1; rank <= 9; rank++) {
        for (let i = 0; i < 4; i++) {
          allTiles.push(createTile(type, rank));
        }
      }
    }
  });
  
  // 随机抽取
  const shuffled = [...allTiles].sort(() => Math.random() - 0.5);
  gameState.appearedTiles = shuffled.slice(0, targetCount);
}

/**
 * 显示记忆阶段
 */
function showMemoryPhase() {
  try {
    gameState.currentPhase = 'memory';
    
    if (!container) {
      console.error('容器元素不存在');
      return;
    }
    
    container.innerHTML = '';
    
    const phaseContainer = document.createElement('div');
    phaseContainer.className = 'memory-phase';
    
    // 计时器显示
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer-display';
    timerDisplay.id = 'memory-timer';
    timerDisplay.textContent = formatTime(gameState.memoryTime);
    
    // 提示文字
    const hint = document.createElement('p');
    hint.style.textAlign = 'center';
    hint.style.marginTop = 'var(--spacing-md)';
    hint.style.color = 'var(--text-secondary)';
    hint.textContent = gameState.mode === 'training' 
      ? '训练模式：可以反复查看，无时间限制' 
      : '挑战模式：记忆时间结束后将隐藏牌面';
    
    // 牌显示区域
    const tilesContainer = document.createElement('div');
    tilesContainer.className = 'memory-tiles-grid';
    
    // 按类型分组显示
    const tileCounts = countTiles(gameState.appearedTiles);
    const groupedTiles = {};
    
    gameState.appearedTiles.forEach(tile => {
      const groupKey = tile.suit === SUITS.HONOR ? 'honor' : tile.suit;
      if (!groupedTiles[groupKey]) {
        groupedTiles[groupKey] = [];
      }
      groupedTiles[groupKey].push(tile);
    });
    
    Object.keys(groupedTiles).sort().forEach(groupKey => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'tile-group';
      groupDiv.style.marginBottom = 'var(--spacing-lg)';
      
      const groupTitle = document.createElement('h4');
      groupTitle.textContent = TILE_TYPE_GROUPS[groupKey]?.name || groupKey;
      groupTitle.style.marginBottom = 'var(--spacing-sm)';
      groupTitle.style.color = 'var(--text-secondary)';
      groupTitle.style.fontSize = '15px';
      groupTitle.style.fontWeight = '600';
      
      const tilesRow = document.createElement('div');
      tilesRow.style.display = 'flex';
      tilesRow.style.flexWrap = 'wrap';
      tilesRow.style.gap = 'var(--spacing-sm)';
      
      groupedTiles[groupKey].forEach(tile => {
        const tileEl = createTileElement(tile);
        tilesRow.appendChild(tileEl);
      });
      
      groupDiv.appendChild(groupTitle);
      groupDiv.appendChild(tilesRow);
      tilesContainer.appendChild(groupDiv);
    });
    
    // 准备按钮（训练模式）
    const readyBtn = document.createElement('button');
    readyBtn.className = 'btn btn-primary';
    readyBtn.textContent = '开始答题';
    readyBtn.style.marginTop = 'var(--spacing-lg)';
    readyBtn.style.width = '100%';
    readyBtn.addEventListener('click', () => {
      if (gameState.timer) {
        gameState.timer.stop();
      }
      showAnswerPhase();
    });
    
    phaseContainer.appendChild(timerDisplay);
    phaseContainer.appendChild(hint);
    phaseContainer.appendChild(tilesContainer);
    
    if (gameState.mode === 'training') {
      phaseContainer.appendChild(readyBtn);
    }
  
    container.appendChild(phaseContainer);
    
    // 启动计时器
    if (gameState.mode === 'challenge' || gameState.memoryTime > 0) {
      gameState.timer = createTimer({
        duration: gameState.memoryTime,
        onTick: (remaining) => {
          const timerEl = document.getElementById('memory-timer');
          if (timerEl) {
            timerEl.textContent = formatTime(remaining);
            if (remaining <= 10) {
              timerEl.classList.add('danger');
            } else if (remaining <= gameState.memoryTime * 0.3) {
              timerEl.classList.add('warning');
            }
          }
        },
        onFinish: () => {
          showAnswerPhase();
        }
      });
      gameState.timer.start();
    }
  } catch (error) {
    console.error('显示记忆阶段时出错:', error);
    alert('显示记忆阶段时出错: ' + error.message);
  }
}

/**
 * 显示答题阶段
 */
function showAnswerPhase() {
  gameState.currentPhase = 'answer';
  gameState.selectedTileIndex = 0;
  gameState.answerStartTime = Date.now();
  container.innerHTML = '';
  
  const phaseContainer = document.createElement('div');
  phaseContainer.className = 'answer-phase';
  
  // 进度指示器
  const progressDiv = document.createElement('div');
  progressDiv.className = 'progress-indicator';
  progressDiv.style.textAlign = 'center';
  progressDiv.style.marginBottom = 'var(--spacing-md)';
  progressDiv.style.color = 'var(--text-secondary)';
  progressDiv.id = 'progress-indicator';
  updateProgressIndicator(progressDiv);
  
  // 牌输入区域
  const tilesContainer = document.createElement('div');
  tilesContainer.className = 'tiles-input-container';
  tilesContainer.id = 'tiles-input-container';
  
  // 按类型分组
  const groupedTiles = {};
  gameState.allTileTypes.forEach((tile, index) => {
    const groupKey = tile.suit === SUITS.HONOR ? 'honor' : tile.suit;
    if (!groupedTiles[groupKey]) {
      groupedTiles[groupKey] = [];
    }
    groupedTiles[groupKey].push({ tile, index });
  });
  
  Object.keys(groupedTiles).sort().forEach(groupKey => {
    const groupSection = document.createElement('div');
    groupSection.className = 'tile-group-section';
    
    const groupTitle = document.createElement('h3');
    groupTitle.textContent = TILE_TYPE_GROUPS[groupKey]?.name || groupKey;
    groupTitle.style.marginBottom = 'var(--spacing-md)';
    groupTitle.style.fontSize = '20px';
    groupTitle.style.fontWeight = '700';
    groupTitle.style.color = 'var(--text-primary)';
    
    const tilesGrid = document.createElement('div');
    tilesGrid.className = 'tiles-input-grid';
    tilesGrid.style.display = 'grid';
    tilesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(100px, 1fr))';
    tilesGrid.style.gap = 'var(--spacing-md)';
    
    groupedTiles[groupKey].forEach(({ tile, index }) => {
      const tileItem = createTileInputItem(tile, index);
      tilesGrid.appendChild(tileItem);
    });
    
    groupSection.appendChild(groupTitle);
    groupSection.appendChild(tilesGrid);
    tilesContainer.appendChild(groupSection);
  });
  
  // 提交按钮
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = '提交答案';
  submitBtn.style.marginTop = 'var(--spacing-xl)';
  submitBtn.style.width = '100%';
  submitBtn.style.fontSize = '18px';
  submitBtn.style.padding = 'var(--spacing-md)';
  submitBtn.addEventListener('click', submitAnswer);
  
  phaseContainer.appendChild(progressDiv);
  phaseContainer.appendChild(tilesContainer);
  phaseContainer.appendChild(submitBtn);
  
  container.appendChild(phaseContainer);
  
  // 绑定键盘事件
  bindKeyboardEvents();
  
  // 聚焦第一个牌
  setTimeout(() => {
    const firstItem = document.querySelector('.tile-input-item');
    if (firstItem) {
      firstItem.focus();
      firstItem.classList.add('selected');
    }
  }, 100);
}

/**
 * 创建牌输入项
 */
function createTileInputItem(tile, index) {
  const item = document.createElement('div');
  item.className = 'tile-input-item';
  item.dataset.index = index;
  item.tabIndex = 0;
  
  const count = gameState.userAnswers[tile.id];
  const tileEl = createTileElement(tile, {
    showCount: true,
    count: count !== null ? count : 0
  });
  
  const countDisplay = document.createElement('div');
  countDisplay.className = 'count-display';
  countDisplay.textContent = count !== null ? count : '-';
  countDisplay.style.textAlign = 'center';
  countDisplay.style.marginTop = 'var(--spacing-xs)';
  countDisplay.style.fontSize = '24px';
  countDisplay.style.fontWeight = '700';
  countDisplay.style.color = count !== null ? 'var(--system-blue)' : 'var(--text-tertiary)';
  
  item.appendChild(tileEl);
  item.appendChild(countDisplay);
  
  // 鼠标事件
  item.addEventListener('click', (e) => {
    e.preventDefault();
    selectTile(index);
    incrementCount(index);
  });
  
  item.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    selectTile(index);
    decrementCount(index);
  });
  
  // 键盘焦点
  item.addEventListener('focus', () => {
    selectTile(index);
  });
  
  return item;
}

/**
 * 选择牌
 */
function selectTile(index) {
  const items = document.querySelectorAll('.tile-input-item');
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === index);
  });
  gameState.selectedTileIndex = index;
}

/**
 * 增加数量
 */
function incrementCount(index) {
  const tile = gameState.allTileTypes[index];
  const current = gameState.userAnswers[tile.id] ?? 4;
  const next = (current + 1) % 5; // 0-4循环
  gameState.userAnswers[tile.id] = next;
  updateTileInputItem(index);
  updateProgressIndicator();
}

/**
 * 减少数量
 */
function decrementCount(index) {
  const tile = gameState.allTileTypes[index];
  const current = gameState.userAnswers[tile.id] ?? 4;
  const next = current === 0 ? 4 : current - 1;
  gameState.userAnswers[tile.id] = next;
  updateTileInputItem(index);
  updateProgressIndicator();
}

/**
 * 更新牌输入项显示
 */
function updateTileInputItem(index) {
  const item = document.querySelector(`.tile-input-item[data-index="${index}"]`);
  if (!item) return;
  
  const tile = gameState.allTileTypes[index];
  const count = gameState.userAnswers[tile.id];
  const countDisplay = item.querySelector('.count-display');
  
  if (countDisplay) {
    countDisplay.textContent = count !== null ? count : '-';
    countDisplay.style.color = count !== null ? 'var(--system-blue)' : 'var(--text-tertiary)';
  }
  
  const tileEl = item.querySelector('.tile');
  if (tileEl) {
    tileEl.classList.toggle('filled', count !== null && count > 0);
    tileEl.classList.toggle('unfilled', count === null || count === 0);
    
    // 更新或创建 count badge
    let badge = tileEl.querySelector('.count-badge');
    if (count !== null && count > 0) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'count-badge';
        tileEl.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
}

/**
 * 更新进度指示器
 */
function updateProgressIndicator(element = null) {
  const progressEl = element || document.getElementById('progress-indicator');
  if (!progressEl) return;
  
  const total = gameState.allTileTypes.length;
  const filled = Object.values(gameState.userAnswers).filter(v => v !== null).length;
  
  progressEl.textContent = `已填写 ${filled} / ${total}`;
}

/**
 * 绑定键盘事件
 */
function bindKeyboardEvents() {
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
  }
  
  keyboardHandler = (e) => {
    if (gameState.currentPhase !== 'answer') return;
    
    const items = document.querySelectorAll('.tile-input-item');
    const currentIndex = gameState.selectedTileIndex;
    
    switch(e.key) {
      case 'Tab':
        e.preventDefault();
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + items.length) % items.length
          : (currentIndex + 1) % items.length;
        selectTile(nextIndex);
        items[nextIndex]?.focus();
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const next = (currentIndex + 1) % items.length;
        selectTile(next);
        items[next]?.focus();
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prev = (currentIndex - 1 + items.length) % items.length;
        selectTile(prev);
        items[prev]?.focus();
        break;
        
      case 'Enter':
        e.preventDefault();
        submitAnswer();
        break;
        
      case 'Escape':
        e.preventDefault();
        if (currentIndex >= 0) {
          const tile = gameState.allTileTypes[currentIndex];
          gameState.userAnswers[tile.id] = 0;
          updateTileInputItem(currentIndex);
          updateProgressIndicator();
        }
        break;
        
      case 'Backspace':
        e.preventDefault();
        if (currentIndex >= 0) {
          const tile = gameState.allTileTypes[currentIndex];
          gameState.userAnswers[tile.id] = null;
          updateTileInputItem(currentIndex);
          updateProgressIndicator();
        }
        break;
        
      default:
        // 数字键 0-9
        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          if (currentIndex >= 0) {
            const tile = gameState.allTileTypes[currentIndex];
            const num = parseInt(e.key);
            gameState.userAnswers[tile.id] = num > 4 ? 4 : num;
            updateTileInputItem(currentIndex);
            updateProgressIndicator();
            
            // 自动移动到下一个
            setTimeout(() => {
              const next = (currentIndex + 1) % items.length;
              selectTile(next);
              items[next]?.focus();
            }, 100);
          }
        }
        break;
    }
  };
  
  document.addEventListener('keydown', keyboardHandler);
}

/**
 * 提交答案
 */
function submitAnswer() {
  const answerTime = Math.floor((Date.now() - gameState.answerStartTime) / 1000);
  
  // 计算得分
  const result = calculateScore(answerTime);
  
  // 保存成绩
  saveScore('memory', {
    score: result.totalScore,
    time: answerTime,
    difficulty: gameState.difficulty,
    config: {
      mode: gameState.mode,
      selectedTileTypes: gameState.selectedTileTypes
    }
  });
  
  // 显示结果
  showResultPhase(result);
}

/**
 * 计算得分
 */
function calculateScore(answerTime) {
  const total = gameState.allTileTypes.length;
  let correct = 0;
  const details = [];
  
  gameState.allTileTypes.forEach(tile => {
    const correctCount = gameState.correctRemaining[tile.id] || 0;
    const userCount = gameState.userAnswers[tile.id] ?? null;
    const isCorrect = userCount === correctCount;
    
    if (isCorrect) {
      correct++;
    }
    
    details.push({
      tile,
      correct: correctCount,
      user: userCount,
      isCorrect
    });
  });
  
  const accuracy = (correct / total) * 100;
  let baseScore = Math.round(accuracy);
  
  // 时间奖励（仅挑战模式）
  let timeBonus = 0;
  if (gameState.mode === 'challenge' && answerTime < 60) {
    timeBonus = Math.max(0, (60 - answerTime) * 0.5);
  }
  
  const totalScore = Math.min(100, Math.round(baseScore + timeBonus));
  
  return {
    total,
    correct,
    accuracy,
    baseScore,
    timeBonus,
    totalScore,
    details,
    answerTime
  };
}

/**
 * 显示结果阶段
 */
function showResultPhase(result) {
  gameState.currentPhase = 'result';
  
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
  
  container.innerHTML = '';
  
  const resultContainer = document.createElement('div');
  resultContainer.className = 'result-container';
  
  // 得分摘要
  const summary = document.createElement('div');
  summary.className = 'result-summary';
  summary.innerHTML = `
    <h3>训练完成</h3>
    <div class="score">${result.totalScore}</div>
    <div style="font-size: 18px; margin-top: var(--spacing-sm);">
      准确率: ${result.accuracy.toFixed(1)}% (${result.correct}/${result.total})
    </div>
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9;">
      用时: ${formatTime(result.answerTime)}
    </div>
  `;
  
  // 详细对比
  const detailSection = document.createElement('div');
  detailSection.className = 'result-detail';
  
  const detailTitle = document.createElement('h4');
  detailTitle.textContent = '详细对比';
  detailTitle.style.marginBottom = 'var(--spacing-md)';
  
  const comparisonTable = document.createElement('div');
  comparisonTable.className = 'result-comparison';
  
  // 按类型分组显示
  const groupedDetails = {};
  result.details.forEach(detail => {
    const groupKey = detail.tile.suit === SUITS.HONOR ? 'honor' : detail.tile.suit;
    if (!groupedDetails[groupKey]) {
      groupedDetails[groupKey] = [];
    }
    groupedDetails[groupKey].push(detail);
  });
  
  Object.keys(groupedDetails).sort().forEach(groupKey => {
    const groupDiv = document.createElement('div');
    groupDiv.style.marginBottom = 'var(--spacing-lg)';
    
    const groupTitle = document.createElement('h5');
    groupTitle.textContent = TILE_TYPE_GROUPS[groupKey]?.name || groupKey;
    groupTitle.style.marginBottom = 'var(--spacing-sm)';
    groupTitle.style.fontSize = '16px';
    groupTitle.style.fontWeight = '600';
    groupTitle.style.color = 'var(--text-secondary)';
    
    const itemsList = document.createElement('div');
    itemsList.style.display = 'grid';
    itemsList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    itemsList.style.gap = 'var(--spacing-sm)';
    
    groupedDetails[groupKey].forEach(detail => {
      const item = document.createElement('div');
      item.className = 'comparison-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = 'var(--spacing-sm)';
      item.style.padding = 'var(--spacing-sm)';
      item.style.borderRadius = 'var(--radius-sm)';
      item.style.backgroundColor = detail.isCorrect 
        ? 'rgba(52, 199, 89, 0.1)' 
        : 'rgba(255, 59, 48, 0.1)';
      
      const tileEl = createTileElement(detail.tile, { showCount: false });
      tileEl.style.width = '40px';
      tileEl.style.height = '56px';
      
      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `
        <div style="font-size: 14px; font-weight: 600;">
          ${detail.tile.suit === SUITS.HONOR ? HONOR_NAMES[detail.tile.rank] : `${detail.tile.rank}${SUIT_NAMES[detail.tile.suit]}`}
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          正确答案: ${detail.correct} | 您的答案: ${detail.user !== null ? detail.user : '-'}
        </div>
      `;
      
      const status = document.createElement('div');
      status.textContent = detail.isCorrect ? '✓' : '✗';
      status.style.fontSize = '20px';
      status.style.fontWeight = '700';
      status.style.color = detail.isCorrect ? 'var(--system-green)' : 'var(--system-red)';
      
      item.appendChild(tileEl);
      item.appendChild(info);
      item.appendChild(status);
      itemsList.appendChild(item);
    });
    
    groupDiv.appendChild(groupTitle);
    groupDiv.appendChild(itemsList);
    comparisonTable.appendChild(groupDiv);
  });
  
  detailSection.appendChild(detailTitle);
  detailSection.appendChild(comparisonTable);
  
  // 操作按钮
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = 'var(--spacing-md)';
  actions.style.marginTop = 'var(--spacing-xl)';
  
  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn btn-secondary';
  restartBtn.textContent = '再来一次';
  restartBtn.style.flex = '1';
  restartBtn.addEventListener('click', () => {
    startTraining();
  });
  
  const configBtn = document.createElement('button');
  configBtn.className = 'btn btn-primary';
  configBtn.textContent = '返回设置';
  configBtn.style.flex = '1';
  configBtn.addEventListener('click', () => {
    showConfigPhase();
  });
  
  actions.appendChild(restartBtn);
  actions.appendChild(configBtn);
  
  resultContainer.appendChild(summary);
  resultContainer.appendChild(detailSection);
  resultContainer.appendChild(actions);
  
  container.appendChild(resultContainer);
}
