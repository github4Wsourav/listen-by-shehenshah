/**
 * Play and Listen Together (Host & Join) System for "LISTEN by shehenshah"
 */

class ListenTogetherSystem {
  constructor() {
    this.mode = 'idle'; // 'idle', 'host', 'client'
    this.roomCode = null;
    this.listenerCount = 0;
    this.hostIp = 'localhost';
    this.isConnected = false;

    this.initEventListeners();
  }

  initEventListeners() {
    if (window.electronAPI) {
      window.electronAPI.onListenersChanged((count) => {
        this.listenerCount = count;
        this.updateUi();
      });

      window.electronAPI.onSyncEvent((data) => {
        this.handleSyncEvent(data);
      });

      window.electronAPI.onDisconnected(() => {
        this.mode = 'idle';
        this.isConnected = false;
        this.updateUi();
        window.appUi && window.appUi.showToast('Disconnected from Listen Together session');
      });
    }
  }

  generateRoomCode() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `LSTN-${num}`;
  }

  async startHosting() {
    const code = this.generateRoomCode();
    this.roomCode = code;

    if (window.electronAPI) {
      const res = await window.electronAPI.startHostServer(code);
      if (res && res.success) {
        this.mode = 'host';
        this.isConnected = true;
        this.listenerCount = 0;
        this.updateUi();
        window.appUi && window.appUi.showToast(`Hosting room ${code}`);
        return { success: true, roomCode: code };
      } else {
        alert('Failed to start host server: ' + (res?.error || 'Unknown error'));
        return { success: false };
      }
    } else {
      this.mode = 'host';
      this.isConnected = true;
      this.updateUi();
      return { success: true, roomCode: code };
    }
  }

  async stopHosting() {
    if (window.electronAPI) {
      await window.electronAPI.stopHostServer();
    }
    this.mode = 'idle';
    this.roomCode = null;
    this.listenerCount = 0;
    this.isConnected = false;
    this.updateUi();
  }

  async joinRoom(roomCode, hostIp = 'localhost') {
    if (!roomCode || roomCode.trim().length === 0) {
      alert('Please enter a valid Room Code');
      return false;
    }

    const cleanCode = roomCode.trim().toUpperCase();
    this.roomCode = cleanCode;
    this.hostIp = hostIp.trim() || 'localhost';

    if (window.electronAPI) {
      const res = await window.electronAPI.joinSession({
        hostIp: this.hostIp,
        roomCode: cleanCode
      });

      if (res && res.success) {
        this.mode = 'client';
        this.isConnected = true;
        this.updateUi();
        window.appUi && window.appUi.showToast(`Connected to ${cleanCode}! Syncing playback...`);
        return true;
      } else {
        alert('Unable to join session: ' + (res?.error || 'Connection refused or room not found'));
        return false;
      }
    } else {
      this.mode = 'client';
      this.isConnected = true;
      this.updateUi();
      return true;
    }
  }

  async leaveRoom() {
    if (window.electronAPI) {
      await window.electronAPI.leaveSession();
    }
    this.mode = 'idle';
    this.roomCode = null;
    this.isConnected = false;
    this.updateUi();
  }

  // Broadcasts playback events if acting as Host
  broadcastHostEvent(eventType, extraData = {}) {
    if (this.mode !== 'host') return;
    const payload = {
      type: eventType,
      roomCode: this.roomCode,
      timestamp: Date.now(),
      ...extraData
    };

    if (window.electronAPI) {
      window.electronAPI.hostBroadcastEvent(payload);
    }
  }

  // Handles playback events from Host when acting as Client
  handleSyncEvent(data) {
    if (this.mode !== 'client' || !window.appUi) return;

    if (data.type === 'track_change' && data.track) {
      window.appUi.playTrackFromSync(data.track, data.currentTime, data.isPlaying);
    } else if (data.type === 'play') {
      window.appUi.syncPlay(data.currentTime);
    } else if (data.type === 'pause') {
      window.appUi.syncPause(data.currentTime);
    } else if (data.type === 'seek') {
      window.appUi.syncSeek(data.currentTime);
    }
  }

  updateUi() {
    if (window.appUi && window.appUi.renderListenTogetherView) {
      window.appUi.renderListenTogetherView();
    }
  }
}

window.listenTogether = new ListenTogetherSystem();
