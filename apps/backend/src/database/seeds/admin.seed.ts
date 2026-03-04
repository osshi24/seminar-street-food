import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminAccount } from '../../entities/admin-account.entity';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const adminRepo = app.get<Repository<AdminAccount>>(
    getRepositoryToken(AdminAccount),
  );

  const email = process.env.ADMIN_EMAIL || 'admin@phoamthuc.vn';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const fullName = process.env.ADMIN_FULL_NAME || 'System Admin';

  const existing = await adminRepo.findOne({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    await app.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = adminRepo.create({ email, passwordHash, fullName });
  await adminRepo.save(admin);

  console.log(`Admin account created: ${email}`);
  await app.close();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
