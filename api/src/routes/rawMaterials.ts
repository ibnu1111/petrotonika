import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/rawmaterials
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
      prisma.rawMaterial.findMany({
        where,
        include: { supplier: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.rawMaterial.count({ where })
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
    console.error('Get raw materials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/rawmaterials/low-stock
router.get('/low-stock', async (req, res: Response) => {
  try {
    const items = await prisma.rawMaterial.findMany({
      where: {
        currentStock: { lte: prisma.rawMaterial.fields.minimumStock }
      },
      include: { supplier: true },
      orderBy: { name: 'asc' }
    });

    // Filter manually since Prisma doesn't support currentStock <= minimumStock directly
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
    console.error('Get low stock raw materials error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/rawmaterials/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.rawMaterial.findUnique({
      where: { id },
      include: { supplier: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get raw material error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/rawmaterials
router.post('/', async (req, res: Response) => {
  try {
    const { name, code, description, unit, currentStock, minimumStock, price, supplierId } = req.body;

    const existingCode = await prisma.rawMaterial.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.rawMaterial.create({
      data: {
        name,
        code,
        description,
        unit,
        currentStock,
        minimumStock,
        price,
        supplierId
      },
      include: { supplier: true }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create raw material error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/rawmaterials/:id
router.put('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, description, unit, currentStock, minimumStock, price, supplierId } = req.body;

    const existing = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }

    const existingCode = await prisma.rawMaterial.findFirst({
      where: { code, NOT: { id } }
    });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name,
        code,
        description,
        unit,
        currentStock,
        minimumStock,
        price,
        supplierId
      },
      include: { supplier: true }
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update raw material error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/rawmaterials/:id
router.delete('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const item = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Raw material not found' });
    }

    const hasTransactions = await prisma.stockTransaction.findFirst({
      where: { itemId: id, itemType: 'RAW_MATERIAL' }
    });

    if (hasTransactions) {
      return res.status(400).json({ success: false, message: 'Cannot delete raw material with existing transactions' });
    }

    await prisma.rawMaterial.delete({ where: { id } });

    res.json({ success: true, message: 'Raw material deleted successfully' });
  } catch (error) {
    console.error('Delete raw material error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
