import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { UserRole } from '../src/lib/enums';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin User';
  const roleArg = (process.argv[5] || 'SUPER_ADMIN').toUpperCase();

  if (!email || !password) {
    console.log('Usage: npx tsx scripts/create-admin.ts <email> <password> [name] [role]');
    console.log('Roles: SUPER_ADMIN, ADMIN, DESK_OPERATOR, VOLUNTEER');
    process.exit(1);
  }

  const role = UserRole[roleArg as keyof typeof UserRole];
  if (!role) {
    console.error(`Invalid role: ${roleArg}. Valid roles: ${Object.keys(UserRole).join(', ')}`);
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`User with email ${email} already exists.`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: hashedPassword,
      role,
      isActive: true,
    },
  });

  console.log(`✅ Admin user created successfully:`);
  console.log(`   ID:    ${user.id}`);
  console.log(`   Name:  ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role:  ${user.role}`);
}

createAdminUser()
  .catch((e) => {
    console.error('Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
