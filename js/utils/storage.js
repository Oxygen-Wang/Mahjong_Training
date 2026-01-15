/**
 * 本地存储工具文件 (storage.js)
 * 
 * 这个文件负责把数据保存到浏览器的本地存储（localStorage）中
 * 
 * localStorage 是什么？
 * - 就像浏览器的"小仓库"，可以保存一些数据
 * - 即使关闭浏览器，数据也不会丢失（直到手动清除）
 * - 只能保存字符串，所以需要把对象转换成 JSON 字符串
 * 
 * 主要功能：
 * 1. 保存训练成绩到排行榜
 * 2. 获取排行榜数据
 * 3. 清空排行榜
 * 4. 保存和读取用户配置（比如难度设置）
 * 
 * 为什么需要这个文件？
 * - 统一管理所有存储操作，避免代码重复
 * - 统一使用存储键名，避免冲突
 * - 统一错误处理，避免程序崩溃
 */

// 存储键名前缀，所有键名都会加上这个前缀，避免和其他网站的数据冲突
const STORAGE_PREFIX = 'mahjong_trainer_';
// 排行榜数据的键名
const LEADERBOARD_KEY = STORAGE_PREFIX + 'leaderboard';

/**
 * 保存成绩到本地存储
 * 
 * 这个函数会把训练成绩保存到浏览器的本地存储中
 * 保存后可以在排行榜中查看历史成绩
 * 
 * @param {string} mode - 训练模式名称
 *   例如：'memory'（记牌训练）、'tenpai'（听牌训练）等
 * 
 * @param {Object} result - 成绩对象，包含以下信息：
 *   @param {number} result.score - 得分（分数）
 *   @param {number} result.time - 用时（秒）
 *   @param {string} result.difficulty - 难度级别（'easy', 'medium', 'hard' 等）
 *   @param {Object} result.config - 其他配置信息（可选）
 * 
 * @returns {boolean} 返回 true 表示保存成功，false 表示保存失败
 * 
 * 保存的数据格式：
 * {
 *   id: '时间戳',          // 唯一标识
 *   mode: 'memory',        // 训练模式
 *   score: 85,             // 得分
 *   time: 120,             // 用时（秒）
 *   difficulty: 'easy',    // 难度
 *   config: {...},         // 配置信息
 *   timestamp: 'ISO时间',   // 保存时间（ISO格式）
 *   date: '中文时间'        // 保存时间（中文格式）
 * }
 */
export function saveScore(mode, result) {
  // 获取当前的排行榜数据
  // getLeaderboard() 会从 localStorage 中读取所有记录
  const leaderboard = getLeaderboard();
  
  // 创建一个新的成绩记录对象
  // 这个对象包含了这次训练的所有信息
  const entry = {
    id: Date.now().toString(),              // 唯一标识符，使用当前时间戳（毫秒）
                                           // toString() 把数字转换成字符串
    mode,                                  // 训练模式（如 'memory', 'tenpai'）
    score: result.score,                   // 得分
    time: result.time,                     // 用时（秒）
    difficulty: result.difficulty || 'unknown',  // 难度，如果没有就默认为 'unknown'
    config: result.config || {},           // 其他配置信息，如果没有就默认为空对象
    timestamp: new Date().toISOString(),   // ISO 格式的时间戳（国际标准时间格式）
                                           // 例如：'2024-01-01T12:00:00.000Z'
    date: new Date().toLocaleString('zh-CN')  // 中文格式的日期时间
                                           // 例如：'2024/1/1 20:00:00'
  };
  
  // 把新记录添加到排行榜数组的末尾
  // push 方法会把元素添加到数组的末尾
  leaderboard.push(entry);
  
  // 对排行榜进行排序
  // sort 方法会对数组进行排序，参数是一个比较函数
  // 比较函数返回负数表示 a 排在 b 前面，返回正数表示 a 排在 b 后面
  leaderboard.sort((a, b) => {
    // 首先按得分排序（降序：得分高的排在前面）
    // 如果两个记录的得分不同
    if (b.score !== a.score) {
      // 返回 b.score - a.score
      // 如果 b.score > a.score，返回正数，b 排在后面（实际上因为排序规则，这会正确排序）
      // 这里应该是 return a.score - b.score 才能降序，但原代码是这样写的，可能是有特殊考虑
      // 实际上，如果 b.score > a.score，返回正数意味着 a 应该排在 b 后面
      // 所以 b.score - a.score 确实能实现降序（分数高的在前面）
      return b.score - a.score;
    }
    // 如果得分相同，按用时排序（升序：用时短的排在前面）
    // a.time - b.time 如果 a.time < b.time，返回负数，a 排在前面
    return a.time - b.time;
  });
  
  // 只保留前100条记录
  // slice(0, 100) 截取数组的前100个元素
  // 这样可以避免存储太多数据，节省空间
  const trimmed = leaderboard.slice(0, 100);
  
  // 尝试保存到本地存储
  // try...catch 是错误处理机制，如果出错不会让程序崩溃
  try {
    // localStorage.setItem(key, value) 保存数据
    // key 是键名，value 必须是字符串
    // JSON.stringify(trimmed) 把对象数组转换成 JSON 字符串
    // 因为 localStorage 只能存储字符串，不能直接存储对象
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
    
    // 保存成功，返回 true
    return true;
  } catch (e) {
    // 如果保存失败（比如存储空间已满），捕获错误
    // console.error 在控制台输出错误信息（开发者调试用）
    console.error('Failed to save score:', e);
    
    // 返回 false 表示保存失败
    return false;
  }
}

/**
 * 获取排行榜数据
 * @param {string} mode - 可选，筛选特定模式
 * @param {number} limit - 可选，限制返回数量
 * @returns {Array<Object>} 成绩数组
 */
/**
 * 获取排行榜数据
 * 
 * 从本地存储中读取排行榜数据，可以根据模式筛选，可以限制返回数量
 * 
 * @param {string} mode - 可选，筛选特定训练模式（如 'memory'）
 *                        如果为 null，返回所有模式的记录
 * @param {number} limit - 可选，限制返回的记录数量
 *                         如果为 null，返回所有记录
 * @returns {Array<Object>} 返回成绩数组，每条记录包含得分、用时等信息
 */
export function getLeaderboard(mode = null, limit = null) {
  // 使用 try...catch 处理可能的错误（比如数据格式错误）
  try {
    // 从 localStorage 中读取排行榜数据
    // getItem 方法根据键名获取存储的数据
    // 如果数据不存在，返回 null
    const data = localStorage.getItem(LEADERBOARD_KEY);
    
    // 如果数据不存在，返回空数组
    if (!data) {
      return [];
    }
    
    // 把 JSON 字符串转换成 JavaScript 对象
    // JSON.parse 是 JSON 的反向操作，把字符串转回对象
    let leaderboard = JSON.parse(data);
    
    // 如果指定了模式，筛选出该模式的记录
    // filter 方法会遍历数组，只保留满足条件的元素
    // entry => entry.mode === mode 是一个函数，检查 entry.mode 是否等于 mode
    if (mode) {
      leaderboard = leaderboard.filter(entry => entry.mode === mode);
    }
    
    // 如果指定了限制数量，只返回前 limit 条记录
    // slice(0, limit) 截取数组的前 limit 个元素
    if (limit) {
      leaderboard = leaderboard.slice(0, limit);
    }
    
    // 返回处理后的排行榜数据
    return leaderboard;
  } catch (e) {
    // 如果读取或解析失败（比如数据格式错误），捕获错误
    // 在控制台输出错误信息
    console.error('Failed to get leaderboard:', e);
    
    // 返回空数组，避免程序崩溃
    return [];
  }
}

/**
 * 清空排行榜
 * @param {string} mode - 可选，只清空特定模式
 */
export function clearLeaderboard(mode = null) {
  if (mode) {
    const leaderboard = getLeaderboard();
    const filtered = leaderboard.filter(entry => entry.mode !== mode);
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Failed to clear leaderboard:', e);
      return false;
    }
  } else {
    try {
      localStorage.removeItem(LEADERBOARD_KEY);
      return true;
    } catch (e) {
      console.error('Failed to clear leaderboard:', e);
      return false;
    }
  }
}

/**
 * 获取指定模式的最高分
 * @param {string} mode - 训练模式
 * @returns {Object|null} 最高分记录
 */
export function getBestScore(mode) {
  const leaderboard = getLeaderboard(mode, 1);
  return leaderboard.length > 0 ? leaderboard[0] : null;
}

/**
 * 获取统计信息
 * @param {string} mode - 可选，筛选特定模式
 * @returns {Object} 统计信息
 */
export function getStats(mode = null) {
  const leaderboard = getLeaderboard(mode);
  
  if (leaderboard.length === 0) {
    return {
      totalGames: 0,
      averageScore: 0,
      bestScore: 0,
      averageTime: 0
    };
  }
  
  const scores = leaderboard.map(e => e.score);
  const times = leaderboard.map(e => e.time);
  
  return {
    totalGames: leaderboard.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    bestScore: Math.max(...scores),
    averageTime: times.reduce((a, b) => a + b, 0) / times.length
  };
}

/**
 * 保存用户配置
 * @param {string} key - 配置键
 * @param {*} value - 配置值
 */
export function saveConfig(key, value) {
  try {
    const configKey = STORAGE_PREFIX + 'config_' + key;
    localStorage.setItem(configKey, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Failed to save config:', e);
    return false;
  }
}

/**
 * 获取用户配置
 * @param {string} key - 配置键
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
export function getConfig(key, defaultValue = null) {
  try {
    const configKey = STORAGE_PREFIX + 'config_' + key;
    const data = localStorage.getItem(configKey);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Failed to get config:', e);
    return defaultValue;
  }
}

