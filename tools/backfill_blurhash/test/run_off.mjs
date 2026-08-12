#!/usr/bin/env node
// Harness de verificacion: ejecuta el encode oficial (transpilacion literal de
// woltapp/blurhash master) sobre unos pixeles RGBA dados por argv, imprime el hash.
// Uso: node test/run_off.mjs <componentX> <componentY> <WxH> <r,g,b;r,g,b;...>
import encode from "./encode_off.mjs";

const [cx, cy, dims, csv] = process.argv.slice(2);
const [w, h] = dims.split("x").map(Number);
const pixels = new Uint8ClampedArray(
  csv.split(";").flatMap((p) => p.split(",").map(Number))
);
if (pixels.length !== w * h * 4) {
  console.error(`esperado ${w * h * 4} bytes, llegaron ${pixels.length}`);
  process.exit(1);
}
console.log(encode(pixels, w, h, Number(cx), Number(cy)));