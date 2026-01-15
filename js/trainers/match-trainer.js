/**
 * 麻将连连看训练模块 (match-trainer.js)
 * 
 * 这个文件实现了"麻将连连看"游戏功能
 * 
 * 游戏规则：
 * - 在16列n行的网格中随机生成麻将牌（每行16个牌，行数由难度决定）
 * - 点击四个相同的牌来计分（不消除，牌保持可见）
 * - 重复点击算错误
 * - 完成所有可能的四张组合即可获胜
 * - 支持计时和排名功能
 * - 支持无尽模式和无尽疯模式
 * 
 * 难度说明：
 * - 简单：较少牌数，包含筒、条、万和所有字牌
 * - 中等：中等牌数，包含筒、条、万和所有字牌
 * - 困难：较多牌数，包含筒、条、万和所有字牌
 * - 专家：最多牌数，包含筒、条、万和所有字牌
 */

import { createTimer, formatTime } from '../utils/timer.js';
import { 
  createTile,
  SUITS,
  generateFullDeck,
  tilesEqual
} from '../utils/tile-utils.js';
import { createTileElement } from '../components/tile-display.js';
import { saveScore, getConfig, saveConfig, getLeaderboard } from '../utils/storage.js';

// 游戏状态
let gameState = {
  mode: 'training',
  difficulty: 'easy',
  currentPhase: 'config',
  grid: [], // 16列n行的网格
  selectedTiles: [], // 当前选中的牌
  removedTiles: [], // 已消除的牌（保留用于兼容）
  startTime: null,
  timer: null,
  elapsedTime: 0,
  isGameOver: false,
  totalTiles: 0,
  removedCount: 0, // 已点击的组合数
  clickedTiles: [], // 已点击过的牌组合（用于检测重复点击）
  score: 0, // 当前得分
  stars: 0, // 获得的星星数
  endlessMode: false, // 是否为无尽模式
  endlessCrazyMode: false, // 是否为无尽疯模式
  roundsCompleted: 0 // 无尽模式下完成的局数
};

let container = null;
let gridContainer = null;
let timerDisplay = null;
let scoreDisplay = null;

// 难度配置
// 字牌包括：东(dong)、南(nan)、西(xi)、北(bei)、白(bai)、发(fa)、中(zhong)
const DIFFICULTY_CONFIG = {
  easy: {
    name: '简单',
    suits: [SUITS.TONG, SUITS.TIAO, SUITS.WAN],
    includeHonor: true, // 包含所有字牌（东、南、西、北、白、发、中）
    rows: 4, // 4行 × 16列 = 64张牌，需要16种牌，每种4张
    cols: 16,
    minTilesPerType: 4
  },
  medium: {
    name: '中等',
    suits: [SUITS.TONG, SUITS.TIAO, SUITS.WAN],
    includeHonor: true, // 包含所有字牌（东、南、西、北、白、发、中）
    rows: 5, // 5行 × 16列 = 80张牌
    cols: 16,
    minTilesPerType: 4
  },
  hard: {
    name: '困难',
    suits: [SUITS.TONG, SUITS.TIAO, SUITS.WAN],
    includeHonor: true, // 包含所有字牌（东、南、西、北、白、发、中）
    rows: 6, // 6行 × 16列 = 96张牌
    cols: 16,
    minTilesPerType: 4
  },
  expert: {
    name: '专家',
    suits: [SUITS.TONG, SUITS.TIAO, SUITS.WAN],
    includeHonor: true, // 包含所有字牌（东、南、西、北、白、发、中）
    rows: 7, // 7行 × 16列 = 112张牌
    cols: 16,
    minTilesPerType: 4
  }
};

/**
 * 初始化训练器
 */
export default {
  async init(containerElement) {
    container = containerElement;
    
    // 加载保存的配置
    const savedConfig = getConfig('match_trainer', {
      mode: 'training',
      difficulty: 'easy'
    });
    
    gameState.mode = savedConfig.mode || 'training';
    gameState.difficulty = savedConfig.difficulty || 'easy';
    
    showConfigPhase();
  },
  
  onShow() {
    // 显示时的回调
    if (gameState.currentPhase === 'playing') {
      // 重新绑定事件
      bindTileEvents();
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
  card.className = 'card match-config-panel';
  
  card.innerHTML = `
    <h2>麻将连连看</h2>
    <p class="subtitle">点击四个相同的牌来计分，完成所有组合即可获胜</p>
  `;
  
  // 模式选择
  const modeGroup = document.createElement('div');
  modeGroup.className = 'form-group';
  modeGroup.innerHTML = `
    <label class="label">游戏模式</label>
    <div class="btn-group">
      <button class="btn btn-toggle ${gameState.mode === 'training' ? 'active' : ''}" data-mode="training">
        训练模式
      </button>
      <button class="btn btn-toggle ${gameState.mode === 'challenge' ? 'active' : ''}" data-mode="challenge">
        挑战模式
      </button>
      <button class="btn btn-toggle ${gameState.mode === 'endless' ? 'active' : ''}" data-mode="endless">
        无尽模式
      </button>
      <button class="btn btn-toggle ${gameState.mode === 'endless-crazy' ? 'active' : ''}" data-mode="endless-crazy">
        无尽疯模式
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
  
  // 难度选择
  const difficultyGroup = document.createElement('div');
  difficultyGroup.className = 'form-group';
  difficultyGroup.innerHTML = `
    <label class="label">难度级别</label>
    <div class="btn-group">
      ${Object.keys(DIFFICULTY_CONFIG).map(diff => `
        <button class="btn btn-toggle ${gameState.difficulty === diff ? 'active' : ''}" data-difficulty="${diff}">
          ${DIFFICULTY_CONFIG[diff].name}
        </button>
      `).join('')}
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
  startBtn.className = 'btn btn-primary btn-large';
  startBtn.textContent = '开始游戏';
  startBtn.addEventListener('click', () => {
    saveConfig('match_trainer', {
      mode: gameState.mode,
      difficulty: gameState.difficulty
    });
    startGame();
  });
  
  // 排行榜按钮
  const leaderboardBtn = document.createElement('button');
  leaderboardBtn.className = 'btn btn-secondary';
  leaderboardBtn.textContent = '查看排行榜';
  leaderboardBtn.addEventListener('click', () => {
    showLeaderboard();
  });
  
  card.appendChild(modeGroup);
  card.appendChild(difficultyGroup);
  card.appendChild(startBtn);
  card.appendChild(leaderboardBtn);
  
  container.appendChild(card);
}

/**
 * 开始游戏
 */
function startGame() {
  gameState.currentPhase = 'playing';
  gameState.selectedTiles = [];
  gameState.removedTiles = [];
  gameState.isGameOver = false;
  gameState.removedCount = 0;
  gameState.clickedTiles = [];
  gameState.score = 0;
  gameState.stars = 0;
  gameState.elapsedTime = 0;
  gameState.startTime = Date.now();
  gameState.roundsCompleted = 0;
  
  // 根据模式设置
  gameState.endlessMode = (gameState.mode === 'endless' || gameState.mode === 'endless-crazy');
  gameState.endlessCrazyMode = (gameState.mode === 'endless-crazy');
  
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  generateGrid(config);
  
  renderGame();
  
  // 启动计时器
  if (gameState.timer) {
    gameState.timer.stop();
  }
  gameState.timer = createTimer((time) => {
    gameState.elapsedTime = time;
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(time);
    }
  });
  gameState.timer.start();
}

/**
 * 生成游戏网格
 * 确保每种牌正好4张，但网格不需要完全填满
 */
function generateGrid(config) {
  const cols = config.cols || 16; // 默认16列，一行16个
  const rows = config.rows;
  const totalCells = cols * rows;
  
  // 生成牌堆
  const deck = generateFullDeck(config.suits, config.includeHonor);
  
  // 计算需要的牌类型数量
  // 每种牌需要4张，所以需要的牌类型数 = Math.floor(totalCells / 4)
  const tileTypesNeeded = Math.floor(totalCells / 4);
  
  // 随机选择牌类型
  const allTileTypes = [];
  deck.forEach(tile => {
    const existing = allTileTypes.find(t => tilesEqual(t, tile));
    if (!existing) {
      allTileTypes.push(tile);
    }
  });
  
  // 随机打乱并选择需要的类型
  const shuffledTypes = [...allTileTypes].sort(() => Math.random() - 0.5);
  const selectedTypes = shuffledTypes.slice(0, tileTypesNeeded);
  
  // 生成牌数组（每种正好4张）
  const tiles = [];
  selectedTypes.forEach(tileType => {
    for (let i = 0; i < 4; i++) {
      tiles.push({ ...tileType });
    }
  });
  
  // 确保总牌数不超过网格大小
  // 如果总牌数小于 totalCells，留空部分单元格（不需要完全填满）
  // 如果总牌数大于 totalCells，这种情况不应该发生（因为每种4张，类型数已限制）
  if (tiles.length > totalCells) {
    // 如果牌数太多，随机移除多余的（但保持每种至少4张）
    tiles.sort(() => Math.random() - 0.5);
    tiles.splice(totalCells);
  }
  
  // 打乱顺序
  const shuffledTiles = tiles.sort(() => Math.random() - 0.5);
  
  // 创建网格（16列n行）
  gameState.grid = [];
  for (let row = 0; row < rows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index < shuffledTiles.length) {
        gameState.grid[row][col] = {
          tile: shuffledTiles[index],
          row,
          col,
          removed: false,
          selected: false,
          clicked: false // 标记是否已点击
        };
      } else {
        // 留空单元格
        gameState.grid[row][col] = null;
      }
    }
  }
  
  gameState.totalTiles = tiles.length;
}

/**
 * 渲染游戏界面
 */
function renderGame() {
  container.innerHTML = '';
  
  const gameCard = document.createElement('div');
  gameCard.className = 'card match-game-container';
  
  // 顶部信息栏
  const infoBar = document.createElement('div');
  infoBar.className = 'match-info-bar';
  
  const infoItems = [
    `<div class="match-info-item">
      <span class="info-label">难度：</span>
      <span class="info-value">${DIFFICULTY_CONFIG[gameState.difficulty].name}</span>
    </div>`,
    `<div class="match-info-item">
      <span class="info-label">时间：</span>
      <span class="info-value" id="timer-display">00:00</span>
    </div>`,
    `<div class="match-info-item">
      <span class="info-label">得分：</span>
      <span class="info-value" id="score-display">0</span>
    </div>`,
    `<div class="match-info-item">
      <span class="info-label">进度：</span>
      <span class="info-value" id="progress-display">0 / ${Math.floor(gameState.totalTiles / 4)}</span>
    </div>`
  ];
  
  if (gameState.endlessMode) {
    infoItems.push(`
      <div class="match-info-item">
        <span class="info-label">局数：</span>
        <span class="info-value">${gameState.roundsCompleted}</span>
      </div>
    `);
  }
  
  infoBar.innerHTML = infoItems.join('');
  
  timerDisplay = infoBar.querySelector('#timer-display');
  scoreDisplay = infoBar.querySelector('#score-display');
  const progressDisplay = infoBar.querySelector('#progress-display');
  
  // 更新进度显示
  const updateProgress = () => {
    progressDisplay.textContent = `${gameState.removedCount} / ${Math.floor(gameState.totalTiles / 4)}`;
    if (scoreDisplay) {
      scoreDisplay.textContent = gameState.score;
    }
  };
  updateProgress();
  
  // 游戏网格
  gridContainer = document.createElement('div');
  gridContainer.className = 'match-grid';
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  const cols = config.cols || 16;
  // 使用 CSS Grid 布局，每行固定 16 列，确保不再只显示为一列
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  
  // 渲染所有牌
  gameState.grid.forEach(row => {
    row.forEach(cell => {
      if (cell && !cell.removed) {
        const tileEl = createTileElement(cell.tile, {
          selectable: true,
          selected: cell.selected,
          onClick: () => handleTileClick(cell)
        });
        tileEl.dataset.row = cell.row;
        tileEl.dataset.col = cell.col;
        tileEl.classList.add('match-tile');
        
        // 如果已点击，添加视觉标记
        if (cell.clicked) {
          tileEl.classList.add('clicked');
        }
        
        gridContainer.appendChild(tileEl);
      }
    });
  });
  
  // 控制按钮
  const controlBar = document.createElement('div');
  controlBar.className = 'match-control-bar';
  controlBar.innerHTML = `
    <button class="btn btn-secondary" id="reset-btn">重新开始</button>
    <button class="btn btn-secondary" id="back-btn">返回</button>
  `;
  
  controlBar.querySelector('#reset-btn').addEventListener('click', () => {
    if (confirm('确定要重新开始吗？当前进度将丢失。')) {
      startGame();
    }
  });
  
  controlBar.querySelector('#back-btn').addEventListener('click', () => {
    if (confirm('确定要返回吗？当前进度将丢失。')) {
      if (gameState.timer) {
        gameState.timer.stop();
      }
      showConfigPhase();
    }
  });
  
  gameCard.appendChild(infoBar);
  gameCard.appendChild(gridContainer);
  gameCard.appendChild(controlBar);
  container.appendChild(gameCard);
  
  // 保存进度显示更新函数
  gameState.updateProgress = updateProgress;
}

/**
 * 生成牌的唯一标识符（用于检测重复点击）
 */
function getTileKey(tile) {
  return `${tile.suit}-${tile.rank}`;
}

/**
 * 生成组合的唯一标识符（用于检测重复点击）
 */
function getCombinationKey(cells) {
  // 对单元格按位置排序，生成唯一标识
  const sorted = cells
    .map(c => `${c.row}-${c.col}`)
    .sort()
    .join('|');
  return sorted;
}

/**
 * 检查是否重复点击
 */
function isDuplicateClick(cells) {
  const key = getCombinationKey(cells);
  return gameState.clickedTiles.includes(key);
}

/**
 * 记录已点击的组合
 */
function recordClickedCombination(cells) {
  const key = getCombinationKey(cells);
  gameState.clickedTiles.push(key);
}

/**
 * 处理牌点击事件
 */
function handleTileClick(cell) {
  if (cell.removed || gameState.isGameOver || cell.clicked) {
    return;
  }
  
  // 切换选中状态
  cell.selected = !cell.selected;
  
  // 更新选中列表
  if (cell.selected) {
    gameState.selectedTiles.push(cell);
  } else {
    const index = gameState.selectedTiles.findIndex(c => c.row === cell.row && c.col === cell.col);
    if (index > -1) {
      gameState.selectedTiles.splice(index, 1);
    }
  }
  
  // 检查是否选中了4张相同的牌
  if (gameState.selectedTiles.length === 4) {
    const firstTile = gameState.selectedTiles[0].tile;
    const allSame = gameState.selectedTiles.every(c => 
      tilesEqual(c.tile, firstTile)
    );
    
    if (allSame) {
      // 检查是否重复点击
      if (isDuplicateClick(gameState.selectedTiles)) {
        // 重复点击，触发错误处理
        handleError('重复点击！');
        // 取消所有选中
        gameState.selectedTiles.forEach(c => {
          c.selected = false;
        });
        gameState.selectedTiles = [];
        renderGame();
        return;
      }
      
      // 计分并标记为已点击（不消除）
      markTilesAsClicked(gameState.selectedTiles);
      recordClickedCombination(gameState.selectedTiles);
      addScore(gameState.selectedTiles);
      
      gameState.selectedTiles = [];
      
      // 无尽疯模式：每次点击正确后重新随机打乱所有牌
      if (gameState.endlessCrazyMode) {
        shuffleAllTiles();
      }
      
      // 检查是否完成所有组合
      if (checkAllCombinationsClicked()) {
        handleRoundComplete();
      } else {
        // 重新渲染
        renderGame();
      }
    } else {
      // 选中的牌不相同，取消所有选中
      gameState.selectedTiles.forEach(c => {
        c.selected = false;
      });
      gameState.selectedTiles = [];
      renderGame();
    }
  } else {
    // 只更新当前牌的选中状态
    updateTileDisplay(cell);
  }
}

/**
 * 标记牌为已点击（不消除）
 */
function markTilesAsClicked(cells) {
  cells.forEach(cell => {
    cell.clicked = true;
  });
  gameState.removedCount += 1;
  
  if (gameState.updateProgress) {
    gameState.updateProgress();
  }
}

/**
 * 添加得分
 */
function addScore(cells) {
  const baseScore = 10;
  const timeBonus = Math.max(1, Math.floor(5 - gameState.elapsedTime / 60)); // 时间越短奖励越高
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3
  };
  
  const multiplier = difficultyMultiplier[gameState.difficulty] || 1;
  const roundScore = Math.floor((baseScore + timeBonus) * multiplier);
  
  // 无尽模式连续完成奖励
  if (gameState.endlessMode && gameState.roundsCompleted > 0) {
    const bonus = Math.floor(roundScore * gameState.roundsCompleted * 0.1);
    gameState.score += roundScore + bonus;
  } else {
    gameState.score += roundScore;
  }
}

/**
 * 检查所有可能的四张组合是否都被点击完
 */
function checkAllCombinationsClicked() {
  // 统计每种牌类型的数量
  const tileCounts = {};
  
  gameState.grid.forEach(row => {
    row.forEach(cell => {
      if (cell && !cell.removed) {
        const key = getTileKey(cell.tile);
        if (!tileCounts[key]) {
          tileCounts[key] = { total: 0, clicked: 0 };
        }
        tileCounts[key].total += 1;
        if (cell.clicked) {
          tileCounts[key].clicked += 1;
        }
      }
    });
  });
  
  // 检查每种牌类型是否都被点击了4张
  for (const key in tileCounts) {
    const count = tileCounts[key];
    // 如果某种牌的总数不是4的倍数，或者已点击数不等于总数，说明未完成
    if (count.total % 4 !== 0 || count.clicked !== count.total) {
      return false;
    }
  }
  
  return true;
}

/**
 * 处理一局完成
 */
function handleRoundComplete() {
  gameState.roundsCompleted += 1;
  
  if (gameState.endlessMode) {
    // 无尽模式：生成新局
    const config = DIFFICULTY_CONFIG[gameState.difficulty];
    generateGrid(config);
    renderGame();
  } else {
    // 普通模式：结束游戏
    endGame(true);
  }
}

/**
 * 处理错误（重复点击等）
 */
function handleError(message) {
  if (gameState.endlessMode || gameState.endlessCrazyMode) {
    // 无尽模式：结束游戏
    endGame(false);
  } else {
    // 普通模式：提示错误，允许继续
    alert(message);
  }
}

/**
 * 无尽疯模式：重新随机打乱所有牌的位置
 */
function shuffleAllTiles() {
  // 收集所有牌（包括已点击和未点击的）
  const allTiles = [];
  gameState.grid.forEach(row => {
    row.forEach(cell => {
      if (cell && !cell.removed) {
        allTiles.push({
          tile: cell.tile,
          clicked: cell.clicked,
          selected: false // 重置选中状态
        });
      }
    });
  });
  
  // 随机打乱
  const shuffled = allTiles.sort(() => Math.random() - 0.5);
  
  // 重新填充到网格中（保持16列布局）
  const config = DIFFICULTY_CONFIG[gameState.difficulty];
  const cols = config.cols || 16;
  const rows = config.rows;
  let index = 0;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index < shuffled.length) {
        const cell = gameState.grid[row][col];
        if (cell) {
          cell.tile = shuffled[index].tile;
          cell.clicked = shuffled[index].clicked;
          cell.selected = false;
        } else {
          gameState.grid[row][col] = {
            tile: shuffled[index].tile,
            row,
            col,
            removed: false,
            selected: false,
            clicked: shuffled[index].clicked
          };
        }
        index++;
      } else {
        gameState.grid[row][col] = null;
      }
    }
  }
}

/**
 * 更新单张牌的显示
 */
function updateTileDisplay(cell) {
  const tileEl = gridContainer.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
  if (tileEl) {
    if (cell.selected) {
      tileEl.classList.add('selected');
    } else {
      tileEl.classList.remove('selected');
    }
    if (cell.clicked) {
      tileEl.classList.add('clicked');
    } else {
      tileEl.classList.remove('clicked');
    }
  }
}

/**
 * 计算星星数
 */
function calculateStars() {
  const starMap = {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 4
  };
  return starMap[gameState.difficulty] || 0;
}

/**
 * 结束游戏
 */
function endGame(win) {
  gameState.isGameOver = true;
  
  if (gameState.timer) {
    gameState.timer.stop();
  }
  
  if (win) {
    // 计算星星
    gameState.stars = calculateStars();
    
    // 保存成绩（非无尽模式）
    if (!gameState.endlessMode) {
      const score = calculateScore();
      saveScore('match', {
        score: score,
        time: gameState.elapsedTime,
        difficulty: gameState.difficulty,
        config: {
          mode: gameState.mode,
          totalTiles: gameState.totalTiles
        }
      });
      
      // 显示胜利界面
      showResult(true, score);
    } else {
      // 无尽模式：显示最终成绩
      showResult(true, gameState.score);
    }
  } else {
    // 失败（无尽模式下出错）
    showResult(false, gameState.score);
  }
}

/**
 * 计算得分（用于普通模式）
 */
function calculateScore() {
  const baseScore = 1000;
  const timeBonus = Math.max(0, 300 - gameState.elapsedTime); // 时间越短奖励越高
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3
  };
  
  const multiplier = difficultyMultiplier[gameState.difficulty] || 1;
  return Math.floor((baseScore + timeBonus) * multiplier);
}

/**
 * 显示结果
 */
function showResult(win, score) {
  const resultCard = document.createElement('div');
  resultCard.className = 'card match-result';
  
  // 生成星星显示
  const stars = win ? gameState.stars : 0;
  const starsDisplay = '⭐'.repeat(stars);
  
  let resultHTML = `
    <h2>${win ? '🎉 恭喜完成！' : '游戏结束'}</h2>
    <div class="result-stats">
      <div class="stat-item">
        <span class="stat-label">用时：</span>
        <span class="stat-value">${formatTime(gameState.elapsedTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">得分：</span>
        <span class="stat-value">${score}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">难度：</span>
        <span class="stat-value">${DIFFICULTY_CONFIG[gameState.difficulty].name}</span>
      </div>
  `;
  
  if (win && stars > 0) {
    resultHTML += `
      <div class="stat-item">
        <span class="stat-label">星星：</span>
        <span class="stat-value">${starsDisplay}</span>
      </div>
    `;
  }
  
  if (gameState.endlessMode && gameState.roundsCompleted > 0) {
    resultHTML += `
      <div class="stat-item">
        <span class="stat-label">完成局数：</span>
        <span class="stat-value">${gameState.roundsCompleted}</span>
      </div>
    `;
  }
  
  resultHTML += `
    </div>
    <div class="result-actions">
      <button class="btn btn-primary" id="play-again-btn">再玩一次</button>
      <button class="btn btn-secondary" id="back-to-config-btn">返回</button>
    </div>
  `;
  
  resultCard.innerHTML = resultHTML;
  
  resultCard.querySelector('#play-again-btn').addEventListener('click', () => {
    startGame();
  });
  
  resultCard.querySelector('#back-to-config-btn').addEventListener('click', () => {
    showConfigPhase();
  });
  
  container.innerHTML = '';
  container.appendChild(resultCard);
}

/**
 * 显示排行榜
 */
function showLeaderboard() {
  const leaderboard = getLeaderboard().filter(entry => entry.mode === 'match');
  const top10 = leaderboard.slice(0, 10);
  
  const leaderboardCard = document.createElement('div');
  leaderboardCard.className = 'card match-leaderboard';
  leaderboardCard.innerHTML = `
    <h2>排行榜</h2>
    <div class="leaderboard-list">
      ${top10.length === 0 ? '<p class="empty-message">暂无记录</p>' : ''}
      ${top10.map((entry, index) => `
        <div class="leaderboard-item">
          <span class="rank">${index + 1}</span>
          <span class="score">${entry.score}</span>
          <span class="time">${formatTime(entry.time)}</span>
          <span class="difficulty">${DIFFICULTY_CONFIG[entry.difficulty]?.name || entry.difficulty}</span>
          <span class="date">${entry.date}</span>
        </div>
      `).join('')}
    </div>
    <button class="btn btn-primary" id="close-leaderboard-btn">关闭</button>
  `;
  
  leaderboardCard.querySelector('#close-leaderboard-btn').addEventListener('click', () => {
    showConfigPhase();
  });
  
  container.innerHTML = '';
  container.appendChild(leaderboardCard);
}

/**
 * 绑定牌的事件
 */
function bindTileEvents() {
  // 事件已经在 createTileElement 中绑定，这里可以添加其他事件
}
