/**
 * Main Application Orchestrator for "LISTEN by shehenshah"
 */

class AppUI {
  constructor() {
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.isRepeat = false;
    this.likedTrackIds = new Set(this.loadLikedSongs());

    // Audio Element
    this.audio = document.getElementById('audio-player');

    // DOM Elements
    this.dom = {
      navItems: document.querySelectorAll('.nav-item'),
      views: document.querySelectorAll('.view-section'),
      // Player bar
      playerThumb: document.getElementById('player-thumb'),
      playerTitle: document.getElementById('player-title'),
      playerArtist: document.getElementById('player-artist'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      playPauseIcon: document.getElementById('play-pause-icon'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      btnShuffle: document.getElementById('btn-shuffle'),
      btnRepeat: document.getElementById('btn-repeat'),
      currentTime: document.getElementById('current-time'),
      totalDuration: document.getElementById('total-duration'),
      progressBarBg: document.getElementById('progress-bar-bg'),
      progressBarFill: document.getElementById('progress-bar-fill'),
      btnPlayerLike: document.getElementById('btn-player-like'),
      btnPlayerDownload: document.getElementById('btn-player-download'),
      volumeSlider: document.getElementById('volume-slider'),
      btnVolumeIcon: document.getElementById('btn-volume-icon'),
      btnQuickFxSound: document.getElementById('btn-quick-fxsound'),
      // FxSound View
      btnMasterPower: document.getElementById('btn-fxsound-master-power'),
      visualizerCanvas: document.getElementById('fxsound-visualizer'),
      eqContainer: document.getElementById('eq-sliders-container'),
      presetChips: document.querySelectorAll('.preset-chip'),
      sliderFidelity: document.getElementById('slider-fidelity'),
      sliderBass: document.getElementById('slider-bass'),
      sliderDynamic: document.getElementById('slider-dynamic'),
      sliderSurround: document.getElementById('slider-surround'),
      sliderVoice: document.getElementById('slider-voice'),
      valFidelity: document.getElementById('val-fidelity'),
      valBass: document.getElementById('val-bass'),
      valDynamic: document.getElementById('val-dynamic'),
      valSurround: document.getElementById('val-surround'),
      valVoice: document.getElementById('val-voice'),
      // Home & Search
      homeFeaturedGrid: document.getElementById('home-featured-grid'),
      homePlaylistsGrid: document.getElementById('home-playlists-grid'),
      globalSearchInput: document.getElementById('global-search-input'),
      searchResultsTbody: document.getElementById('search-results-tbody'),
      searchStatusText: document.getElementById('search-status-text'),
      // Library & Downloads
      libraryGrid: document.getElementById('library-grid'),
      libraryCount: document.getElementById('library-count'),
      downloadsTbody: document.getElementById('downloads-tbody'),
      downloadsBadge: document.getElementById('downloads-badge'),
      btnOpenDownloadsFolder: document.getElementById('btn-open-downloads-folder'),
      // Listen Together
      btnStartHosting: document.getElementById('btn-start-hosting'),
      btnStopHosting: document.getElementById('btn-stop-hosting'),
      hostControls: document.getElementById('host-controls'),
      hostActivePanel: document.getElementById('host-active-panel'),
      hostRoomCodeBox: document.getElementById('host-room-code-box'),
      hostListenerCount: document.getElementById('host-listener-count'),
      btnJoinSession: document.getElementById('btn-join-session'),
      btnLeaveSession: document.getElementById('btn-leave-session'),
      joinControls: document.getElementById('join-controls'),
      clientActivePanel: document.getElementById('client-active-panel'),
      clientRoomDisplay: document.getElementById('client-room-display'),
      joinRoomCodeInput: document.getElementById('join-room-code-input'),
      joinHostIpInput: document.getElementById('join-host-ip-input'),
      liveSessionBadge: document.getElementById('live-session-badge'),
      btnQuickHost: document.getElementById('btn-quick-host'),
      // Google Auth Modal
      googleAuthModal: document.getElementById('google-auth-modal'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      btnGoogleLoginModal: document.getElementById('btn-google-login-modal'),
      btnDoGoogleSignin: document.getElementById('btn-do-google-signin'),
      btnCustomGoogleSignin: document.getElementById('btn-custom-google-signin'),
      customGoogleName: document.getElementById('custom-google-name'),
      sidebarUserCard: document.getElementById('sidebar-user-card'),
      sidebarUserAvatar: document.getElementById('sidebar-user-avatar'),
      sidebarUserName: document.getElementById('sidebar-user-name'),
      sidebarUserStatus: document.getElementById('sidebar-user-status'),
      btnLoginLabel: document.getElementById('btn-login-label'),
      settingsAuthStatus: document.getElementById('settings-auth-status'),
      btnSettingsSignOut: document.getElementById('btn-settings-sign-out'),
      btnSettingsOpenFolder: document.getElementById('btn-settings-open-folder'),
      // Toast
      toast: document.getElementById('app-toast')
    };

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupAudioListeners();
    this.setupPlayerControls();
    this.setupFxSoundControls();
    this.setupSearch();
    this.setupDownloads();
    this.setupListenTogether();
    this.setupGoogleAuth();
    this.loadCatalog();
    this.renderEqSliders();
    this.startVisualizer();

    // Default load first track
    if (this.playlist.length > 0) {
      this.loadTrack(this.playlist[0], false);
    }
  }

  loadLikedSongs() {
    try {
      const data = localStorage.getItem('listen_liked_tracks');
      return data ? JSON.parse(data) : ['track-1', 'track-4'];
    } catch (e) {
      return [];
    }
  }

  saveLikedSongs() {
    try {
      localStorage.setItem('listen_liked_tracks', JSON.stringify(Array.from(this.likedTrackIds)));
    } catch (e) {}
  }

  // --- Navigation & View Switching ---
  setupNavigation() {
    this.dom.navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        this.switchView(viewId);
      });
    });

    const linkExplore = document.getElementById('link-view-all-tracks');
    if (linkExplore) {
      linkExplore.addEventListener('click', () => this.switchView('search'));
    }
  }

  switchView(viewId) {
    this.dom.navItems.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });

    this.dom.views.forEach(view => {
      view.classList.toggle('active', view.id === `view-${viewId}`);
    });

    if (viewId === 'library') this.renderLibraryView();
    if (viewId === 'downloads') this.renderDownloadsView();
    if (viewId === 'listen-together') this.renderListenTogetherView();
  }

  // --- Audio Pipeline & Listeners ---
  setupAudioListeners() {
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updatePlayPauseButton();
      window.fxSound.resumeContext();
      window.listenTogether.broadcastHostEvent('play', { currentTime: this.audio.currentTime });
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updatePlayPauseButton();
      window.listenTogether.broadcastHostEvent('pause', { currentTime: this.audio.currentTime });
    });

    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.dom.totalDuration.textContent = this.formatTime(this.audio.duration || 0);
    });

    this.audio.addEventListener('ended', () => {
      if (this.isRepeat) {
        this.audio.currentTime = 0;
        this.audio.play();
      } else {
        this.playNextTrack();
      }
    });

    // Attach FxSound DSP on first interaction
    const initAudioContextOnce = () => {
      window.fxSound.attachAudioElement(this.audio);
      window.fxSound.resumeContext();
      document.removeEventListener('click', initAudioContextOnce);
      document.removeEventListener('keydown', initAudioContextOnce);
    };
    document.addEventListener('click', initAudioContextOnce);
    document.addEventListener('keydown', initAudioContextOnce);
  }

  // --- Player Bar Controls ---
  setupPlayerControls() {
    this.dom.btnPlayPause.addEventListener('click', () => {
      this.togglePlayPause();
    });

    this.dom.btnPrev.addEventListener('click', () => {
      this.playPrevTrack();
    });

    this.dom.btnNext.addEventListener('click', () => {
      this.playNextTrack();
    });

    this.dom.btnShuffle.addEventListener('click', () => {
      this.isShuffle = !this.isShuffle;
      this.dom.btnShuffle.style.color = this.isShuffle ? 'var(--accent-green)' : 'var(--text-secondary)';
      this.showToast(this.isShuffle ? 'Shuffle enabled' : 'Shuffle disabled');
    });

    this.dom.btnRepeat.addEventListener('click', () => {
      this.isRepeat = !this.isRepeat;
      this.dom.btnRepeat.style.color = this.isRepeat ? 'var(--accent-green)' : 'var(--text-secondary)';
      this.showToast(this.isRepeat ? 'Repeat track enabled' : 'Repeat disabled');
    });

    // Progress Bar Seeking
    this.dom.progressBarBg.addEventListener('click', (e) => {
      const rect = this.dom.progressBarBg.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (this.audio.duration) {
        this.audio.currentTime = pos * this.audio.duration;
        window.listenTogether.broadcastHostEvent('seek', { currentTime: this.audio.currentTime });
      }
    });

    // Volume Slider
    this.dom.volumeSlider.addEventListener('input', (e) => {
      this.audio.volume = parseFloat(e.target.value);
    });

    this.dom.btnVolumeIcon.addEventListener('click', () => {
      if (this.audio.volume > 0) {
        this.lastVolume = this.audio.volume;
        this.audio.volume = 0;
        this.dom.volumeSlider.value = 0;
      } else {
        this.audio.volume = this.lastVolume || 0.8;
        this.dom.volumeSlider.value = this.audio.volume;
      }
    });

    // Player Like Button
    this.dom.btnPlayerLike.addEventListener('click', () => {
      if (!this.currentTrack) return;
      if (this.likedTrackIds.has(this.currentTrack.id)) {
        this.likedTrackIds.delete(this.currentTrack.id);
        this.dom.btnPlayerLike.classList.remove('active');
        this.showToast(`Removed from Library`);
      } else {
        this.likedTrackIds.add(this.currentTrack.id);
        this.dom.btnPlayerLike.classList.add('active');
        this.showToast(`Added to Library ❤️`);
      }
      this.saveLikedSongs();
    });

    // Player Direct Download Button
    this.dom.btnPlayerDownload.addEventListener('click', () => {
      if (this.currentTrack) {
        window.downloader.download(this.currentTrack);
      }
    });

    // Quick FxSound Toggle in Player Bar
    this.dom.btnQuickFxSound.addEventListener('click', () => {
      this.toggleFxSoundPower();
    });
  }

  loadTrack(track, autoplay = true) {
    if (!track) return;
    this.currentTrack = track;
    this.dom.playerThumb.src = track.thumbnail;
    this.dom.playerTitle.textContent = track.title;
    this.dom.playerArtist.textContent = track.artist;
    this.dom.totalDuration.textContent = this.formatTime(track.duration || 0);

    // Update Like Heart
    this.dom.btnPlayerLike.classList.toggle('active', this.likedTrackIds.has(track.id));

    this.audio.src = track.audioUrl;
    this.audio.load();

    if (autoplay) {
      this.audio.play().catch(e => console.log('Autoplay prevented:', e));
      window.listenTogether.broadcastHostEvent('track_change', {
        track: this.currentTrack,
        currentTime: 0,
        isPlaying: true
      });
    }
  }

  togglePlayPause() {
    if (!this.currentTrack && this.playlist.length > 0) {
      this.loadTrack(this.playlist[0], true);
      return;
    }

    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
  }

  updatePlayPauseButton() {
    if (this.isPlaying) {
      this.dom.playPauseIcon.innerHTML = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
      this.dom.btnPlayPause.title = 'Pause';
    } else {
      this.dom.playPauseIcon.innerHTML = `<path d="M8 5v14l11-7z"/>`;
      this.dom.btnPlayPause.title = 'Play';
    }
  }

  playNextTrack() {
    if (this.playlist.length === 0) return;
    if (this.isShuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    this.loadTrack(this.playlist[this.currentIndex], true);
  }

  playPrevTrack() {
    if (this.playlist.length === 0) return;
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.playlist[this.currentIndex], true);
  }

  updateProgress() {
    if (!this.audio.duration) return;
    const percent = (this.audio.currentTime / this.audio.duration) * 100;
    this.dom.progressBarFill.style.width = `${percent}%`;
    this.dom.currentTime.textContent = this.formatTime(this.audio.currentTime);
  }

  formatTime(secs) {
    const minutes = Math.floor(secs / 60) || 0;
    const seconds = Math.floor(secs % 60) || 0;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  // --- FxSound DSP Audio Enhancer Controls ---
  setupFxSoundControls() {
    // Master Power Toggle
    this.dom.btnMasterPower.addEventListener('click', () => {
      this.toggleFxSoundPower();
    });

    // Preset chips
    this.dom.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.dom.presetChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const presetKey = chip.getAttribute('data-preset');
        window.fxSound.applyPreset(presetKey);
        this.syncFxSoundSlidersFromEngine();
        this.showToast(`Applied preset: ${chip.textContent}`);
      });
    });

    // DSP Sliders
    const linkSlider = (slider, badge, effectKey) => {
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        badge.textContent = `${val}%`;
        window.fxSound.setEffect(effectKey, val);
      });
    };

    linkSlider(this.dom.sliderFidelity, this.dom.valFidelity, 'fidelity');
    linkSlider(this.dom.sliderBass, this.dom.valBass, 'bass');
    linkSlider(this.dom.sliderDynamic, this.dom.valDynamic, 'dynamicBoost');
    linkSlider(this.dom.sliderSurround, this.dom.valSurround, 'surround');
    linkSlider(this.dom.sliderVoice, this.dom.valVoice, 'voiceEnhance');
  }

  toggleFxSoundPower() {
    const isNowOn = window.fxSound.togglePower();
    
    // Update Power button in FxSound View
    this.dom.btnMasterPower.classList.toggle('active', isNowOn);
    
    // Update Quick Toggle in Player Bar
    this.dom.btnQuickFxSound.classList.toggle('active', isNowOn);
    this.dom.btnQuickFxSound.querySelector('span').textContent = isNowOn ? 'FxSound ON' : 'FxSound OFF';

    this.showToast(isNowOn ? 'FxSound DSP Activated (HD Sound)' : 'FxSound Bypassed (Clean)');
  }

  syncFxSoundSlidersFromEngine() {
    const p = window.fxSound.params;
    this.dom.sliderFidelity.value = p.fidelity;
    this.dom.valFidelity.textContent = `${p.fidelity}%`;

    this.dom.sliderBass.value = p.bass;
    this.dom.valBass.textContent = `${p.bass}%`;

    this.dom.sliderDynamic.value = p.dynamicBoost;
    this.dom.valDynamic.textContent = `${p.dynamicBoost}%`;

    this.dom.sliderSurround.value = p.surround;
    this.dom.valSurround.textContent = `${p.surround}%`;

    this.dom.sliderVoice.value = p.voiceEnhance;
    this.dom.valVoice.textContent = `${p.voiceEnhance}%`;

    this.renderEqSliders();
  }

  renderEqSliders() {
    this.dom.eqContainer.innerHTML = '';
    const freqs = window.fxSound.eqFrequencies;
    const bands = window.fxSound.eqBands;

    freqs.forEach((freq, idx) => {
      const col = document.createElement('div');
      col.className = 'eq-band-col';

      const labelText = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
      const gainVal = bands[idx] || 0;

      col.innerHTML = `
        <span class="eq-band-val" id="eq-val-${idx}">${gainVal > 0 ? '+' : ''}${gainVal.toFixed(1)}</span>
        <input type="range" min="-12" max="12" step="0.5" value="${gainVal}" data-band="${idx}">
        <span class="eq-band-label">${labelText}</span>
      `;

      const input = col.querySelector('input');
      const valBadge = col.querySelector('.eq-band-val');

      input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valBadge.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}`;
        window.fxSound.setEqBand(idx, val);
      });

      this.dom.eqContainer.appendChild(col);
    });
  }

  // --- Real-time Spectrum Analyzer Visualizer ---
  startVisualizer() {
    const canvas = this.dom.visualizerCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      requestAnimationFrame(draw);

      const bufferLength = 32;
      const dataArray = window.fxSound.getSpectrumData();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) - 3;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Amplitude
        const val = dataArray[i] || 0;
        const barHeight = (val / 255) * canvas.height * (window.fxSound.isPoweredOn ? 1.0 : 0.4);

        // Gradient styling
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        if (window.fxSound.isPoweredOn) {
          gradient.addColorStop(0, '#00e676');
          gradient.addColorStop(0.5, '#00e5ff');
          gradient.addColorStop(1, '#7c4dff');
        } else {
          gradient.addColorStop(0, '#555555');
          gradient.addColorStop(1, '#888888');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();

        x += barWidth + 3;
      }
    };

    draw();
  }

  // --- Catalog, Featured Tracks & Playlists ---
  loadCatalog() {
    this.playlist = window.musicApi.getFeaturedTracks();
    const playlists = window.musicApi.getPlaylists();

    // Render Home Featured Grid
    this.dom.homeFeaturedGrid.innerHTML = '';
    this.playlist.forEach((track, index) => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <div class="card-thumb-wrapper">
          <img src="${track.thumbnail}" alt="${track.title}" loading="lazy">
          <div class="card-play-btn" data-index="${index}">
            <svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="card-title">${track.title}</div>
        <div class="card-artist">${track.artist}</div>
        <div class="card-actions">
          <button class="btn-card-icon btn-dl" data-id="${track.id}" title="Download Track">
            <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
          </button>
          <button class="btn-card-icon btn-lk ${this.likedTrackIds.has(track.id) ? 'active' : ''}" data-id="${track.id}" title="Like">
            <svg style="width:16px;height:16px;fill:${this.likedTrackIds.has(track.id) ? '#00e676' : 'currentColor'}" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
      `;

      card.querySelector('.card-play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.currentIndex = index;
        this.loadTrack(track, true);
      });

      card.querySelector('.btn-dl').addEventListener('click', (e) => {
        e.stopPropagation();
        window.downloader.download(track);
      });

      card.querySelector('.btn-lk').addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.likedTrackIds.has(track.id)) {
          this.likedTrackIds.delete(track.id);
          card.querySelector('.btn-lk svg').style.fill = 'currentColor';
        } else {
          this.likedTrackIds.add(track.id);
          card.querySelector('.btn-lk svg').style.fill = '#00e676';
          this.showToast(`Liked ${track.title}`);
        }
        this.saveLikedSongs();
      });

      card.addEventListener('click', () => {
        this.currentIndex = index;
        this.loadTrack(track, true);
      });

      this.dom.homeFeaturedGrid.appendChild(card);
    });

    // Render Playlists Grid
    this.dom.homePlaylistsGrid.innerHTML = '';
    playlists.forEach(pl => {
      const plCard = document.createElement('div');
      plCard.className = 'song-card';
      plCard.innerHTML = `
        <div class="card-thumb-wrapper">
          <img src="${pl.thumbnail}" alt="${pl.title}">
          <div class="card-play-btn">
            <svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="card-title">${pl.title}</div>
        <div class="card-artist">${pl.description}</div>
      `;

      plCard.addEventListener('click', () => {
        if (pl.trackList && pl.trackList.length > 0) {
          this.playlist = pl.trackList;
          this.currentIndex = 0;
          this.loadTrack(this.playlist[0], true);
          this.showToast(`Playing playlist: ${pl.title}`);
        }
      });

      this.dom.homePlaylistsGrid.appendChild(plCard);
    });
  }

  // --- Search System ---
  setupSearch() {
    let debounceTimer = null;
    this.dom.globalSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value;
      debounceTimer = setTimeout(async () => {
        this.switchView('search');
        this.dom.searchStatusText.textContent = query ? `Results for "${query}"` : 'Showing top recommendations';
        const results = await window.musicApi.searchSongs(query);
        this.renderSearchResults(results);
      }, 300);
    });

    // Initial search render
    this.renderSearchResults(this.playlist);
  }

  renderSearchResults(results) {
    this.dom.searchResultsTbody.innerHTML = '';

    if (!results || results.length === 0) {
      this.dom.searchResultsTbody.innerHTML = `
        <tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No songs found. Try another search.</td></tr>
      `;
      return;
    }

    results.forEach((track, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color:var(--text-muted); font-weight:600;">${index + 1}</td>
        <td>
          <div class="table-track-info">
            <img src="${track.thumbnail}" class="table-track-thumb" alt="${track.title}">
            <div>
              <div class="table-track-title">${track.title}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">${track.artist}</div>
            </div>
          </div>
        </td>
        <td>${track.album || 'Single'}</td>
        <td>${this.formatTime(track.duration || 180)}</td>
        <td style="text-align:center;">
          <div style="display:inline-flex; gap:6px;">
            <button class="btn-card-icon btn-table-play" title="Play">
              <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button class="btn-card-icon btn-table-dl" title="Download">
              <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-table-play').addEventListener('click', (e) => {
        e.stopPropagation();
        this.loadTrack(track, true);
      });

      tr.querySelector('.btn-table-dl').addEventListener('click', (e) => {
        e.stopPropagation();
        window.downloader.download(track);
      });

      tr.addEventListener('click', () => {
        this.loadTrack(track, true);
      });

      this.dom.searchResultsTbody.appendChild(tr);
    });
  }

  // --- Library View ---
  renderLibraryView() {
    this.dom.libraryGrid.innerHTML = '';
    const allTracks = window.musicApi.getFeaturedTracks();
    const liked = allTracks.filter(t => this.likedTrackIds.has(t.id));

    this.dom.libraryCount.textContent = `${liked.length} Liked Tracks`;

    if (liked.length === 0) {
      this.dom.libraryGrid.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1;">Your library is empty. Click the heart icon on any song to save it here!</p>`;
      return;
    }

    liked.forEach((track, idx) => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <div class="card-thumb-wrapper">
          <img src="${track.thumbnail}" alt="${track.title}">
          <div class="card-play-btn">
            <svg style="width:20px;height:20px;fill:currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="card-title">${track.title}</div>
        <div class="card-artist">${track.artist}</div>
      `;

      card.addEventListener('click', () => {
        this.playlist = liked;
        this.currentIndex = idx;
        this.loadTrack(track, true);
      });

      this.dom.libraryGrid.appendChild(card);
    });
  }

  // --- Downloads View & Manager ---
  setupDownloads() {
    this.dom.btnOpenDownloadsFolder.addEventListener('click', () => {
      window.downloader.openFolder();
    });

    this.dom.btnSettingsOpenFolder.addEventListener('click', () => {
      window.downloader.openFolder();
    });

    this.renderDownloadsView();
  }

  renderDownloadsView() {
    const downloaded = window.downloader.getDownloadedTracks();
    this.dom.downloadsBadge.textContent = downloaded.length;
    this.dom.downloadsTbody.innerHTML = '';

    if (downloaded.length === 0) {
      this.dom.downloadsTbody.innerHTML = `
        <tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No songs downloaded yet. Click the download icon on any song to save it offline!</td></tr>
      `;
      return;
    }

    downloaded.forEach((item, index) => {
      const tr = document.createElement('tr');
      const dateStr = item.downloadedAt ? new Date(item.downloadedAt).toLocaleDateString() : 'Recent';
      tr.innerHTML = `
        <td style="color:var(--text-muted); font-weight:600;">${index + 1}</td>
        <td>
          <div class="table-track-info">
            <img src="${item.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120'}" class="table-track-thumb" alt="${item.title}">
            <div>
              <div class="table-track-title">${item.title}</div>
              <div style="font-size:0.75rem; color:var(--text-secondary);">${item.artist}</div>
            </div>
          </div>
        </td>
        <td style="font-family:monospace; font-size:0.78rem; color:var(--accent-blue);">${item.fileName || 'music.mp3'}</td>
        <td>${dateStr}</td>
        <td style="text-align:center;">
          <button class="btn-card-icon btn-dl-play" title="Play">
            <svg style="width:18px;height:18px;fill:var(--accent-green)" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </td>
      `;

      tr.querySelector('.btn-dl-play').addEventListener('click', () => {
        this.loadTrack(item, true);
      });

      this.dom.downloadsTbody.appendChild(tr);
    });
  }

  // --- Play & Listen Together (Host & Join) ---
  setupListenTogether() {
    this.dom.btnQuickHost.addEventListener('click', () => {
      this.switchView('listen-together');
      this.startHostMode();
    });

    this.dom.btnStartHosting.addEventListener('click', () => {
      this.startHostMode();
    });

    this.dom.btnStopHosting.addEventListener('click', () => {
      window.listenTogether.stopHosting();
      this.renderListenTogetherView();
      this.showToast('Host session closed');
    });

    this.dom.hostRoomCodeBox.addEventListener('click', () => {
      const code = this.dom.hostRoomCodeBox.textContent;
      navigator.clipboard.writeText(code);
      this.showToast(`Copied room code: ${code}`);
    });

    this.dom.btnJoinSession.addEventListener('click', async () => {
      const code = this.dom.joinRoomCodeInput.value;
      const ip = this.dom.joinHostIpInput.value;
      await window.listenTogether.joinRoom(code, ip);
      this.renderListenTogetherView();
    });

    this.dom.btnLeaveSession.addEventListener('click', async () => {
      await window.listenTogether.leaveRoom();
      this.renderListenTogetherView();
      this.showToast('Left room');
    });

    this.renderListenTogetherView();
  }

  async startHostMode() {
    const res = await window.listenTogether.startHosting();
    if (res && res.success) {
      this.renderListenTogetherView();
    }
  }

  renderListenTogetherView() {
    const lt = window.listenTogether;
    const isHosting = lt.mode === 'host';
    const isClient = lt.mode === 'client';

    this.dom.liveSessionBadge.style.display = (isHosting || isClient) ? 'inline-block' : 'none';

    // Host UI panel
    this.dom.hostControls.style.display = isHosting ? 'none' : 'block';
    this.dom.hostActivePanel.style.display = isHosting ? 'flex' : 'none';
    if (isHosting) {
      this.dom.hostRoomCodeBox.textContent = lt.roomCode || 'LSTN-0000';
      this.dom.hostListenerCount.textContent = `👥 ${lt.listenerCount} Listener${lt.listenerCount === 1 ? '' : 's'} connected`;
    }

    // Client UI panel
    this.dom.joinControls.style.display = isClient ? 'none' : 'flex';
    this.dom.clientActivePanel.style.display = isClient ? 'flex' : 'none';
    if (isClient) {
      this.dom.clientRoomDisplay.textContent = `ROOM: ${lt.roomCode}`;
    }
  }

  // --- Listen Together Client Sync Hooks ---
  playTrackFromSync(track, currentTime, shouldPlay) {
    this.loadTrack(track, false);
    if (currentTime !== undefined) {
      this.audio.currentTime = currentTime;
    }
    if (shouldPlay) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
    this.showToast(`Synced to host track: ${track.title}`);
  }

  syncPlay(currentTime) {
    if (currentTime !== undefined) {
      this.audio.currentTime = currentTime;
    }
    this.audio.play();
  }

  syncPause(currentTime) {
    if (currentTime !== undefined) {
      this.audio.currentTime = currentTime;
    }
    this.audio.pause();
  }

  syncSeek(currentTime) {
    if (currentTime !== undefined) {
      this.audio.currentTime = currentTime;
    }
  }

  // --- Google Authentication System ---
  setupGoogleAuth() {
    // Open Modal
    this.dom.btnGoogleLoginModal.addEventListener('click', () => {
      this.dom.googleAuthModal.classList.add('show');
    });

    this.dom.sidebarUserCard.addEventListener('click', () => {
      this.dom.googleAuthModal.classList.add('show');
    });

    this.dom.btnSettingsSignOut.addEventListener('click', () => {
      this.dom.googleAuthModal.classList.add('show');
    });

    // Close Modal
    this.dom.btnCloseModal.addEventListener('click', () => {
      this.dom.googleAuthModal.classList.remove('show');
    });

    this.dom.googleAuthModal.addEventListener('click', (e) => {
      if (e.target === this.dom.googleAuthModal) {
        this.dom.googleAuthModal.classList.remove('show');
      }
    });

    // Action: 1-click Sign In with Google
    this.dom.btnDoGoogleSignin.addEventListener('click', async () => {
      const user = await window.googleAuth.signInWithGoogle('sourav.roy@gmail.com', 'Sourav Roy');
      this.dom.googleAuthModal.classList.remove('show');
      this.showToast(`Welcome back, ${user.name}!`);
    });

    // Action: Custom Name Sign In
    this.dom.btnCustomGoogleSignin.addEventListener('click', async () => {
      const name = this.dom.customGoogleName.value.trim() || 'Sourav Roy';
      const user = await window.googleAuth.signInWithGoogle(null, name);
      this.dom.googleAuthModal.classList.remove('show');
      this.showToast(`Signed in as ${user.name}`);
    });

    // Auth State Observer
    window.googleAuth.onAuthStateChanged((user) => {
      this.updateUserDisplay(user);
    });
  }

  updateUserDisplay(user) {
    if (!user) return;
    this.dom.sidebarUserAvatar.src = user.avatar;
    this.dom.sidebarUserName.textContent = user.name;
    this.dom.sidebarUserStatus.innerHTML = user.isSignedIn
      ? `<svg style="width:12px;height:12px;fill:#00e676" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Google Connected`
      : `<span style="color:var(--text-muted)">Guest User</span>`;

    this.dom.btnLoginLabel.textContent = user.isSignedIn ? user.name.split(' ')[0] : 'Sign In';
    this.dom.settingsAuthStatus.textContent = user.isSignedIn ? `${user.name} (${user.email})` : 'Guest Mode';
  }

  // --- Toast Notification Helper ---
  showToast(message) {
    if (!this.dom.toast) return;
    this.dom.toast.textContent = message;
    this.dom.toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.dom.toast.classList.remove('show');
    }, 2800);
  }
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.appUi = new AppUI();
});
