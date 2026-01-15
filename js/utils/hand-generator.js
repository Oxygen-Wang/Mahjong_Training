/**
 * 手牌生成工具文件 (hand-generator.js)
 * 
 * 这个文件专门用于生成听牌手牌
 * 根据已测试的 Python 代码实现
 * 
 * 主要功能：
 * 1. 生成指定张数的听牌手牌（7张、10张或13张）
 * 2. 生成同花色的听牌（只使用万/筒/条中的一种花色）
 * 3. 计算待牌（能和的牌）
 * 4. 确保每种牌不超过4张
 * 
 * 听牌类型：
 * - 两面听：如 2万3万，听 1万和4万
 * - 单骑听：如 1万1万1万，听 1万
 * - 三面听：可以听三张不同的牌
 * - 嵌张听：如 1万3万，听 2万
 * - 边张听：如 1万2万，听 3万（或 8万9万，听 7万）
 * - 双碰听：两个对子，听两张牌
 */

import { createTile, SUITS } from './tile-utils.js';

const SUITS_ARRAY = [SUITS.WAN, SUITS.TONG, SUITS.TIAO];

/**
 * 生成指定数量的面子（顺子或刻子）
 * 
 * @param {number} numMelds - 要生成的面子数量
 * @param {string} suit - 指定花色，如果为null则随机选择
 * @param {Array<number>} excludeRanks - 排除的rank列表，避免与两面搭子冲突
 * @param {Object} rankCounts - 已使用的rank计数字典，用于确保每种牌不超过4张
 * @returns {Array<Object>} 面子牌列表
 */
function genMelds(numMelds, suit = null, excludeRanks = [], rankCounts = {}) {
  if (!suit) {
    suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  }
  
  const hand = [];
  const usedRanks = new Set(excludeRanks);
  
  // 生成指定数量的面子
  let generated = 0;
  let attempts = 0;
  const maxTotalAttempts = 200;
  
  while (generated < numMelds && attempts < maxTotalAttempts) {
    attempts++;
    // 随机选择生成顺子或刻子
    const meldType = Math.random() < 0.5 ? 'shunzi' : 'kezi';
    
    if (meldType === 'shunzi') {
      // 尝试生成顺子（连续三张）
      const start = Math.floor(Math.random() * 7) + 1; // 1-7，保证能形成顺子
      const ranks = [start, start + 1, start + 2];
      // 检查是否与排除列表冲突，以及每种牌是否不超过4张
      const hasConflict = ranks.some(r => usedRanks.has(r));
      const hasOverLimit = ranks.some(r => (rankCounts[r] || 0) >= 4);
      
      if (!hasConflict && !hasOverLimit) {
        ranks.forEach(r => {
          hand.push(createTile(suit, r));
          usedRanks.add(r);
          rankCounts[r] = (rankCounts[r] || 0) + 1;
        });
        generated++;
      }
    } else {
      // 尝试生成刻子（三张相同）
      const rank = Math.floor(Math.random() * 9) + 1;
      // 检查是否与排除列表冲突，以及该牌是否不超过4张（刻子需要3张）
      if (!usedRanks.has(rank) && (rankCounts[rank] || 0) < 2) { // 刻子需要3张，所以已有数量要<2
        for (let i = 0; i < 3; i++) {
          hand.push(createTile(suit, rank));
        }
        usedRanks.add(rank);
        rankCounts[rank] = (rankCounts[rank] || 0) + 3;
        generated++;
      }
    }
  }
  
  // 如果无法生成足够的面子，用刻子补足
  while (generated < numMelds) {
    let found = false;
    for (let rank = 1; rank <= 9; rank++) {
      if (!usedRanks.has(rank) && (rankCounts[rank] || 0) < 2) {
        for (let i = 0; i < 3; i++) {
          hand.push(createTile(suit, rank));
        }
        usedRanks.add(rank);
        rankCounts[rank] = (rankCounts[rank] || 0) + 3;
        generated++;
        found = true;
        break;
      }
    }
    if (!found) {
      break; // 无法生成更多面子
    }
  }
  
  return hand;
}

/**
 * 生成两面听
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genLiangmian(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  // base范围2-7，可以生成所有类型的两面听
  const base = Math.floor(Math.random() * 6) + 2; // 2-7
  
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 根据牌数确定面子数量
  const numMelds = { 7: 1, 10: 2, 13: 3 }[displaySize] || 3;
  
  // 生成面子，排除两面搭子使用的rank及可能形成更大顺子的rank
  // 排除base-1, base, base+1, base+2，避免与两面搭子形成更大的顺子
  const excludeRanks = [base - 1, base, base + 1, base + 2].filter(r => r >= 1 && r <= 9);
  hand.push(...genMelds(numMelds, suit, excludeRanks, rankCounts));
  
  // 对子（使用同一个花色，确保不超过4张）
  let availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => !excludeRanks.includes(r) && (rankCounts[r] || 0) < 2);
  
  let pairRank;
  if (availableRanks.length > 0) {
    pairRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个数量最少的
    const candidateRanks = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(r => !excludeRanks.includes(r));
    if (candidateRanks.length > 0) {
      pairRank = candidateRanks.reduce((min, r) => 
        (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min
      );
    } else {
      pairRank = 1; // 默认值
    }
  }
  
  hand.push(createTile(suit, pairRank));
  hand.push(createTile(suit, pairRank));
  rankCounts[pairRank] = (rankCounts[pairRank] || 0) + 2;
  
  // 两面搭子（检查数量限制，确保不超过4张）
  if ((rankCounts[base] || 0) < 4 && (rankCounts[base + 1] || 0) < 4) {
    hand.push(createTile(suit, base));
    hand.push(createTile(suit, base + 1));
    rankCounts[base] = (rankCounts[base] || 0) + 1;
    rankCounts[base + 1] = (rankCounts[base + 1] || 0) + 1;
  }
  
  const waits = [
    createTile(suit, base - 1),
    createTile(suit, base + 2)
  ];
  
  return { hand, waits };
}

/**
 * 生成单骑听（单吊）
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genDanqi(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 根据牌数确定面子数量
  const numMelds = { 7: 2, 10: 3, 13: 4 }[displaySize] || 4;
  
  // 生成面子
  hand.push(...genMelds(numMelds, suit, [], rankCounts));
  
  // 生成一张孤张（单张）
  // 找一个在手牌中未使用的rank作为孤张，确保是真正的"孤张"
  let unusedRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => (rankCounts[r] || 0) === 0);
  
  let waitRank;
  if (unusedRanks.length > 0) {
    waitRank = unusedRanks[Math.floor(Math.random() * unusedRanks.length)];
  } else {
    // 如果所有rank都已使用，找一个数量最少的
    waitRank = Array.from({ length: 9 }, (_, i) => i + 1)
      .reduce((min, r) => (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min, 1);
  }
  
  hand.push(createTile(suit, waitRank));
  rankCounts[waitRank] = (rankCounts[waitRank] || 0) + 1;
  
  const waits = [createTile(suit, waitRank)];
  
  return { hand, waits };
}

/**
 * 生成三面听
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genSanmian(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 五连张的base范围：2-4，保证base-1 >= 1, base+5 <= 9
  const base = Math.floor(Math.random() * 3) + 2; // 2-4
  
  // 生成五连张（5张）
  for (let i = 0; i < 5; i++) {
    const rank = base + i;
    hand.push(createTile(suit, rank));
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }
  
  // 根据牌数确定额外面子数量
  const numExtraMelds = { 7: 0, 10: 1, 13: 2 }[displaySize] || 2;
  
  // 生成额外的面子（排除五连张使用的rank，避免冲突）
  const excludeRanks = Array.from({ length: 5 }, (_, i) => base + i);
  if (numExtraMelds > 0) {
    hand.push(...genMelds(numExtraMelds, suit, excludeRanks, rankCounts));
  }
  
  // 生成对子（排除五连张使用的rank）
  let availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => !excludeRanks.includes(r) && (rankCounts[r] || 0) < 2);
  
  let pairRank;
  if (availableRanks.length > 0) {
    pairRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个数量最少的
    const candidateRanks = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(r => !excludeRanks.includes(r));
    if (candidateRanks.length > 0) {
      pairRank = candidateRanks.reduce((min, r) => 
        (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min
      );
    } else {
      pairRank = 1; // 默认值
    }
  }
  
  hand.push(createTile(suit, pairRank));
  hand.push(createTile(suit, pairRank));
  rankCounts[pairRank] = (rankCounts[pairRank] || 0) + 2;
  
  // 三面听待牌
  const waits = [
    createTile(suit, base - 1),
    createTile(suit, base + 2),
    createTile(suit, base + 5)
  ];
  
  return { hand, waits };
}

/**
 * 生成嵌张听（坎张）
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genKanchan(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 根据牌数确定面子数量
  const numMelds = { 7: 1, 10: 2, 13: 3 }[displaySize] || 3;
  
  // 坎张搭子的base范围：2-7，保证base+2 <= 9
  const base = Math.floor(Math.random() * 6) + 2; // 2-7
  
  // 生成面子，排除坎张搭子使用的rank（base, base+1, base+2）
  // 避免与坎张搭子形成更大的顺子
  const excludeRanks = [base, base + 1, base + 2].filter(r => r >= 1 && r <= 9);
  hand.push(...genMelds(numMelds, suit, excludeRanks, rankCounts));
  
  // 生成对子（排除坎张搭子使用的rank）
  let availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => !excludeRanks.includes(r) && (rankCounts[r] || 0) < 2);
  
  let pairRank;
  if (availableRanks.length > 0) {
    pairRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个数量最少的
    const candidateRanks = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(r => !excludeRanks.includes(r));
    if (candidateRanks.length > 0) {
      pairRank = candidateRanks.reduce((min, r) => 
        (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min
      );
    } else {
      pairRank = 1; // 默认值
    }
  }
  
  hand.push(createTile(suit, pairRank));
  hand.push(createTile(suit, pairRank));
  rankCounts[pairRank] = (rankCounts[pairRank] || 0) + 2;
  
  // 坎张搭子（检查数量限制，确保不超过4张）
  if ((rankCounts[base] || 0) < 4 && (rankCounts[base + 2] || 0) < 4) {
    hand.push(createTile(suit, base));
    hand.push(createTile(suit, base + 2));
    rankCounts[base] = (rankCounts[base] || 0) + 1;
    rankCounts[base + 2] = (rankCounts[base + 2] || 0) + 1;
  }
  
  // 嵌张听待牌（1张）
  const waits = [createTile(suit, base + 1)];
  
  return { hand, waits };
}

/**
 * 生成边张听
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genBianzhang(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 根据牌数确定面子数量
  const numMelds = { 7: 1, 10: 2, 13: 3 }[displaySize] || 3;
  
  // 边张搭子有两种：12听3 或 89听7
  const edgeType = Math.random() < 0.5 ? 'low' : 'high'; // low: 12听3, high: 89听7
  
  let edgeRanks, waitRank;
  if (edgeType === 'low') {
    // 边张12，听3
    edgeRanks = [1, 2];
    waitRank = 3;
  } else {
    // 边张89，听7
    edgeRanks = [8, 9];
    waitRank = 7;
  }
  
  // 生成面子，排除边张搭子使用的rank（避免冲突）
  const excludeRanks = [...edgeRanks, waitRank].filter(r => r >= 1 && r <= 9);
  hand.push(...genMelds(numMelds, suit, excludeRanks, rankCounts));
  
  // 生成对子（排除边张搭子使用的rank）
  let availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => !excludeRanks.includes(r) && (rankCounts[r] || 0) < 2);
  
  let pairRank;
  if (availableRanks.length > 0) {
    pairRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个数量最少的
    const candidateRanks = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(r => !excludeRanks.includes(r));
    if (candidateRanks.length > 0) {
      pairRank = candidateRanks.reduce((min, r) => 
        (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min
      );
    } else {
      pairRank = 1; // 默认值
    }
  }
  
  hand.push(createTile(suit, pairRank));
  hand.push(createTile(suit, pairRank));
  rankCounts[pairRank] = (rankCounts[pairRank] || 0) + 2;
  
  // 边张搭子（检查数量限制，确保不超过4张）
  if ((rankCounts[edgeRanks[0]] || 0) < 4 && (rankCounts[edgeRanks[1]] || 0) < 4) {
    hand.push(createTile(suit, edgeRanks[0]));
    hand.push(createTile(suit, edgeRanks[1]));
    rankCounts[edgeRanks[0]] = (rankCounts[edgeRanks[0]] || 0) + 1;
    rankCounts[edgeRanks[1]] = (rankCounts[edgeRanks[1]] || 0) + 1;
  }
  
  // 边张听待牌（1张）
  const waits = [createTile(suit, waitRank)];
  
  return { hand, waits };
}

/**
 * 生成双碰听（对倒）
 * 
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
function genDuipeng(displaySize = 13) {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  const hand = [];
  const rankCounts = {}; // 跟踪每种牌的数量，确保不超过4
  
  // 根据牌数确定面子数量
  const numMelds = { 7: 1, 10: 2, 13: 3 }[displaySize] || 3;
  
  // 生成面子
  hand.push(...genMelds(numMelds, suit, [], rankCounts));
  
  // 生成两个对子（确保不重复且不超过4张）
  let p1, p2;
  
  // 第一个对子
  let availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => (rankCounts[r] || 0) < 2);
  
  if (availableRanks.length > 0) {
    p1 = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个数量最少的
    p1 = Array.from({ length: 9 }, (_, i) => i + 1)
      .reduce((min, r) => (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min, 1);
  }
  
  hand.push(createTile(suit, p1));
  hand.push(createTile(suit, p1));
  rankCounts[p1] = (rankCounts[p1] || 0) + 2;
  
  // 第二个对子（不能与第一个相同）
  availableRanks = Array.from({ length: 9 }, (_, i) => i + 1)
    .filter(r => r !== p1 && (rankCounts[r] || 0) < 2);
  
  if (availableRanks.length > 0) {
    p2 = availableRanks[Math.floor(Math.random() * availableRanks.length)];
  } else {
    // 如果找不到完全可用的rank，找一个与p1不同且数量最少的
    const candidateRanks = Array.from({ length: 9 }, (_, i) => i + 1)
      .filter(r => r !== p1);
    if (candidateRanks.length > 0) {
      p2 = candidateRanks.reduce((min, r) => 
        (rankCounts[r] || 0) < (rankCounts[min] || 0) ? r : min
      );
    } else {
      p2 = p1 === 1 ? 2 : 1; // 默认值
    }
  }
  
  hand.push(createTile(suit, p2));
  hand.push(createTile(suit, p2));
  rankCounts[p2] = (rankCounts[p2] || 0) + 2;
  
  // 双碰听待牌（两个对子中的任意一张）
  const waits = [
    createTile(suit, p1),
    createTile(suit, p2)
  ];
  
  return { hand, waits };
}

/**
 * 根据听牌类型生成听牌手牌
 * 
 * @param {string} tenpaiType - 听牌类型（'两面听'、'单骑听'、'三面听'、'嵌张听'、'边张听'、'双碰听'）
 * @param {number} displaySize - 显示牌数（7/10/13）
 * @param {number} honorTripletsCount - 字牌刻子数量（用于7张和10张的隐藏）
 * @returns {Object} { hand: Array<Object>, waits: Array<Object> }
 */
export function generateTenpaiByType(tenpaiType, displaySize = 13, honorTripletsCount = 0) {
  let result;
  
  switch (tenpaiType) {
    case '两面听':
      result = genLiangmian(displaySize);
      break;
    case '单骑听':
      result = genDanqi(displaySize);
      break;
    case '三面听':
      result = genSanmian(displaySize);
      break;
    case '嵌张听':
      result = genKanchan(displaySize);
      break;
    case '边张听':
      result = genBianzhang(displaySize);
      break;
    case '双碰听':
      result = genDuipeng(displaySize);
      break;
    default:
      // 默认使用两面听
      result = genLiangmian(displaySize);
  }
  
  // 如果需要添加字牌刻子（用于7张和10张的隐藏）
  if (honorTripletsCount > 0) {
    const honorSuits = ['dong', 'nan', 'xi', 'bei', 'bai', 'fa', 'zhong'];
    for (let i = 0; i < honorTripletsCount; i++) {
      const honor = honorSuits[i % honorSuits.length];
      for (let j = 0; j < 3; j++) {
        result.hand.push(createTile(SUITS.HONOR, honor));
      }
    }
  }
  
  // 洗牌
  result.hand = shuffleTiles(result.hand);
  
  return result;
}

/**
 * 洗牌
 * @param {Array<Object>} tiles - 牌数组
 * @returns {Array<Object>} 洗牌后的数组
 */
function shuffleTiles(tiles) {
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 听牌模式常量
 */
export const TENPAI_PATTERNS = {
  LIANGMIAN: '两面听',
  DANQI: '单骑听',
  SANMIAN: '三面听',
  KANCHAN: '嵌张听',
  BIANZHANG: '边张听',
  DUIPENG: '双碰听'
};

/**
 * 生成听牌手牌（兼容旧接口）
 * @param {number} count - 牌的张数（7/10/13）
 * @param {string} suit - 指定花色（可选）
 * @returns {Object} { hand: 手牌数组, waiting: 待牌数组 }
 */
export function generateTenpai(count, suit = null) {
  const displaySize = count;
  
  // 随机选择听牌类型
  const types = ['两面听', '单骑听', '三面听', '嵌张听', '边张听', '双碰听'];
  const selectedType = types[Math.floor(Math.random() * types.length)];
  
  const result = generateTenpaiByType(selectedType, displaySize, 0);
  
  return {
    hand: result.hand,
    waiting: result.waits
  };
}

/**
 * 生成所有支持的张数的听牌示例
 * @returns {Object} 包含7、10、13张牌示例的对象
 */
export function generateAllExamples() {
  const suit = SUITS_ARRAY[Math.floor(Math.random() * SUITS_ARRAY.length)];
  
  return {
    7: generateTenpai(7, suit),
    10: generateTenpai(10, suit),
    13: generateTenpai(13, suit)
  };
}

/**
 * 验证手牌是否符合麻将规则
 * @param {Array} hand - 手牌数组
 * @returns {boolean} 是否有效
 */
export function validateHand(hand) {
  // 检查牌数是否为7、10或13张
  if (hand.length !== 7 && hand.length !== 10 && hand.length !== 13) {
    return false;
  }
  
  // 检查是否同花色（数字牌部分）
  const suits = [...new Set(hand.map(t => t.suit))];
  const validSuits = [SUITS.WAN, SUITS.TONG, SUITS.TIAO, SUITS.HONOR];
  
  // 检查所有花色是否合法
  if (!suits.every(s => validSuits.includes(s))) {
    return false;
  }
  
  // 检查数字范围（点数应该在1-9之间，字牌除外）
  const numbers = hand.filter(t => t.suit !== SUITS.HONOR).map(t => t.rank);
  if (numbers.some(n => n < 1 || n > 9)) {
    return false;
  }
  
  // 检查每种牌不超过4张（麻将规则：每种牌只有4张）
  const countMap = new Map();
  
  hand.forEach(t => {
    const key = t.id || `${t.suit}-${t.rank}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });
  
  return [...countMap.values()].every(count => count <= 4);
}
