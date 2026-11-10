/**
 * Song Downloader Module for "LISTEN by shehenshah"
 */

class SongDownloader {
  constructor() {
    this.downloadHistoryKey = 'listen_download_history';
    this.history = this.loadHistory();
    this.activeDownloads = new Map();
  }

  loadHistory() {
    try {
      const data = localStorage.getItem(this.downloadHistoryKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.downloadHistoryKey, JSON.stringify(this.history));
    } catch (e) {}
  }

  getDownloadedTracks() {
    return this.history;
  }

  isDownloaded(trackId) {
    return this.history.some(t => t.id === trackId);
  }

  async download(track, onProgress = null) {
    if (!track || !track.audioUrl) {
      alert('This song has no valid audio stream available for download.');
      return;
    }

    if (this.activeDownloads.has(track.id)) {
      return;
    }

    this.activeDownloads.set(track.id, true);

    try {
      if (window.electronAPI && window.electronAPI.downloadSong) {
        // Native Electron download directly to local disk
        const result = await window.electronAPI.downloadSong({
          id: track.id,
          title: track.title,
          artist: track.artist,
          audioUrl: track.audioUrl,
          thumbnail: track.thumbnail
        });

        if (result && result.success) {
          const item = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            duration: track.duration,
            thumbnail: track.thumbnail,
            filePath: result.filePath,
            fileName: result.fileName,
            downloadedAt: new Date().toISOString()
          };

          this.history.unshift(item);
          this.saveHistory();
          window.appUi && window.appUi.showToast(`Downloaded: ${track.title} to LISTEN Music`);
          window.appUi && window.appUi.renderDownloadsView();
        } else {
          alert('Download failed: ' + (result?.error || 'Unknown error'));
        }
      } else {
        // Web fallback
        const anchor = document.createElement('a');
        anchor.href = track.audioUrl;
        anchor.download = `${track.artist} - ${track.title}.mp3`;
        anchor.target = '_blank';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.appUi && window.appUi.showToast(`Starting download: ${track.title}`);
      }
    } catch (err) {
      alert('Download error: ' + err.message);
    } finally {
      this.activeDownloads.delete(track.id);
    }
  }

  async openFolder() {
    if (window.electronAPI && window.electronAPI.openDownloadsFolder) {
      await window.electronAPI.openDownloadsFolder();
    }
  }
}

window.downloader = new SongDownloader();
