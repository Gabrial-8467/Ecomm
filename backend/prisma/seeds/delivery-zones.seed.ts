import { PrismaClient } from '@prisma/client';

export async function seedDeliveryZones(prisma: PrismaClient) {
  console.log('🚚 Seeding Delivery Zones...');

  await prisma.deliveryZone.deleteMany({});

  const zones = [
    {
      name: 'Mohali Core Zone',
      city: 'Mohali',
      state: 'Punjab',
      pincodes: ['160055', '160059', '160062', '160070', '160071', '140301'],
      deliveryCharge: 150.0,
      minimumOrder: 500.0,
      estimatedDays: 2,
      isActive: true,
    },
    {
      name: 'Chandigarh Tri-City Zone',
      city: 'Chandigarh',
      state: 'Chandigarh',
      pincodes: ['160017', '160022', '160036', '160047'],
      deliveryCharge: 200.0,
      minimumOrder: 1000.0,
      estimatedDays: 3,
      isActive: true,
    },
    {
      name: 'Panchkula & Zirakpur Hub',
      city: 'Panchkula',
      state: 'Haryana',
      pincodes: ['134109', '134112', '140603', '140604'],
      deliveryCharge: 180.0,
      minimumOrder: 800.0,
      estimatedDays: 2,
      isActive: true,
    },
    {
      name: 'Delhi NCR Central Zone',
      city: 'New Delhi',
      state: 'Delhi',
      pincodes: ['110001', '110002', '110003', '110005', '110011'],
      deliveryCharge: 250.0,
      minimumOrder: 1500.0,
      estimatedDays: 2,
      isActive: true,
    },
    {
      name: 'South Delhi & Gurugram Cyber Hub',
      city: 'Gurugram',
      state: 'Haryana',
      pincodes: ['110017', '110019', '110048', '122001', '122002'],
      deliveryCharge: 300.0,
      minimumOrder: 2000.0,
      estimatedDays: 2,
      isActive: true,
    },
    {
      name: 'Noida Expressway Tech Zone',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincodes: ['201301', '201304', '201305', '201306', '201307'],
      deliveryCharge: 250.0,
      minimumOrder: 1500.0,
      estimatedDays: 2,
      isActive: true,
    },
  ];

  for (const zone of zones) {
    await prisma.deliveryZone.create({
      data: zone,
    });
  }
}
