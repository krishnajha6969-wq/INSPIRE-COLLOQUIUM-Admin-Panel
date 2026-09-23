import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Super Admin User if not exists
  const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'admin@inspirecolloquium.org';
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'InspireAdmin2026!';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: superAdminEmail,
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log(`✅ Super Admin created: ${superAdmin.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existingSuperAdmin.email}`);
  }

  // 2. Initialize System Settings
  const defaultSettings = [
    { key: 'EVENT_NAME', value: 'INSPIRE Colloquium 2026', description: 'Official name of the colloquium event' },
    { key: 'MAX_CAPACITY_UG', value: '60', description: 'Maximum accepted UG presentations' },
    { key: 'MAX_CAPACITY_PG', value: '40', description: 'Maximum accepted PG presentations' },
    { key: 'MAX_CAPACITY_PHD', value: '20', description: 'Maximum accepted PhD presentations' },
    { key: 'DESK_CHECKIN_ENABLED', value: 'true', description: 'Enable/disable on-site desk check-in' },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ System settings initialized.');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
