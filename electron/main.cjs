const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Set unique Application Identity and standalone userData path
app.setName('SHAKER MOTORS');
app.setAppUserModelId('com.shakermotors.desktop.standalone');

// Isolate storage path completely from any previous applications
try {
  const customUserData = path.join(app.getPath('appData'), 'SHAKER_MOTORS_DATA');
  app.setPath('userData', customUserData);
} catch (e) {
  // Fallback to standard if error
}

function setupApplicationMenu() {
  // Standard Edit menu allows Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+A to work cleanly on Windows
  // without trapping keyboard focus or blocking typing during Alt / Alt+Shift Arabic language switching.
  const template = [
    {
      label: 'تعديل / Edit',
      submenu: [
        { role: 'undo', label: 'تراجع (Undo)' },
        { role: 'redo', label: 'إعادة (Redo)' },
        { type: 'separator' },
        { role: 'cut', label: 'قص (Cut)' },
        { role: 'copy', label: 'نسخ (Copy)' },
        { role: 'paste', label: 'لصق (Paste)' },
        { role: 'selectAll', label: 'تحديد الكل (Select All)' },
      ],
    },
    {
      label: 'عرض / View',
      submenu: [
        { role: 'reload', label: 'إعادة تحميل الصفحة (Reload)' },
        { role: 'forceReload', label: 'إعادة تحميل قسرية' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'الحجم الأصلي' },
        { role: 'zoomIn', label: 'تكبير' },
        { role: 'zoomOut', label: 'تصغير' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 868,
    minWidth: 1024,
    minHeight: 700,
    title: 'SHAKER MOTORS - نظام إدارة وتأجير السيارات الفنية',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true, // Prevents Alt / Alt+Shift keys from trapping focus on Windows menu bar
  });

  // Ensure menu bar does not steal focus when typing
  mainWindow.setMenuBarVisibility(false);

  // If in dev mode, wait for local server or load index.html
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL || 'http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  setupApplicationMenu();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
