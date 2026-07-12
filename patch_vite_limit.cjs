const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const target = "workbox: {\\n          globPatterns: ['**/*.{js,css,html,ico,png,svg}']\\n        }";
const replacement = "workbox: {\\n          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],\\n          maximumFileSizeToCacheInBytes: 5000000\\n        }";

code = code.replace(target, replacement);
fs.writeFileSync('vite.config.ts', code);
