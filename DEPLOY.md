# GitHub Pages 部署指南

## 快速部署步骤

### 1. 创建 GitHub 仓库

1. 登录 GitHub，点击右上角 "+" → "New repository"
2. 填写仓库名称（如 `mahjong-trainer`）
3. 选择 Public（GitHub Pages 免费版需要公开仓库）
4. 不要勾选 "Initialize this repository with a README"（如果本地已有代码）
5. 点击 "Create repository"

### 2. 初始化 Git 并推送代码

在项目根目录打开终端，执行以下命令：

```bash
# 初始化 Git 仓库（如果还没有）
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 麻将训练系统"

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/仓库名.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 3. 启用 GitHub Pages

**方法一：使用 GitHub Actions（推荐，已配置）**

1. 进入仓库 Settings → Pages
2. 在 "Source" 部分，选择 "GitHub Actions"
3. 保存设置
4. 每次推送到 `main` 分支时，会自动部署

**方法二：手动选择分支**

1. 进入仓库 Settings → Pages
2. 在 "Source" 部分，选择 "Deploy from a branch"
3. Branch 选择 `main`，文件夹选择 `/ (root)`
4. 点击 Save

### 4. 访问网站

部署完成后（通常需要 1-2 分钟），访问：
- `https://你的用户名.github.io/仓库名/`

例如：`https://username.github.io/mahjong-trainer/`

## 自定义域名（可选）

如果你想使用自己的域名：

1. 在项目根目录创建 `CNAME` 文件，内容为你的域名：
   ```
   example.com
   ```

2. 在你的域名 DNS 设置中添加 CNAME 记录：
   - 类型：CNAME
   - 主机记录：@ 或 www
   - 记录值：你的用户名.github.io

3. 在 GitHub 仓库 Settings → Pages 中配置自定义域名

## 更新部署

每次修改代码后：

```bash
git add .
git commit -m "更新说明"
git push origin main
```

GitHub Actions 会自动重新部署，通常 1-2 分钟后生效。

## 常见问题

### 1. 页面显示 404

- 检查仓库是否为 Public
- 确认 Pages 设置中的 Source 已正确配置
- 等待几分钟让部署完成

### 2. 模块加载失败

- 检查浏览器控制台的错误信息
- 确认所有文件路径使用相对路径
- 确保 `.nojekyll` 文件存在（已包含在项目中）

### 3. 样式或功能不正常

- 清除浏览器缓存
- 检查文件路径是否正确
- 查看浏览器控制台的错误信息

## 项目文件说明

- `.nojekyll` - 告诉 GitHub Pages 不要使用 Jekyll 处理
- `.github/workflows/deploy.yml` - 自动部署工作流配置
- 所有其他文件都是项目正常运行所需

## 其他部署选项

除了 GitHub Pages，你还可以部署到：

- **Netlify** - 拖拽文件夹即可部署
- **Vercel** - 连接 GitHub 仓库自动部署
- **Cloudflare Pages** - 免费且快速
- **自己的服务器** - 上传文件到服务器即可
