// @vitest-environment node
// El DoD de B1, automatizado. admin-core viaja a vinos-carta-app tal cual, así que
// su lista de imports permitidos es cerrada y se verifica fichero a fichero. Un grep
// manual comprueba el día que se ejecuta; esto lo comprueba en cada suite.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";

const CORE_DIR = new URL("../core/", import.meta.url);

const coreFiles = (directory = CORE_DIR) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) return coreFiles(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });

const ALLOWED_IMPORT =
  /^(react|react\/jsx-runtime|framer-motion|\.\.\/\.\.\/tokens|\.\.\/\.\.\/core\/ui\/(Button|Card|Input|Dialog|Icon|Skeleton)|\.\/[\w.-]+)$/;

const SPECIFIER_PATTERNS = [
  /\bfrom\s+["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
  /\brequire\(\s*["']([^"']+)["']\s*\)/g,
];

const specifiersOf = (source) => {
  const found = new Set();
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) found.add(match[1]);
  }
  return [...found];
};

describe("admin-core boundaries", () => {
  const files = coreFiles();

  it("1. encuentra ficheros que auditar", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("2. solo importa de la lista blanca de portabilidad", () => {
    for (const file of files) {
      for (const specifier of specifiersOf(readFileSync(file, "utf8"))) {
        expect(specifier, `${file.pathname} importa "${specifier}"`).toMatch(ALLOWED_IMPORT);
      }
    }
  });

  it("3. no toca ningún módulo del Búnker", () => {
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file.pathname).not.toMatch(
        /vault|musiclab|capsules|smoke|VaultContext|PlayerContext|GoogleDrive|WorkerDataService|FileUploadService/i
      );
    }
  });

  it("4. no importa lucide-react directamente — la iconografía pasa por core/ui/Icon", () => {
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file.pathname).not.toMatch(/lucide-react/);
    }
  });

  it("5. no importa el ConfirmDialog simple de core/ui/Dialog (colisión de nombre)", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file.pathname).not.toMatch(
        /import\s*\{[^}]*\bConfirmDialog\b[^}]*\}\s*from\s*["'][^"']*core\/ui\/Dialog["']/
      );
    }
  });

  it("6. cero emoji", () => {
    for (const file of files) {
      expect(readFileSync(file, "utf8"), file.pathname).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  // La superficie de tokens es el otro contrato de portabilidad: vinos-carta-app solo
  // tendrá que definir estos cuatro para que el núcleo funcione tal cual.
  it("7. solo consume cuatro tokens: ACID, RED, BG, FONT_MONO", () => {
    const ALLOWED_TOKENS = new Set(["ACID", "RED", "BG", "FONT_MONO"]);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*["']\.\.\/\.\.\/tokens["']/g)) {
        for (const raw of match[1].split(",")) {
          const name = raw.split(" as ")[0].trim();
          if (!name) continue;
          expect(ALLOWED_TOKENS.has(name), `${file.pathname} usa el token "${name}"`).toBe(true);
        }
      }
    }
  });
});
