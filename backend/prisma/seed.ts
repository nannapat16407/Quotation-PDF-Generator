import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { hash } from 'bcryptjs';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'quotation_db',
  user: 'postgres',
  password: 'postgres',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@superhr.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@superhr.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  const supplier = await prisma.supplierInfo.upsert({
    where: { id: 'supplier-info-singleton' },
    update: {
      companyName: 'Super HR Co., Ltd.',
      address: '287 Silom Rd, Silom, Bang Rak, Bangkok 10500',
    },
    create: {
      id: 'supplier-info-singleton',
      companyName: 'Super HR Co., Ltd.',
      companyNameTh: 'บริษัท ซุปเปอร์เอชอาร์ จำกัด สำนักงานใหญ่',
      taxId: '0105566158667',
      address: '287 Silom Rd, Silom, Bang Rak, Bangkok 10500',
    },
  });
  console.log(`Created supplier info: ${supplier.companyName}`);

  const packagesData = [
    {
      id: 'pkg-starter',
      name: 'Starter',
      nameTh: 'สตาร์ทเตอร์',
      userCountEn: '1 Organization User',
      userCountTh: 'ผู้ใช้องค์กร 1 ราย',
      monthlyPrice: 150,
      yearlyPrice: 1500,
      sortOrder: 1,
    },
    {
      id: 'pkg-basic-account',
      name: 'Basic Account',
      nameTh: 'แบบบูรณาการพื้นฐาน',
      userCountEn: '2 Organization Users',
      userCountTh: 'ผู้ใช้องค์กร 2 ราย',
      monthlyPrice: 459,
      yearlyPrice: 4590,
      sortOrder: 2,
    },
    {
      id: 'pkg-advanced',
      name: 'Advanced',
      nameTh: 'แอดวานซ์',
      userCountEn: '3 Organization Users',
      userCountTh: 'ผู้ใช้องค์กร 3 ราย',
      monthlyPrice: 859,
      yearlyPrice: 8590,
      sortOrder: 3,
    },
    {
      id: 'pkg-go-pro',
      name: 'Go Pro',
      nameTh: 'โก๊ะโปร',
      userCountEn: 'Unlimited Users',
      userCountTh: 'ผู้ใช้ไม่จำกัด',
      monthlyPrice: 1359,
      yearlyPrice: 13590,
      sortOrder: 4,
    },
  ];

  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }
  console.log(`Created ${packagesData.length} packages`);

  const offersData = [
    {
      id: 'offer-free-data-migration',
      name: 'Free Data Migration',
      nameTh: 'นำเข้าข้อมูลฟรี',
      description: 'Free for Basic plans and above.',
      descriptionTh: 'ฟรีสำหรับแพ็กเกจ Basic ขึ้นไป',
      isDefault: true,
      sortOrder: 1,
    },
    {
      id: 'offer-24-7-technical-support',
      name: '24/7 Technical Support',
      nameTh: 'สนับสนุนทางเทคนิคตลอด 24 ชั่วโมง',
      description: 'Round-the-clock technical assistance.',
      descriptionTh: 'บริการช่วยเหลือทางเทคนิคตลอด 24 ชั่วโมง',
      isDefault: true,
      sortOrder: 2,
    },
    {
      id: 'offer-unlimited-users',
      name: 'Unlimited Users',
      nameTh: 'ผู้ใช้งานไม่จำกัด',
      description: 'No limit on user accounts.',
      descriptionTh: 'ไม่จำกัดจำนวนบัญชีผู้ใช้งาน',
      isDefault: false,
      sortOrder: 3,
    },
  ];

  for (const offer of offersData) {
    await prisma.specialOffer.upsert({
      where: { id: offer.id },
      update: {
        name: offer.name,
        nameTh: offer.nameTh,
        description: offer.description,
        descriptionTh: offer.descriptionTh,
        isDefault: offer.isDefault,
        sortOrder: offer.sortOrder,
      },
      create: offer,
    });
  }
  console.log(`Created ${offersData.length} special offers`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
