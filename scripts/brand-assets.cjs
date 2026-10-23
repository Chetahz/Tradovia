// Derive every mark from the approved raster. No tracing or replacement paths.
// Usage: node scripts/brand-assets.cjs [path-to-installed-sharp]
/* oxlint-disable typescript/no-require-imports -- Standalone .cjs asset tool accepts an installed Sharp module path. */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.argv[2] || 'sharp');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'public/brand');
const tokens = fs.readFileSync(path.join(root, 'app/design-tokens.css'), 'utf8');
const primary = tokens.match(/--brand-primary:\s*(#[0-9a-f]{6});/i)?.[1];
if (primary !== '#00EFD3') throw new Error('Approved brand primary must remain #00EFD3');
const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
const svg = (image, width, height) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><title>tradovia</title><image width="${width}" height="${height}" href="data:image/png;base64,${image.toString('base64')}"/></svg>`;
async function main() {
  fs.mkdirSync(target, { recursive: true });
  const { data, info } = await sharp(path.join(root, 'assets/brand/tradovia-approved.png'))
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== 1620 || info.height !== 1620 || info.channels !== 3)
    throw new Error('Source changed; review the approved artwork before regenerating.');
  // Black-matte removal in raster space: green-minus-red carries the silhouette.
  // 239 is the approved RGB, not a sampled replacement brand color.
  // Preserve pixel positions and edge coverage: no path fitting/erosion/dilation.
  const alpha = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < alpha.length; i++)
    alpha[i] = Math.max(0, Math.min(255, Math.round((data[i * 3 + 1] - data[i * 3]) * 255 / 239)));
  // Crop only outer canvas, retaining a 10px margin around the approved art.
  const region = { left: 300, top: 395, width: 1022, height: 857 };
  const images = {};
  for (const [name, color] of [['primary', primary], ['white', '#ffffff'], ['black', '#000000']]) {
    const rgba = Buffer.alloc(alpha.length * 4); const channels = rgb(color);
    for (let i = 0; i < alpha.length; i++) {
      rgba[i * 4] = channels[0]; rgba[i * 4 + 1] = channels[1];
      rgba[i * 4 + 2] = channels[2]; rgba[i * 4 + 3] = alpha[i];
    }
    const image = await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract(region).png().toBuffer();
    images[name] = image;
    fs.writeFileSync(path.join(target, `tradovia-mark-${name}.png`), image);
  }
  // Explicit raster wrapper, NOT an auto-traced vector logo.
  const webMark = await sharp(images.primary).resize(192).png().toBuffer();
  fs.writeFileSync(path.join(target, 'tradovia-mark.svg'), svg(webMark, region.width, region.height));
  const faviconMark = await sharp(images.primary).resize(102, 86, { fit: 'inside' }).png().toBuffer();
  const favicon = await sharp({ create: { width: 128, height: 128, channels: 4, background: '#1a1a1a' } })
    .composite([{ input: faviconMark, gravity: 'centre' }]).png().toBuffer();
  fs.writeFileSync(path.join(root, 'public/favicon.svg'), svg(favicon, 128, 128));
  for (const size of [180, 192, 512]) {
    // At most 60% width, inside the maskable icon safe circle.
    const mark = await sharp(images.primary).resize(Math.round(size * .6), Math.round(size * .6), { fit: 'inside' }).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: '#1a1a1a' } })
      .composite([{ input: mark, gravity: 'centre' }]).png().toFile(path.join(target, `icon-${size}.png`));
  }
  console.log('Approved raster-derived mark variants, favicon and app icons generated.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
