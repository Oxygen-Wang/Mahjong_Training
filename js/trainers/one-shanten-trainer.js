/**
 * 一向听训练模块 (one-shanten-trainer.js)
 * 
 * "向听"是麻将术语：
 * - 向听数表示手牌距离和牌还差几张牌
 * - 一向听 = 再摸1张牌就能听牌
 * - 听牌 = 再摸1张牌就能和牌
 * 
 * 训练内容：
 * - 识别一向听的牌型
 * - 找出所有能进张的牌（摸到这些牌就能听牌）
 * - 评估每张牌的价值
 * 
 * 注意：当前这个模块还在开发中，暂时只显示占位内容
 */

export default {
  async init(container) {
    container.innerHTML = `
      <div class="card">
        <h2>一向听训练</h2>
        <p>该模块正在开发中...</p>
      </div>
    `;
  },
  
  onShow() {
    // 显示时的回调
  }
};

