const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const htmlFiles = ["index.html", "copa.html", "namorados.html", "ofertas-selecionadas.html"];
const staticFiles = ["perfil.png"];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(rootDir, file), "utf8");
  const output = minifyHtml(obfuscateInlineScripts(minifyInlineStyles(source)));
  fs.writeFileSync(path.join(distDir, file), output);
}

for (const file of staticFiles) {
  fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
}

function minifyInlineStyles(html) {
  return html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
    return match.replace(css, minifyCss(css));
  });
}

function obfuscateInlineScripts(html) {
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, js) => {
    if (/\bsrc\s*=/.test(attrs) || !js.trim()) {
      return match;
    }

    const payload = Buffer.from(minifyJs(js), "utf8").toString("base64");
    const loader = [
      "(()=>{",
      `const s="${payload}";`,
      "const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));",
      "Function(new TextDecoder().decode(b))();",
      "})();"
    ].join("");

    return `<script${attrs}>${loader}</script>`;
  });
}

function minifyHtml(html) {
  return html
    .replace(/<!--(?!\[if\b)[\s\S]*?-->/gi, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}()[\];,:+\-*/%=<>!&|?])\s*/g, "$1")
    .trim();
}
