/**
 * 麻将牌展示组件文件 (tile-display.js)
 * 
 * 这个文件负责在网页上显示麻将牌
 * 就像"画师"，把牌对象转换成网页上可见的图片元素
 * 
 * 主要功能：
 * 1. 创建牌的 HTML 元素（显示图片）
 * 2. 支持点击交互（可选择、点击事件等）
 * 3. 支持显示数量徽章（比如显示这张牌还有几张）
 * 4. 批量渲染多张牌
 * 
 * DOM 是什么？
 * - Document Object Model（文档对象模型）
 * - 可以理解为网页中的元素（比如按钮、图片、文字等）
 * - 通过 JavaScript 可以创建、修改、删除这些元素
 */

// 导入需要的工具函数
import { getTileImagePath, getTileDisplayName } from '../utils/tile-utils.js';

/**
 * 创建一张牌的 DOM 元素
 * 
 * 这个函数就像"制造"一个牌的显示元素，包括图片、样式、事件等
 * 
 * @param {Object} tile - 牌对象，包含 suit（花色）和 rank（点数）属性
 * 
 * @param {Object} options - 选项对象（可选），包含以下属性：
 *   @param {boolean} options.selectable - 是否可以选择（默认 false）
 *                                        如果为 true，鼠标悬停会有样式变化
 *   @param {boolean} options.selected - 是否已被选中（默认 false）
 *                                      如果为 true，会显示选中样式（比如边框高亮）
 *   @param {Function} options.onClick - 点击时的回调函数
 *                                       函数接收两个参数：(tile, element)
 *                                       tile: 牌对象，element: HTML元素
 *   @param {Function} options.onRightClick - 右键点击时的回调函数（可选）
 *                                            用法和 onClick 一样
 *   @param {number} options.count - 显示的数量（用于记忆训练）
 *                                  例如：显示"还剩3张"
 *   @param {boolean} options.showCount - 是否显示数量徽章（默认 false）
 *                                       如果为 true，会在牌上显示数量
 * 
 * @returns {HTMLElement} 返回创建好的 HTML 元素（div），可以插入到网页中
 * 
 * 使用示例：
 * const tile = createTile('tong', 1);
 * const element = createTileElement(tile, {
 *   selectable: true,
 *   onClick: (tile) => console.log('点击了', tile)
 * });
 * document.body.appendChild(element);  // 把元素添加到网页中
 */
export function createTileElement(tile, options = {}) {
  // 从选项对象中提取参数，如果没提供就用默认值
  // 这行代码使用了"解构赋值"语法，从 options 对象中提取属性
  // 例如：如果 options = {selectable: true}，那么 selectable 就是 true，其他用默认值
  const { 
    selectable = false,   // 是否可选择，默认 false
    selected = false,     // 是否已选中，默认 false
    onClick = null,       // 点击回调函数，默认 null（没有）
    onRightClick = null,  // 右键点击回调函数，默认 null（没有）
    count = null,         // 数量，默认 null
    showCount = false     // 是否显示数量徽章，默认 false
  } = options;
  
  // 创建一个 div 元素（HTML 中的容器元素）
  // document.createElement('div') 会创建一个新的 div 元素
  const tileEl = document.createElement('div');
  
  // 给这个元素添加 CSS 类名 'tile'
  // className 是 HTML 元素的属性，用来设置 CSS 类
  // 有了这个类名，CSS 样式文件就可以控制它的外观
  tileEl.className = 'tile';
  
  // 如果 selectable 为 true，添加 'selectable' 类名
  // 这样 CSS 可以给这个元素添加可选择样式（比如鼠标悬停效果）
  if (selectable) {
    tileEl.classList.add('selectable');  // classList.add 是添加类名的方法
  }
  
  // 如果 selected 为 true，添加 'selected' 类名
  // 这样 CSS 可以给这个元素添加选中样式（比如边框高亮）
  if (selected) {
    tileEl.classList.add('selected');
  }
  
  // 根据 count 的值设置样式类
  // filled: 有数量且大于0（已填充）
  // unfilled: 没有数量或数量为0（未填充）
  if (count !== null && count > 0) {
    // !== 表示"不等于"，&& 表示"并且"
    // 如果 count 不是 null 并且大于0，添加 'filled' 类
    tileEl.classList.add('filled');
  } else if (count === 0 || count === null) {
    // || 表示"或者"
    // 如果 count 是 0 或者是 null，添加 'unfilled' 类
    tileEl.classList.add('unfilled');
  }
  
  // 创建图片元素（img 标签）
  // 这个图片用来显示麻将牌的图像
  const img = document.createElement('img');
  
  // 设置图片的源路径（src 属性）
  // getTileImagePath 函数会根据牌的花色和点数返回图片路径
  // 例如：'svg_materials/tong1.svg'
  img.src = getTileImagePath(tile.suit, tile.rank);
  
  // 设置图片的替代文本（alt 属性）
  // 如果图片加载失败，会显示这个文本
  // 也用于屏幕阅读器（为视力障碍用户服务）
  // getTileDisplayName 返回中文名称，如 "1筒"
  img.alt = getTileDisplayName(tile);
  
  // 设置图片的加载方式为"懒加载"（lazy loading）
  // 这意味着只有当图片即将进入视野时才会加载，可以提高页面加载速度
  img.loading = 'lazy';
  
  // 把图片元素添加到牌的容器元素中
  // appendChild 方法会把元素添加到父元素的末尾
  // 现在 tileEl 是父元素，img 是子元素
  tileEl.appendChild(img);
  
  // 如果需要显示数量徽章
  // showCount 为 true 并且 count 不是 null 时，创建并显示数量徽章
  if (showCount && count !== null) {
    // 创建一个 div 元素作为徽章容器
    const countBadge = document.createElement('div');
    
    // 添加 CSS 类名，用于样式控制
    countBadge.className = 'count-badge';
    
    // 设置徽章显示的文本内容（数量）
    // textContent 属性用来设置元素的文本内容
    // 例如：如果 count 是 3，徽章就显示 "3"
    countBadge.textContent = count;
    
    // 把徽章元素添加到牌的容器中
    tileEl.appendChild(countBadge);
  }
  
  // 如果提供了点击回调函数，就绑定点击事件
  // onClick 不为 null 或 undefined 时，说明用户想要处理点击事件
  if (onClick) {
    // addEventListener 给元素添加事件监听器
    // 'click' 是事件类型（点击事件）
    // 第二个参数是事件处理函数，当点击发生时会被调用
    tileEl.addEventListener('click', (e) => {
      // e 是事件对象，包含了事件的相关信息
      // preventDefault 阻止默认行为（比如链接的跳转）
      e.preventDefault();
      
      // 调用用户提供的回调函数，传入牌对象和元素对象
      // 这样用户可以在回调函数中使用这些参数
      onClick(tile, tileEl);
    });
  }
  
  // 如果提供了右键点击回调函数，就绑定右键点击事件
  // 'contextmenu' 是右键点击的事件类型
  if (onRightClick) {
    tileEl.addEventListener('contextmenu', (e) => {
      // 阻止默认的右键菜单
      e.preventDefault();
      
      // 调用用户提供的回调函数
      onRightClick(tile, tileEl);
    });
  }
  
  // 返回创建好的元素
  // 调用这个函数的地方可以使用返回的元素，比如添加到页面上
  return tileEl;
}

/**
 * 在容器中渲染牌数组
 * 
 * 这个函数会在一个容器元素中显示多张牌
 * 先把容器清空，然后依次添加每张牌的元素
 * 
 * @param {HTMLElement} container - 容器元素（要显示牌的地方）
 * @param {Array<Object>} tiles - 牌数组（要显示的牌）
 * @param {Object} options - 选项（传递给 createTileElement 的选项）
 */
export function renderTiles(container, tiles, options = {}) {
  // 清空容器中的所有内容
  // innerHTML = '' 会把容器里的所有HTML内容都删除
  // 这样每次调用这个函数时，都是重新渲染，不会保留旧的内容
  container.innerHTML = '';
  
  // 遍历牌数组，为每张牌创建元素并添加到容器中
  // forEach 是数组的方法，会遍历数组中的每个元素
  // tile => { ... } 是箭头函数，相当于 function(tile) { ... }
  tiles.forEach(tile => {
    // 为当前这张牌创建显示元素
    // createTileElement 函数会返回一个 HTML 元素
    const tileEl = createTileElement(tile, options);
    
    // 把创建好的牌元素添加到容器中
    // 这样牌就会显示在网页上了
    container.appendChild(tileEl);
  });
}

/**
 * 创建手牌展示区域
 * 
 * 这个函数创建一个新的容器，用来显示手牌
 * 
 * @param {Array<Object>} tiles - 手牌数组（要显示的牌）
 * @param {Object} options - 选项（传递给 renderTiles 的选项）
 * @returns {HTMLElement} 返回创建好的手牌容器
 */
export function createHandDisplay(tiles, options = {}) {
  // 创建一个新的 div 元素作为手牌容器
  const container = document.createElement('div');
  
  // 给容器添加 CSS 类名 'hand-display'
  // 这样可以通过 CSS 控制手牌显示区域的样式
  container.className = 'hand-display';
  
  // 在容器中渲染所有牌
  // 调用 renderTiles 函数，把牌显示在刚创建的容器中
  renderTiles(container, tiles, options);
  
  // 返回创建好的容器
  // 调用这个函数的地方可以把返回的容器添加到页面上
  return container;
}

