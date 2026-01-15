/**
 * 计时器工具文件 (timer.js)
 * 
 * 这个文件提供了计时器的功能，就像生活中的秒表或倒计时器
 * 
 * 主要功能：
 * 1. 创建倒计时器（比如30秒倒计时，到时间自动停止）
 * 2. 创建普通计时器（记录用了多少时间，比如5分30秒）
 * 3. 暂停和恢复计时
 * 4. 格式化时间显示（把秒数转换成"分:秒"格式）
 */

/**
 * 创建计时器函数
 * 
 * 这个函数创建一个计时器对象，可以用来计时或倒计时
 * 
 * @param {Object} options - 配置选项对象
 *   @param {number} options.duration - 持续时间（单位：秒）
 *                                     如果设置为 0，表示不限时，一直计时下去
 *                                     如果设置为正数，比如 30，表示倒计时30秒
 *   @param {Function} options.onTick - 每次更新时间的回调函数
 *                                      函数接收两个参数：(remaining剩余时间, elapsed已用时间)
 *                                      每0.1秒会调用一次这个函数
 *   @param {Function} options.onFinish - 倒计时结束时的回调函数
 *                                        当倒计时到0时，会自动调用这个函数
 * 
 * @returns {Object} 返回一个计时器对象，包含 start、pause、resume、stop 等方法
 * 
 * 使用示例：
 * const timer = createTimer({
 *   duration: 30,  // 30秒倒计时
 *   onTick: (remaining) => console.log('剩余:', remaining),
 *   onFinish: () => console.log('时间到！')
 * });
 * timer.start();  // 开始计时
 */
export function createTimer(options = {}) {
  // 从配置对象中提取参数，如果没提供就用默认值
  // duration 默认是 0（不限时）
  // onTick 和 onFinish 默认是空函数（什么都不做）
  const {
    duration = 0,        // 持续时间，0表示不限时
    onTick = () => {},   // 每次更新时的回调函数，默认什么都不做
    onFinish = () => {}  // 完成时的回调函数，默认什么都不做
  } = options;
  
  // 内部状态变量，用于记录计时器的各种状态
  let startTime = null;    // 开始计时的时间戳（毫秒）
  let elapsed = 0;         // 已经过去的时间（秒）
  let intervalId = null;   // 定时器的ID，用于停止定时器
  let isRunning = false;   // 是否正在运行
  let isPaused = false;    // 是否已暂停
  
  /**
   * 计时器对象
   * 
   * 这个对象包含了控制计时器的所有方法
   * 就像遥控器控制电视一样，用这些方法控制计时器
   */
  const timer = {
    /**
     * 开始计时方法
     * 
     * 如果计时器已经在运行，直接返回（防止重复启动）
     * 否则设置开始时间，启动定时器，每0.1秒更新一次
     */
    start() {
      // 如果已经在运行，就不要重复启动了
      if (isRunning) return;
      
      // 计算开始时间
      // Date.now() 获取当前时间戳（毫秒）
      // 如果之前有暂停过，需要减去已经过去的时间，这样恢复时才能继续计时
      startTime = Date.now() - (elapsed * 1000);
      isRunning = true;   // 标记为运行中
      isPaused = false;   // 标记为未暂停
      
      // 使用 setInterval 创建一个定时器，每100毫秒（0.1秒）执行一次
      intervalId = setInterval(() => {
        const now = Date.now();  // 获取当前时间
        // 计算已经过去的时间（秒）
        // (now - startTime) / 1000 把毫秒转换成秒，Math.floor 向下取整
        elapsed = Math.floor((now - startTime) / 1000);
        
        // 如果是倒计时模式（duration > 0）
        if (duration > 0) {
          // 计算剩余时间（总时长 - 已用时间）
          // Math.max(0, ...) 确保剩余时间不会小于0
          const remaining = Math.max(0, duration - elapsed);
          
          // 调用回调函数，通知外部时间更新了
          // 传入剩余时间和已用时间
          onTick(remaining, elapsed);
          
          // 如果剩余时间为0，说明倒计时结束了
          if (remaining === 0) {
            timer.stop();   // 停止计时器
            onFinish();     // 调用完成回调函数
          }
        } else {
          // 如果是不限时模式（duration === 0），只传入已用时间
          // remaining 传入 null 表示没有剩余时间限制
          onTick(null, elapsed);
        }
      }, 100); // 每100毫秒（0.1秒）更新一次，这样显示会更流畅
      
      // 返回计时器对象本身，方便链式调用（比如 timer.start().pause()）
      return timer;
    },
    
    /**
     * 暂停计时方法
     * 
     * 暂停当前正在运行的计时器
     * 保存当前已用时间，停止定时器
     */
    pause() {
      // 如果没在运行或者已经暂停了，就不需要暂停
      if (!isRunning || isPaused) return;
      
      // 停止定时器
      clearInterval(intervalId);
      // 保存当前已经过去的时间（秒）
      elapsed = Math.floor((Date.now() - startTime) / 1000);
      isPaused = true;    // 标记为已暂停
      isRunning = false;  // 标记为未运行
      
      return timer;
    },
    
    /**
     * 恢复计时方法
     * 
     * 从暂停状态恢复计时
     * 重新设置开始时间（要减去已用时间），重新启动定时器
     */
    resume() {
      // 如果没暂停，就不需要恢复
      if (!isPaused) return;
      
      // 重新计算开始时间（当前时间 - 已用时间）
      // 这样恢复后，计时器会从之前暂停的位置继续
      startTime = Date.now() - (elapsed * 1000);
      isPaused = false;   // 标记为未暂停
      isRunning = true;   // 标记为运行中
      
      // 重新启动定时器（代码和 start 方法中一样）
      intervalId = setInterval(() => {
        const now = Date.now();
        elapsed = Math.floor((now - startTime) / 1000);
        
        if (duration > 0) {
          const remaining = Math.max(0, duration - elapsed);
          onTick(remaining, elapsed);
          
          if (remaining === 0) {
            timer.stop();
            onFinish();
          }
        } else {
          onTick(null, elapsed);
        }
      }, 100);
      
      return timer;
    },
    
    /**
     * 停止计时方法
     * 
     * 完全停止计时器，清除定时器，重置状态
     */
    stop() {
      // 如果定时器存在，就清除它
      if (intervalId) {
        clearInterval(intervalId);  // 清除定时器
        intervalId = null;           // 清空ID
      }
      isRunning = false;  // 标记为未运行
      isPaused = false;   // 标记为未暂停
      
      return timer;
    },
    
    /**
     * 重置计时器方法
     * 
     * 停止计时器并重置所有状态
     * 让计时器回到初始状态，可以重新开始
     */
    reset() {
      timer.stop();      // 先停止
      startTime = null;  // 清空开始时间
      elapsed = 0;       // 重置已用时间为0
      
      return timer;
    },
    
    /**
     * 获取已用时间方法
     * 
     * @returns {number} 已经过去的时间（秒）
     */
    getElapsed() {
      // 如果正在运行或已暂停，需要实时计算
      if (isRunning || isPaused) {
        return Math.floor((Date.now() - startTime) / 1000);
      }
      // 如果已停止，返回保存的已用时间
      return elapsed;
    },
    
    /**
     * 获取剩余时间方法
     * 
     * @returns {number|null} 剩余时间（秒），如果不限时返回 null
     */
    getRemaining() {
      // 如果是不限时模式，返回 null（没有剩余时间的概念）
      if (duration === 0) return null;
      // 计算剩余时间（总时长 - 已用时间），不能小于0
      return Math.max(0, duration - timer.getElapsed());
    },
    
    /**
     * 检查是否正在运行
     * 
     * @returns {boolean} true 表示正在运行，false 表示未运行
     */
    isRunning() {
      return isRunning;
    },
    
    /**
     * 检查是否已暂停
     * 
     * @returns {boolean} true 表示已暂停，false 表示未暂停
     */
    isPaused() {
      return isPaused;
    }
  };
  
  // 返回创建好的计时器对象
  return timer;
}

/**
 * 格式化时间为 MM:SS 格式（分:秒）
 * 
 * 这个函数把秒数转换成 "分:秒" 的格式显示
 * 比如：65 秒 -> "01:05"，30 秒 -> "00:30"
 * 
 * @param {number} seconds - 要格式化的秒数
 * @returns {string} 格式化后的时间字符串，格式为 "MM:SS"
 *                   如果输入无效（null 或 undefined），返回 "--:--"
 * 
 * 使用示例：
 * formatTime(65)    // 返回 "01:05"
 * formatTime(30)    // 返回 "00:30"
 * formatTime(0)     // 返回 "00:00"
 * formatTime(null)  // 返回 "--:--"
 */
export function formatTime(seconds) {
  // 如果输入无效，返回占位符
  if (seconds === null || seconds === undefined) {
    return '--:--';
  }
  
  // 计算分钟数：总秒数除以60，向下取整
  const mins = Math.floor(seconds / 60);
  // 计算剩余秒数：总秒数除以60的余数
  const secs = seconds % 60;
  
  // 格式化成字符串
  // String(...) 把数字转成字符串
  // padStart(2, '0') 如果字符串长度不够2位，在前面补0
  // 比如：5 -> "05"，12 -> "12"
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 格式化时间为更友好的格式（中文显示）
 * 
 * 这个函数把秒数转换成中文友好的格式
 * 比如：30 秒 -> "30秒"，65 秒 -> "1分5秒"，3600 秒 -> "1小时"
 * 
 * @param {number} seconds - 要格式化的秒数
 * @returns {string} 格式化后的时间字符串
 *                   如果输入无效，返回 "--"
 * 
 * 规则：
 * - 小于60秒：显示 "X秒"
 * - 小于3600秒（1小时）：显示 "X分Y秒" 或 "X分钟"（如果秒数为0）
 * - 大于等于3600秒：显示 "X小时Y分钟" 或 "X小时"（如果分钟数为0）
 * 
 * 使用示例：
 * formatTimeFriendly(30)    // 返回 "30秒"
 * formatTimeFriendly(65)    // 返回 "1分5秒"
 * formatTimeFriendly(60)    // 返回 "1分钟"
 * formatTimeFriendly(3665)  // 返回 "1小时1分钟"
 */
export function formatTimeFriendly(seconds) {
  // 如果输入无效，返回占位符
  if (seconds === null || seconds === undefined) {
    return '--';
  }
  
  // 如果小于60秒，直接显示秒数
  if (seconds < 60) {
    return `${seconds}秒`;
  } 
  // 如果小于3600秒（1小时），显示分和秒
  else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);   // 分钟数
    const secs = seconds % 60;                // 剩余秒数
    
    // 如果有剩余秒数，显示 "X分Y秒"
    // 如果没有剩余秒数，只显示 "X分钟"
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  } 
  // 如果大于等于3600秒，显示小时和分钟
  else {
    const hours = Math.floor(seconds / 3600);              // 小时数
    const mins = Math.floor((seconds % 3600) / 60);        // 剩余分钟数
    
    // 如果有剩余分钟，显示 "X小时Y分钟"
    // 如果没有剩余分钟，只显示 "X小时"
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  }
}

