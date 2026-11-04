# Courtyard Diorama

一座可在浏览器中自由观看的岭南草屋庭院微缩景观。项目使用程序化 Three.js 几何体构建围合建筑、茅草屋顶、木桥、池塘和六类庭院植物，无需构建工具或后端。

## 本地预览

```bash
python3 -m http.server 4173
```

打开 `http://localhost:4173/`。页面通过固定版本 CDN 加载 Three.js，因此需要访问 `cdn.jsdelivr.net`。

## 操作

- 拖动：环绕庭院旋转
- 滚轮或双指：缩放
- 右键拖动：平移
- “归位”：恢复默认视角

## 部署

推送到 `main` 后，GitHub Actions 会把仓库根目录发布到 GitHub Pages。
