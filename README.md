# 🀄️ 麻将训练系统 | Mahjong Training System

<div align="center">

**春节必备神器 | Your Secret Weapon for Chinese New Year** 🎉

**[🌐 在线体验 | Try It Online](https://oxygen-wang.github.io/Mahjong_Training/)** 🚀

> 为了大家能在春节麻将先人一步，讨好丈母娘成为一代雀圣！  
> Help you dominate the mahjong table during Chinese New Year and impress your in-laws! 🏆

**本项目不提供任何算法作弊的方法，意图提高人工智能（打麻将的能力）**  
*This project does NOT provide any cheating algorithms, but aims to improve your AI (Artificial Intelligence for playing mahjong)* 😉

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pure JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Build Required](https://img.shields.io/badge/Build-None-success.svg)]()

</div>

---

## 📖 项目简介 | Project Overview

**中文**  
一个现代化的麻将牌效率训练工具，帮助麻将爱好者系统性地提高听牌、何切、向听数等核心技能。采用 Apple Design 风格的现代化界面设计，提供流畅的训练体验。无论你是麻将新手还是老手，这里都有适合你的训练模式！

**English**  
A modern mahjong tile efficiency training tool that helps mahjong enthusiasts systematically improve core skills like tenpai (waiting), discarding decisions, and shanten calculation. Featuring a sleek Apple Design-inspired interface with smooth training experiences. Whether you're a beginner or a seasoned player, there's a training mode perfect for you!

### 🤔 为什么需要训练？| Why Training Matters?

**中文**  
牌效率是麻将技术的基础，通过系统训练可以：
- 🎯 **提高读牌速度** - 快速识别牌型和待牌，不再犹豫不决
- 🧠 **优化打牌选择** - 学会在复杂局面下做出最优决策，告别"打错牌"的尴尬
- 📈 **增强实战表现** - 将理论知识转化为实战能力，成为真正的"雀圣"

**English**  
Tile efficiency is the foundation of mahjong skills. Systematic training helps you:
- 🎯 **Read Faster** - Quickly identify tile patterns and waiting tiles, no more hesitation
- 🧠 **Make Better Decisions** - Learn to make optimal choices in complex situations, say goodbye to "wrong discards"
- 📈 **Improve Performance** - Transform theory into practice and become a true mahjong master

---

## ✨ 功能特性 | Features

### 🎮 训练模块 | Training Modules

**中文**  
1. **记牌训练** 🧠 - 训练记忆场上已出现的牌，判断剩余牌数（成为"人形记牌器"）
2. **听牌训练** 🎯 - 快速识别听牌形态和待牌（一眼看穿听牌）
3. **何切训练** ✂️ - 学习在14张牌情况下选择最优切牌（告别"打错牌"）
4. **向听数训练** 📊 - 训练快速计算手牌的向听数（秒算距离和牌还有几步）
5. **一向听训练** 🔍 - 识别一向听牌型，找出所有有效牌（精准把握机会）
6. **牌型分析** 🔬 - 综合分析工具，输入任意手牌获得详细评估（你的私人麻将教练）
7. **连连看** 🎮 - 点击四个相同的牌来消除，训练反应速度和牌型识别能力（轻松有趣的训练）

**English**  
1. **Memory Training** 🧠 - Train to remember tiles on the table and calculate remaining tiles (become a "human tile counter")
2. **Tenpai Training** 🎯 - Quickly identify tenpai patterns and waiting tiles (see tenpai at a glance)
3. **Discard Training** ✂️ - Learn optimal discarding decisions with 14 tiles (no more wrong discards)
4. **Shanten Training** 📊 - Train rapid calculation of shanten count (calculate distance to tenpai in seconds)
5. **One-Shanten Training** 🔍 - Identify one-shanten patterns and find all effective tiles (seize opportunities precisely)
6. **Tile Analysis** 🔬 - Comprehensive analysis tool for any hand (your personal mahjong coach)
7. **Match Game** 🎮 - Click four identical tiles to eliminate them, training reaction speed and tile recognition (fun and relaxing training)

### 🎨 设计特点 | Design Features

- **Apple Design 风格** - 简洁优雅的现代化界面，看着就舒服
- **响应式设计** - 完美适配手机竖屏和桌面端，随时随地训练
- **流畅动画** - 细腻的交互动画和过渡效果，训练也是一种享受
- **本地存储** - 成绩自动保存，支持排行榜功能，见证自己的进步

- **Apple Design Style** - Clean, elegant modern interface that's a joy to use
- **Responsive Design** - Perfect for mobile portrait and desktop, train anywhere
- **Smooth Animations** - Delicate interactive animations and transitions
- **Local Storage** - Auto-save scores with leaderboard support, track your progress

---

## 🚀 快速开始 | Quick Start

### 🌐 在线体验 | Online Demo

**中文**  
🎉 **最简单的方式：直接在线体验！** 无需安装任何环境，点击即可开始训练：

**[👉 立即体验 | Try Now](https://oxygen-wang.github.io/Mahjong_Training/)** 🚀

**English**  
🎉 **Easiest way: Try it online!** No installation needed, just click and start training:

**[👉 Try It Now | 立即体验](https://oxygen-wang.github.io/Mahjong_Training/)** 🚀

---

### 本地运行 | Local Development

### 使用方式 | Usage

**中文**  
这是一个纯前端网页应用，由于使用了 ES6 模块，**必须通过 HTTP 服务器运行**，不能直接双击打开 HTML 文件。

**English**  
This is a pure frontend web application. Since it uses ES6 modules, **you MUST run it through an HTTP server**. You cannot simply double-click the HTML file.

### 本地服务器（必须）| Local Server (Required)

#### 1. 使用 Python（推荐）| Using Python (Recommended)

**中文**  
在项目根目录下打开终端/命令行，运行：

```bash
# Python 3
python -m http.server 8000

# 或 Windows 用户可以直接双击 启动服务器.bat 文件
```

然后在浏览器访问：`http://localhost:8000`

**English**  
Open terminal/command line in the project root directory and run:

```bash
# Python 3
python -m http.server 8000

# Or Windows users can double-click 启动服务器.bat
```

Then visit in your browser: `http://localhost:8000`

#### 2. 使用 Node.js | Using Node.js

```bash
npx http-server
```

然后在浏览器访问显示的地址（通常是 http://localhost:8080）  
Then visit the displayed address in your browser (usually http://localhost:8080)

#### 3. Windows 用户快速启动 | Quick Start for Windows

**中文**  
- 双击项目根目录下的 `启动服务器.bat` 文件
- 等待服务器启动后，在浏览器访问 http://localhost:8000

**English**  
- Double-click the `启动服务器.bat` file in the project root
- Wait for the server to start, then visit http://localhost:8000 in your browser

#### 4. 部署到服务器 | Deploy to Server

**中文**  
将整个项目文件夹上传到任何静态网站托管服务（如 GitHub Pages、Netlify、Vercel 等）即可。

**English**  
Upload the entire project folder to any static website hosting service (GitHub Pages, Netlify, Vercel, etc.).

---

## 📁 项目结构 | Project Structure

```
Mahjong/
├── index.html              # 主入口页面 | Main entry page
├── css/                    # 样式文件 | Stylesheets
│   ├── common.css         # 通用样式 | Common styles
│   ├── components.css     # 组件样式 | Component styles
│   └── trainers.css       # 训练模块样式 | Trainer styles
├── js/                     # JavaScript 代码 | JavaScript code
│   ├── main.js            # 主入口，路由和模式切换 | Main entry, routing
│   ├── utils/             # 工具函数库 | Utility functions
│   │   ├── tile-utils.js  # 麻将牌工具函数 | Tile utilities
│   │   ├── storage.js     # localStorage 封装 | Storage wrapper
│   │   └── timer.js       # 计时器工具 | Timer utility
│   ├── trainers/          # 训练模块 | Training modules
│   │   ├── memory-trainer.js      # 记牌训练 | Memory training
│   │   ├── tenpai-trainer.js      # 听牌训练 | Tenpai training
│   │   ├── heqie-trainer.js       # 何切训练 | Discard training
│   │   ├── shanten-trainer.js     # 向听数训练 | Shanten training
│   │   ├── one-shanten-trainer.js # 一向听训练 | One-shanten training
│   │   ├── analysis.js            # 牌型分析 | Tile analysis
│   │   └── match-trainer.js        # 连连看 | Match game
│   └── components/        # 可复用组件 | Reusable components
│       ├── tile-display.js   # 麻将牌展示组件 | Tile display
│       ├── leaderboard.js    # 排行榜组件 | Leaderboard
│       └── config-panel.js   # 配置面板组件 | Config panel
├── svg_materials/         # SVG 资源文件 | SVG resources
└── README.md             # 项目说明文档 | This file
```

---

## 🎯 使用指南 | User Guide

### 通用设置 | General Settings

**中文**  
在开始训练之前，您可以根据自己的水平调整以下参数：
- **牌数选择** - 根据训练模式不同，可选择 13 张牌或 14 张牌模式
- **难度级别** - 从简单到困难，不同难度会影响手牌的复杂程度
- **倒计时** - 可以设置答题时间限制，模拟实战压力

**English**  
Before starting training, you can adjust these parameters based on your skill level:
- **Tile Count** - Choose 13-tile or 14-tile mode depending on training type
- **Difficulty Level** - From easy to hard, affects hand complexity
- **Timer** - Set time limits to simulate real-game pressure

### 快捷键操作 | Keyboard Shortcuts

- `1-9` - 快速选择对应数字的牌 | Quick select tiles by number
- `Enter` - 确认提交答案 | Submit answer

---

## 🎮 训练模式详解 | Training Modes Explained

### 🧠 记牌训练 | Memory Training

**中文**  
训练记忆场上已出现的牌，判断剩余牌数。这是基础训练，帮助提高对牌堆的感知能力。成为"人形记牌器"，让对手刮目相看！

**English**  
Train to remember tiles on the table and calculate remaining tiles. This foundational training improves your awareness of the tile pool. Become a "human tile counter" and impress your opponents!

**核心功能 | Core Features:**
- 系统随机生成场上已出现的牌 | System randomly generates tiles on the table
- 限定时间内记忆这些牌 | Memorize tiles within time limit
- 填写每种牌还剩几张（每种牌总共 4 张）| Fill in remaining count for each tile type (4 tiles per type)
- 查看详细分析和成绩 | View detailed analysis and scores

**牌种说明 | Tile Types:**
- **万子牌**：一万至九万（共 9 种，每种 4 张）| **Characters**: 1-9 (9 types, 4 each)
- **筒子牌**：一筒至九筒（共 9 种，每种 4 张）| **Circles**: 1-9 (9 types, 4 each)
- **条子牌**：一条至九条（共 9 种，每种 4 张）| **Bamboos**: 1-9 (9 types, 4 each)
- **字牌**：东、南、西、北、白、发、中（共 7 种，每种 4 张）| **Honors**: East, South, West, North, White, Green, Red (7 types, 4 each)
- 总计 34 种牌，每种牌在牌堆中都有 4 张 | Total 34 types, 4 tiles each

**训练技巧 | Training Tips:**
- **分组记忆** - 按牌种分组记忆，提高效率 | Group by tile type for efficiency
- **系统化方法** - 按照固定顺序记忆 | Use systematic memorization order
- **重点标记** - 优先记忆出现次数多的牌种 | Focus on frequently appearing tiles

---

### 🎯 听牌训练 | Tenpai Training

**中文**  
听牌训练帮助您快速识别听牌形态和待牌。这是牌效率训练的基础，掌握听牌识别是提高麻将水平的关键。一眼看穿听牌，让对手防不胜防！

**English**  
Tenpai training helps you quickly identify tenpai patterns and waiting tiles. This is the foundation of tile efficiency training. Mastering tenpai recognition is key to improving your mahjong skills. See tenpai at a glance and catch your opponents off guard!

**听牌种类 | Tenpai Types:**

1. **两面听（双面听）| Two-Sided Wait**
   - 最常见的听牌类型 | Most common tenpai type
   - 待牌为连续数字的两端 | Waiting on both ends of a sequence
   - 待牌数量为 2 张，和牌概率较高 | 2 waiting tiles, higher winning probability

2. **单骑听（单吊）| Single Wait**
   - 只待一张特定的牌 | Waiting on one specific tile
   - 待牌数量为 1 张，和牌概率较低 | 1 waiting tile, lower probability

3. **三面听 | Three-Sided Wait**
   - 待牌为三张连续的牌 | Waiting on three consecutive tiles
   - 待牌数量为 3 张，和牌概率很高 | 3 waiting tiles, very high probability

4. **嵌张听（坎张听）| Closed Wait**
   - 待牌为两张连续数字中间的那张牌 | Waiting on the middle tile between two consecutive tiles
   - 待牌数量为 1 张 | 1 waiting tile

5. **边张听 | Edge Wait**
   - 待牌为顺子的边张（1 或 9）| Waiting on edge tiles (1 or 9)
   - 待牌数量为 1 张 | 1 waiting tile

6. **双碰听（对倒听）| Pair Wait**
   - 待牌为两个对子中的任意一张 | Waiting on either tile from two pairs
   - 待牌数量为 2 张 | 2 waiting tiles

---

### ✂️ 何切训练 | Discard Training

**中文**  
学习在 14 张牌的情况下，选择最优的切牌方案。这是实战中最常用的技能之一。通过科学的进张数分析，掌握最大机率的打法，提升牌效。告别"打错牌"的尴尬！

**English**  
Learn to choose optimal discarding decisions with 14 tiles. This is one of the most practical skills. Through scientific tile acceptance analysis, master the highest probability plays and improve tile efficiency. Say goodbye to wrong discards!

**训练步骤 | Training Steps:**
1. 系统生成 14 张牌 | System generates 14 tiles
2. 分析手牌，找出应该打出的牌 | Analyze hand and find the best discard
3. 选择要切的牌 | Select the tile to discard
4. 查看正确答案和解析 | View correct answer and analysis

---

### 📊 向听数训练 | Shanten Training

**中文**  
训练快速计算手牌的向听数。向听数是判断手牌好坏的重要指标，向听数越小，距离和牌越近。秒算距离和牌还有几步，成为"人形计算器"！

**English**  
Train rapid calculation of shanten count. Shanten is a key indicator of hand quality - the lower the shanten, the closer to tenpai. Calculate distance to tenpai in seconds and become a "human calculator"!

**训练步骤 | Training Steps:**
1. 观察手牌 | Observe the hand
2. 计算距离听牌还差几步 | Calculate steps to tenpai
3. 输入向听数 | Enter shanten count
4. 查看答案 | View answer

---

### 🔍 一向听训练 | One-Shanten Training

**中文**  
识别距离听牌只差一步的牌型，并找出所有能让手牌进入听牌的有效牌。精准把握机会，不错过任何和牌的可能！

**English**  
Identify one-shanten patterns and find all effective tiles that can bring the hand to tenpai. Seize opportunities precisely and never miss a winning chance!

**训练步骤 | Training Steps:**
1. 观察 13 张牌 | Observe 13 tiles
2. 判断有效牌（能让手牌进入听牌的牌）| Identify effective tiles (tiles that bring hand to tenpai)
3. 选择所有有效牌 | Select all effective tiles
4. 提交答案 | Submit answer

---

### 🔬 牌型分析 | Tile Analysis

**中文**  
综合分析工具，输入任意手牌获得详细的牌效率评估。你的私人麻将教练，随时为你分析手牌！

**English**  
Comprehensive analysis tool that provides detailed tile efficiency evaluation for any hand. Your personal mahjong coach, always ready to analyze!

**使用方法 | Usage:**
1. 输入或选择手牌（支持 13 张或 14 张牌）| Input or select hand (supports 13 or 14 tiles)
2. 点击分析按钮 | Click analyze button
3. 查看详细的分析结果 | View detailed analysis

**分析内容包括 | Analysis Includes:**
- 向听数：当前手牌距离听牌还差几步 | Shanten: Steps to tenpai
- 有效牌：能让向听数减少的所有牌种及数量 | Effective tiles: All tiles that reduce shanten
- 推荐切牌：在 14 张牌模式下，分析每种切牌方案的效果 | Recommended discards: Analysis of each discard option
- 听牌信息：如果已听牌，显示所有待牌 | Tenpai info: All waiting tiles if in tenpai
- 牌型评估：手牌的整体效率和改进建议 | Hand evaluation: Overall efficiency and improvement suggestions

---

### 🎮 连连看 | Match Game

**中文**  
通过点击四个相同的牌来消除，训练反应速度和牌型识别能力。这是一个轻松有趣的训练模式，在游戏中提高对麻将牌的熟悉程度。放松心情，边玩边学！

**English**  
Click four identical tiles to eliminate them, training reaction speed and tile recognition. A fun and relaxing training mode that improves your familiarity with mahjong tiles while having fun. Relax and learn while playing!

**游戏规则 | Game Rules:**
- 游戏界面为 16 列 n 行的网格布局 | 16 columns × n rows grid layout
- 随机生成各种麻将牌 | Randomly generated mahjong tiles
- 点击四个相同的牌即可消除 | Click four identical tiles to eliminate
- 消除所有牌即可获胜 | Eliminate all tiles to win
- 支持计时和排名功能 | Timer and leaderboard support

**难度级别 | Difficulty Levels:**
- **简单 | Easy**: 4 行 × 16 列 = 64 张牌，16 种牌型 | 4 rows × 16 cols = 64 tiles, 16 types
- **中等 | Medium**: 5 行 × 16 列 = 80 张牌，20 种牌型 | 5 rows × 16 cols = 80 tiles, 20 types
- **困难 | Hard**: 6 行 × 16 列 = 96 张牌，24 种牌型 | 6 rows × 16 cols = 96 tiles, 24 types
- **专家 | Expert**: 7 行 × 16 列 = 112 张牌，28 种牌型 | 7 rows × 16 cols = 112 tiles, 28 types

---

## 🛠️ 技术栈 | Tech Stack

- **前端框架 | Frontend**: 纯原生 JavaScript (ES6+) | Pure Vanilla JavaScript (ES6+)
- **样式 | Styling**: CSS3 (Apple Design 风格) | CSS3 (Apple Design style)
- **存储 | Storage**: localStorage (本地数据持久化) | localStorage (local data persistence)
- **资源 | Resources**: SVG 矢量图形 | SVG vector graphics

---

## 📝 开发说明 | Development

### 环境要求 | Requirements

- 现代浏览器（Chrome、Firefox、Safari、Edge 等）| Modern browsers (Chrome, Firefox, Safari, Edge, etc.)
- 支持 ES6+ 模块的浏览器 | Browser with ES6+ module support
- 无需 Node.js 或任何构建工具 | No Node.js or build tools required

### 添加新的训练模块 | Adding New Training Modules

1. 在 `js/trainers/` 目录下创建新的训练器文件 | Create new trainer file in `js/trainers/`
2. 实现标准的训练器接口 | Implement standard trainer interface
3. 在 `js/main.js` 中注册新模块 | Register in `js/main.js`
4. 在 `index.html` 中添加导航按钮 | Add navigation button in `index.html`

---

## 📊 功能路线图 | Roadmap

- [x] 基础架构和 UI 设计 | Basic architecture and UI design
- [x] 记牌训练模块 | Memory training module
- [x] 听牌训练模块 | Tenpai training module
- [x] 何切训练模块 | Discard training module
- [x] 向听数训练模块 | Shanten training module
- [x] 一向听训练模块 | One-shanten training module
- [x] 牌型分析工具 | Tile analysis tool
- [x] 连连看游戏 | Match game
- [ ] 深色模式支持 | Dark mode support
- [ ] 多语言支持 | Multi-language support
- [ ] 数据导出功能 | Data export feature

---

## 🤝 贡献 | Contributing

**中文**  
欢迎提交 Issue 和 Pull Request！让我们一起让这个项目变得更好！

**English**  
Issues and Pull Requests are welcome! Let's make this project even better together!

---

## 📄 许可证 | License

本项目采用 MIT 许可证。  
This project is licensed under the MIT License.

---

## 🙏 致谢 | Acknowledgments

**中文**  
感谢所有为麻将技术发展做出贡献的社区和开发者。让我们一起传承和发扬麻将文化！

**English**  
Thanks to all communities and developers who have contributed to mahjong technique development. Let's preserve and promote mahjong culture together!

---

<div align="center">

**开始训练，提升你的麻将水平！** 🀄️  
**Start Training and Level Up Your Mahjong Skills!** 🀄️

*愿你在麻将桌上战无不胜！*  
*May you be invincible at the mahjong table!*

</div>
