import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Golden Path E2E (Contract -> P&L)', () => {
  let app: INestApplication;
  let jwtToken: string;

  // Track important IDs across steps
  let quotationId: string;
  let contractId: string;
  let projectId: string;
  let taskId: string;
  let vendorId: string;
  let timesheetId: string;
  let invoiceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: Login as Global Admin to get JWT 
    // In a real test, you'd insert a user or use a mock auth guard.
    // For this e2e, we'll try to login with a known dev user or skip if Auth is bypassed 
    const loginRes = await request(app.getHttpServer())
      .post('/iam/sign-in')
      .send({ email: 'pm@amit.vn', password: 'password123' });
    
    expect(loginRes.status).toBe(201);
    expect(loginRes.body.access_token).toBeDefined();
    
    // We assume the login works and returns a token. 
    // If not, our guards might block subsequent requests.
    jwtToken = loginRes.body.access_token;
  });

  it('1. [Sales] Sign Quotation via PKI & Auto-Initialize Project', async () => {
    // Note: We need a pre-existing quotation ID. Let's mock a UUID for structure
    // Normally you'd insert a Quotation into the DB before this step
    quotationId = '5756e3d9-0e63-4975-9791-92bb270e4638'; // Replace with real inserted Quotation ID

    // This is the Flow 1 & 2 endpoint we created
    const res = await request(app.getHttpServer())
      .post(`/sales/quotations/${quotationId}/sign`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(201); // Created

    expect(res.body.contractNumber).toBeDefined();
    expect(res.body.documentHash).toBeDefined();

    contractId = res.body.id;
    projectId = res.body.projectId;
    // We'd expect the project to be generated here in the backend
  });

  it('2. [Project] Split WBS and assign to Vendor', async () => {
    // For the test, we'll extract the generated project ID and inject the real Vendor ID
    vendorId = '8312401c-2837-4bda-ab05-278c15640434';

    const res = await request(app.getHttpServer())
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        title: 'Develop Backend API',
        estimatedHours: 40,
        assigneeId: vendorId,
        riskBufferPercent: 0.1
      })
      .expect(201);

    expect(res.body.status).toBe('TODO');
    taskId = res.body.id;
  });

  it('3. [Timesheet] Log Hours', async () => {
    // Vendor logs hours mapped to task
    const res = await request(app.getHttpServer())
      .post(`/timesheets`)
      .set('Authorization', `Bearer ${jwtToken}`) // Preteding it's the vendor
      .send({
        taskId: taskId,
        hours: 10,
        vendorId: vendorId,
        snapshotPrice: 20
      })
      .expect(201);

    expect(res.body.approvalStatus).toBe('PENDING');
    timesheetId = res.body.id;
  });

  it('4. [Timesheet] Approve Hours (Triggers Debt & Alert)', async () => {
    // PM Approves the logged hours
    const res = await request(app.getHttpServer())
      .patch(`/timesheets/${timesheetId}/approve`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.approvalStatus).toBe('Approved');
    // System should have automatically generated VendorDebt and checked SysAlert
  });

  it('5. [Finance] Generate Invoice for Client', async () => {
    const res = await request(app.getHttpServer())
      .post(`/finance/invoices/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 5000 }) // Invoice amount for 1st milestone
      .expect(201);

    expect(res.body.status).toBe('ISSUED');
    invoiceId = res.body.id;
  });

  it('6. [Finance] Register Client Payment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/finance/payments/${invoiceId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ amount: 5000, reference: 'BANK-TRANSFER-001' })
      .expect(201);

    expect(Number(res.body.paidAmount)).toBe(5000);
    expect(res.body.referenceCode).toBe('BANK-TRANSFER-001');
    // Invoice should now be PAID and mapped VendorDebt cleared
  });

  it('7. [Finance] Accountant Checks Final P&L', async () => {
    const res = await request(app.getHttpServer())
      .get(`/finance/pnl/${projectId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(Number(res.body.revenue)).toBeGreaterThanOrEqual(0);
    expect(Number(res.body.vendorCosts)).toBeGreaterThanOrEqual(0);
    expect(res.body.profit).toBeDefined();
    expect(res.body.margin).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
