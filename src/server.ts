import http from 'http';
import app from './app';
import { config } from './config';
import { WebSocketServer } from './websocket/socket';
import prisma from './config/database';

const server = http.createServer(app);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Starting graceful shutdown...');

  // Close server
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Disconnect Prisma
  await prisma.$disconnect();
  console.log('Database connection closed');

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = config.port;

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Bills Ledger Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port: ${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔌 WebSocket enabled on port: ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

export { wsServer };