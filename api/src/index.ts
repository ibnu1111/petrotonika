import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import rawMaterialsRoutes from './routes/rawMaterials.js';
import finishedProductsRoutes from './routes/finishedProducts.js';
import suppliersRoutes from './routes/suppliers.js';
import stockTransactionsRoutes from './routes/stockTransactions.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Make prisma available to routes
app.locals.prisma = prisma;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rawmaterials', rawMaterialsRoutes);
app.use('/api/finishedproducts', finishedProductsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/stock-transactions', stockTransactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };
