import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/iam/entities/user.entity';
import { Quotation } from './modules/sales/entities/quotation.entity';
import { Branch } from './modules/system/entities/branch.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🌱 Bắt đầu gieo Seed Data (Pragmatic QA Style)...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const dataSource = app.get(DataSource);
  
  try {
    // 0. Tạo Branch mẫu
    const branchRepository = dataSource.getRepository(Branch);
    console.log('⏳ Mở Chi Nhánh...');
    let hqBranch = await branchRepository.findOne({ where: { code: 'HN-HQ' } });
    if (!hqBranch) {
      hqBranch = branchRepository.create({
        name: 'Trụ sở chính Hà Nội',
        code: 'HN-HQ',
        currency: 'VND',
        timezone: 'Asia/Ho_Chi_Minh',
      });
      await branchRepository.save(hqBranch);
    }

    // 1. Tạo Users mẫu (Admin, Vendor, Client)
    const userRepository = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('⏳ Gieo PM, Vendor, Client...');
    let pm = await userRepository.findOne({ where: { email: 'pm@amit.vn' } });
    if (!pm) {
      pm = userRepository.create({
        fullName: 'Quản Lý Dự Án SWS (Admin)',
        email: 'pm@amit.vn',
        passwordHash: hashedPassword,
        role: 'GLOBAL_ADMIN',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(pm);
    }

    let branchPm = await userRepository.findOne({ where: { email: 'branch_pm@amit.vn' } });
    if (!branchPm) {
      branchPm = userRepository.create({
        fullName: 'Project Manager (Chi nhánh)',
        email: 'branch_pm@amit.vn',
        passwordHash: hashedPassword,
        role: 'BRANCH_PM',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(branchPm);
    }

    let sale = await userRepository.findOne({ where: { email: 'sale@amit.vn' } });
    if (!sale) {
      sale = userRepository.create({
        fullName: 'Kinh Doanh SWS',
        email: 'sale@amit.vn',
        passwordHash: hashedPassword,
        role: 'SALE',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(sale);
    }

    let vendor = await userRepository.findOne({ where: { email: 'vendor@amit.vn' } });
    if (!vendor) {
      vendor = userRepository.create({
        fullName: 'Bùi Anh Tuấn (Vendor)',
        email: 'vendor@amit.vn',
        passwordHash: hashedPassword,
        role: 'VENDOR',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(vendor);
    }

    let client = await userRepository.findOne({ where: { email: 'client@vcb.com' } });
    if (!client) {
      client = userRepository.create({
        fullName: 'Đại diện Vietcombank',
        email: 'client@vcb.com',
        passwordHash: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(client);
    }

    // 2. Tạo Báo Giá (Luồng 1) chốt sẵn
    const quotationRepository = dataSource.getRepository(Quotation);
    console.log('⏳ Gieo Báo giá (Quotation)...');
    
    let quotation = await quotationRepository.findOne({ where: { title: 'App Mobile Vietcombank (Giai đoạn 1)' } });
    if (!quotation) {
      quotation = quotationRepository.create({
        branchId: hqBranch.id,
        clientId: client.id,
        pmId: pm.id,
        title: 'App Mobile Vietcombank (Giai đoạn 1)',
        totalEstimatedHours: 500,
        totalAmount: 150000000, 
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
      });
      await quotationRepository.save(quotation);
    } else {
      // Reset for testing
      quotation.status = 'DRAFT';
      await quotationRepository.save(quotation);
      
      // Cleanup existing test artifacts
      // PN: Using TRUNCATE with CASCADE to safely clear the transaction chain for a fresh test run.
      await dataSource.query(`TRUNCATE TABLE fin_payments, fin_invoices, fin_vendor_debts, tms_timesheets, prj_tasks, prj_projects, sls_contracts CASCADE`);
      
      // Reset for testing
      quotation.status = 'DRAFT';
      await quotationRepository.save(quotation);
    }

    console.log('✅ Gieo Data XONG! Dữ liệu của bạn:');
    console.log(`- Bạn có thể Login bằng: pm@amit.vn / password123`);
    console.log(`- Quotation ID để test Luồng 1 (Ký PKI CA): ${quotation.id}`);
    console.log(`- Vendor ID để test Luồng 3 (Gán Task): ${vendor.id}`);
    
  } catch (error) {
    console.error('❌ Lỗi khi gieo Seed:', error);
  } finally {
    console.log('🔌 Ngắt kết nối Database.');
    await app.close();
  }
}

bootstrap();
