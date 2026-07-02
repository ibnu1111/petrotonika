import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/suppliers
router.get('/', async (req, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const isActive = req.query.isActive;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [items, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.supplier.count({ where })
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
    console.error('Get suppliers error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.supplier.findUnique({
      where: { id },
      include: { rawMaterials: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/suppliers
router.post('/', async (req, res: Response) => {
  try {
    const { name, code, contact, phone, email, address, isActive } = req.body;

    const existingCode = await prisma.supplier.findUnique({ where: { code } });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.supplier.create({
      data: {
        name,
        code,
        contact,
        phone,
        email,
        address,
        isActive: isActive ?? true
      }
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, code, contact, phone, email, address, isActive } = req.body;

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const existingCode = await prisma.supplier.findFirst({
      where: { code, NOT: { id } }
    });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Code already exists' });
    }

    const item = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        code,
        contact,
        phone,
        email,
        address,
        isActive
      }
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const item = await prisma.supplier.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const hasRawMaterials = await prisma.rawMaterial.findFirst({
      where: { supplierId: id }
    });

    if (hasRawMaterials) {
      return res.status(400).json({ success: false, message: 'Cannot delete supplier with linked raw materials' });
    }

    await prisma.supplier.delete({ where: { id } });

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
