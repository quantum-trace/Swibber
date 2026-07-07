import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server as SocketIOServer } from 'socket.io';

import { connectDatabase } from './config/database';
import { getRedis } from './config/redis';
import { initFirebase } from './config/firebase';
import { initCloudinary } from './config/cloudinary';
import { globalRateLimit } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/error';
import routes from './routes';
import { registerSocketHandlers } from './socket/socket.manager';
import { startAutoCancelJob } from './jobs/autoCancel';

declare global {
  // eslint-disable-next-line no-var
  var __io: SocketIOServer | undefined;
}

const app = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:19000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

global.__io = io;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalRateLimit);

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '5000', 10);

const bootstrap = async () => {
  await connectDatabase();
  getRedis();
  initFirebase();
  initCloudinary();
  registerSocketHandlers(io);
  startAutoCancelJob();

  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Swibber Backend running on http://localhost:${PORT}`);
    console.log(`   API:    http://localhost:${PORT}/api/v1`);
    console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
    console.log(`   Socket: ws://localhost:${PORT}\n`);
  });
};

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});

export { io };
