import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/stock-transactions
router.get('/', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const itemType = req.query.itemType as string;

    const where: any = {};

    if (type) {
      where.transactionType = type;
    }

    if (itemType) {
      where.itemType = itemType;
    }

    const [items, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.stockTransaction.count({ where })
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
    console.error('Get stock transactions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/stock-transactions/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.stockTransaction.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Stock transaction not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get stock transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/stock-transactions/item/:itemId/:itemType
router.get('/item/:itemId/:itemType', async (req, res: Response) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const itemType = req.params.itemType;

    const items = await prisma.stockTransaction.findMany({
      where: { itemId, itemType },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page: 1,
        limit: items.length,
        total: items.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Get transactions by item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/stock-transactions
router.post('/', async (req, res: Response) => {
  try {
    const { itemId, itemType, transactionType, quantity, unit, reference, notes, userId } = req.body;

    // Validate item exists and update stock
    if (itemType === 'RAW_MATERIAL') {
      const rawMaterial = await prisma.rawMaterial.findUnique({ where: { id: itemId } });
      if (!rawMaterial) {
        return res.status(400).json({ success: false, message: 'Raw material not found' });
      }

      let newStock: Prisma.Decimal;
      if (transactionType === 'IN') {
        newStock = rawMaterial.currentStock.plus(quantity);
      } else if (transactionType === 'OUT') {
        if (rawMaterial.currentStock.lessThan(quantity)) {
          return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }
        newStock = rawMaterial.currentStock.minus(quantity);
      } else {
        newStock = rawMaterial.currentStock;
      }

      await prisma.rawMaterial.update({
        where: { id: itemId },
        data: { currentStock: newStock }
      });
    } else if (itemType === 'FINISHED_PRODUCT') {
      const finishedProduct = await prisma.finishedProduct.findUnique({ where: { id: itemId } });
      if (!finishedProduct) {
        return res.status(400).json({ success: false, message: 'Finished product not found' });
      }

      let newStock: Prisma.Decimal;
      if (transactionType === 'IN') {
        newStock = finishedProduct.currentStock.plus(quantity);
      } else if (transactionType === 'OUT') {
        if (finishedProduct.currentStock.lessThan(quantity)) {
          return res.status(400).json({ success: false, message: 'Insufficient stock' });
        }
        newStock = finishedProduct.currentStock.minus(quantity);
      } else {
        newStock = finishedProduct.currentStock;
      }

      await prisma.finishedProduct.update({
        where: { id: itemId },
        data: { currentStock: newStock }
      });
    }

    // Create transaction record
    const transaction = await prisma.stockTransaction.create({
      data: {
        itemId,
        itemType,
        transactionType,
        quantity,
        unit,
        reference,
        notes,
        userId,
        finishedProductId: itemType === 'FINISHED_PRODUCT' ? itemId : null,
        rawMaterialId: itemType === 'RAW_MATERIAL' ? itemId : null
      },
      include: { user: true }
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('Create stock transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
