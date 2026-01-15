/**
 * 配置面板组件文件 (config-panel.js)
 * 
 * 这个文件提供了一些通用的配置界面组件
 * 就像"积木块"，可以在不同的训练模块中重复使用
 * 
 * 提供的组件：
 * 1. 难度选择器 - 让用户选择训练难度（简单/中等/困难）
 * 2. 花色选择器 - 让用户选择要使用的牌型（筒/条/万）
 * 3. 滑块输入 - 让用户通过拖动滑块来设置数值
 * 
 * 为什么需要这个文件？
 * - 避免代码重复（如果每个训练模块都写一遍配置界面，代码会很冗余）
 * - 统一样式和行为（所有训练模块的配置界面看起来一样）
 */

/**
 * 创建难度选择组件
 * @param {string} currentDifficulty - 当前难度
 * @param {Function} onChange - 变化回调
 * @returns {HTMLElement} 难度选择容器
 */
export function createDifficultySelector(currentDifficulty = 'medium', onChange = null) {
  const container = document.createElement('div');
  container.className = 'form-group';
  
  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = '难度';
  
  const btnGroup = document.createElement('div');
  btnGroup.className = 'btn-group';
  btnGroup.id = 'difficulty-group';
  
  const difficulties = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' }
  ];
  
  difficulties.forEach(diff => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-toggle ${diff.value === currentDifficulty ? 'active' : ''}`;
    btn.dataset.difficulty = diff.value;
    btn.textContent = diff.label;
    
    btn.addEventListener('click', () => {
      btnGroup.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (onChange) {
        onChange(diff.value);
      }
    });
    
    btnGroup.appendChild(btn);
  });
  
  container.appendChild(label);
  container.appendChild(btnGroup);
  
  return container;
}

/**
 * 创建花色选择组件
 * @param {Array<string>} enabledSuits - 已启用的花色
 * @param {Function} onChange - 变化回调
 * @returns {HTMLElement} 花色选择容器
 */
export function createSuitSelector(enabledSuits = ['tong', 'tiao', 'wan'], onChange = null) {
  const container = document.createElement('div');
  container.className = 'form-group';
  
  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = '花色';
  
  const checkboxRow = document.createElement('div');
  checkboxRow.className = 'checkbox-row';
  
  const suits = [
    { value: 'tong', label: '筒' },
    { value: 'tiao', label: '条' },
    { value: 'wan', label: '万' }
  ];
  
  suits.forEach(suit => {
    const labelEl = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'suit';
    checkbox.value = suit.value;
    checkbox.checked = enabledSuits.includes(suit.value);
    
    checkbox.addEventListener('change', () => {
      if (onChange) {
        const checked = Array.from(checkboxRow.querySelectorAll('input:checked'))
          .map(cb => cb.value);
        onChange(checked);
      }
    });
    
    labelEl.appendChild(checkbox);
    labelEl.appendChild(document.createTextNode(` ${suit.label}`));
    checkboxRow.appendChild(labelEl);
  });
  
  container.appendChild(label);
  container.appendChild(checkboxRow);
  
  return container;
}

/**
 * 创建滑块输入组件
 * @param {string} labelText - 标签文本
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {number} value - 当前值
 * @param {Function} onChange - 变化回调
 * @returns {HTMLElement} 滑块容器
 */
export function createSliderInput(labelText, min, max, value, onChange = null) {
  const container = document.createElement('div');
  container.className = 'form-group';
  
  const label = document.createElement('label');
  label.className = 'label';
  label.textContent = labelText;
  
  const sliderRow = document.createElement('div');
  sliderRow.className = 'slider-row';
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min;
  slider.max = max;
  slider.value = value;
  
  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'slider-value';
  valueDisplay.textContent = `${value}`;
  
  slider.addEventListener('input', () => {
    valueDisplay.textContent = `${slider.value}`;
    if (onChange) {
      onChange(Number(slider.value));
    }
  });
  
  sliderRow.appendChild(slider);
  sliderRow.appendChild(valueDisplay);
  
  container.appendChild(label);
  container.appendChild(sliderRow);
  
  return container;
}

