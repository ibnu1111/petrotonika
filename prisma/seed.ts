import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      isActive: true
    }
  });
  console.log('Created admin user:', admin.username);

  // Create sample suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: 'SUP001' },
      update: {},
      create: {
        name: 'PT Petrokimia',
        code: 'SUP001',
        contact: 'Budi Santoso',
        phone: '021-5551234',
        email: 'sales@petrokimia.co.id',
        address: 'Jakarta, Indonesia',
        isActive: true
      }
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP002' },
      update: {},
      create: {
        name: 'CV Chemical Indonesia',
        code: 'SUP002',
        contact: 'Ahmad Wijaya',
        phone: '021-5555678',
        email: 'info@chemical.co.id',
        address: 'Surabaya, Indonesia',
        isActive: true
      }
    })
  ]);
  console.log('Created', suppliers.length, 'suppliers');

  // Create sample raw materials
  const rawMaterials = await Promise.all([
    prisma.rawMaterial.upsert({
      where: { code: 'RM001' },
      update: {},
      create: {
        name: 'Methanol',
        code: 'RM001',
        description: 'Bahan baku utama untuk produksi',
        unit: 'liter',
        currentStock: 1000,
        minimumStock: 200,
        price: 25000,
        supplierId: suppliers[0].id
      }
    }),
    prisma.rawMaterial.upsert({
      where: { code: 'RM002' },
      update: {},
      create: {
        name: 'Sodium Hydroxide',
        code: 'RM002',
        description: 'Bahan kimia proses',
        unit: 'kg',
        currentStock: 500,
        minimumStock: 100,
        price: 35000,
        supplierId: suppliers[0].id
      }
    }),
    prisma.rawMaterial.upsert({
      where: { code: 'RM003' },
      update: {},
      create: {
        name: 'Katalis',
        code: 'RM003',
        description: 'Katalis reaksi',
        unit: 'kg',
        currentStock: 50,
        minimumStock: 20,
        price: 150000,
        supplierId: suppliers[1].id
      }
    })
  ]);
  console.log('Created', rawMaterials.length, 'raw materials');

  // Create sample finished products
  const finishedProducts = await Promise.all([
    prisma.finishedProduct.upsert({
      where: { code: 'FP001' },
      update: {},
      create: {
        name: 'DOP (Dioctyl Phthalate)',
        code: 'FP001',
        description: 'Plasticizer utama',
        unit: 'drum',
        currentStock: 100,
        minimumStock: 20,
        price: 450000,
        productionCost: 350000
      }
    }),
    prisma.finishedProduct.upsert({
      where: { code: 'FP002' },
      update: {},
      create: {
        name: 'DNIP (Diisononyl Phthalate)',
        code: 'FP002',
        description: 'Plasticizer premium',
        unit: 'drum',
        currentStock: 75,
        minimumStock: 15,
        price: 550000,
        productionCost: 420000
      }
    }),
    prisma.finishedProduct.upsert({
      where: { code: 'FP003' },
      update: {},
      create: {
        name: 'DOTP (Dioctyl Terephthalate)',
        code: 'FP003',
        description: 'Plasticizer non-phthalate',
        unit: 'drum',
        currentStock: 30,
        minimumStock: 10,
        price: 600000,
        productionCost: 480000
      }
    })
  ]);
  console.log('Created', finishedProducts.length, 'finished products');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
