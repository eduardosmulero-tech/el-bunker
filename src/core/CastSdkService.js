// Chromecast SDK loader. Loaded only when the user requests Cast.
let sdkPromise = null;

export function loadCastSdk() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.cast?.framework && window.chrome?.cast) return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    const previousCallback = window.__onGCastApiAvailable;
    let settled = false;
    let timeoutId;
    const finish = (available) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      if (window.__onGCastApiAvailable === finish) {
        window.__onGCastApiAvailable = previousCallback;
      }
      if (typeof previousCallback === "function") previousCallback(available);
      const ready = Boolean(available && window.cast?.framework && window.chrome?.cast);
      if (!ready) sdkPromise = null;
      resolve(ready);
    };
    window.__onGCastApiAvailable = finish;
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
    script.async = true;
    script.dataset.bunkerCast = "true";
    script.onerror = () => finish(false);
    timeoutId = setTimeout(() => finish(false), 10000);
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function resetCastSdkForTests() {
  sdkPromise = null;
}
