/**
 * 何切训练模块 (heqie-trainer.js)
 * 
 * "何切"是麻将术语，意思是"应该切（打出）哪张牌"
 * 
 * 训练内容：
 * - 给你14/10/8张手牌
 * - 需要选择打出一张牌，使手牌达到最佳状态（切后听牌且胡牌数量最多）
 * - 学习如何选择最优的切牌
 */

import { createTimer, formatTime } from '../utils/timer.js';
import { 
  createTile,
  SUITS,
  SUIT_NAMES,
  tilesEqual
} from '../utils/tile-utils.js';
import { createTileElement } from '../components/tile-display.js';
import { saveScore, getConfig, saveConfig } from '../utils/storage.js';
import { evaluateHeqieOptions } from '../utils/heqie-utils.js';

// 游戏状态
let gameState = {
  mode: 'training',
  tileCount: 14,
  difficulty: 'easy',
  currentPhase: 'config',
  hand: [],
  evaluationResult: null,
  userSelectedTiles: [],
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
    const savedConfig = getConfig('heqie_trainer', {
      mode: 'training',
      tileCount: 14,
      difficulty: 'easy'
    });
    
    gameState.mode = savedConfig.mode || 'training';
    gameState.tileCount = savedConfig.tileCount || 14;
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
    <h2>何切训练</h2>
    <p class="subtitle">学习在14/10/8张牌情况下选择最优的切牌方案</p>
  `;
  
  // 牌数选择
  const tileCountGroup = document.createElement('div');
  tileCountGroup.className = 'form-group';
  tileCountGroup.innerHTML = `
    <label class="label">牌数选择</label>
    <div class="btn-group">
      <button class="btn btn-toggle ${gameState.tileCount === 14 ? 'active' : ''}" data-count="14">
        14张
      </button>
      <button class="btn btn-toggle ${gameState.tileCount === 10 ? 'active' : ''}" data-count="10">
        10张
      </button>
      <button class="btn btn-toggle ${gameState.tileCount === 8 ? 'active' : ''}" data-count="8">
        8张
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
  startBtn.textContent = '开始何切训练';
  startBtn.style.marginTop = 'var(--spacing-xl)';
  startBtn.style.marginBottom = 'var(--spacing-md)';
  startBtn.style.width = '100%';
  startBtn.style.padding = 'var(--spacing-md) var(--spacing-lg)';
  startBtn.style.fontSize = '18px';
  startBtn.style.fontWeight = '700';
  startBtn.addEventListener('click', startTraining);
  
  card.appendChild(tileCountGroup);
  card.appendChild(difficultyGroup);
  card.appendChild(startBtn);
  
  container.appendChild(card);
}

/**
 * 生成测试手牌（临时实现，后续可以接入真实的手牌生成器）
 */
function generateTestHand(tileCount, difficulty) {
  // 临时实现：生成一个简单的测试手牌
  // 后续可以接入真实的手牌生成器
  const hand = [];
  const suit = SUITS.TONG;
  
  // 生成一个简单的测试手牌：例如 14张模式
  if (tileCount === 14) {
    // 示例：111 222 333 44 55 66 7
    // 切7后听牌：待4、5、6
    for (let i = 1; i <= 3; i++) {
      for (let j = 0; j < 3; j++) {
        hand.push(createTile(suit, i));
      }
    }
    for (let i = 4; i <= 6; i++) {
      for (let j = 0; j < 2; j++) {
        hand.push(createTile(suit, i));
      }
    }
    hand.push(createTile(suit, 7));
  } else if (tileCount === 10) {
    // 示例：111 222 33 44 5
    for (let i = 1; i <= 2; i++) {
      for (let j = 0; j < 3; j++) {
        hand.push(createTile(suit, i));
      }
    }
    for (let i = 3; i <= 4; i++) {
      for (let j = 0; j < 2; j++) {
        hand.push(createTile(suit, i));
      }
    }
    hand.push(createTile(suit, 5));
  } else if (tileCount === 8) {
    // 示例：111 22 33 4
    for (let j = 0; j < 3; j++) {
      hand.push(createTile(suit, 1));
    }
    for (let i = 2; i <= 3; i++) {
      for (let j = 0; j < 2; j++) {
        hand.push(createTile(suit, i));
      }
    }
    hand.push(createTile(suit, 4));
  }
  
  return hand;
}

/**
 * 开始训练
 */
async function startTraining() {
  try {
    // 保存配置
    saveConfig('heqie_trainer', {
      mode: gameState.mode,
      tileCount: gameState.tileCount,
      difficulty: gameState.difficulty
    });
    
    // 生成手牌（临时使用测试手牌）
    gameState.hand = generateTestHand(gameState.tileCount, gameState.difficulty);
    
    // 评估何切选项
    gameState.evaluationResult = await evaluateHeqieOptions(gameState.hand, gameState.tileCount);
    
    if (!gameState.evaluationResult || gameState.evaluationResult.bestDiscards.length === 0) {
      // 如果没有找到最优切牌，重新生成
      console.warn('未找到最优切牌，重新生成手牌');
      gameState.hand = generateTestHand(gameState.tileCount, gameState.difficulty);
      gameState.evaluationResult = await evaluateHeqieOptions(gameState.hand, gameState.tileCount);
    }
    
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
  handTitle.textContent = '手牌（请选择要打出的牌）';
  handTitle.style.marginBottom = 'var(--spacing-md)';
  handTitle.style.fontSize = '20px';
  handTitle.style.fontWeight = '700';
  
  const handDisplay = document.createElement('div');
  handDisplay.className = 'heqie-hand-display';
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
      return 0;  // 字牌排序可以后续优化
    }
    return a.rank - b.rank;
  });
  
  // 为每张牌创建可点击的元素
  sortedHand.forEach((tile, index) => {
    const isSelected = gameState.userSelectedTiles.some(t => tilesEqual(t, tile));
    const tileEl = createTileElement(tile, {
      selectable: true,
      selected: isSelected,
      onClick: () => toggleTileSelection(tile, tileEl)
    });
    
    // 添加点击高亮效果
    tileEl.style.cursor = 'pointer';
    tileEl.style.transition = 'all 0.2s';
    if (isSelected) {
      tileEl.style.border = '3px solid var(--system-blue)';
      tileEl.style.transform = 'scale(1.1)';
    }
    
    handDisplay.appendChild(tileEl);
  });
  
  handSection.appendChild(handTitle);
  handSection.appendChild(handDisplay);
  
  // 提示区域
  const hintSection = document.createElement('div');
  hintSection.style.marginBottom = 'var(--spacing-lg)';
  hintSection.style.padding = 'var(--spacing-md)';
  hintSection.style.background = 'var(--background-secondary)';
  hintSection.style.borderRadius = 'var(--radius-md)';
  hintSection.innerHTML = `
    <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
      请选择你认为应该打出的牌（可多选，如果有多个等价最优切牌）
    </p>
  `;
  
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
  phaseContainer.appendChild(hintSection);
  phaseContainer.appendChild(submitBtn);
  
  container.appendChild(phaseContainer);
  
  // 绑定键盘事件
  bindKeyboardEvents();
}

/**
 * 切换牌的选择状态
 */
function toggleTileSelection(tile, tileElement) {
  const index = gameState.userSelectedTiles.findIndex(t => tilesEqual(t, tile));
  
  if (index >= 0) {
    // 取消选择
    gameState.userSelectedTiles.splice(index, 1);
    tileElement.classList.remove('selected');
    tileElement.style.border = '';
    tileElement.style.transform = '';
  } else {
    // 选择
    gameState.userSelectedTiles.push(tile);
    tileElement.classList.add('selected');
    tileElement.style.border = '3px solid var(--system-blue)';
    tileElement.style.transform = 'scale(1.1)';
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
  
  // 检查答案
  const result = checkAnswer();
  
  if (result.isCorrect) {
    // 选对了：直接下一题，不显示答案
    gameState.totalScore += result.score;
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
    saveScore('heqie', {
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
 * 检查答案
 */
function checkAnswer() {
  const bestDiscards = gameState.evaluationResult.bestDiscards;
  const userSelected = gameState.userSelectedTiles;
  
  // 检查用户选择的牌是否都在最优切牌中
  const correctSelected = userSelected.filter(userTile => 
    bestDiscards.some(bestTile => tilesEqual(userTile, bestTile))
  );
  
  const incorrectSelected = userSelected.filter(userTile => 
    !bestDiscards.some(bestTile => tilesEqual(userTile, bestTile))
  );
  
  // 检查是否完全正确（至少选择了一个最优切牌，且没有选择非最优切牌）
  const isCorrect = correctSelected.length > 0 && incorrectSelected.length === 0;
  
  // 计算得分
  let score = 0;
  if (isCorrect) {
    score = 100;  // 完全正确100分
  } else if (correctSelected.length > 0) {
    score = 50;  // 部分正确50分
  }
  
  return {
    isCorrect,
    correctSelected,
    incorrectSelected,
    score,
    bestDiscards
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
    <div class="score">${result.score}</div>
    <div style="font-size: 18px; margin-top: var(--spacing-sm);">
      ${result.isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
    </div>
    <div style="font-size: 14px; margin-top: var(--spacing-xs); opacity: 0.9;">
      用时: ${formatTime(answerTime)}
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
  correctTitle.textContent = '正确答案（最优切牌）';
  correctTitle.style.marginBottom = 'var(--spacing-sm)';
  correctTitle.style.fontSize = '16px';
  correctTitle.style.fontWeight = '600';
  
  const correctTilesDisplay = document.createElement('div');
  correctTilesDisplay.style.display = 'flex';
  correctTilesDisplay.style.flexWrap = 'wrap';
  correctTilesDisplay.style.gap = 'var(--spacing-sm)';
  
  result.bestDiscards.forEach(tile => {
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
  
  if (result.correctSelected.length > 0 || result.incorrectSelected.length > 0) {
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
    noAnswer.textContent = '未选择任何切牌';
    noAnswer.style.color = 'var(--text-secondary)';
    userTilesDisplay.appendChild(noAnswer);
  }
  
  userSection.appendChild(userTitle);
  userSection.appendChild(userTilesDisplay);
  
  // 解析信息
  const analysisSection = document.createElement('div');
  analysisSection.style.marginBottom = 'var(--spacing-lg)';
  analysisSection.style.padding = 'var(--spacing-md)';
  analysisSection.style.background = 'var(--background-secondary)';
  analysisSection.style.borderRadius = 'var(--radius-md)';
  
  const analysisTitle = document.createElement('h5');
  analysisTitle.textContent = '解析';
  analysisTitle.style.marginBottom = 'var(--spacing-sm)';
  analysisTitle.style.fontSize = '16px';
  analysisTitle.style.fontWeight = '600';
  
  // 显示最优切牌的信息
  const bestCandidate = gameState.evaluationResult.candidates.find(c => 
    result.bestDiscards.some(best => tilesEqual(c.discardTile, best))
  );
  
  if (bestCandidate) {
    const analysisText = document.createElement('div');
    analysisText.style.fontSize = '14px';
    analysisText.style.color = 'var(--text-secondary)';
    analysisText.style.lineHeight = '1.6';
    analysisText.innerHTML = `
      <p style="margin: 0 0 var(--spacing-sm) 0;">
        <strong>最优切牌：</strong>切掉这些牌后，手牌进入听牌状态，胡牌数量为 <strong>${gameState.evaluationResult.bestWinTileCount}</strong> 张。
      </p>
      <p style="margin: 0;">
        <strong>待牌：</strong>${bestCandidate.waitingTiles.length > 0 
          ? bestCandidate.waitingTiles.map(t => `${t.rank}${SUIT_NAMES[t.suit]}`).join('、')
          : '无'}
      </p>
    `;
    analysisSection.appendChild(analysisTitle);
    analysisSection.appendChild(analysisText);
  }
  
  detailSection.appendChild(detailTitle);
  detailSection.appendChild(correctSection);
  detailSection.appendChild(userSection);
  if (analysisSection.children.length > 0) {
    detailSection.appendChild(analysisSection);
  }
  
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
