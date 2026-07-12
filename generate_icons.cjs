const fs = require('fs');

const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const buffer = Buffer.from(base64Pixel, 'base64');

fs.writeFileSync('public/icon-192.png', buffer);
fs.writeFileSync('public/icon-512.png', buffer);
