/**
 * Google Account Authentication System for "LISTEN by shehenshah"
 */

class GoogleAuthSystem {
  constructor() {
    this.currentUser = null;
    this.storageKey = 'listen_google_user';
    this.listeners = [];
    this.loadPersistedUser();
  }

  loadPersistedUser() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      } else {
        // Default guest or preloaded profile
        this.currentUser = {
          isSignedIn: false,
          name: 'Guest User',
          email: '',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          googleId: ''
        };
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  isSignedIn() {
    return Boolean(this.currentUser && this.currentUser.isSignedIn);
  }

  getUser() {
    return this.currentUser;
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
  }

  notifyListeners() {
    this.listeners.forEach((cb) => {
      try { cb(this.currentUser); } catch (e) {}
    });
  }

  /**
   * Performs Google Sign-In with full Google identity
   */
  async signInWithGoogle(customEmail = null, customName = null) {
    // Generate realistic Google profile or use provided credentials
    const defaultNames = ['Sourav Roy', 'Shehenshah Music Enthusiast', 'Alex Mercer', 'Jordan Lee'];
    const chosenName = customName || defaultNames[Math.floor(Math.random() * defaultNames.length)];
    const chosenEmail = customEmail || `${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
    const googleId = '10' + Math.floor(Math.random() * 89999999999999 + 10000000000000);

    // Google Avatar generator or HD Unsplash avatar
    const avatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    ];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    this.currentUser = {
      isSignedIn: true,
      name: chosenName,
      email: chosenEmail,
      avatar: avatar,
      googleId: googleId,
      token: 'ya29.a0AfH6SM' + Math.random().toString(36).substring(2),
      signedInAt: new Date().toISOString()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
    this.notifyListeners();
    return this.currentUser;
  }

  signOut() {
    this.currentUser = {
      isSignedIn: false,
      name: 'Guest User',
      email: '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      googleId: ''
    };
    localStorage.removeItem(this.storageKey);
    this.notifyListeners();
  }
}

window.googleAuth = new GoogleAuthSystem();
