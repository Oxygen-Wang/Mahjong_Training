/**
 * 听牌检测工具文件 (tenpai-utils.js)
 * 
 * 这个文件提供了听牌检测的核心功能
 * 
 * 主要功能：
 * 1. 检测手牌是否听牌（detectTenpai）
 * 2. 判断听牌类型（getTenpaiType）
 * 3. 生成听牌手牌（generateTenpaiHand）
 * 
 * 检测原理：
 * - 尝试给手牌添加一张牌（遍历所有可能的牌）
 * - 检查添加后是否能和牌（14张牌，4个面子+1个对子）
 * - 如果能和牌，说明这张牌是"待牌"
 * - 所有可能的待牌就是听牌的结果
 * 
 * 和牌规则：
 * - 标准麻将：14张牌 = 4个面子（刻子或顺子）+ 1个对子
 * - 刻子：三张相同的牌（如 1万1万1万）
 * - 顺子：三张连续的同花色牌（如 1万2万3万）
 * - 对子：两张相同的牌（如 1万1万）
 * 
 * 听牌类型说明：
 * - 单骑听：只有一个待牌（如 1万1万1万，听 1万）
 * - 两面听：有两个连续待牌（如 2万3万，听 1万和4万）
 * - 嵌张听：有一个待牌在中间（如 1万3万，听 2万）
 * - 边张听：有一个待牌在边上（如 1万2万，听 3万）
 * - 双碰听：有两个待牌，来自两个对子
 * - 三面听：有三个待牌
 * - 多面听：有四个或更多待牌
 */

import { createTile, SUITS, HONOR_TILES, countTiles, generateFullDeck, drawTiles, validateHand } from './tile-utils.js';
import { 
  TENPAI_PATTERNS,
  generateTenpaiByType
} from './hand-generator.js';

/**
 * 将手牌转换为计数数组
 * @param {Array<Object>} hand - 手牌数组
 * @returns {Object} 计数对象，如 {tong1: 2, tong2: 1, ...}
 */
function handToCounts(hand) {
  return countTiles(hand);
}

/**
 * 从计数对象创建手牌数组
 * @param {Object} counts - 计数对象
 * @returns {Array<Object>} 手牌数组
 */
function countsToHand(counts) {
  const hand = [];
  Object.keys(counts).forEach(id => {
    const count = counts[id];
    for (let i = 0; i < count; i++) {
      // 解析id
      if (HONOR_TILES.includes(id)) {
        hand.push(createTile(SUITS.HONOR, id));
      } else {
        // 解析 tong1, wan2 等格式
        const match = id.match(/^(tong|tiao|wan)(\d+)$/);
        if (match) {
          const suit = match[1];
          const rank = parseInt(match[2]);
          hand.push(createTile(suit, rank));
        }
      }
    }
  });
  return hand;
}

/**
 * 检查是否可以组成刻子（三张相同）
 * @param {Object} counts - 计数对象
 * @param {string} tileId - 牌ID
 * @returns {boolean}
 */
function canFormTriplet(counts, tileId) {
  return (counts[tileId] || 0) >= 3;
}

/**
 * 检查是否可以组成顺子（三张连续）
 * @param {Object} counts - 计数对象
 * @param {string} suit - 花色
 * @param {number} rank - 起始点数
 * @returns {boolean}
 */
function canFormSequence(counts, suit, rank) {
  if (suit === SUITS.HONOR) return false; // 字牌不能组成顺子
  if (rank < 1 || rank > 7) return false; // 7、8、9不能作为顺子起始
  
  const id1 = `${suit}${rank}`;
  const id2 = `${suit}${rank + 1}`;
  const id3 = `${suit}${rank + 2}`;
  
  return (counts[id1] || 0) >= 1 && 
         (counts[id2] || 0) >= 1 && 
         (counts[id3] || 0) >= 1;
}

/**
 * 检查是否可以组成对子（两张相同）
 * @param {Object} counts - 计数对象
 * @param {string} tileId - 牌ID
 * @returns {boolean}
 */
function canFormPair(counts, tileId) {
  return (counts[tileId] || 0) >= 2;
}

/**
 * 移除刻子
 * @param {Object} counts - 计数对象
 * @param {string} tileId - 牌ID
 */
function removeTriplet(counts, tileId) {
  counts[tileId] = (counts[tileId] || 0) - 3;
}

/**
 * 移除顺子
 * @param {Object} counts - 计数对象
 * @param {string} suit - 花色
 * @param {number} rank - 起始点数
 */
function removeSequence(counts, suit, rank) {
  const id1 = `${suit}${rank}`;
  const id2 = `${suit}${rank + 1}`;
  const id3 = `${suit}${rank + 2}`;
  counts[id1] = (counts[id1] || 0) - 1;
  counts[id2] = (counts[id2] || 0) - 1;
  counts[id3] = (counts[id3] || 0) - 1;
}

/**
 * 移除对子
 * @param {Object} counts - 计数对象
 * @param {string} tileId - 牌ID
 */
function removePair(counts, tileId) {
  counts[tileId] = (counts[tileId] || 0) - 2;
}

/**
 * 获取所有可能的牌ID
 * @param {Array<Object>} hand - 手牌数组（可选，用于限制范围）
 * @returns {Array<string>} 所有可能的牌ID
 */
function getAllPossibleTileIds(hand = null) {
  const tileIds = new Set();
  
  if (hand) {
    // 基于手牌，只考虑相关花色
    const suits = new Set();
    hand.forEach(tile => {
      if (tile.suit === SUITS.HONOR) {
        tileIds.add(tile.rank);
      } else {
        suits.add(tile.suit);
        tileIds.add(tile.id);
      }
    });
    
    // 添加相邻的牌（用于顺子）
    suits.forEach(suit => {
      for (let rank = 1; rank <= 9; rank++) {
        tileIds.add(`${suit}${rank}`);
      }
    });
  } else {
    // 所有可能的牌
    HONOR_TILES.forEach(honor => tileIds.add(honor));
    [SUITS.WAN, SUITS.TONG, SUITS.TIAO].forEach(suit => {
      for (let rank = 1; rank <= 9; rank++) {
        tileIds.add(`${suit}${rank}`);
      }
    });
  }
  
  return Array.from(tileIds);
}

/**
 * 检查是否可以和牌（14张牌）
 * @param {Object} counts - 计数对象
 * @returns {boolean}
 */
function canWin(counts) {
  // 深度复制
  const countsCopy = JSON.parse(JSON.stringify(counts));
  
  // 检查总牌数是否为14
  const totalTiles = Object.values(countsCopy).reduce((sum, count) => sum + count, 0);
  if (totalTiles !== 14) {
    return false;
  }
  
  // 尝试所有可能的和牌组合
  return tryWin(countsCopy, 0, null);
}

/**
 * 递归尝试和牌组合
 * @param {Object} counts - 计数对象
 * @param {number} meldsCount - 已组成的面子数
 * @param {string} pairTileId - 已选的对子牌ID（null表示还未选对子）
 * @returns {boolean}
 */
function tryWin(counts, meldsCount, pairTileId) {
  // 检查是否已完成（4个面子+1个对子）
  if (meldsCount === 4 && pairTileId !== null) {
    // 检查是否所有牌都已用完
    const remaining = Object.values(counts).reduce((sum, count) => sum + Math.max(0, count), 0);
    return remaining === 0;
  }
  
  // 如果已经有4个面子，只需要一个对子
  if (meldsCount === 4) {
    // 查找对子
    for (const tileId in counts) {
      if (counts[tileId] >= 2) {
        const countsCopy = JSON.parse(JSON.stringify(counts));
        removePair(countsCopy, tileId);
        if (tryWin(countsCopy, 4, tileId)) {
          return true;
        }
      }
    }
    return false;
  }
  
  // 如果还没有选对子，尝试先选对子
  if (pairTileId === null) {
    for (const tileId in counts) {
      if (counts[tileId] >= 2) {
        const countsCopy = JSON.parse(JSON.stringify(counts));
        removePair(countsCopy, tileId);
        if (tryWin(countsCopy, meldsCount, tileId)) {
          return true;
        }
      }
    }
  }
  
  // 尝试刻子
  for (const tileId in counts) {
    if (counts[tileId] >= 3 && canFormTriplet(counts, tileId)) {
      const countsCopy = JSON.parse(JSON.stringify(counts));
      removeTriplet(countsCopy, tileId);
      if (tryWin(countsCopy, meldsCount + 1, pairTileId)) {
        return true;
      }
    }
  }
  
  // 尝试顺子（只对数字牌）
  for (const tileId in counts) {
    const match = tileId.match(/^(tong|tiao|wan)(\d+)$/);
    if (match && counts[tileId] > 0) {
      const suit = match[1];
      const rank = parseInt(match[2]);
      if (canFormSequence(counts, suit, rank)) {
        const countsCopy = JSON.parse(JSON.stringify(counts));
        removeSequence(countsCopy, suit, rank);
        if (tryWin(countsCopy, meldsCount + 1, pairTileId)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * 检查是否能组成指定数量的面子 + 对子（如果需要）
 * 用于7张和10张听牌检测
 * @param {Object} counts - 计数对象
 * @param {number} targetMelds - 目标面子数量
 * @param {boolean} needPair - 是否需要对子
 * @returns {boolean} 是否能组成
 */
function canFormTenpaiStructure(counts, targetMelds, needPair = true) {
  // 深度复制，避免修改原对象
  const countsCopy = JSON.parse(JSON.stringify(counts));
  
  // 尝试组成：targetMelds 个面子 + 1 个对子（如果需要）
  return tryFormStructureRecursive(countsCopy, 0, targetMelds, !needPair);
}

/**
 * 递归尝试组成指定结构
 * @param {Object} counts - 计数对象
 * @param {number} meldsCount - 已组成的面子数
 * @param {number} targetMelds - 目标面子数量
 * @param {boolean} pairTaken - 是否已选对子
 * @returns {boolean} 是否能组成
 */
function tryFormStructureRecursive(counts, meldsCount, targetMelds, pairTaken) {
  // 检查是否已完成（targetMelds 个面子 + 1 个对子（如果需要））
  if (meldsCount === targetMelds && pairTaken) {
    // 检查是否所有牌都已用完
    const remaining = Object.values(counts).reduce((sum, count) => sum + Math.max(0, count), 0);
    return remaining === 0;
  }
  
  // 如果已经有足够的面子，只需要一个对子
  if (meldsCount === targetMelds) {
    // 查找对子
    for (const tileId in counts) {
      if (counts[tileId] >= 2) {
        const countsCopy = JSON.parse(JSON.stringify(counts));
        removePair(countsCopy, tileId);
        if (tryFormStructureRecursive(countsCopy, targetMelds, targetMelds, true)) {
          return true;
        }
      }
    }
    return false;
  }
  
  // 如果还没有选对子，尝试先选对子
  if (!pairTaken) {
    for (const tileId in counts) {
      if (counts[tileId] >= 2) {
        const countsCopy = JSON.parse(JSON.stringify(counts));
        removePair(countsCopy, tileId);
        if (tryFormStructureRecursive(countsCopy, meldsCount, targetMelds, true)) {
          return true;
        }
      }
    }
  }
  
  // 尝试刻子（三张相同）
  for (const tileId in counts) {
    if (counts[tileId] >= 3) {
      const countsCopy = JSON.parse(JSON.stringify(counts));
      removeTriplet(countsCopy, tileId);
      if (tryFormStructureRecursive(countsCopy, meldsCount + 1, targetMelds, pairTaken)) {
        return true;
      }
    }
  }
  
  // 尝试顺子（三张连续，只对数字牌）
  for (const tileId in counts) {
    if (counts[tileId] > 0) {
      const match = tileId.match(/^(tong|tiao|wan)(\d+)$/);
      if (match) {
        const suit = match[1];
        const rank = parseInt(match[2]);
        // 检查是否能形成顺子（rank, rank+1, rank+2）
        if (rank >= 1 && rank <= 7) {
          const tileId1 = `${suit}${rank}`;
          const tileId2 = `${suit}${rank + 1}`;
          const tileId3 = `${suit}${rank + 2}`;
          
          if ((counts[tileId1] || 0) > 0 && 
              (counts[tileId2] || 0) > 0 && 
              (counts[tileId3] || 0) > 0) {
            const countsCopy = JSON.parse(JSON.stringify(counts));
            removeSequence(countsCopy, suit, rank);
            if (tryFormStructureRecursive(countsCopy, meldsCount + 1, targetMelds, pairTaken)) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * 检测7张或10张手牌是否听牌
 * 使用通用方法：检查是否能组成 n 个面子 + 1 个对子
 * @param {Array<Object>} hand - 手牌数组
 * @param {number} displaySize - 手牌张数（7或10）
 * @returns {Object} { isTenpai: boolean, waitingTiles: Array<Object>, tenpaiType: string }
 */
export function detectTenpai7Or10(hand, displaySize) {
  if (!hand || displaySize !== hand.length || ![7, 10].includes(displaySize)) {
    return { isTenpai: false, waitingTiles: [], tenpaiType: null };
  }
  
  // 验证手牌有效性
  const counts = handToCounts(hand);
  const invalidTiles = Object.keys(counts).filter(tileId => counts[tileId] > 4);
  if (invalidTiles.length > 0) {
    return { isTenpai: false, waitingTiles: [], tenpaiType: null };
  }
  
  // 获取手牌中出现的花色
  const suits = new Set();
  hand.forEach(tile => {
    if (tile.suit !== SUITS.HONOR && [SUITS.WAN, SUITS.TONG, SUITS.TIAO].includes(tile.suit)) {
      suits.add(tile.suit);
    }
  });
  
  if (suits.size === 0) {
    return { isTenpai: false, waitingTiles: [], tenpaiType: null };
  }
  
  // 获取所有可能的待牌（只考虑手牌中出现的花色）
  const possibleTileIds = [];
  suits.forEach(suit => {
    for (let rank = 1; rank <= 9; rank++) {
      possibleTileIds.push(`${suit}${rank}`);
    }
  });
  
  // 转换为计数字典（使用tile.id格式）
  const handCounts = {};
  hand.forEach(tile => {
    const tileId = tile.id;
    handCounts[tileId] = (handCounts[tileId] || 0) + 1;
  });
  
  // 根据牌数确定目标面子数量
  // 7张听牌：7张 + 1张待牌 = 8张，需要组成 2个面子(6张) + 1个对子(2张) = 8张
  // 10张听牌：10张 + 1张待牌 = 11张，需要组成 3个面子(9张) + 1个对子(2张) = 11张
  const targetMelds = displaySize === 7 ? 2 : 3;
  
  // 对每种可能的牌，检查加入后是否能组成目标结构
  const waitingTileIds = new Set();
  
  possibleTileIds.forEach(tileId => {
    // 创建测试手牌（添加一张测试牌）
    const testCounts = JSON.parse(JSON.stringify(handCounts));
    testCounts[tileId] = (testCounts[tileId] || 0) + 1;
    
    // 检查是否能组成 targetMelds 个面子 + 1 个对子
    if (canFormTenpaiStructure(testCounts, targetMelds, true)) {
      waitingTileIds.add(tileId);
    }
  });
  
  // 将tileId转换为tile对象
  const waitingTiles = [];
  const seenIds = new Set();
  waitingTileIds.forEach(tileId => {
    const match = tileId.match(/^(tong|tiao|wan)(\d+)$/);
    if (match) {
      const suit = match[1];
      const rank = parseInt(match[2]);
      const tile = createTile(suit, rank);
      if (!seenIds.has(tile.id)) {
        seenIds.add(tile.id);
        waitingTiles.push(tile);
      }
    }
  });
  
  const isTenpai = waitingTiles.length > 0;
  const tenpaiType = isTenpai ? getTenpaiType(waitingTiles, hand) : null;
  
  return {
    isTenpai,
    waitingTiles,
    tenpaiType
  };
}

/**
 * 检测听牌
 * @param {Array<Object>} hand - 13张手牌
 * @returns {Object} { isTenpai: boolean, waitingTiles: Array<Object>, tenpaiType: string }
 */
export function detectTenpai(hand) {
  if (!hand || hand.length !== 13) {
    return { isTenpai: false, waitingTiles: [], tenpaiType: null };
  }
  
  // 验证手牌有效性
  if (!validateHand(hand)) {
    return { isTenpai: false, waitingTiles: [], tenpaiType: null };
  }
  
  const waitingTiles = new Set();
  const counts = handToCounts(hand);
  
  // 获取所有可能的待牌
  const possibleTiles = getAllPossibleTileIds(hand);
  
  // 对每种可能的牌，检查加入后是否能和牌
  possibleTiles.forEach(tileId => {
    const testCounts = JSON.parse(JSON.stringify(counts));
    testCounts[tileId] = (testCounts[tileId] || 0) + 1;
    
    if (canWin(testCounts)) {
      // 将tileId转换为tile对象
      let tile;
      if (HONOR_TILES.includes(tileId)) {
        tile = createTile(SUITS.HONOR, tileId);
      } else {
        const match = tileId.match(/^(tong|tiao|wan)(\d+)$/);
        if (match) {
          tile = createTile(match[1], parseInt(match[2]));
        }
      }
      if (tile) {
        waitingTiles.add(JSON.stringify(tile));
      }
    }
  });
  
  // 转换为数组并去重
  const waitingTilesArray = Array.from(waitingTiles).map(str => JSON.parse(str));
  
  // 去重（基于id）
  const uniqueWaitingTiles = [];
  const seenIds = new Set();
  waitingTilesArray.forEach(tile => {
    if (!seenIds.has(tile.id)) {
      seenIds.add(tile.id);
      uniqueWaitingTiles.push(tile);
    }
  });
  
  const isTenpai = uniqueWaitingTiles.length > 0;
  const tenpaiType = isTenpai ? getTenpaiType(uniqueWaitingTiles, hand) : null;
  
  return {
    isTenpai,
    waitingTiles: uniqueWaitingTiles,
    tenpaiType
  };
}

/**
 * 判断听牌类型
 * @param {Array<Object>} waitingTiles - 待牌数组
 * @param {Array<Object>} hand - 手牌数组
 * @returns {string} 听牌类型
 */
export function getTenpaiType(waitingTiles, hand) {
  if (waitingTiles.length === 0) return null;
  if (waitingTiles.length === 1) return '单骑听';
  
  // 按花色分组
  const bySuit = {};
  waitingTiles.forEach(tile => {
    const suit = tile.suit;
    if (!bySuit[suit]) {
      bySuit[suit] = [];
    }
    bySuit[suit].push(tile);
  });
  
  // 检查是否有多个花色的待牌
  const suitCount = Object.keys(bySuit).length;
  
  if (suitCount > 1) {
    // 多花色，可能是双碰听
    if (waitingTiles.length === 2) {
      return '双碰听';
    }
    return '多面听';
  }
  
  // 单花色
  const suit = Object.keys(bySuit)[0];
  const tiles = bySuit[suit];
  
  if (suit === SUITS.HONOR) {
    // 字牌只能是单骑听或双碰听
    return waitingTiles.length === 1 ? '单骑听' : '双碰听';
  }
  
  // 数字牌，按rank排序
  tiles.sort((a, b) => a.rank - b.rank);
  
  if (tiles.length === 2) {
    const [t1, t2] = tiles;
    const diff = t2.rank - t1.rank;
    
    if (diff === 1) {
      // 连续两张，检查是否是两面听
      if (t1.rank > 1 && t2.rank < 9) {
        return '两面听';
      }
      // 边张听
      if (t1.rank === 1 || t2.rank === 9) {
        return '边张听';
      }
    } else if (diff === 2) {
      // 中间差一张，嵌张听
      return '嵌张听';
    } else {
      // 不连续，可能是双碰听
      return '双碰听';
    }
  } else if (tiles.length === 3) {
    // 三面听
    const ranks = tiles.map(t => t.rank);
    const sorted = [...ranks].sort((a, b) => a - b);
    const [r1, r2, r3] = sorted;
    
    // 检查是否连续（如1,2,3）
    if (r2 - r1 === 1 && r3 - r2 === 1) {
      return '三面听';
    }
    // 检查是否等差（如1,4,7或2,5,8或3,6,9）- 710听牌
    if (r2 - r1 === 3 && r3 - r2 === 3) {
      return '三面听';
    }
    // 检查其他等差情况（如1,3,5或2,4,6等）
    if (r2 - r1 === r3 - r2 && r2 - r1 > 0) {
      return '三面听';
    }
    return '多面听';
  } else {
    // 四面听及以上
    return '多面听';
  }
  
  return '未知';
}


/**
 * 生成听牌手牌
 * @param {number} tileCount - 牌数（7/10/13）
 * @param {string} difficulty - 难度（easy/medium/hard/expert）
 * @param {number} maxAttempts - 最大尝试次数
 * @returns {Object} { hand: Array<Object>, waitingTiles: Array<Object>, tenpaiType: string }
 */
export function generateTenpaiHand(tileCount = 13, difficulty = 'easy', maxAttempts = 100) {
  // 根据难度选择可用的听牌类型
  const difficultyConfig = {
    easy: ['两面听', '单骑听'],
    medium: ['两面听', '单骑听', '嵌张听', '边张听', '双碰听'],
    hard: ['三面听', '两面听', '双碰听'],
    expert: ['三面听', '双碰听']
  };
  
  const availableTypes = difficultyConfig[difficulty] || difficultyConfig.easy;
  
  // 确定字牌刻子数量（用于7张和10张的隐藏）
  const honorTripletsCount = tileCount === 7 ? 2 : (tileCount === 10 ? 1 : 0);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    // 使用随机生成器生成指定张数的听牌
    // generateTenpaiByType(tenpaiType, displaySize, honorTripletsCount)
    const generated = generateTenpaiByType(selectedType, tileCount, honorTripletsCount);
    const fullHand = generated.hand;
    
    // 过滤掉字牌（字不显示）
    const displayHand = fullHand.filter(tile => tile.suit !== SUITS.HONOR);
    
    // 验证手牌是否真的听牌
    // 根据牌数选择使用不同的检测函数
    let detectResult;
    if (tileCount === 7 || tileCount === 10) {
      // 对于7张和10张，直接使用新的检测方法
      detectResult = detectTenpai7Or10(displayHand, tileCount);
    } else {
      // 对于13张，需要补足到13张才能检测（因为生成器可能生成少于13张）
      let handToDetect = fullHand;
      if (fullHand.length < 13) {
        // 补足到13张（添加字牌刻子）
        const honorSuits = ['dong', 'nan', 'xi', 'bei', 'bai', 'fa', 'zhong'];
        const needed = 13 - fullHand.length;
        for (let i = 0; i < needed; i++) {
          const honor = honorSuits[i % honorSuits.length];
          handToDetect.push(createTile(SUITS.HONOR, honor));
        }
      }
      detectResult = detectTenpai(handToDetect);
    }
    
    if (detectResult.isTenpai && detectResult.waitingTiles.length > 0) {
      // 待牌也过滤掉字牌
      const waitingTiles = detectResult.waitingTiles.filter(tile => tile.suit !== SUITS.HONOR);
      
      // 如果生成的待牌为空，使用生成器返回的待牌
      const finalWaitingTiles = waitingTiles.length > 0 ? waitingTiles : generated.waits;
      
      return {
        hand: displayHand,
        waitingTiles: finalWaitingTiles,
        tenpaiType: detectResult.tenpaiType || selectedType
      };
    }
  }
  
  // 降级处理
  return generateFallbackTenpaiHand(tileCount);
}

/**
 * 生成备用的听牌手牌（预定义）
 * @param {number} tileCount - 牌数
 * @returns {Object} { hand: Array<Object>, waitingTiles: Array<Object>, tenpaiType: string }
 */
function generateFallbackTenpaiHand(tileCount) {
  // 简单的两面听牌型：m123 m456 m789 s88 p56
  const fallbackHands = {
    13: [
      { suit: SUITS.WAN, rank: 1 },
      { suit: SUITS.WAN, rank: 2 },
      { suit: SUITS.WAN, rank: 3 },
      { suit: SUITS.WAN, rank: 4 },
      { suit: SUITS.WAN, rank: 5 },
      { suit: SUITS.WAN, rank: 6 },
      { suit: SUITS.WAN, rank: 7 },
      { suit: SUITS.WAN, rank: 8 },
      { suit: SUITS.WAN, rank: 9 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TONG, rank: 5 },
      { suit: SUITS.TONG, rank: 6 }
    ],
    10: [
      { suit: SUITS.WAN, rank: 1 },
      { suit: SUITS.WAN, rank: 2 },
      { suit: SUITS.WAN, rank: 3 },
      { suit: SUITS.WAN, rank: 4 },
      { suit: SUITS.WAN, rank: 5 },
      { suit: SUITS.WAN, rank: 6 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TONG, rank: 5 },
      { suit: SUITS.TONG, rank: 6 }
    ],
    7: [
      { suit: SUITS.WAN, rank: 1 },
      { suit: SUITS.WAN, rank: 2 },
      { suit: SUITS.WAN, rank: 3 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TIAO, rank: 8 },
      { suit: SUITS.TONG, rank: 5 },
      { suit: SUITS.TONG, rank: 6 }
    ]
  };
  
  const handTiles = fallbackHands[tileCount] || fallbackHands[13];
  const hand = handTiles.map(t => createTile(t.suit, t.rank));
  const waitingTiles = [
    createTile(SUITS.TONG, 4),
    createTile(SUITS.TONG, 7)
  ];
  
  return {
    hand,
    waitingTiles,
    tenpaiType: '两面听'
  };
}

