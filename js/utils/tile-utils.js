/**
 * 麻将牌工具函数文件 (tile-utils.js)
 * 
 * 这个文件提供了所有关于麻将牌的基础功能
 * 就像一本"牌类百科全书"，包含了：
 * - 牌的类型定义（筒、条、万、字牌）
 * - 创建牌对象
 * - 获取牌的图片路径
 * - 生成完整的牌堆
 * - 统计牌的数量
 * - 验证牌的合法性
 * 等等功能
 */

/**
 * 牌的花色常量定义
 * 
 * 麻将牌有四种基本类型：
 * - TONG: 筒子（圆形图案）
 * - TIAO: 条子（竹子图案）
 * - WAN: 万字（汉字"万"）
 * - HONOR: 字牌（东、南、西、北、白、发、中）
 * 
 * 这些常量用来标识牌的类型，在代码中统一使用，避免写错
 */
export const SUITS = {
  TONG: 'tong',  // 筒子牌
  TIAO: 'tiao',  // 条子牌
  WAN: 'wan',    // 万字牌
  HONOR: 'honor' // 字牌（风牌和箭牌）
};

/**
 * 花色的中文显示名称
 * 
 * 把英文代码转换成中文显示名，用于界面显示
 * 比如 SUITS.TONG 对应 "筒"
 */
export const SUIT_NAMES = {
  [SUITS.TONG]: '筒',   // tong -> 筒
  [SUITS.TIAO]: '条',   // tiao -> 条
  [SUITS.WAN]: '万',    // wan -> 万
  [SUITS.HONOR]: '字'   // honor -> 字
};

/**
 * 字牌类型数组
 * 
 * 麻将中有7种字牌：
 * - dong: 东
 * - nan: 南
 * - xi: 西
 * - bei: 北
 * - bai: 白板
 * - fa: 发财
 * - zhong: 红中
 * 
 * 这是一个数组，包含了所有字牌的类型代码
 */
export const HONOR_TILES = ['dong', 'nan', 'xi', 'bei', 'bai', 'fa', 'zhong'];

/**
 * 字牌的中文显示名称
 * 
 * 把字牌的英文代码转换成中文显示名
 * 比如 'dong' 对应 "东"，'bai' 对应 "白"
 */
export const HONOR_NAMES = {
  'dong': '东',   // 东风
  'nan': '南',    // 南风
  'xi': '西',     // 西风
  'bei': '北',    // 北风
  'bai': '白',    // 白板
  'fa': '发',     // 发财
  'zhong': '中'   // 红中
};

/**
 * 创建一张牌的对象
 * 
 * 这个函数就像"制造"一张牌，根据你提供的信息（花色和点数）创建一个牌对象
 * 牌对象包含三个属性：suit（花色）、rank（点数/字牌类型）、id（唯一标识）
 * 
 * @param {string} suit - 花色
 *   - 'tong': 筒子
 *   - 'tiao': 条子
 *   - 'wan': 万字
 *   - 'honor': 字牌
 * 
 * @param {number|string} rank - 点数或字牌类型
 *   - 对于筒/条/万：数字 1-9（比如 1筒、2条、9万）
 *   - 对于字牌：字符串，如 'dong', 'nan', 'bai' 等
 * 
 * @returns {Object} 返回一个牌对象，格式：
 *   {
 *     suit: 'tong',     // 花色
 *     rank: 1,          // 点数（数字牌）或字牌类型（字牌）
 *     id: 'tong1'       // 唯一标识符，用于区分不同的牌
 *   }
 * 
 * @throws {Error} 如果输入无效（比如花色不对、点数不在1-9范围、字牌类型不存在）
 * 
 * 使用示例：
 * createTile('tong', 1)          // 创建 1筒
 * createTile('wan', 9)           // 创建 9万
 * createTile('honor', 'dong')    // 创建 东风
 */
export function createTile(suit, rank) {
  // 如果是字牌，需要特殊处理
  if (suit === SUITS.HONOR) {
    // 检查字牌类型是否有效
    // includes 方法检查数组中是否包含某个值
    if (!HONOR_TILES.includes(rank)) {
      // 如果无效，抛出错误（停止执行，并显示错误信息）
      throw new Error(`Invalid honor tile: ${rank}`);
    }
    // 返回字牌对象
    // 字牌的 id 就是 rank 的值（如 'dong'），因为字牌没有数字
    return {
      suit: SUITS.HONOR,  // 花色是字牌
      rank: rank,         // rank 是字牌类型（如 'dong'）
      id: rank            // id 和 rank 相同（如 'dong'）
    };
  }
  
  // 对于数字牌（筒/条/万），需要验证花色和点数
  
  // 检查花色是否有效（必须是筒、条、万之一）
  if (![SUITS.TONG, SUITS.TIAO, SUITS.WAN].includes(suit)) {
    throw new Error(`Invalid suit: ${suit}`);
  }
  
  // 检查点数是否在1-9范围内
  if (rank < 1 || rank > 9) {
    throw new Error(`Invalid rank: ${rank}, must be 1-9`);
  }
  
  // 返回数字牌对象
  // id 是花色和点数的组合，如 'tong1', 'wan9'
  return {
    suit,                    // 花色（如 'tong'）
    rank,                    // 点数（如 1）
    id: `${suit}${rank}`     // 唯一标识（如 'tong1'）
    // ${} 是模板字符串语法，可以把变量值插入到字符串中
  };
}

/**
 * 获取牌的图片文件路径
 * 
 * 这个函数根据牌的花色和点数，返回对应的图片文件路径
 * 图片文件存放在 svg_materials 文件夹中
 * 
 * @param {string} suit - 花色（'tong', 'tiao', 'wan', 'honor'）
 * @param {number|string} rank - 点数（1-9）或字牌类型（'dong', 'bai' 等）
 * 
 * @returns {string} SVG 图片文件的相对路径
 * 
 * 规则：
 * - 字牌：svg_materials/dong.svg, svg_materials/bai.svg 等
 * - 数字牌：svg_materials/tong1.svg, svg_materials/wan9.svg 等
 * 
 * 使用示例：
 * getTileImagePath('tong', 1)        // 返回 "svg_materials/tong1.svg"
 * getTileImagePath('honor', 'dong')  // 返回 "svg_materials/dong.svg"
 */
export function getTileImagePath(suit, rank) {
  // 如果是字牌，文件名就是字牌类型
  if (suit === SUITS.HONOR) {
    return `svg_materials/${rank}.svg`;  // 如 "svg_materials/dong.svg"
  }
  // 如果是数字牌，文件名是花色+点数
  return `svg_materials/${suit}${rank}.svg`;  // 如 "svg_materials/tong1.svg"
}

/**
 * 获取牌的显示名称（中文）
 * 
 * 这个函数把牌对象转换成用户可以看懂的中文名称
 * 比如把 {suit: 'tong', rank: 1} 转换成 "1筒"
 * 
 * @param {Object} tile - 牌对象，必须包含 suit 和 rank 属性
 * 
 * @returns {string} 中文显示名称
 *   - 数字牌：如 "1筒", "9万", "5条"
 *   - 字牌：如 "东", "南", "白"
 * 
 * 使用示例：
 * const tile = createTile('tong', 1);
 * getTileDisplayName(tile)  // 返回 "1筒"
 * 
 * const honorTile = createTile('honor', 'dong');
 * getTileDisplayName(honorTile)  // 返回 "东"
 */
export function getTileDisplayName(tile) {
  // 如果是字牌，使用字牌名称映射
  if (tile.suit === SUITS.HONOR) {
    // HONOR_NAMES[tile.rank] 获取中文名，如果找不到就用 rank 的值
    // || 表示"或者"，如果前面的值是假值（null/undefined），就用后面的值
    return HONOR_NAMES[tile.rank] || tile.rank;
  }
  // 如果是数字牌，格式是"点数+花色名"
  // 如：1 + "筒" = "1筒"
  return `${tile.rank}${SUIT_NAMES[tile.suit]}`;
}

/**
 * 生成一副完整的牌（每种牌4张）
 * 
 * 这个函数就像"洗牌"前的准备工作，生成一副完整的麻将牌
 * 麻将规则：每种牌都有4张（比如有4张1筒，4张2条等）
 * 
 * @param {Array<string>} enabledSuits - 要包含的花色数组
 *   默认值：['tong', 'tiao', 'wan']（包含筒、条、万）
 *   可选值：'tong', 'tiao', 'wan', 'honor'
 *   例如：['tong', 'tiao'] 表示只生成筒子和条子
 * 
 * @param {boolean} includeHonor - 是否包含字牌
 *   默认值：false（不包含字牌）
 *   如果设置为 true，会在牌堆中添加所有字牌
 * 
 * @returns {Array<Object>} 返回一个数组，包含所有生成的牌对象
 *   例如：如果包含筒和条，会返回 72 张牌（9种筒×4 + 9种条×4 = 72）
 * 
 * 使用示例：
 * generateFullDeck(['tong', 'tiao'])  // 生成筒和条，共72张
 * generateFullDeck(['tong'], true)    // 生成筒和字牌
 */
export function generateFullDeck(enabledSuits = [SUITS.TONG, SUITS.TIAO, SUITS.WAN], includeHonor = false) {
  const deck = [];  // 空的牌堆数组，用来存放所有生成的牌
  const copiesPerTile = 4; // 每种牌的数量（麻将规则：每种牌4张）
  
  enabledSuits.forEach(suit => {
    if (suit === SUITS.HONOR || (includeHonor && suit === 'honor')) {
      HONOR_TILES.forEach(honorTile => {
        for (let copy = 0; copy < copiesPerTile; copy++) {
          deck.push(createTile(SUITS.HONOR, honorTile));
        }
      });
    } else {
      for (let rank = 1; rank <= 9; rank++) {
        for (let copy = 0; copy < copiesPerTile; copy++) {
          deck.push(createTile(suit, rank));
        }
      }
    }
  });
  
  return deck;
}

/**
 * 获取所有牌类型（用于记忆训练）
 * @param {Array<string>} enabledTypes - 启用的牌型 ['wan', 'tong', 'tiao', 'honor']
 * @returns {Array<Object>} 所有牌类型的数组
 */
export function getAllTileTypes(enabledTypes = ['wan', 'tong', 'tiao', 'honor']) {
  const tiles = [];
  
  enabledTypes.forEach(type => {
    if (type === 'honor') {
      HONOR_TILES.forEach(honorTile => {
        tiles.push(createTile(SUITS.HONOR, honorTile));
      });
    } else if ([SUITS.WAN, SUITS.TONG, SUITS.TIAO].includes(type)) {
      for (let rank = 1; rank <= 9; rank++) {
        tiles.push(createTile(type, rank));
      }
    }
  });
  
  return tiles;
}

/**
 * 从牌堆中随机抽取指定数量的牌
 * @param {Array<Object>} deck - 牌堆
 * @param {number} count - 要抽取的数量
 * @returns {Object} {drawn: 抽取的牌数组, remaining: 剩余的牌堆}
 */
export function drawTiles(deck, count) {
  const shuffled = [...deck].sort(() => Math.random() - 0.5);
  const drawn = shuffled.slice(0, count);
  const remaining = shuffled.slice(count);
  
  return { drawn, remaining };
}

/**
 * 统计牌数组中每种牌的数量
 * @param {Array<Object>} tiles - 牌数组
 * @returns {Object} 统计对象，如 {tong1: 2, tong2: 1, ...}
 */
/**
 * 统计牌数组中每种牌的数量
 * 
 * 这个函数会统计牌数组中每种牌出现了几次
 * 返回一个对象，键是牌的唯一标识，值是该牌的数量
 * 
 * @param {Array<Object>} tiles - 牌数组
 * @returns {Object} 统计结果对象
 *   格式：{ 'tong1': 2, 'tong2': 1, 'wan3': 3, ... }
 *   表示：1筒有2张，2筒有1张，3万有3张...
 * 
 * 使用示例：
 * const tiles = [createTile('tong', 1), createTile('tong', 1), createTile('tong', 2)];
 * countTiles(tiles)  // 返回 { 'tong1': 2, 'tong2': 1 }
 */
export function countTiles(tiles) {
  // 创建一个空对象，用来存储统计结果
  // 对象的键是牌的ID，值是该牌的数量
  const counts = {};
  
  // 遍历牌数组，统计每种牌的数量
  tiles.forEach(tile => {
    // 获取牌的唯一标识符
    // tile.id 是牌的ID（如果有的话）
    // 如果没有 id，就用 suit 和 rank 组合生成：`${tile.suit}${tile.rank}`
    // 例如：'tong1', 'wan9'
    const id = tile.id || `${tile.suit}${tile.rank}`;
    
    // 如果这种牌已经统计过，获取当前数量；如果没统计过，默认为0
    // counts[id] || 0 表示：如果 counts[id] 存在就用它，否则用0
    // 然后加1，表示又遇到一张这种牌
    // counts[id] = ... 把更新后的数量保存回对象
    counts[id] = (counts[id] || 0) + 1;
  });
  
  // 返回统计结果对象
  return counts;
}

/**
 * 计算剩余牌数（基于完整牌堆和已出现的牌）
 * @param {Array<string>} enabledTypes - 启用的牌型 ['wan', 'tong', 'tiao', 'honor']
 * @param {Array<Object>} appearedTiles - 已出现的牌数组
 * @returns {Object} 剩余牌统计，如 {tong1: 2, tong2: 4, dong: 3, ...}
 */
/**
 * 计算剩余牌数
 * 
 * 这个函数根据完整牌堆和已出现的牌，计算每种牌还剩多少张
 * 麻将规则：每种牌只有4张
 * 
 * @param {Array<string>} enabledTypes - 启用的牌型数组
 *   例如：['wan', 'tong'] 表示启用了万子和筒子
 * 
 * @param {Array<Object>} appearedTiles - 已出现的牌数组
 *   例如：已经打出的牌、已经摸到的牌等
 * 
 * @returns {Object} 剩余牌统计对象
 *   格式：{ 'tong1': 2, 'tong2': 4, 'dong': 3, ... }
 *   表示：1筒还剩2张，2筒还剩4张（没出现），东风还剩3张...
 * 
 * 计算逻辑：
 * 1. 先统计已出现的每种牌的数量
 * 2. 初始化所有牌为4张
 * 3. 从4张中减去已出现的数量，得到剩余数量
 */
export function calculateRemainingTiles(enabledTypes, appearedTiles) {
  // 先统计已出现的每种牌有多少张
  // countTiles 函数会返回一个对象，如 { 'tong1': 2, 'tong2': 1 }
  const appearedCounts = countTiles(appearedTiles);
  
  // 创建一个空对象，用来存储剩余牌数
  const remaining = {};
  
  // 初始化所有可能的牌为4张（因为每种牌最多4张）
  enabledTypes.forEach(type => {
    // 如果是字牌
    if (type === 'honor') {
      // 遍历所有字牌类型
      HONOR_TILES.forEach(honorTile => {
        // 初始化为4张（每种字牌最多4张）
        remaining[honorTile] = 4;
      });
    } 
    // 如果是数字牌（万/筒/条）
    else if ([SUITS.WAN, SUITS.TONG, SUITS.TIAO].includes(type)) {
      // 遍历1到9的所有点数
      for (let rank = 1; rank <= 9; rank++) {
        // 创建牌的ID（如 'tong1', 'wan9'）
        const id = `${type}${rank}`;
        
        // 初始化为4张
        remaining[id] = 4;
      }
    }
  });
  
  // 减去已出现的牌
  // Object.keys(appearedCounts) 获取所有已出现牌的ID
  // 遍历这些ID，从剩余数量中减去已出现的数量
  Object.keys(appearedCounts).forEach(id => {
    // hasOwnProperty 检查对象是否有这个属性
    // 只有当这种牌在剩余对象中存在时，才需要减去
    if (remaining.hasOwnProperty(id)) {
      // Math.max(0, ...) 确保剩余数量不会小于0
      // 剩余数量 = 初始4张 - 已出现的数量
      remaining[id] = Math.max(0, remaining[id] - appearedCounts[id]);
    }
  });
  
  // 返回剩余牌统计结果
  return remaining;
}

/**
 * 验证手牌数组是否有效（每种牌不超过4张）
 * @param {Array<Object>} tiles - 手牌数组
 * @returns {boolean} 是否有效
 */
export function validateHand(tiles) {
  const counts = countTiles(tiles);
  return Object.values(counts).every(count => count <= 4);
}

/**
 * 将牌数组转换为字符串表示（用于显示或存储）
 * @param {Array<Object>} tiles - 牌数组
 * @returns {string} 字符串表示，如 "m123p456s789"
 */
export function tilesToString(tiles) {
  const suitMap = {
    [SUITS.WAN]: 'm',
    [SUITS.TONG]: 'p',
    [SUITS.TIAO]: 's'
  };
  
  const grouped = {};
  tiles.forEach(tile => {
    const prefix = suitMap[tile.suit];
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push(tile.rank);
  });
  
  const parts = [];
  ['m', 'p', 's'].forEach(prefix => {
    if (grouped[prefix]) {
      grouped[prefix].sort((a, b) => a - b);
      parts.push(prefix + grouped[prefix].join(''));
    }
  });
  
  return parts.join('');
}

/**
 * 从字符串解析牌数组
 * @param {string} str - 字符串表示，如 "m123p456s789"
 * @returns {Array<Object>} 牌数组
 */
export function stringToTiles(str) {
  const suitMap = {
    'm': SUITS.WAN,
    'p': SUITS.TONG,
    's': SUITS.TIAO
  };
  
  const tiles = [];
  const pattern = /([mps])(\d+)/g;
  let match;
  
  while ((match = pattern.exec(str)) !== null) {
    const suit = suitMap[match[1]];
    const ranks = match[2].split('').map(Number);
    ranks.forEach(rank => {
      tiles.push(createTile(suit, rank));
    });
  }
  
  return tiles;
}

/**
 * 比较两张牌是否相同
 * @param {Object} tile1 - 牌1
 * @param {Object} tile2 - 牌2
 * @returns {boolean} 是否相同
 */
export function tilesEqual(tile1, tile2) {
  return tile1.suit === tile2.suit && tile1.rank === tile2.rank;
}

/**
 * 检查牌数组中是否包含指定牌
 * @param {Array<Object>} tiles - 牌数组
 * @param {Object} tile - 要查找的牌
 * @returns {boolean} 是否包含
 */
export function containsTile(tiles, tile) {
  return tiles.some(t => tilesEqual(t, tile));
}

