import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get('/stats', async (req, res: Response) => {
  try {
    const [
      totalRawMaterials,
      totalFinishedProducts,
      rawMaterials,
      finishedProducts,
      todayTransactions
    ] = await Promise.all([
      prisma.rawMaterial.count(),
      prisma.finishedProduct.count(),
      prisma.rawMaterial.findMany(),
      prisma.finishedProduct.findMany(),
      prisma.stockTransaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    // Calculate low stock items
    const lowStockRawMaterials = rawMaterials.filter(
      item => Number(item.currentStock) <= Number(item.minimumStock)
    ).length;

    const lowStockFinishedProducts = finishedProducts.filter(
      item => Number(item.currentStock) <= Number(item.minimumStock)
    ).length;

    // Calculate total inventory value
    const rawMaterialsValue = rawMaterials.reduce(
      (sum, item) => sum + Number(item.currentStock) * Number(item.price),
      0
    );

    const finishedProductsValue = finishedProducts.reduce(
      (sum, item) => sum + Number(item.currentStock) * Number(item.price),
      0
    );

    res.json({
      success: true,
      data: {
        totalRawMaterials,
        totalFinishedProducts,
        lowStockItems: lowStockRawMaterials + lowStockFinishedProducts,
        todayTransactions,
        totalValue: rawMaterialsValue + finishedProductsValue
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/dashboard/recent-transactions
router.get('/recent-transactions', async (req, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const transactions = await prisma.stockTransaction.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const data = transactions.map(t => ({
      id: t.id,
      itemId: t.itemId,
      itemType: t.itemType,
      transactionType: t.transactionType,
      quantity: t.quantity,
      unit: t.unit,
      reference: t.reference,
      createdAt: t.createdAt,
      userName: t.user?.username || 'Unknown'
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/dashboard/low-stock-alerts
router.get('/low-stock-alerts', async (req, res: Response) => {
  try {
    const [rawMaterials, finishedProducts] = await Promise.all([
      prisma.rawMaterial.findMany(),
      prisma.finishedProduct.findMany()
    ]);

    const lowStockRawMaterials = rawMaterials
      .filter(item => Number(item.currentStock) <= Number(item.minimumStock))
      .map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        unit: item.unit,
        type: 'RAW_MATERIAL'
      }));

    const lowStockFinishedProducts = finishedProducts
      .filter(item => Number(item.currentStock) <= Number(item.minimumStock))
      .map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        currentStock: item.currentStock,
        minimumStock: item.minimumStock,
        unit: item.unit,
        type: 'FINISHED_PRODUCT'
      }));

    const allLowStockItems = [...lowStockRawMaterials, ...lowStockFinishedProducts];

    res.json({ success: true, data: allLowStockItems });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
