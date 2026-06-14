// Shim: jsmediatags ReactNativeFileReader.js imports react-native-fs,
// which is never used in browser builds. This empty module prevents
// Rolldown/Vite from failing to resolve it.
export default {};
