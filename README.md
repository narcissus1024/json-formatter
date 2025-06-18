# JSON Formatter

一个简单易用的 JSON 格式化工具，基于 Electron 和 CodeMirror 开发。

## 功能特点

- 🎯 JSON 格式化：自动格式化 JSON 字符串，使其更易读
- 🔄 JSON 压缩：将格式化的 JSON 压缩为单行
- 🔒 JSON 转义：将 JSON 字符串进行转义处理
- 🔓 去除转义：移除 JSON 字符串中的转义字符
- 📋 复制/粘贴：支持快速复制和粘贴操作
- 🎨 美观的界面：现代化的用户界面设计
- 🖥️ 系统托盘：支持最小化到系统托盘
- ⌨️ 快捷键支持：提供常用操作的快捷键

## 快捷键

- `Ctrl/Cmd + F`: 格式化 JSON
- `Ctrl/Cmd + M`: 压缩 JSON
- `Ctrl/Cmd + E`: 转义 JSON
- `Ctrl/Cmd + U`: 去除转义
- `Ctrl/Cmd + L`: 清空内容
- `Alt + F`: 显示/隐藏窗口
- `ESC`: 隐藏窗口

## 开发

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖

```bash
npm install
```

### 运行开发环境

```bash
npm run dev
```

### 打包应用

```bash
npm run make
```

打包后的应用可以在 `out/make` 目录下找到。

## 项目结构

```
.
├── src/
│   ├── main/           # 主进程代码
│   │   └── main.js
│   ├── renderer/       # 渲染进程代码
│   │   ├── index.html
│   │   ├── renderer.js
│   │   └── styles.css
│   └── assets/         # 资源文件
│       └── icon.png
├── package.json
└── README.md
```

## 技术栈

- [Electron](https://www.electronjs.org/): 跨平台桌面应用开发框架
- [CodeMirror](https://codemirror.net/): 代码编辑器组件
- [Electron Forge](https://www.electronforge.io/): 应用打包工具

## 许可证

MIT License 