// 处理 Windows 平台的安装事件
if (require('electron-squirrel-startup')) {
  app.quit();
}

const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const electronLocalshortcut = require('electron-localshortcut');

// 在应用启动前设置为不在 dock 中显示
if (process.platform === 'darwin') {
  app.dock.hide();
}

class AppManager {
  constructor() {
    this.window = null;
    this.tray = null;
    this.isQuitting = false;
  }

  /**
   * 初始化应用
   */
  init() {
    this.createWindow();
    this.createTray();
    this.registerShortcuts();
  }

  /**
   * 获取资源文件路径
   * @param {string} assetName - 资源文件名
   * @returns {string} 资源文件完整路径
   */
  getAssetPath(assetName) {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'src', 'assets', assetName);
    }
    return path.join(__dirname, '../../src/assets', assetName);
  }

  /**
   * 创建应用图标
   * @returns {Electron.NativeImage} 图标对象
   */
  createAppIcon() {
    const iconPath = this.getAssetPath('icon.png');
    try {
      const icon = nativeImage.createFromPath(iconPath);
      if (!icon.isEmpty()) {
        return icon.resize({ width: 16, height: 16 });
      }
    } catch (error) {
      console.error('Error loading icon:', error);
    }
    // 加载失败时使用默认图标
    return nativeImage.createFromPath(path.join(__dirname, '../../src/assets/icon.png'))
      .resize({ width: 16, height: 16 });
  }

  /**
   * 创建系统托盘
   */
  createTray() {
    const icon = this.createAppIcon();
    
    if (this.tray) {
      this.tray.destroy();
    }

    this.tray = new Tray(icon);
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示/隐藏',
        click: () => this.toggleWindow()
      },
      {
        label: '退出',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    this.tray.setToolTip('JSON Formatter');
    this.tray.setContextMenu(contextMenu);
    this.tray.on('click', () => this.tray.popUpContextMenu());
  }

  /**
   * 切换窗口显示状态
   */
  toggleWindow() {
    if (!this.window || this.window.isDestroyed()) {
      this.createWindow();
      return;
    }
    
    if (this.window.isVisible()) {
      this.window.hide();
    } else {
      this.window.show();
      this.window.focus();
      this.window.webContents.send('focus-editor');
    }
  }

  /**
   * 创建主窗口
   */
  createWindow() {
    this.window = new BrowserWindow({
      width: 800,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      show: false,
      icon: this.createAppIcon(),
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: !app.isPackaged
      }
    });

    this.window.loadFile(path.join(__dirname, '../renderer/index.html'));

    // 开发模式下打开开发者工具
    if (!app.isPackaged && process.argv.includes('--dev')) {
      this.window.webContents.openDevTools();
    }

    this.setupWindowEvents();
    this.createApplicationMenu();
  }

  /**
   * 设置窗口事件
   */
  setupWindowEvents() {
    // 窗口准备好后显示
    this.window.once('ready-to-show', () => {
      this.window.show();
    });

    // 处理窗口关闭事件
    this.window.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.window.hide();
      }
    });

    // 处理窗口最小化事件
    this.window.on('minimize', (event) => {
      event.preventDefault();
      this.window.hide();
    });

    // 窗口关闭时清理资源
    this.window.on('closed', () => {
      this.unregisterShortcuts();
      this.window = null;
    });
  }

  /**
   * 创建应用菜单
   */
  createApplicationMenu() {
    const template = [
      {
        label: '文件',
        submenu: [
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              this.isQuitting = true;
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
          ...(app.isPackaged ? [] : [{ role: 'toggleDevTools', label: '切换开发者工具' }]),
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

  /**
   * 注册快捷键
   */
  registerShortcuts() {
    globalShortcut.register('Alt+F', () => {
      this.toggleWindow();
    });
  }

  /**
   * 注销快捷键
   */
  unregisterShortcuts() {
    if (this.window) {
      electronLocalshortcut.unregisterAll(this.window);
    }
    globalShortcut.unregisterAll();
  }
}

// 创建应用管理器实例
const appManager = new AppManager();

// 应用程序事件处理
app.whenReady().then(() => {
  appManager.init();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  appManager.isQuitting = true;
});

app.on('will-quit', () => {
  appManager.unregisterShortcuts();
}); 