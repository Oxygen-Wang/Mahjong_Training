/**
 * 排行榜组件文件 (leaderboard.js)
 * 
 * 这个文件负责显示和管理排行榜
 * 
 * 主要功能：
 * 1. 显示排行榜列表（按得分排序）
 * 2. 显示每条记录的详细信息（得分、用时、难度、时间等）
 * 3. 提供清空记录的功能
 * 
 * 排行榜排序规则：
 * - 首先按得分降序（得分高的排在前面）
 * - 如果得分相同，按用时升序（用时短的排在前面）
 * 
 * 显示的信息：
 * - 排名（#1, #2, ...）
 * - 得分
 * - 训练模式
 * - 难度级别
 * - 用时
 * - 记录时间
 */

import { getLeaderboard, clearLeaderboard } from '../utils/storage.js';
import { formatTimeFriendly } from '../utils/timer.js';

/**
 * 渲染排行榜
 * @param {HTMLElement} container - 容器元素
 * @param {string} mode - 训练模式，null 表示显示所有模式
 * @param {number} limit - 限制显示数量
 */
export function renderLeaderboard(container, mode = null, limit = 20) {
  const leaderboard = getLeaderboard(mode, limit);
  
  if (leaderboard.length === 0) {
    container.innerHTML = '<p class="text-center">暂无记录</p>';
    return;
  }
  
  const list = document.createElement('ul');
  list.className = 'leaderboard-list';
  
  leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.className = 'leaderboard-item';
    
    item.innerHTML = `
      <div class="leaderboard-rank">#${index + 1}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-score">${entry.score} 分</div>
        <div style="font-size: 0.875rem; color: var(--text-secondary);">
          ${entry.mode} · ${entry.difficulty} · ${formatTimeFriendly(entry.time)}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-secondary);">
          ${entry.date}
        </div>
      </div>
    `;
    
    list.appendChild(item);
  });
  
  container.innerHTML = '';
  container.appendChild(list);
}

/**
 * 创建排行榜组件（包含清空按钮）
 * @param {string} mode - 训练模式
 * @returns {HTMLElement} 排行榜容器
 */
export function createLeaderboardComponent(mode = null) {
  const container = document.createElement('div');
  container.className = 'card-section';
  
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = mode ? `${mode} 排行榜` : '本机排行榜';
  
  const listContainer = document.createElement('div');
  listContainer.id = 'leaderboard-list';
  
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  
  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn-danger';
  clearBtn.textContent = '清空记录';
  clearBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有记录吗？此操作不可恢复。')) {
      clearLeaderboard(mode);
      renderLeaderboard(listContainer, mode);
    }
  });
  
  actions.appendChild(clearBtn);
  
  container.appendChild(title);
  container.appendChild(listContainer);
  container.appendChild(actions);
  
  // 初始渲染
  renderLeaderboard(listContainer, mode);
  
  return container;
}

