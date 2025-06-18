// 处理 Windows 平台的安装事件
if (require('electron-squirrel-startup')) {
  app.quit();
}

const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage } = require('electron');
const path = require('path');

// 保持对窗口对象的全局引用，避免 JavaScript 垃圾回收时窗口被关闭
let mainWindow = null;
let trayIcon = null;

// 获取正确的资源路径
function getAssetPath(assetName) {
  if (app.isPackaged) {
    // 打包后的路径
    return path.join(process.resourcesPath, 'src', 'assets', assetName);
  } else {
    // 开发环境路径
    return path.join(__dirname, '../../src/assets', assetName);
  }
}

// 创建应用图标
function createAppIcon() {
  const iconPath = getAssetPath('icon.png');
  
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.error('Failed to load icon:', iconPath);
      // 使用默认图标
      icon = nativeImage.createFromPath(path.join(__dirname, '../../src/assets/icon.png'));
    }
  } catch (error) {
    console.error('Error loading icon:', error);
    // 使用默认图标
    icon = nativeImage.createFromPath(path.join(__dirname, '../../src/assets/icon.png'));
  }
  
  // 创建不同尺寸的图标
  const trayIconImage = icon.resize({ width: 16, height: 16 });
  const dockIconImage = icon.resize({ width: 128, height: 128 });
  
  // 设置程序坞图标
  if (process.platform === 'darwin') {
    app.dock.setIcon(dockIconImage);
  }
  
  return trayIconImage;
}

// 创建系统托盘
function createTray() {
  const trayIconImage = createAppIcon();
  
  // 确保之前的托盘图标被销毁
  if (trayIcon !== null) {
    trayIcon.destroy();
  }
  
  try {
    trayIcon = new Tray(trayIconImage);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => toggleWindow()
      },
      {
        label: '退出',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    trayIcon.setToolTip('JSON Formatter');
    trayIcon.setContextMenu(contextMenu);

    // 点击托盘图标时显示菜单
    trayIcon.on('click', (event, bounds) => {
      trayIcon.popUpContextMenu();
    });
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

// 切换窗口显示状态
function toggleWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('focus-editor');
  }
}

// 创建主窗口
function createWindow() {
  // 创建应用图标
  const trayIconImage = createAppIcon();
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: trayIconImage,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // 开发环境启用开发者工具
      devTools: true
    }
  });

  // 加载应用的 index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 在开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 处理窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // 创建应用菜单
  createApplicationMenu();
}

// 创建应用菜单
function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectall', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '切换开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 注册快捷键
function registerShortcuts() {
  globalShortcut.register('Alt+F', () => {
    toggleWindow();
  });

  // ESC 隐藏窗口
  globalShortcut.register('Escape', () => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
      mainWindow.hide();
    }
  });
}

// 应用初始化
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前清理
app.on('before-quit', () => {
  app.isQuitting = true;
});

// 注销所有快捷键
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
}); 