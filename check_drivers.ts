import { prisma } from './apps/api/src/config/prisma'
async function main() {
  try {
    const drivers = await prisma.driver.findMany()
    console.log('Drivers found:', JSON.stringify(drivers, null, 2))
  } catch (err) {
    console.error('Error fetching drivers:', err)
  }
}
main().catch(console.error).finally(() => prisma.$disconnect())
