import '@testing-library/jest-dom';

// Mock navigator.mediaSession
Object.defineProperty(navigator, 'mediaSession', {
  value: {
    metadata: null,
    setActionHandler: () => {},
  },
  writable: true,
});

// Mock navigator.vibrate
navigator.vibrate = () => true;

// Mock navigator.wakeLock
navigator.wakeLock = { request: () => Promise.resolve({ release: () => {} }) };

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = value; },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock HTMLMediaElement methods not in jsdom
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};

// Mock MediaMetadata (not in jsdom)
globalThis.MediaMetadata = class MediaMetadata {
  constructor(init) { Object.assign(this, init); }
};

// Mock gapi (Google API — avoid crash in PlayerContext tests)
globalThis.gapi = {
  client: {
    drive: { files: {} },
    request: () => Promise.resolve({ result: {} }),
    getToken: () => ({ access_token: 'mock-token' }),
    setToken: () => {},
  },
  auth2: {
    getAuthInstance: () => ({
      signOut: () => {},
      currentUser: { get: () => ({ getBasicProfile: () => ({ getEmail: () => '' }) }) },
    }),
  },
  load: () => {},
};
