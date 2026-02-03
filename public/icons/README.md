# PWA 图标生成说明

## 方法 1：使用 favicon.io（推荐）

1. 访问 https://favicon.io/emoji-converter/
2. 输入 emoji：📦
3. 点击"Download"下载生成的图标包
4. 解压下载的文件
5. 将以下文件复制到 `public/icons/` 目录：
   - `android-icon-72x72.png` → `icon-72x72.png`
   - `android-icon-96x96.png` → `icon-96x96.png`
   - `android-icon-128x128.png` → `icon-128x128.png`
   - `android-icon-144x144.png` → `icon-144x144.png`
   - `android-icon-152x152.png` → `icon-152x152.png`
   - `android-icon-192x192.png` → `icon-192x192.png`
   - `android-icon-384x384.png` → `icon-384x384.png`
   - `android-icon-512x512.png` → `icon-512x512.png`
   - `apple-icon.png` → `favicon.png`

## 方法 2：使用在线工具

其他可选工具：
- **RealFaviconGenerator**: https://realfavicongenerator.net/
  - 上传任何图片或 emoji
  - 自动生成所有需要的尺寸
  - 下载完整的图标包

- **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
  - 专门为 PWA 设计
  - 支持多种输入格式

## 临时方案（开发测试用）

如果你暂时不想生成图标，可以：
1. 保持现有的 SVG 图标（`/vite.svg`）
2. PWA 功能仍然可以正常工作
3. 只是应用图标会显示浏览器默认图标

## 注意事项

- **生产环境必须使用 PNG 图标**，否则 PWA 安装后图标会显示不正确
- 图标背景建议使用透明或纯色
- 推荐尺寸：192x192（主要图标）、512x512（Android maskable icon）
