// One master silhouette for the website, favicon and home-screen icons.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mark = '<path fill="currentColor" fill-rule="evenodd" d="M12 16H116C115 30 107 36 94 36H74V82C74 95 78 103 85 108H75C54 108 48 95 48 80V36H34C21 36 13 28 12 16ZM88 16H93L56 53Q54 54 55 51Z"/>';
const svg = (body, color='#163e32') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" style="color:${color}">${body}</svg>`;
fs.mkdirSync(path.join(root,'public/brand'),{recursive:true});
fs.writeFileSync(path.join(root,'public/brand/tradovia-mark.svg'),svg(mark));
fs.writeFileSync(path.join(root,'public/favicon.svg'),svg('<rect width="128" height="128" rx="28" fill="#163e32"/><g transform="translate(14 14) scale(.78)">'+mark+'</g>','#ffffff'));
// Pass the installed sharp module path; no downloaded tooling is needed.
const sharp = require(process.argv[2] || 'sharp');
const tile = svg('<rect width="128" height="128" fill="#163e32"/><g transform="translate(22 22) scale(.66)">'+mark+'</g>','#ffffff');
Promise.all([180,192,512].map(size=>sharp(Buffer.from(tile)).resize(size,size).png().toFile(path.join(root,`public/brand/icon-${size}.png`)))).catch(error=>{console.error(error);process.exitCode=1;});
