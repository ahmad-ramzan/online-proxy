/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Server entry point.
 *   - Development (npm run dev): mounts Vite middleware for HMR.
 *   - Production (npm run build && npm start): serves the compiled frontend from /dist
 *     and the API on the same port. Suitable for an Ubuntu VPS behind nginx.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import app from './server/app';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Mount Vite's HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[Dev Server] Vite middleware integrated successfully.');
  } else {
    // Production Mode: Serve compiled bundles.
    // Hashed assets can be cached forever; index.html must never be cached so a
    // new deploy's bundle is picked up immediately (no stale UI after updates).
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Prod Server] Static hosting integrated from /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxibity Online server initialized successfully on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Critical server crash during bootstrap:', err);
});
