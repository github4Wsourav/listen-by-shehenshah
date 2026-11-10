const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  downloadSong: (track) => ipcRenderer.invoke('download-song', track),
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  startHostServer: (roomCode) => ipcRenderer.invoke('start-host-server', roomCode),
  stopHostServer: () => ipcRenderer.invoke('stop-host-server'),
  hostBroadcastEvent: (payload) => ipcRenderer.invoke('host-broadcast-event', payload),
  joinSession: (data) => ipcRenderer.invoke('join-session', data),
  leaveSession: () => ipcRenderer.invoke('leave-session'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Event Listeners
  onListenersChanged: (callback) => {
    ipcRenderer.on('listen-together-listeners-changed', (event, count) => callback(count));
  },
  onSyncEvent: (callback) => {
    ipcRenderer.on('listen-together-sync-event', (event, data) => callback(data));
  },
  onDisconnected: (callback) => {
    ipcRenderer.on('listen-together-disconnected', () => callback());
  }
});
