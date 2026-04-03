import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';
import { Project } from '../../project/entities/project.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async createInvoice(projectId: string, amount: number, vat: number = 0.1): Promise<Invoice> {
    const queryRunner = this.projectRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId },
        relations: ['branch'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const subtotal = Number(amount);
      const vatAmount = subtotal * vat;
      const total = subtotal + vatAmount;

      const invoice = queryRunner.manager.create(Invoice, {
        projectId,
        branchId: project.branchId,
        invoiceNumber: `INV-${Date.now()}`,
        subtotalAmount: subtotal,
        vatAmount: vatAmount,
        totalAmount: total,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days due
        status: 'ISSUED',
      });

      const saved = await queryRunner.manager.save(Invoice, invoice);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByProject(projectId: string, user: any) {
    const qb = this.invoiceRepository.createQueryBuilder('inv')
      .innerJoin('prj_projects', 'p', 'p.id = inv.project_id')
      .where('inv.project_id = :projectId', { projectId });

    if (user.role === 'CLIENT') {
      qb.andWhere('p.client_id = :clientId', { clientId: user.id });
    }

    if (user.role === 'PM') {
      qb.andWhere('p.pm_id = :pmId', { pmId: user.id });
    }
    
    // CEO/Admin see everything
  }

  async createFromContract(contractId: string, projectId: string, amount: number, branchId: string): Promise<Invoice> {
    const invoice = this.invoiceRepository.create({
      projectId,
      branchId,
      contractId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      subtotalAmount: amount,
      vatAmount: amount * 0.1,
      totalAmount: amount * 1.1,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'UNPAID',
    });
    return this.invoiceRepository.save(invoice);
  }

  async payInvoice(invoiceId: string, signature: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    
    invoice.status = 'PAID';
    invoice.paymentDate = new Date();
    invoice.pkiPaymentSignature = signature;
    
    return this.invoiceRepository.save(invoice);
  }
}
