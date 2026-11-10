import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Seeding Users & Customer Profiles...');

  const adminSalt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123456', adminSalt);
  const staffPassword = await bcrypt.hash('Staff@123456', adminSalt);
  const customerPassword = await bcrypt.hash('Customer@123456', adminSalt);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Store Administrator',
      phone: '+919876543210',
      email: 'admin@store.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Staff User
  await prisma.user.upsert({
    where: { phone: '+919876543211' },
    update: {
      passwordHash: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
    },
    create: {
      name: 'Store Operations Lead',
      phone: '+919876543211',
      email: 'staff@store.com',
      passwordHash: staffPassword,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  // Customer User
  const customer = await prisma.user.upsert({
    where: { phone: '+919876543212' },
    update: {
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    },
    create: {
      name: 'Rahul Sharma',
      phone: '+919876543212',
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
