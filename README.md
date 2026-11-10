# 🎵 LISTEN by shehenshah

> **Next-generation, high-fidelity music streaming, co-listening & audio enhancement desktop player.**  
> Created by **shehenshah (Sourav)**.

---

## 🌟 Highlights & Key Features

### 1. 🔐 Google Account Authentication
- Seamless 1-click **Sign in with Google**.
- Persistent user profiles, custom avatars, and Google account status.
- Personal cloud-synced playlists, liked library, and room session credentials.

### 2. 🎚️ Integrated FxSound 64-bit DSP Audio Enhancer
Reverse-engineered from [`fxsound2/fxsound-app`](https://github.com/fxsound2/fxsound-app) and natively integrated into the audio pipeline:
- **Clarity & Fidelity**: Harmonic exciter that restores crisp high frequencies, transient snap, and vocal sparkle.
- **Bass Boost**: Resonant sub-bass and punch processing without muddiness or distortion.
- **Dynamic Boost (Maximizer)**: Lookahead peak compressor for maximum volume, richness, and depth.
- **3D Surround Sound**: Binaural phase spatializer providing an immersive 3D soundstage.
- **Voice Enhancer**: Mid-frequency vocal isolation bringing lead vocals to the forefront.
- **10-Band Graphic Equalizer**: Precision sliders from 32 Hz to 16 kHz (-12 dB to +12 dB).
- **Acoustic Presets**: *Music (High Fidelity)*, *Bass Explosion*, *Voice & Podcast*, *Gaming 3D*, *Cinematic Concert*, and *Flat Studio*.
- **Live On/Off Power Toggle**: Easily switch FxSound ON or OFF anytime during live song playback with instant audio feedback.
- **Real-Time Spectrum Analyzer**: Animated 32-band audio visualizer reflecting live frequency output.

### 3. 🖼️ Pure Songs with High-Definition Thumbnails
- Completely removed lyrics panels and video playback elements.
- Focused purely on pristine audio playback with stunning high-resolution album artwork.

### 4. 🚀 Zero Third-Party Login Dependencies
- **No YouTube login, No Spotify Premium account, No Discord connection required.**
- Independent, lightning-fast streaming and search catalog powered by open APIs and iTunes high-res metadata.

### 5. 🚫 Clean & Ad-Free (No SponsorBlock)
- Completely stripped of SponsorBlock logic for direct, uninterrupted playback.

### 6. ⬇️ Built-In Song Downloader for Every Song
- One-click download button on every track card, table row, and currently playing bar.
- Saves songs directly into `Downloads/LISTEN Music/` on your computer.
- Direct "Open Downloads Folder" button inside the app.

### 7. 👥 Play & Listen Together (Host & Join)
- **Host Mode**: Click "Generate Room & Host" to receive a 6-digit room code (e.g. `LSTN-4892`).
- **Join Mode**: Friends enter your room code to connect and synchronize tracks, play/pause state, and seek timestamps in real time!
- Real-time connected listener counter.

### 8. 👑 Dedicated Branding & Credits
- Built and designed exclusively for **shehenshah (Sourav)** with custom branding, themes, and sleek glassmorphism UI.

---

## 🛠️ Technology Stack & Architecture

- **Runtime & Desktop Shell:** Electron 33+, Node.js
- **Audio & DSP Core:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `DynamicsCompressorNode`, `DelayNode`, `AnalyserNode`)
- **Networking & Co-listening:** Native WebSockets (`ws`)
- **UI Framework:** Ultra-modern dark glassmorphism responsive HTML5/CSS3/ES6

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Launch

```bash
# 1. Clone the repository
git clone https://github.com/github4Wsourav/listen-by-shehenshah.git

# 2. Navigate into project folder
cd listen-by-shehenshah

# 3. Install dependencies
npm install

# 4. Start the application
npm start
```

### Packaging into Executable (.exe)
```bash
# Build standalone desktop installer
npm run dist
```

---

## 🔬 Reverse Engineering Analysis (REA)
This project was developed by analyzing:
1. **Spotifast** ([`crmne/spotifast`](https://github.com/crmne/spotifast)): Architectural layout, state dispatching, player bar controls, and desktop media integration.
2. **FxSound** ([`fxsound2/fxsound-app`](https://github.com/fxsound2/fxsound-app)): C++ `DfxDsp` processing pipeline, multi-band harmonic exciter, peak maximizer, and 10-band equalizer.

---

## 📄 License
MIT License © 2026 **shehenshah (Sourav)**.
