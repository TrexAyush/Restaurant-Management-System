import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection, closeConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { performanceMiddleware } from './middleware/performanceMiddleware';
import { monitoringService } from './services/monitoringService';
import authRoutes from './routes/authRoutes';
import menuRoutes from './routes/menuRoutes';
import tableRoutes from './routes/tableRoutes';
import orderRoutes from './routes/orderRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import billingRoutes from './routes/billingRoutes';
import reportingRoutes from './routes/reportingRoutes';
import monitoringRoutes from './routes/monitoringRoutes';

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3001;

// Start periodic monitoring
const monitoringInterval = monitoringService.startPeriodicMonitoring(60000); // Every minute

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3002' // Add support for port 3002
  ],
  credentials: true
}));

// Performance monitoring middleware
app.use(performanceMiddleware);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Restaurant Management System'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bills', billingRoutes);
app.use('/api/reports', reportingRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Placeholder for other API routes
app.use('/api', (req, res, next) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server only if this file is run directly
if (require.main === module) {
  // Test database connection before starting server
  testConnection()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 Restaurant Management System server running on port ${PORT}`);
        console.log(`📊 Health check available at http://localhost:${PORT}/health`);
        console.log(`📈 Performance monitoring started`);
        
        // Record initial system health
        monitoringService.recordSystemHealth('server', 'healthy', 'Server started successfully');
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server due to database connection error:', error);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    clearInterval(monitoringInterval);
    closeConnection()
      .then(() => {
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      })
      .catch((error) => {
        console.error('Error during shutdown:', error);
        process.exit(1);
      });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    clearInterval(monitoringInterval);
    closeConnection()
      .then(() => {
        server.close(() => {
          console.log('Server closed');
          process.exit(0);
        });
      })
      .catch((error) => {
        console.error('Error during shutdown:', error);
        process.exit(1);
      });
  });
}

export default app;