/**
 * 听牌训练模块 (tenpai-trainer.js)
 * 
 * 这个文件实现了"听牌训练"功能
 * 
 * 什么是听牌？
 * - 听牌是麻将术语，指手牌只差一张牌就能和牌的状态
 * - 比如你有 1万2万，听牌就是等待 3万（或者听 3万，等待 1万或2万）
 * 
 * 训练内容：
 * 1. 显示一副听牌手牌（7张、10张或13张）
 * 2. 用户需要识别出哪些牌是"待牌"（能和的牌）
 * 3. 检查答案是否正确
 * 
 * 训练模式：
 * - 训练模式：答错后显示详细解析，适合学习
 * - 挑战模式：连续答题，答对直接下一题，答错显示答案
 * 
 * 难度说明：
 * - 简单：主要是两面听、单骑听
 * - 中等：包含嵌张听、边张听、双碰听
 * - 困难：包含三面听
 * - 专家：主要是多面听和复杂听牌
 */

import { createTimer, formatTime } from '../utils/timer.js';
import { 
  createTile,
  SUITS,
  SUIT_NAMES,
  HONOR_TILES,
  HONOR_NAMES,
  getAllTileTypes,
  tilesEqual
} from '../utils/tile-utils.js';
import { createTileElement } from '../components/tile-display.js';
import { saveScore, getConfig, saveConfig } from '../utils/storage.js';
import { detectTenpai, detectTenpai7Or10, generateTenpaiHand, getTenpaiType } from '../utils/tenpai-utils.js';

// 游戏状态
let gameState = {
  mode: 'training',
  tileCount: 13,
  difficulty: 'easy',
  currentPhase: 'config',
  hand: [],
  waitingTiles: [],
  userSelectedTiles: [],
  tenpaiType: null,
  startTime: null,
  timer: null,
  // 连续答题模式
  totalScore: 0,
  correctCount: 0,
  wrongCount: 0,
  consecutiveCorrect: 0,
  isContinuousMode: false
};

let container = null;
let keyboardHandler = null;

/**
 * 初始化训练器
 */
export default {
  async init(containerElement) {
    container = containerElement;
    
    // 加载保存的配置
    const savedConfig = getConfig('tenpai_trainer', {
      mode: 'training',
      tileCount: 13,
      difficulty: 'easy'
    });
    
    gameState.mode = savedConfig.mode || 'training';
    gameState.tileCount = savedConfig.tileCount || 13;
    gameState.difficulty = savedConfig.difficulty || 'easy';
    
    showConfigPhase();
  },
  
  onShow() {
    // 显示时的回调
    if (gameState.currentPhase === 'training') {
      // 重新绑定键盘事件
      bindKeyboardEvents();
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
  card.className = 'card tenpai-config-panel';
  
  card.innerHTML = `
    <h2>听牌训练</h2>
    <p class="subtitle">快速识别听牌形态和待牌</p>
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
  
  // 牌数选择
  const tileCountGroup = document.createElement('div');
  tileCountGroup.className = 'form-group';
  tileCountGroup.innerHTML = `
    <label class="label">牌数选择</label>
    <div class="btn-group">
      <button class="btn btn-toggle ${gameState.tileCount === 7 ? 'active' : ''}" data-count="7">
        7张
      </button>
      <button class="btn btn-toggle ${gameState.tileCount === 10 ? 'active' : ''}" data-count="10">
        10张
      </button>
      <button class="btn btn-toggle ${gameState.tileCount === 13 ? 'active' : ''}" data-count="13">
        13张
      </button>
    </div>
  `;
  
  tileCountGroup.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      tileCountGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gameState.tileCount = parseInt(btn.dataset.count);
    });
  });
  
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
    });
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
  card.appendChild(tileCountGroup);
  card.appendChild(difficultyGroup);
  card.appendChild(startBtn);
  
  container.appendChild(card);
}

/**
 * 开始训练
 */
function startTraining() {
  try {
    // 保存配置
    saveConfig('tenpai_trainer', {
      mode: gameState.mode,
      tileCount: gameState.tileCount,
      difficulty: gameState.difficulty
    });
    
    // 生成听牌手牌
    let result;
    try {
      result = generateTenpaiHand(gameState.tileCount, gameState.difficulty);
    } catch (error) {
      console.error('生成听牌手牌失败:', error);
      alert(error.message || '生成听牌手牌失败，请重试');
      return;
    }
    
    if (!result || !result.hand) {
      alert('生成听牌手牌失败，请重试');
      return;
    }
    
    // 验证生成的牌是否真的听牌
    // 根据牌数选择使用不同的检测函数
    let detectResult;
    if (gameState.tileCount === 7 || gameState.tileCount === 10) {
      detectResult = detectTenpai7Or10(result.hand, gameState.tileCount);
    } else {
      detectResult = detectTenpai(result.hand);
    }
    
    if (!detectResult.isTenpai) {
      alert('生成的手牌不是听牌，请重试');
      return;
    }
    
    gameState.hand = result.hand;
    gameState.waitingTiles = detectResult.waitingTiles;
    gameState.tenpaiType = detectResult.tenpaiType;
    
    gameState.userSelectedTiles = [];
    gameState.startTime = Date.now();
    
    // 显示训练阶段
    showTrainingPhase();
  } catch (error) {
    console.error('开始训练时出错:', error);
    alert('开始训练时出错: ' + error.message);
  }
}

/**
 * 更新得分显示
 */
function updateScoreDisplay() {
  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-md); background: var(--background-primary); border-radius: var(--radius-md); margin-bottom: var(--spacing-md);">
        <div>
          <div style="font-size: 14px; color: var(--text-secondary);">总分</div>
          <div style="font-size: 24px; font-weight: 700; color: var(--system-blue);">${gameState.totalScore}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 14px; color: var(--text-secondary);">正确</div>
          <div style="font-size: 20px; font-weight: 600; color: var(--system-green);">${gameState.correctCount}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 14px; color: var(--text-secondary);">错误</div>
          <div style="font-size: 20px; font-weight: 600; color: var(--system-red);">${gameState.wrongCount}</div>
        </div>
        ${gameState.consecutiveCorrect > 0 ? `
        <div style="text-align: center;">
          <div style="font-size: 14px; color: var(--text-secondary);">连对</div>
          <div style="font-size: 20px; font-weight: 600; color: var(--system-orange);">${gameState.consecutiveCorrect}</div>
        </div>
        ` : ''}
      </div>
    `;
  }
}

/**
 * 显示训练阶段
 */
function showTrainingPhase() {
  gameState.currentPhase = 'training';
  container.innerHTML = '';
  
  const phaseContainer = document.createElement('div');
  phaseContainer.className = 'tenpai-training-phase';
  
  // 得分显示区域（连续答题模式）
  if (gameState.isContinuousMode || gameState.totalScore > 0) {
    const scoreSection = document.createElement('div');
    scoreSection.id = 'score-display';
    phaseContainer.appendChild(scoreSection);
    updateScoreDisplay();
  }
  
  // 手牌显示区域
  const handSection = document.createElement('div');
  handSection.className = 'tenpai-hand-section';
  
  const handTitle = document.createElement('h3');
  handTitle.textContent = '手牌';
  handTitle.style.marginBottom = 'var(--spacing-md)';
  handTitle.style.fontSize = '20px';
  handTitle.style.fontWeight = '700';
  
  const handDisplay = document.createElement('div');
  handDisplay.className = 'tenpai-hand-display';
  handDisplay.style.display = 'flex';
  handDisplay.style.flexWrap = 'wrap';
  handDisplay.style.gap = 'var(--spacing-sm)';
  handDisplay.style.justifyContent = 'center';
  handDisplay.style.marginBottom = 'var(--spacing-xl)';
  
  // 排序手牌以便显示
  const sortedHand = [...gameState.hand].sort((a, b) => {
    if (a.suit !== b.suit) {
      const suitOrder = { [SUITS.WAN]: 1, [SUITS.TONG]: 2, [SUITS.TIAO]: 3, [SUITS.HONOR]: 4 };
      return (suitOrder[a.suit] || 99) - (suitOrder[b.suit] || 99);
    }
    if (a.suit === SUITS.HONOR) {
      const honorOrder = HONOR_TILES.indexOf(a.rank) - HONOR_TILES.indexOf(b.rank);
      return honorOrder;
    }
    return a.rank - b.rank;
  });
  
  sortedHand.forEach(tile => {
    const tileEl = createTileElement(tile);
    handDisplay.appendChild(tileEl);
  });
  
  handSection.appendChild(handTitle);
  handSection.appendChild(handDisplay);
  
  // 待选牌区域
  const waitingSection = document.createElement('div');
  waitingSection.className = 'waiting-tiles-section';
  
  const waitingTitle = document.createElement('h3');
  waitingTitle.textContent = '选择待牌（可多选）';
  waitingTitle.style.marginBottom = 'var(--spacing-md)';
  waitingTitle.style.fontSize = '20px';
  waitingTitle.style.fontWeight = '700';
  
  const waitingGrid = document.createElement('div');
  waitingGrid.className = 'waiting-tiles-grid';
  waitingGrid.id = 'waiting-tiles-grid';
  waitingGrid.style.display = 'flex';
  waitingGrid.style.flexWrap = 'nowrap';
  waitingGrid.style.gap = 'var(--spacing-sm)';
  waitingGrid.style.justifyContent = 'center';
  waitingGrid.style.alignItems = 'center';
  waitingGrid.style.overflowX = 'auto';
  waitingGrid.style.padding = 'var(--spacing-md)';
  
  // 只显示手牌中出现的花色的1-9
  const suitsInHand = new Set(gameState.hand.map(t => t.suit).filter(s => s !== SUITS.HONOR));
  const tilesToShow = [];
  
  // 只取第一个花色（清一色，只有一个花色）
  const suit = Array.from(suitsInHand)[0] || SUITS.WAN;
  
  // 按1-9排列成一排
  for (let rank = 1; rank <= 9; rank++) {
    const tile = createTile(suit, rank);
    tilesToShow.push(tile);
  }
  
  tilesToShow.forEach(tile => {
    const tileItem = createWaitingTileItem(tile);
    waitingGrid.appendChild(tileItem);
  });
  
  waitingSection.appendChild(waitingTitle);
  waitingSection.appendChild(waitingGrid);
  
  // 提交按钮
  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = '提交答案';
  submitBtn.style.marginTop = 'var(--spacing-xl)';
  submitBtn.style.width = '100%';
  submitBtn.style.fontSize = '18px';
  submitBtn.style.padding = 'var(--spacing-md)';
  submitBtn.addEventListener('click', submitAnswer);
  
  // 结束训练按钮（连续答题模式）
  if (gameState.isContinuousMode || gameState.totalScore > 0) {
    const endBtn = document.createElement('button');
    endBtn.className = 'btn btn-secondary';
    endBtn.textContent = '结束训练';
    endBtn.style.marginTop = 'var(--spacing-md)';
    endBtn.style.width = '100%';
    endBtn.style.fontSize = '16px';
    endBtn.style.padding = 'var(--spacing-sm)';
    endBtn.addEventListener('click', () => {
      endTraining();
    });
    phaseContainer.appendChild(endBtn);
  }
  
  phaseContainer.appendChild(handSection);
  phaseContainer.appendChild(waitingSection);
  phaseContainer.appendChild(submitBtn);
  
  container.appendChild(phaseContainer);
  
  // 绑定键盘事件
  bindKeyboardEvents();
}

/**
 * 结束训练
 */
function endTraining() {
  if (gameState.totalScore > 0 || gameState.correctCount > 0 || gameState.wrongCount > 0) {
    // 显示最终成绩
    showFinalResult();
  } else {
    // 返回配置
    showConfigPhase();
  }
}

/**
 * 显示最终成绩
 */
function showFinalResult() {
  gameState.currentPhase = 'result';
  gameState.isContinuousMode = false;
  
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
  
  container.innerHTML = '';
  
  const resultContainer = document.createElement('div');
  resultContainer.className = 'result-container';
  
  // 最终成绩摘要
  const summary = document.createElement('div');
  summary.className = 'result-summary';
  summary.innerHTML = `
    <h3>训练结束</h3>
    <div class="score">${gameState.totalScore}</div>
    <div style="font-size: 18px; margin-top: var(--spacing-sm);">
      正确: ${gameState.correctCount} | 错误: ${gameState.wrongCount}
    </div>
    ${gameState.correctCount + gameState.wrongCount > 0 ? `
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9;">
      准确率: ${((gameState.correctCount / (gameState.correctCount + gameState.wrongCount)) * 100).toFixed(1)}%
    </div>
    ` : ''}
    ${gameState.consecutiveCorrect > 0 ? `
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9; color: var(--system-orange);">
      最高连对: ${gameState.consecutiveCorrect}
    </div>
    ` : ''}
  `;
  
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
    // 重置状态
    gameState.totalScore = 0;
    gameState.correctCount = 0;
    gameState.wrongCount = 0;
    gameState.consecutiveCorrect = 0;
    gameState.isContinuousMode = false;
    startTraining();
  });
  
  const configBtn = document.createElement('button');
  configBtn.className = 'btn btn-primary';
  configBtn.textContent = '返回设置';
  configBtn.style.flex = '1';
  configBtn.addEventListener('click', () => {
    // 重置状态
    gameState.totalScore = 0;
    gameState.correctCount = 0;
    gameState.wrongCount = 0;
    gameState.consecutiveCorrect = 0;
    gameState.isContinuousMode = false;
    showConfigPhase();
  });
  
  actions.appendChild(restartBtn);
  actions.appendChild(configBtn);
  
  resultContainer.appendChild(summary);
  resultContainer.appendChild(actions);
  
  container.appendChild(resultContainer);
}

/**
 * 获取所有可能的牌（用于待选区域）
 */
function getAllPossibleTiles() {
  const tiles = [];
  const suits = new Set();
  
  // 从手牌中获取所有出现的花色
  gameState.hand.forEach(tile => {
    suits.add(tile.suit);
  });
  
  // 为每个花色生成所有可能的牌
  suits.forEach(suit => {
    if (suit === SUITS.HONOR) {
      HONOR_TILES.forEach(honor => {
        tiles.push(createTile(SUITS.HONOR, honor));
      });
    } else {
      for (let rank = 1; rank <= 9; rank++) {
        tiles.push(createTile(suit, rank));
      }
    }
  });
  
  // 去重
  const uniqueTiles = [];
  const seenIds = new Set();
  tiles.forEach(tile => {
    if (!seenIds.has(tile.id)) {
      seenIds.add(tile.id);
      uniqueTiles.push(tile);
    }
  });
  
  // 排序
  uniqueTiles.sort((a, b) => {
    if (a.suit !== b.suit) {
      const suitOrder = { [SUITS.WAN]: 1, [SUITS.TONG]: 2, [SUITS.TIAO]: 3, [SUITS.HONOR]: 4 };
      return (suitOrder[a.suit] || 99) - (suitOrder[b.suit] || 99);
    }
    if (a.suit === SUITS.HONOR) {
      return HONOR_TILES.indexOf(a.rank) - HONOR_TILES.indexOf(b.rank);
    }
    return a.rank - b.rank;
  });
  
  return uniqueTiles;
}

/**
 * 创建待选牌项
 */
function createWaitingTileItem(tile) {
  const item = document.createElement('div');
  item.className = 'waiting-tile-item';
  item.dataset.tileId = tile.id;
  
  const isSelected = gameState.userSelectedTiles.some(t => tilesEqual(t, tile));
  if (isSelected) {
    item.classList.add('selected');
  }
  
  const tileEl = createTileElement(tile);
  tileEl.style.opacity = isSelected ? '1' : '0.5';
  item.appendChild(tileEl);
  
  item.addEventListener('click', () => {
    toggleTileSelection(tile, item);
  });
  
  return item;
}

/**
 * 切换牌的选择状态
 */
function toggleTileSelection(tile, itemElement) {
  const index = gameState.userSelectedTiles.findIndex(t => tilesEqual(t, tile));
  
  if (index >= 0) {
    // 取消选择
    gameState.userSelectedTiles.splice(index, 1);
    itemElement.classList.remove('selected');
    const tileEl = itemElement.querySelector('.tile');
    if (tileEl) {
      tileEl.style.opacity = '0.5';
    }
  } else {
    // 选择
    gameState.userSelectedTiles.push(tile);
    itemElement.classList.add('selected');
    const tileEl = itemElement.querySelector('.tile');
    if (tileEl) {
      tileEl.style.opacity = '1';
    }
  }
}

/**
 * 绑定键盘事件
 */
function bindKeyboardEvents() {
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
  }
  
  keyboardHandler = (e) => {
    if (gameState.currentPhase !== 'training') return;
    
    if (e.key === 'Enter') {
      e.preventDefault();
      submitAnswer();
    }
  };
  
  document.addEventListener('keydown', keyboardHandler);
}

/**
 * 提交答案
 */
function submitAnswer() {
  const answerTime = Math.floor((Date.now() - gameState.startTime) / 1000);
  
  // 计算得分
  const result = calculateScore();
  
  // 检查是否完全正确
  const isCorrect = result.userCorrect === result.totalCorrect && 
                    result.userIncorrect === 0 && 
                    result.missedTiles.length === 0;
  
  if (isCorrect) {
    // 选对了：直接下一题，不显示答案
    gameState.totalScore += result.totalScore;
    gameState.correctCount++;
    gameState.consecutiveCorrect++;
    gameState.isContinuousMode = true;
    
    // 更新得分显示
    updateScoreDisplay();
    
    // 延迟一下再显示下一题（给用户反馈）
    setTimeout(() => {
      startTraining();
    }, 500);
  } else {
    // 选错了：显示答案和解析
    gameState.wrongCount++;
    gameState.consecutiveCorrect = 0;
    gameState.isContinuousMode = false;
    
    // 保存成绩
    saveScore('tenpai', {
      score: gameState.totalScore,
      time: answerTime,
      difficulty: gameState.difficulty,
      config: {
        mode: gameState.mode,
        tileCount: gameState.tileCount
      }
    });
    
    // 显示结果
    showResultPhase(result, answerTime);
  }
}

/**
 * 计算得分
 */
function calculateScore() {
  const correctTiles = gameState.waitingTiles;
  const userTiles = gameState.userSelectedTiles;
  
  // 计算正确和错误的待牌
  const correctSelected = [];
  const incorrectSelected = [];
  const missedTiles = [];
  
  // 检查用户选择的牌
  userTiles.forEach(tile => {
    const isCorrect = correctTiles.some(correctTile => tilesEqual(correctTile, tile));
    if (isCorrect) {
      correctSelected.push(tile);
    } else {
      incorrectSelected.push(tile);
    }
  });
  
  // 检查遗漏的待牌
  correctTiles.forEach(correctTile => {
    const isSelected = userTiles.some(userTile => tilesEqual(userTile, correctTile));
    if (!isSelected) {
      missedTiles.push(correctTile);
    }
  });
  
  // 计算准确率
  const totalCorrect = correctTiles.length;
  const userCorrect = correctSelected.length;
  const userIncorrect = incorrectSelected.length;
  
  // 得分计算：正确选择得分，错误选择扣分，遗漏扣分
  let score = 0;
  score += userCorrect * 10; // 每个正确选择10分
  score -= userIncorrect * 5; // 每个错误选择扣5分
  score -= missedTiles.length * 10; // 每个遗漏扣10分
  
  // 如果完全正确，额外奖励
  if (userCorrect === totalCorrect && userIncorrect === 0 && missedTiles.length === 0) {
    score += 50; // 完全正确奖励50分
  }
  
  const totalScore = Math.max(0, Math.min(100, score));
  const accuracy = totalCorrect > 0 ? (userCorrect / totalCorrect) * 100 : 0;
  
  return {
    totalCorrect,
    userCorrect,
    userIncorrect,
    missedTiles,
    correctSelected,
    incorrectSelected,
    totalScore,
    accuracy
  };
}

/**
 * 显示结果阶段
 */
function showResultPhase(result, answerTime) {
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
      准确率: ${result.accuracy.toFixed(1)}% (${result.userCorrect}/${result.totalCorrect})
    </div>
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9;">
      用时: ${formatTime(answerTime)}
    </div>
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9;">
      听牌类型: ${gameState.tenpaiType || '未知'}
    </div>
  `;
  
  // 详细对比
  const detailSection = document.createElement('div');
  detailSection.className = 'result-detail';
  detailSection.style.marginTop = 'var(--spacing-xl)';
  
  const detailTitle = document.createElement('h4');
  detailTitle.textContent = '详细分析';
  detailTitle.style.marginBottom = 'var(--spacing-md)';
  
  // 正确答案
  const correctSection = document.createElement('div');
  correctSection.style.marginBottom = 'var(--spacing-lg)';
  
  const correctTitle = document.createElement('h5');
  correctTitle.textContent = '正确答案（待牌）';
  correctTitle.style.marginBottom = 'var(--spacing-sm)';
  correctTitle.style.fontSize = '16px';
  correctTitle.style.fontWeight = '600';
  
  const correctTilesDisplay = document.createElement('div');
  correctTilesDisplay.style.display = 'flex';
  correctTilesDisplay.style.flexWrap = 'wrap';
  correctTilesDisplay.style.gap = 'var(--spacing-sm)';
  
  gameState.waitingTiles.forEach(tile => {
    const tileEl = createTileElement(tile);
    tileEl.style.border = '2px solid var(--system-green)';
    correctTilesDisplay.appendChild(tileEl);
  });
  
  correctSection.appendChild(correctTitle);
  correctSection.appendChild(correctTilesDisplay);
  
  // 用户答案
  const userSection = document.createElement('div');
  userSection.style.marginBottom = 'var(--spacing-lg)';
  
  const userTitle = document.createElement('h5');
  userTitle.textContent = '您的答案';
  userTitle.style.marginBottom = 'var(--spacing-sm)';
  userTitle.style.fontSize = '16px';
  userTitle.style.fontWeight = '600';
  
  const userTilesDisplay = document.createElement('div');
  userTilesDisplay.style.display = 'flex';
  userTilesDisplay.style.flexWrap = 'wrap';
  userTilesDisplay.style.gap = 'var(--spacing-sm)';
  
  if (result.userCorrect > 0 || result.userIncorrect > 0) {
    // 正确选择的牌
    result.correctSelected.forEach(tile => {
      const tileEl = createTileElement(tile);
      tileEl.style.border = '2px solid var(--system-green)';
      userTilesDisplay.appendChild(tileEl);
    });
    
    // 错误选择的牌
    result.incorrectSelected.forEach(tile => {
      const tileEl = createTileElement(tile);
      tileEl.style.border = '2px solid var(--system-red)';
      tileEl.style.opacity = '0.7';
      userTilesDisplay.appendChild(tileEl);
    });
  } else {
    const noAnswer = document.createElement('div');
    noAnswer.textContent = '未选择任何待牌';
    noAnswer.style.color = 'var(--text-secondary)';
    userTilesDisplay.appendChild(noAnswer);
  }
  
  userSection.appendChild(userTitle);
  userSection.appendChild(userTilesDisplay);
  
  // 遗漏的牌
  if (result.missedTiles.length > 0) {
    const missedSection = document.createElement('div');
    missedSection.style.marginBottom = 'var(--spacing-lg)';
    
    const missedTitle = document.createElement('h5');
    missedTitle.textContent = '遗漏的待牌';
    missedTitle.style.marginBottom = 'var(--spacing-sm)';
    missedTitle.style.fontSize = '16px';
    missedTitle.style.fontWeight = '600';
    missedTitle.style.color = 'var(--system-orange)';
    
    const missedTilesDisplay = document.createElement('div');
    missedTilesDisplay.style.display = 'flex';
    missedTilesDisplay.style.flexWrap = 'wrap';
    missedTilesDisplay.style.gap = 'var(--spacing-sm)';
    
    result.missedTiles.forEach(tile => {
      const tileEl = createTileElement(tile);
      tileEl.style.border = '2px solid var(--system-orange)';
      missedTilesDisplay.appendChild(tileEl);
    });
    
    missedSection.appendChild(missedTitle);
    missedSection.appendChild(missedTilesDisplay);
    detailSection.appendChild(missedSection);
  }
  
  detailSection.appendChild(detailTitle);
  detailSection.appendChild(correctSection);
  detailSection.appendChild(userSection);
  
  // 操作按钮
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = 'var(--spacing-md)';
  actions.style.marginTop = 'var(--spacing-xl)';
  
  const continueBtn = document.createElement('button');
  continueBtn.className = 'btn btn-primary';
  continueBtn.textContent = '继续训练';
  continueBtn.style.flex = '1';
  continueBtn.addEventListener('click', () => {
    // 继续训练，保持得分统计
    startTraining();
  });
  
  const endBtn = document.createElement('button');
  endBtn.className = 'btn btn-secondary';
  endBtn.textContent = '结束训练';
  endBtn.style.flex = '1';
  endBtn.addEventListener('click', () => {
    endTraining();
  });
  
  actions.appendChild(continueBtn);
  actions.appendChild(endBtn);
  
  resultContainer.appendChild(summary);
  resultContainer.appendChild(detailSection);
  resultContainer.appendChild(actions);
  
  container.appendChild(resultContainer);
}
