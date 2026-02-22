import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './server/db';
import authRoutes from './server/routes/auth';
import habitRoutes from './server/routes/habits';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initializeDatabase();

  app.set('trust proxy', 1); // Trust first proxy (required for secure cookies behind load balancer)

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/habits', habitRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
