/**
 * Music Streaming & Search Catalog API for "LISTEN by shehenshah"
 * No YouTube login, no Spotify account, no Discord required.
 * Pure songs with high-resolution album thumbnails.
 */

class MusicCatalogAPI {
  constructor() {
    // Curated high-fidelity tracks with working audio streams and stunning album artwork
    this.featuredTracks = [
      {
        id: 'track-1',
        title: 'Starry Night Resonance',
        artist: 'The Shehenshah Orchestra',
        album: 'Cosmic Horizons',
        duration: 214,
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=star-night-112191.mp3'
      },
      {
        id: 'track-2',
        title: 'Midnight City Drive',
        artist: 'Cyber Dreamer',
        album: 'Neon Overdrive',
        duration: 185,
        thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3'
      },
      {
        id: 'track-3',
        title: 'Lofi Chill Study Session',
        artist: 'Aura Beats',
        album: 'Rainy Cafe Vibes',
        duration: 162,
        thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3'
      },
      {
        id: 'track-4',
        title: 'Golden Sunset Acoustic',
        artist: 'Sourav Roy & Strings',
        album: 'Acoustic Solitude',
        duration: 198,
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77395.mp3?filename=acoustic-guitar-ambient-124483.mp3'
      },
      {
        id: 'track-5',
        title: 'Deep Bass Frequency Anthem',
        artist: 'Bassline Masters',
        album: 'Subwoofer Dynamics',
        duration: 228,
        thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_510a74070a.mp3?filename=modern-vlog-bass-111059.mp3'
      },
      {
        id: 'track-6',
        title: 'Euphoric Club Odyssey',
        artist: 'Spectra Groove',
        album: 'Afterdark Sessions',
        duration: 242,
        thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_73bb2f5bd2.mp3?filename=club-dance-beat-9048.mp3'
      },
      {
        id: 'track-7',
        title: 'Peaceful Ambient Forest',
        artist: 'Zenith Echoes',
        album: 'Binaural Horizons',
        duration: 210,
        thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=ambient-piano-calm-112191.mp3'
      },
      {
        id: 'track-8',
        title: 'Voice in the Clouds',
        artist: 'Acoustic Melody Duo',
        album: 'Pure Vocals',
        duration: 175,
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=sweet-love-story-118855.mp3'
      }
    ];

    this.playlists = [
      {
        id: 'pl-trending',
        title: 'Trending Shehenshah Hits',
        description: 'The hottest tracks trending globally right now.',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        tracks: [0, 1, 2, 4]
      },
      {
        id: 'pl-fxsound',
        title: 'FxSound Audio Showcase',
        description: 'Optimized specifically to experience clarity, punchy bass, and 3D surround sound.',
        thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        tracks: [1, 4, 5, 0]
      },
      {
        id: 'pl-lofi',
        title: 'Chill & Focus Vibes',
        description: 'Relaxing ambient beats for study, coding, and meditation.',
        thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
        tracks: [2, 3, 6, 7]
      }
    ];
  }

  getFeaturedTracks() {
    return this.featuredTracks;
  }

  getPlaylists() {
    return this.playlists.map(pl => ({
      ...pl,
      trackList: pl.tracks.map(idx => this.featuredTracks[idx]).filter(Boolean)
    }));
  }

  /**
   * Search songs with online iTunes API + local database
   */
  async searchSongs(query) {
    if (!query || query.trim() === '') {
      return this.featuredTracks;
    }

    const qLower = query.toLowerCase().trim();

    // 1. Check local catalog
    const localMatches = this.featuredTracks.filter(t => 
      t.title.toLowerCase().includes(qLower) || 
      t.artist.toLowerCase().includes(qLower) || 
      t.album.toLowerCase().includes(qLower)
    );

    // 2. Fetch live online search from iTunes API for album art & preview audio
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.results && data.results.length > 0) {
        const onlineTracks = data.results.map((item, index) => {
          // Use high-resolution artwork (replace 100x100 with 600x600)
          const highResArt = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
          return {
            id: `itunes-${item.trackId || index}`,
            title: item.trackName || 'Unknown Title',
            artist: item.artistName || 'Unknown Artist',
            album: item.collectionName || 'Single',
            duration: Math.round((item.trackTimeMillis || 180000) / 1000),
            thumbnail: highResArt || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
            audioUrl: item.previewUrl
          };
        }).filter(t => Boolean(t.audioUrl));

        // Combine local and online
        const combined = [...localMatches];
        onlineTracks.forEach(ot => {
          if (!combined.some(ct => ct.title.toLowerCase() === ot.title.toLowerCase())) {
            combined.push(ot);
          }
        });

        return combined;
      }
    } catch (err) {
      console.warn('Online music search fallback to local:', err);
    }

    return localMatches;
  }
}

window.musicApi = new MusicCatalogAPI();
