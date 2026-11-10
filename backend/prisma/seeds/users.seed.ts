import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Seeding Users & Customer Profiles...');

  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@12345', salt);
  const staffPassword = await bcrypt.hash('Staff@12345', salt);
  const customerPassword = await bcrypt.hash('Customer@12345', salt);

  // 1. Primary Store Admin (supports admin@furniturestore.local and admin@store.com)
  const admin = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {
      email: 'admin@furniturestore.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Store Administrator',
      phone: '+919876543210',
      email: 'admin@furniturestore.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Admin alias (admin@store.com)
  await prisma.user.upsert({
    where: { phone: '+919876543219' },
    update: {
      email: 'admin@store.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Store Administrator',
      phone: '+919876543219',
      email: 'admin@store.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // 2. Staff User (staff@furniturestore.local)
  await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {
      email: 'staff@furniturestore.local',
      passwordHash: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
    },
    create: {
      name: 'Store Operations Lead',
      phone: '+919876543211',
      email: 'staff@furniturestore.local',
      passwordHash: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  // 3. Customer (customer@example.com)
  const customer = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    create: {
      name: 'Rahul Sharma',
      phone: '+919876543212',
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // Customer alias (rahul.sharma@example.com)
  await prisma.user.upsert({
    where: { phone: '+919876543213' },
    update: {
      email: 'rahul.sharma@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    create: {
      name: 'Rahul Sharma',
      phone: '+919876543213',
      email: 'rahul.sharma@example.com',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
  });

  // Customer Address
  await prisma.address.deleteMany({ where: { userId: customer.id } });
  await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Rahul Sharma',
      phone: '+919876543212',
      addressLine1: 'House No. 452, Phase 7',
      addressLine2: 'Sector 61',
      landmark: 'Near Rose Garden',
      city: 'Mohali',
      state: 'Punjab',
      pincode: '160062',
      isDefault: true,
    },
  });

  return { admin, customer };
}
