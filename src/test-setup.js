import '@testing-library/jest-dom';

// Guard de entorno: los tests de workers/ (ADR-028) corren en `node`
// (workers/utils/__tests__/*), donde `window` no existe. El resto del
// setup (navigator, gapi, MediaMetadata) vive solo en jsdom.
const hasWindow = typeof window !== 'undefined';

if (hasWindow) {
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
}

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
