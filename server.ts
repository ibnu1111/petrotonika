import express, { Request, Response, NextFunction } from 'express';
import next from 'next';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();

// Types
interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

// JWT functions
const generateToken = (user: { id: number; username: string; role: string }) => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-that-is-long-enough';
  return jwt.sign(user, secret, { expiresIn: '7d' });
};

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.substring(7);
  try {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-that-is-long-enough';
    req.user = jwt.verify(token, secret) as { id: number; username: string; role: string };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

app.prepare().then(() => {
  const expressApp = express();
  expressApp.use(cors());
  expressApp.use(express.json());

  // Make prisma available
  (expressApp as any).locals = { prisma };

  // ==================== AUTH ROUTES ====================
  expressApp.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
      }
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
      const token = generateToken({ id: user.id, username: user.username, role: user.role });
      res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role } }, message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user?.id },
        select: { id: true, username: true, role: true }
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ==================== RAW MATERIALS ROUTES ====================
  expressApp.get('/api/rawmaterials', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : {};
      const [items, total] = await Promise.all([
        prisma.rawMaterial.findMany({ where, include: { supplier: true }, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.rawMaterial.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/rawmaterials/low-stock', async (req: Request, res: Response) => {
    try {
      const items = await prisma.rawMaterial.findMany({ include: { supplier: true }, orderBy: { name: 'asc' } });
      const lowStockItems = items.filter(item => Number(item.currentStock) <= Number(item.minimumStock));
      res.json({ success: true, data: lowStockItems, pagination: { page: 1, limit: lowStockItems.length, total: lowStockItems.length, totalPages: 1 } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/rawmaterials/:id', async (req: Request, res: Response) => {
    try {
      const item = await prisma.rawMaterial.findUnique({ where: { id: parseInt(req.params.id) }, include: { supplier: true } });
      if (!item) return res.status(404).json({ success: false, message: 'Raw material not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.post('/api/rawmaterials', async (req: Request, res: Response) => {
    try {
      const { name, code, description, unit, currentStock, minimumStock, price, supplierId } = req.body;
      const existing = await prisma.rawMaterial.findUnique({ where: { code } });
      if (existing) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.rawMaterial.create({ data: { name, code, description, unit, currentStock, minimumStock, price, supplierId }, include: { supplier: true } });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.put('/api/rawmaterials/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, code, description, unit, currentStock, minimumStock, price, supplierId } = req.body;
      const existing = await prisma.rawMaterial.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Raw material not found' });
      const codeExists = await prisma.rawMaterial.findFirst({ where: { code, NOT: { id } } });
      if (codeExists) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.rawMaterial.update({ where: { id }, data: { name, code, description, unit, currentStock, minimumStock, price, supplierId }, include: { supplier: true } });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.delete('/api/rawmaterials/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.rawMaterial.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ success: false, message: 'Raw material not found' });
      const hasTransactions = await prisma.stockTransaction.findFirst({ where: { itemId: id, itemType: 'RAW_MATERIAL' } });
      if (hasTransactions) return res.status(400).json({ success: false, message: 'Cannot delete raw material with existing transactions' });
      await prisma.rawMaterial.delete({ where: { id } });
      res.json({ success: true, message: 'Raw material deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ==================== FINISHED PRODUCTS ROUTES ====================
  expressApp.get('/api/finishedproducts', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }] } : {};
      const [items, total] = await Promise.all([
        prisma.finishedProduct.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.finishedProduct.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/finishedproducts/low-stock', async (req: Request, res: Response) => {
    try {
      const items = await prisma.finishedProduct.findMany({ orderBy: { name: 'asc' } });
      const lowStockItems = items.filter(item => Number(item.currentStock) <= Number(item.minimumStock));
      res.json({ success: true, data: lowStockItems, pagination: { page: 1, limit: lowStockItems.length, total: lowStockItems.length, totalPages: 1 } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/finishedproducts/:id', async (req: Request, res: Response) => {
    try {
      const item = await prisma.finishedProduct.findUnique({ where: { id: parseInt(req.params.id) } });
      if (!item) return res.status(404).json({ success: false, message: 'Finished product not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.post('/api/finishedproducts', async (req: Request, res: Response) => {
    try {
      const { name, code, description, unit, currentStock, minimumStock, price, productionCost } = req.body;
      const existing = await prisma.finishedProduct.findUnique({ where: { code } });
      if (existing) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.finishedProduct.create({ data: { name, code, description, unit, currentStock, minimumStock, price, productionCost } });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.put('/api/finishedproducts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, code, description, unit, currentStock, minimumStock, price, productionCost } = req.body;
      const existing = await prisma.finishedProduct.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Finished product not found' });
      const codeExists = await prisma.finishedProduct.findFirst({ where: { code, NOT: { id } } });
      if (codeExists) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.finishedProduct.update({ where: { id }, data: { name, code, description, unit, currentStock, minimumStock, price, productionCost } });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.delete('/api/finishedproducts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.finishedProduct.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ success: false, message: 'Finished product not found' });
      const hasTransactions = await prisma.stockTransaction.findFirst({ where: { itemId: id, itemType: 'FINISHED_PRODUCT' } });
      if (hasTransactions) return res.status(400).json({ success: false, message: 'Cannot delete finished product with existing transactions' });
      await prisma.finishedProduct.delete({ where: { id } });
      res.json({ success: true, message: 'Finished product deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ==================== SUPPLIERS ROUTES ====================
  expressApp.get('/api/suppliers', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isActive = req.query.isActive;
      const where: any = {};
      if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }];
      if (isActive !== undefined) where.isActive = isActive === 'true';
      const [items, total] = await Promise.all([
        prisma.supplier.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit }),
        prisma.supplier.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/suppliers/:id', async (req: Request, res: Response) => {
    try {
      const item = await prisma.supplier.findUnique({ where: { id: parseInt(req.params.id) }, include: { rawMaterials: true } });
      if (!item) return res.status(404).json({ success: false, message: 'Supplier not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.post('/api/suppliers', async (req: Request, res: Response) => {
    try {
      const { name, code, contact, phone, email, address, isActive } = req.body;
      const existing = await prisma.supplier.findUnique({ where: { code } });
      if (existing) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.supplier.create({ data: { name, code, contact, phone, email, address, isActive: isActive ?? true } });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.put('/api/suppliers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { name, code, contact, phone, email, address, isActive } = req.body;
      const existing = await prisma.supplier.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ success: false, message: 'Supplier not found' });
      const codeExists = await prisma.supplier.findFirst({ where: { code, NOT: { id } } });
      if (codeExists) return res.status(400).json({ success: false, message: 'Code already exists' });
      const item = await prisma.supplier.update({ where: { id }, data: { name, code, contact, phone, email, address, isActive } });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.delete('/api/suppliers/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await prisma.supplier.findUnique({ where: { id } });
      if (!item) return res.status(404).json({ success: false, message: 'Supplier not found' });
      const hasRawMaterials = await prisma.rawMaterial.findFirst({ where: { supplierId: id } });
      if (hasRawMaterials) return res.status(400).json({ success: false, message: 'Cannot delete supplier with linked raw materials' });
      await prisma.supplier.delete({ where: { id } });
      res.json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ==================== STOCK TRANSACTIONS ROUTES ====================
  expressApp.get('/api/stock-transactions', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const itemType = req.query.itemType as string;
      const where: any = {};
      if (type) where.transactionType = type;
      if (itemType) where.itemType = itemType;
      const [items, total] = await Promise.all([
        prisma.stockTransaction.findMany({ where, include: { user: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
        prisma.stockTransaction.count({ where })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/stock-transactions/:id', async (req: Request, res: Response) => {
    try {
      const item = await prisma.stockTransaction.findUnique({ where: { id: parseInt(req.params.id) }, include: { user: true } });
      if (!item) return res.status(404).json({ success: false, message: 'Stock transaction not found' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/stock-transactions/item/:itemId/:itemType', async (req: Request, res: Response) => {
    try {
      const items = await prisma.stockTransaction.findMany({
        where: { itemId: parseInt(req.params.itemId), itemType: req.params.itemType },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: items, pagination: { page: 1, limit: items.length, total: items.length, totalPages: 1 } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.post('/api/stock-transactions', async (req: Request, res: Response) => {
    try {
      const { itemId, itemType, transactionType, quantity, unit, reference, notes, userId } = req.body;

      if (itemType === 'RAW_MATERIAL') {
        const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: itemId } });
        if (!rawMaterial) return res.status(400).json({ success: false, message: 'Raw material not found' });
        let newStock = rawMaterial.currentStock;
        if (transactionType === 'IN') newStock = rawMaterial.currentStock.plus(quantity);
        else if (transactionType === 'OUT') {
          if (rawMaterial.currentStock.lessThan(quantity)) return res.status(400).json({ success: false, message: 'Insufficient stock' });
          newStock = rawMaterial.currentStock.minus(quantity);
        }
        await prisma.rawMaterial.update({ where: { id: itemId }, data: { currentStock: newStock } });
      } else if (itemType === 'FINISHED_PRODUCT') {
        const finishedProduct = await prisma.finishedProduct.findUnique({ where: { id: itemId } });
        if (!finishedProduct) return res.status(400).json({ success: false, message: 'Finished product not found' });
        let newStock = finishedProduct.currentStock;
        if (transactionType === 'IN') newStock = finishedProduct.currentStock.plus(quantity);
        else if (transactionType === 'OUT') {
          if (finishedProduct.currentStock.lessThan(quantity)) return res.status(400).json({ success: false, message: 'Insufficient stock' });
          newStock = finishedProduct.currentStock.minus(quantity);
        }
        await prisma.finishedProduct.update({ where: { id: itemId }, data: { currentStock: newStock } });
      }

      const transaction = await prisma.stockTransaction.create({
        data: { itemId, itemType, transactionType, quantity, unit, reference, notes, userId, finishedProductId: itemType === 'FINISHED_PRODUCT' ? itemId : null, rawMaterialId: itemType === 'RAW_MATERIAL' ? itemId : null },
        include: { user: true }
      });
      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // ==================== DASHBOARD ROUTES ====================
  expressApp.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const [totalRawMaterials, totalFinishedProducts, rawMaterials, finishedProducts, todayTransactions] = await Promise.all([
        prisma.rawMaterial.count(),
        prisma.finishedProduct.count(),
        prisma.rawMaterial.findMany(),
        prisma.finishedProduct.findMany(),
        prisma.stockTransaction.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })
      ]);
      const lowStockRawMaterials = rawMaterials.filter(item => Number(item.currentStock) <= Number(item.minimumStock)).length;
      const lowStockFinishedProducts = finishedProducts.filter(item => Number(item.currentStock) <= Number(item.minimumStock)).length;
      const rawMaterialsValue = rawMaterials.reduce((sum, item) => sum + Number(item.currentStock) * Number(item.price), 0);
      const finishedProductsValue = finishedProducts.reduce((sum, item) => sum + Number(item.currentStock) * Number(item.price), 0);
      res.json({ success: true, data: { totalRawMaterials, totalFinishedProducts, lowStockItems: lowStockRawMaterials + lowStockFinishedProducts, todayTransactions, totalValue: rawMaterialsValue + finishedProductsValue } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/dashboard/recent-transactions', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await prisma.stockTransaction.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: limit });
      const data = transactions.map(t => ({ id: t.id, itemId: t.itemId, itemType: t.itemType, transactionType: t.transactionType, quantity: t.quantity, unit: t.unit, reference: t.reference, createdAt: t.createdAt, userName: t.user?.username || 'Unknown' }));
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  expressApp.get('/api/dashboard/low-stock-alerts', async (req: Request, res: Response) => {
    try {
      const [rawMaterials, finishedProducts] = await Promise.all([prisma.rawMaterial.findMany(), prisma.finishedProduct.findMany()]);
      const lowStockRawMaterials = rawMaterials.filter(item => Number(item.currentStock) <= Number(item.minimumStock)).map(item => ({ id: item.id, name: item.name, code: item.code, currentStock: item.currentStock, minimumStock: item.minimumStock, unit: item.unit, type: 'RAW_MATERIAL' }));
      const lowStockFinishedProducts = finishedProducts.filter(item => Number(item.currentStock) <= Number(item.minimumStock)).map(item => ({ id: item.id, name: item.name, code: item.code, currentStock: item.currentStock, minimumStock: item.minimumStock, unit: item.unit, type: 'FINISHED_PRODUCT' }));
      res.json({ success: true, data: [...lowStockRawMaterials, ...lowStockFinishedProducts] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });

  // Health check
  expressApp.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Let Next.js handle everything else
  expressApp.all('*', (req: Request, res: Response) => {
    return handle(req, res);
  });

  const PORT = process.env.PORT || 3000;
  expressApp.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
