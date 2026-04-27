import { prisma } from './src/config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);
  const driver = await prisma.driver.create({
    data: {
      name: 'Test Driver',
      email: 'driver@example.com',
      phone: '1234567890',
      passwordHash,
      isActive: true,
      isAvailable: true,
      vehicleType: 'BIKE',
      vehicleNumber: 'TEST01'
    }
  });
  console.log('Driver created:', driver.email);
}
main().catch(console.error).finally(() => prisma.$disconnect());
