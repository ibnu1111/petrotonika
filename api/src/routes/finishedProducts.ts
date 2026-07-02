import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/finishedproducts
router.get('/', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.finishedProduct.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.finishedProduct.count({ where })
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get finished products error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/finishedproducts/low-stock
router.get('/low-stock', async (req, res: Response) => {
  try {
    const items = await prisma.finishedProduct.findMany({
      orderBy: { name: 'asc' }
    });

    const lowStockItems = items.filter(item =>
      Number(item.currentStock) <= Number(item.minimumStock)
    );

    res.json({
      success: true,
      data: lowStockItems,
      pagination: {
        page: 1,
        limit: lowStockItems.length,
        total: lowStockItems.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get low stock finished products error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/finishedproducts/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.finishedProduct.findUnique({ where: { id } });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Finished product not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get finished product error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/finishedproducts
router.post('/', async (req, res: Response) => {
  try {
    const { name, code, description, unit, currentStock, minimumStock, price, productionCost } = req.body;

    const existingCode = await prisma.finishedProduct.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.finishedProduct.create({
      data: {
        name,
        code,
        description,
        unit,
        currentStock,
        minimumStock,
        price,
        productionCost
      }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create finished product error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/finishedproducts/:id
router.put('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description, unit, currentStock, minimumStock, price, productionCost } = req.body;

    const existing = await prisma.finishedProduct.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Finished product not found' });
    }

    const existingCode = await prisma.finishedProduct.findFirst({
      where: { code, NOT: { id } }
    });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.finishedProduct.update({
      where: { id },
      data: {
        name,
        code,
        description,
        unit,
        currentStock,
        minimumStock,
        price,
        productionCost
      }
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update finished product error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/finishedproducts/:id
router.delete('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const item = await prisma.finishedProduct.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Finished product not found' });
    }

    const hasTransactions = await prisma.stockTransaction.findFirst({
      where: { itemId: id, itemType: 'FINISHED_PRODUCT' }
    });

    if (hasTransactions) {
      return res.status(400).json({ success: false, message: 'Cannot delete finished product with existing transactions' });
    }

    await prisma.finishedProduct.delete({ where: { id } });

    res.json({ success: true, message: 'Finished product deleted successfully' });
  } catch (error) {
    console.error('Delete finished product error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
