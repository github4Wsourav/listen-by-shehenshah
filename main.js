const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { WebSocketServer, WebSocket } = require('ws');

let mainWindow = null;
let hostWss = null;
let hostPort = null;
let clientWs = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    frame: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0d0f14',
      symbolColor: '#ffffff',
      height: 38
    },
    backgroundColor: '#0a0b0e',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // enables loading external album art thumbnails and audio streams freely
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopHostServer();
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Download Song
ipcMain.handle('download-song', async (event, track) => {
  try {
    const downloadsDir = path.join(app.getPath('downloads'), 'LISTEN Music');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const safeTitle = (track.title || 'Track').replace(/[/\\?%*:|"<>]/g, '_');
    const safeArtist = (track.artist || 'Artist').replace(/[/\\?%*:|"<>]/g, '_');
    const fileName = `${safeArtist} - ${safeTitle}.mp3`;
    const filePath = path.join(downloadsDir, fileName);

    // Stream download
    const streamUrl = track.audioUrl;
    if (!streamUrl) {
      return { success: false, error: 'Audio stream URL is missing' };
    }

    const fileStream = fs.createWriteStream(filePath);
    const client = streamUrl.startsWith('https') ? https : http;

    return new Promise((resolve) => {
      client.get(streamUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Handle redirect
          const redirectClient = response.headers.location.startsWith('https') ? https : http;
          redirectClient.get(response.headers.location, (redirectRes) => {
            redirectRes.pipe(fileStream);
            fileStream.on('finish', () => {
              fileStream.close();
              resolve({ success: true, filePath, fileName });
            });
          }).on('error', (err) => {
            resolve({ success: false, error: err.message });
          });
          return;
        }

        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve({ success: true, filePath, fileName });
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        resolve({ success: false, error: err.message });
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open Downloads Folder
ipcMain.handle('open-downloads-folder', async () => {
  const downloadsDir = path.join(app.getPath('downloads'), 'LISTEN Music');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  shell.openPath(downloadsDir);
  return true;
});

// IPC Handler: Host "Listen Together" Server
ipcMain.handle('start-host-server', async (event, roomCode) => {
  try {
    stopHostServer();

    // Pick a port based on room code or random available port
    const port = 34567 + (parseInt(roomCode.replace(/\D/g, '') || '1000', 10) % 5000);
    hostPort = port;

    hostWss = new WebSocketServer({ port });
    const listeners = new Set();

    hostWss.on('connection', (ws) => {
      listeners.add(ws);
      if (mainWindow) {
        mainWindow.webContents.send('listen-together-listeners-changed', listeners.size);
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          // Broadcast to other listeners
          for (const client of listeners) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        listeners.delete(ws);
        if (mainWindow) {
          mainWindow.webContents.send('listen-together-listeners-changed', listeners.size);
        }
      });
    });

    return { success: true, port, roomCode };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function stopHostServer() {
  if (hostWss) {
    try {
      hostWss.close();
    } catch (e) {}
    hostWss = null;
  }
}

ipcMain.handle('stop-host-server', async () => {
  stopHostServer();
  return true;
});

// IPC Handler: Broadcast host playback event
ipcMain.handle('host-broadcast-event', async (event, payload) => {
  if (hostWss) {
    const dataStr = JSON.stringify(payload);
    hostWss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(dataStr);
      }
    });
    return true;
  }
  return false;
});

// IPC Handler: Join "Listen Together" Server
ipcMain.handle('join-session', async (event, { hostIp, roomCode }) => {
  try {
    if (clientWs) {
      clientWs.close();
      clientWs = null;
    }

    const port = 34567 + (parseInt(roomCode.replace(/\D/g, '') || '1000', 10) % 5000);
    const targetUrl = `ws://${hostIp || 'localhost'}:${port}`;

    return new Promise((resolve) => {
      clientWs = new WebSocket(targetUrl);

      clientWs.on('open', () => {
        resolve({ success: true, roomCode });
      });

      clientWs.on('message', (msg) => {
        try {
          const eventData = JSON.parse(msg);
          if (mainWindow) {
            mainWindow.webContents.send('listen-together-sync-event', eventData);
          }
        } catch (e) {}
      });

      clientWs.on('error', (err) => {
        resolve({ success: false, error: err.message || 'Connection failed' });
      });

      clientWs.on('close', () => {
        if (mainWindow) {
          mainWindow.webContents.send('listen-together-disconnected');
        }
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('leave-session', async () => {
  if (clientWs) {
    clientWs.close();
    clientWs = null;
  }
  return true;
});

// App Info
ipcMain.handle('get-app-info', async () => {
  return {
    name: 'LISTEN by shehenshah',
    creator: 'shehenshah (Sourav)',
    version: '1.0.0',
    audioEngine: 'FxSound 64-bit DSP Master Engine'
  };
});
