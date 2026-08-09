import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function ttsProxyPlugin(): Plugin {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const urlObj = new URL(req.url || '', 'http://localhost');
          const text = urlObj.searchParams.get('text') || '';
          const lang = urlObj.searchParams.get('lang') || 'bn';
          if (!text) {
            res.statusCode = 400;
            res.end('Missing text parameter');
            return;
          }
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
          const ttsRes = await fetch(ttsUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (!ttsRes.ok) {
            res.statusCode = ttsRes.status;
            res.end(`TTS fetch failed with status ${ttsRes.status}`);
            return;
          }
          const arrayBuffer = await ttsRes.arrayBuffer();
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(Buffer.from(arrayBuffer));
        } catch (err) {
          res.statusCode = 500;
          res.end(String(err));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), ttsProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
