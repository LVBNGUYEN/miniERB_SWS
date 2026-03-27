import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/iam/entities/user.entity';
import { Quotation } from './modules/sales/entities/quotation.entity';
import { QuotationStatus } from './modules/sales/entities/quotation-status.enum';
import { Branch } from './modules/system/entities/branch.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  console.log('🌱 Bắt đầu gieo Seed Data (Pragmatic QA Style)...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
    const dataSource = app.get(DataSource);
    
    try {
      console.log('⏳ Làm sạch dữ liệu cũ...');
      await dataSource.query(`TRUNCATE TABLE fin_payments, fin_invoices, fin_vendor_debts, tms_timesheets, prj_tasks, prj_projects, sls_contracts, sls_quotations, iam_users, sys_branches CASCADE`);
      
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

    // 1. Tạo Users mẫu chuẩn theo yêu cầu: <role>@amit.vn và client@gmail.com
    const userRepository = dataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('⏳ Gieo CEO, PM, Sale, Vendor, Client (Standard emails)...');
    
    // CEO account
    let ceo = await userRepository.findOne({ where: { email: 'ceo@amit.vn' } });
    if (!ceo) {
      ceo = userRepository.create({
        fullName: 'Tổng Giám Đốc (CEO)',
        email: 'ceo@amit.vn',
        passwordHash: hashedPassword,
        role: 'CEO',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(ceo);
    }

    // PM account
    let pm = await userRepository.findOne({ where: { email: 'pm@amit.vn' } });
    if (!pm) {
      pm = userRepository.create({
        fullName: 'Quản Lý Dự Án (PM)',
        email: 'pm@amit.vn',
        passwordHash: hashedPassword,
        role: 'PM',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(pm);
    }

    // Sale account
    let sale = await userRepository.findOne({ where: { email: 'sale@amit.vn' } });
    if (!sale) {
      sale = userRepository.create({
        fullName: 'Phòng Kinh Doanh (SALE)',
        email: 'sale@amit.vn',
        passwordHash: hashedPassword,
        role: 'SALE',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(sale);
    }

    // Vendor account
    let vendor = await userRepository.findOne({ where: { email: 'vendor@amit.vn' } });
    if (!vendor) {
      vendor = userRepository.create({
        fullName: 'Đối Tác / Lập Trình Viên (VENDOR)',
        email: 'vendor@amit.vn',
        passwordHash: hashedPassword,
        role: 'VENDOR',
        status: 'ACTIVE',
        branchId: hqBranch.id,
      });
      await userRepository.save(vendor);
    }

    // Client account
    let client = await userRepository.findOne({ where: { email: 'client@gmail.com' } });
    if (!client) {
      client = userRepository.create({
        fullName: 'Khách Hàng (CLIENT)',
        email: 'client@gmail.com',
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
        status: QuotationStatus.DRAFT,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 
      });
      await quotationRepository.save(quotation);
    } else {
      // Cleanup existing test artifacts
      await dataSource.query(`TRUNCATE TABLE fin_payments, fin_invoices, fin_vendor_debts, tms_timesheets, prj_tasks, prj_projects, sls_contracts CASCADE`);
      
      // Update references to new client/pm
      quotation.clientId = client.id;
      quotation.pmId = pm.id;
      quotation.status = QuotationStatus.DRAFT;
      await quotationRepository.save(quotation);
    }

    console.log('✅ Gieo Data XONG! Dữ liệu của bạn:');
    console.log(`- CEO: ceo@amit.vn`);
    console.log(`- PM: pm@amit.vn`);
    console.log(`- SALE: sale@amit.vn`);
    console.log(`- VENDOR: vendor@amit.vn`);
    console.log(`- CLIENT: client@gmail.com`);
    
  } catch (error) {
    console.error('❌ Lỗi khi gieo Seed:', error);
  } finally {
    console.log('🔌 Ngắt kết nối Database.');
    await app.close();
  }
}

bootstrap();
