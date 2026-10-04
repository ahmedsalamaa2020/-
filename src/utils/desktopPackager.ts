// Helper utility to generate and download Desktop (.EXE) packaging configuration & installer scripts

export function downloadDesktopExePackage(appName: string) {
  const sanitizedName = appName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'AutoFleetApp';

  const packageJsonContent = JSON.stringify(
    {
      name: sanitizedName.toLowerCase(),
      version: '1.0.0',
      description: 'Desktop Executable Application',
      main: 'main.js',
      scripts: {
        start: 'electron .',
        'build:exe': 'electron-builder --win nsis',
      },
      devDependencies: {
        electron: '^30.0.0',
        'electron-builder': '^24.13.0',
      },
      build: {
        appId: `com.autofleet.${sanitizedName.toLowerCase()}`,
        productName: appName,
        electronDownload: {
          mirror: 'https://npmmirror.com/mirrors/electron/',
        },
        win: {
          target: ['nsis', 'portable'],
          icon: 'icon.ico',
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
        },
      },
    },
    null,
    2
  );

  const mainJsContent = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "${appName}",
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the production build index.html or remote app URL
  win.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(() => {
    win.loadURL('http://localhost:3000');
  });

  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  const batchScriptContent = `@echo off
echo ============================================================
echo   Building Desktop (.EXE) Installer for ${appName}
echo ============================================================
echo Setting fast Electron download mirror...
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
echo 1. Installing Electron packaging dependencies...
npm install --save-dev electron electron-builder
echo 2. Building production web assets...
npm run build
echo 3. Packaging into Windows (.EXE) Installer...
npx electron-builder --win nsis
echo ============================================================
echo   SUCCESS! Your (.EXE) installer is saved in /dist-electron folder.
echo ============================================================
pause
`;

  const readmeContent = `# ${appName} - Desktop (.EXE) Installer Guide

## Steps to create the standalone Windows (.EXE) file:
1. Copy \`package.json\`, \`main.js\`, and \`build-exe.bat\` into your project root folder.
2. Double click \`build-exe.bat\` on Windows OR run:
   npm install --save-dev electron electron-builder
   npm run build
   npx electron-builder --win nsis
3. The generated installer file (\`${appName}-Setup-1.0.0.exe\`) will be created in the \`dist/\` directory!
`;

  // Trigger download of build-exe.bat
  const blob = new Blob([batchScriptContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `build-exe-desktop.bat`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Trigger download of main.js
  setTimeout(() => {
    const blob2 = new Blob([mainJsContent], { type: 'text/javascript;charset=utf-8' });
    const url2 = URL.createObjectURL(blob2);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = `main.js`;
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    URL.revokeObjectURL(url2);
  }, 300);

  // Trigger download of package-electron.json
  setTimeout(() => {
    const blob3 = new Blob([packageJsonContent], { type: 'application/json;charset=utf-8' });
    const url3 = URL.createObjectURL(blob3);
    const a3 = document.createElement('a');
    a3.href = url3;
    a3.download = `package-electron.json`;
    document.body.appendChild(a3);
    a3.click();
    document.body.removeChild(a3);
    URL.revokeObjectURL(url3);
  }, 600);
}
