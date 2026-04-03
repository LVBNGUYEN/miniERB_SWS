import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './modules/iam/entities/user.entity';
import { Quotation } from './modules/sales/entities/quotation.entity';
import { QuotationStatus } from './modules/sales/entities/quotation-status.enum';
import { Project } from './modules/project/entities/project.entity';
import { ProjectStatus } from './modules/project/entities/project-status.enum';
import { Invoice } from './modules/finance/entities/invoice.entity';
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

    // 2. Tạo Báo Giá (Leads)
    const quotationRepository = dataSource.getRepository(Quotation);
    console.log('⏳ Gieo 18 Báo giá (Leads/Opportunities)...');
    
    const quotations: Quotation[] = [];
    const leadProjects = [
      'App Mobile Vietcombank (Phase 1)',
      'Hệ thống ERP VinFast',
      'AI Chatbot cho Techcombank',
      'Cổng thanh toán MoMo Integration',
      'Hệ thống quản lý kho TH True Milk'
    ];

    for (let i = 0; i < 18; i++) {
        const title = leadProjects[i] || `Dự án tiềm năng #${i+1}`;
        const amount = 200000000 + (Math.random() * 800000000);
        const hours = 400 + Math.floor(Math.random() * 1000);
        
        const q = quotationRepository.create({
          branchId: hqBranch.id,
          clientId: client.id,
          pmId: pm.id,
          title: title,
          totalEstimatedHours: hours,
          totalAmount: amount,
          status: i < 4 ? QuotationStatus.APPROVED : QuotationStatus.DRAFT,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        quotations.push(await quotationRepository.save(q));
    }

    // 3. Tạo 4 Dự án đang chạy (Từ 4 Quotation COMPLETED)
    const projectRepository = dataSource.getRepository(Project);
    console.log('⏳ Gieo 4 Dự án đang thực thi...');
    
    const projects: Project[] = [];
    for (let i = 0; i < 4; i++) {
        const p = projectRepository.create({
          quotationId: quotations[i].id,
          branchId: hqBranch.id,
          pmId: pm.id,
          clientId: client.id,
          name: quotations[i].title,
          totalEstimatedBudget: quotations[i].totalAmount,
          totalEstimatedHours: quotations[i].totalEstimatedHours,
          totalActualHours: quotations[i].totalEstimatedHours * 0.4, // Done 40%
          status: ProjectStatus.IN_PROGRESS,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        });
        projects.push(await projectRepository.save(p));
    }

    // 4. Tạo Hóa đơn (Finance)
    const invoiceRepository = dataSource.getRepository(Invoice);
    console.log('⏳ Gieo Hóa đơn (Finance)...');
    
    for (let i = 0; i < 2; i++) {
        const inv = invoiceRepository.create({
          projectId: projects[i].id,
          branchId: hqBranch.id,
          invoiceNumber: `INV-2026-00${i+1}`,
          subtotalAmount: projects[i].totalEstimatedBudget * 0.3, // Deposit 30%
          vatAmount: projects[i].totalEstimatedBudget * 0.03,
          totalAmount: projects[i].totalEstimatedBudget * 0.33,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: i === 0 ? 'PAID' : 'DRAFT',
          paymentDate: i === 0 ? new Date() : null,
        });
        await invoiceRepository.save(inv);
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
