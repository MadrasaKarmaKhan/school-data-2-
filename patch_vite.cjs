const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const target1 = "import {defineConfig} from 'vite';";
const replacement1 = `import {defineConfig} from 'vite';\nimport { VitePWA } from 'vite-plugin-pwa';`;

code = code.replace(target1, replacement1);

const target2 = "plugins: [react(), tailwindcss()],";
const replacement2 = `plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: "Madrasa Arabia Noorul Uloom",
          short_name: "Noorul Uloom",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#1e5631",
          description: "Portal and ERP for Madrasa Arabia Noorul Uloom",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],`;

code = code.replace(target2, replacement2);

fs.writeFileSync('vite.config.ts', code);
