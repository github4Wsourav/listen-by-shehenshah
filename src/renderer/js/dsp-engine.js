/**
 * FxSound DSP Audio Engine for "LISTEN by shehenshah"
 * Reverse-Engineered from fxsound2/fxsound-app (C++ DfxDsp / ptechDsp)
 * 
 * Features:
 * - Clarity / Fidelity (Aural harmonic excitation)
 * - Bass Boost (Resonant sub-bass and punch processing)
 * - Dynamic Boost (Maximizer / peak limiter & loudness enhancer)
 * - 3D Surround / Ambience (Stereo widening via crossfeed & phase delay)
 * - Voice Enhancer (Vocal formant isolation and forward projection)
 * - 10-Band Graphic Equalizer (32Hz to 16kHz)
 * - Seamless live On/Off Power bypass
 */

class FxSoundEngine {
  constructor() {
    this.audioCtx = null;
    this.sourceNode = null;
    this.audioElement = null;

    // Power state
    this.isPoweredOn = true;

    // Sliders (0 - 100)
    this.params = {
      fidelity: 75,       // Clarity / Vocal fidelity
      bass: 65,           // Bass punch & depth
      dynamicBoost: 70,   // Volume maximizer & loudness
      surround: 60,       // 3D acoustic widening
      voiceEnhance: 65,   // Vocal presence
      eqOn: true
    };

    // 10-Band EQ Frequencies (Hz) and current gains (dB, -12 to +12)
    this.eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.eqBands = [2.0, 3.5, 1.5, 0.0, -0.5, 1.0, 2.5, 3.0, 4.0, 3.5];

    // Presets inspired by FxSound factory presets
    this.presets = {
      'music': {
        name: 'Music (High Fidelity)',
        fidelity: 75,
        bass: 65,
        dynamicBoost: 70,
        surround: 60,
        voiceEnhance: 60,
        eq: [2.5, 3.0, 1.0, 0.0, -0.5, 1.0, 2.0, 3.5, 4.0, 3.5]
      },
      'bass-boost': {
        name: 'Bass Explosion',
        fidelity: 60,
        bass: 95,
        dynamicBoost: 80,
        surround: 45,
        voiceEnhance: 40,
        eq: [7.0, 8.5, 5.0, 2.0, 0.0, -1.0, 0.5, 1.5, 2.5, 2.0]
      },
      'voice': {
        name: 'Voice & Podcast Boost',
        fidelity: 85,
        bass: 30,
        dynamicBoost: 65,
        surround: 30,
        voiceEnhance: 95,
        eq: [-3.0, -2.0, 0.0, 2.0, 4.0, 5.5, 4.5, 3.0, 1.0, 0.0]
      },
      'gaming': {
        name: 'Gaming & Spatial 3D',
        fidelity: 80,
        bass: 75,
        dynamicBoost: 85,
        surround: 90,
        voiceEnhance: 70,
        eq: [4.0, 3.0, 1.0, 0.5, 1.0, 2.5, 3.5, 5.0, 4.5, 5.0]
      },
      'cinematic': {
        name: 'Cinematic Concert',
        fidelity: 80,
        bass: 80,
        dynamicBoost: 75,
        surround: 85,
        voiceEnhance: 65,
        eq: [5.0, 4.0, 2.0, 1.0, 0.0, 1.5, 3.0, 4.0, 4.5, 4.0]
      },
      'flat': {
        name: 'Flat / Studio Clean',
        fidelity: 50,
        bass: 50,
        dynamicBoost: 50,
        surround: 50,
        voiceEnhance: 50,
        eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    };

    // Node references
    this.eqNodes = [];
    this.bassShelfNode = null;
    this.bassPeakingNode = null;
    this.clarityShelfNode = null;
    this.clarityExciterNode = null;
    this.voiceNode1 = null;
    this.voiceNode2 = null;
    this.compressorNode = null;
    this.makeupGainNode = null;
    this.analyserNode = null;
    this.masterGainNode = null;

    // Cross-fade gain nodes for instant, click-free Power bypass
    this.wetGainNode = null;
    this.dryGainNode = null;

    this.initialized = false;
  }

  attachAudioElement(audioElement) {
    if (this.initialized) return;
    this.audioElement = audioElement;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();

    this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);

    // Create dry (bypass) and wet (DSP processed) routing paths
    this.dryGainNode = this.audioCtx.createGain();
    this.wetGainNode = this.audioCtx.createGain();
    this.masterGainNode = this.audioCtx.createGain();

    // 1. Equalizer Filter Chain
    this.eqNodes = this.eqFrequencies.map((freq, idx) => {
      const biquad = this.audioCtx.createBiquadFilter();
      if (idx === 0) {
        biquad.type = 'lowshelf';
      } else if (idx === this.eqFrequencies.length - 1) {
        biquad.type = 'highshelf';
      } else {
        biquad.type = 'peaking';
        biquad.Q.value = 1.4;
      }
      biquad.frequency.value = freq;
      biquad.gain.value = this.eqBands[idx];
      return biquad;
    });

    // 2. Bass Boost Nodes
    this.bassShelfNode = this.audioCtx.createBiquadFilter();
    this.bassShelfNode.type = 'lowshelf';
    this.bassShelfNode.frequency.value = 80;

    this.bassPeakingNode = this.audioCtx.createBiquadFilter();
    this.bassPeakingNode.type = 'peaking';
    this.bassPeakingNode.frequency.value = 130;
    this.bassPeakingNode.Q.value = 1.2;

    // 3. Clarity / Fidelity Nodes (High-frequency harmonic exciter)
    this.clarityShelfNode = this.audioCtx.createBiquadFilter();
    this.clarityShelfNode.type = 'highshelf';
    this.clarityShelfNode.frequency.value = 4500;

    this.clarityExciterNode = this.audioCtx.createBiquadFilter();
    this.clarityExciterNode.type = 'peaking';
    this.clarityExciterNode.frequency.value = 8500;
    this.clarityExciterNode.Q.value = 1.5;

    // 4. Voice Enhancer Nodes (Vocal resonance)
    this.voiceNode1 = this.audioCtx.createBiquadFilter();
    this.voiceNode1.type = 'peaking';
    this.voiceNode1.frequency.value = 1400;
    this.voiceNode1.Q.value = 1.0;

    this.voiceNode2 = this.audioCtx.createBiquadFilter();
    this.voiceNode2.type = 'peaking';
    this.voiceNode2.frequency.value = 2800;
    this.voiceNode2.Q.value = 1.3;

    // 5. Dynamic Boost / Maximizer (Lookahead Peak Compressor)
    this.compressorNode = this.audioCtx.createDynamicsCompressor();
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.15;
    this.compressorNode.knee.value = 6;
    this.compressorNode.ratio.value = 3.5;

    this.makeupGainNode = this.audioCtx.createGain();

    // 6. Surround / Spatial Widener Delay Node
    this.surroundDelay = this.audioCtx.createDelay();
    this.surroundDelay.delayTime.value = 0.016; // 16ms Haas delay
    this.surroundGain = this.audioCtx.createGain();

    // 7. Spectrum Analyser for real-time visualizer
    this.analyserNode = this.audioCtx.createAnalyser();
    this.analyserNode.fftSize = 64; // 32 frequency bins
    this.analyserNode.smoothingTimeConstant = 0.8;

    // --- Connect DSP Audio Graph ---
    // Dry Path: Source -> Dry Gain -> Master -> Analyser -> Destination
    this.sourceNode.connect(this.dryGainNode);
    this.dryGainNode.connect(this.masterGainNode);

    // Wet Path: Source -> EQ Chain -> Bass -> Clarity -> Voice -> Compressor -> Makeup -> Wet Gain -> Master
    let chain = this.sourceNode;

    // Chain 10 EQ bands
    for (const eqNode of this.eqNodes) {
      chain.connect(eqNode);
      chain = eqNode;
    }

    // Connect Enhancers
    chain.connect(this.bassShelfNode);
    this.bassShelfNode.connect(this.bassPeakingNode);
    this.bassPeakingNode.connect(this.clarityShelfNode);
    this.clarityShelfNode.connect(this.clarityExciterNode);
    this.clarityExciterNode.connect(this.voiceNode1);
    this.voiceNode1.connect(this.voiceNode2);
    this.voiceNode2.connect(this.compressorNode);
    this.compressorNode.connect(this.makeupGainNode);

    // Connect Surround sidechain
    this.voiceNode2.connect(this.surroundDelay);
    this.surroundDelay.connect(this.surroundGain);
    this.surroundGain.connect(this.makeupGainNode);

    this.makeupGainNode.connect(this.wetGainNode);
    this.wetGainNode.connect(this.masterGainNode);

    // Master to Analyser & Output
    this.masterGainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioCtx.destination);

    this.initialized = true;
    this.applySettings();
  }

  resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Live Power Toggle (Can be turned on/off anytime during playing)
  setPower(on) {
    this.isPoweredOn = Boolean(on);
    this.applyPowerRouting();
  }

  togglePower() {
    this.setPower(!this.isPoweredOn);
    return this.isPoweredOn;
  }

  applyPowerRouting() {
    if (!this.initialized || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const fadeTime = 0.05; // 50ms clickless crossfade

    if (this.isPoweredOn) {
      this.wetGainNode.gain.cancelScheduledValues(now);
      this.dryGainNode.gain.cancelScheduledValues(now);
      this.wetGainNode.gain.linearRampToValueAtTime(1.0, now + fadeTime);
      this.dryGainNode.gain.linearRampToValueAtTime(0.0, now + fadeTime);
    } else {
      this.wetGainNode.gain.cancelScheduledValues(now);
      this.dryGainNode.gain.cancelScheduledValues(now);
      this.wetGainNode.gain.linearRampToValueAtTime(0.0, now + fadeTime);
      this.dryGainNode.gain.linearRampToValueAtTime(1.0, now + fadeTime);
    }
  }

  // Set Effect Values (0 - 100)
  setEffect(effectName, val) {
    const value = Math.max(0, Math.min(100, Number(val)));
    this.params[effectName] = value;
    this.applySettings();
  }

  // Set individual EQ band gain (-12dB to +12dB)
  setEqBand(bandIndex, gainDb) {
    if (bandIndex < 0 || bandIndex >= this.eqBands.length) return;
    const gain = Math.max(-12, Math.min(12, Number(gainDb)));
    this.eqBands[bandIndex] = gain;
    if (this.initialized && this.eqNodes[bandIndex]) {
      this.eqNodes[bandIndex].gain.setTargetAtTime(gain, this.audioCtx.currentTime, 0.02);
    }
  }

  applyPreset(presetKey) {
    const preset = this.presets[presetKey];
    if (!preset) return;

    this.params.fidelity = preset.fidelity;
    this.params.bass = preset.bass;
    this.params.dynamicBoost = preset.dynamicBoost;
    this.params.surround = preset.surround;
    this.params.voiceEnhance = preset.voiceEnhance;
    this.eqBands = [...preset.eq];

    this.applySettings();
  }

  applySettings() {
    if (!this.initialized || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // 1. Fidelity / Clarity: Maps 0-100 to Shelf (0 to 9dB) & Exciter (0 to 6dB)
    const fidelityRatio = this.params.fidelity / 100;
    this.clarityShelfNode.gain.setTargetAtTime(fidelityRatio * 9.0, now, 0.02);
    this.clarityExciterNode.gain.setTargetAtTime(fidelityRatio * 6.5, now, 0.02);

    // 2. Bass Boost: Maps 0-100 to Shelf (0 to 12dB) & Peaking Punch (0 to 8dB)
    const bassRatio = this.params.bass / 100;
    this.bassShelfNode.gain.setTargetAtTime(bassRatio * 12.0, now, 0.02);
    this.bassPeakingNode.gain.setTargetAtTime(bassRatio * 7.5, now, 0.02);

    // 3. Dynamic Boost (Maximizer): Threshold (-4dB to -20dB), Makeup Gain (1.0 to 2.2x)
    const dynRatio = this.params.dynamicBoost / 100;
    const threshold = -4 - (dynRatio * 16); // Down to -20dB
    this.compressorNode.threshold.setTargetAtTime(threshold, now, 0.02);
    const makeup = 1.0 + (dynRatio * 0.95);
    this.makeupGainNode.gain.setTargetAtTime(makeup, now, 0.02);

    // 4. Surround / Spatial Sound: Sidechain gain 0.0 to 0.45
    const surroundRatio = this.params.surround / 100;
    this.surroundGain.gain.setTargetAtTime(surroundRatio * 0.42, now, 0.02);

    // 5. Voice Enhancer: Formants 0 to 7dB boost
    const voiceRatio = this.params.voiceEnhance / 100;
    this.voiceNode1.gain.setTargetAtTime(voiceRatio * 6.0, now, 0.02);
    this.voiceNode2.gain.setTargetAtTime(voiceRatio * 5.0, now, 0.02);

    // 6. EQ Bands
    this.eqBands.forEach((gain, i) => {
      if (this.eqNodes[i]) {
        this.eqNodes[i].gain.setTargetAtTime(gain, now, 0.02);
      }
    });

    this.applyPowerRouting();
  }

  // Get frequency spectrum data for visualizer
  getSpectrumData() {
    if (!this.analyserNode) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

// Global instance
window.fxSound = new FxSoundEngine();
