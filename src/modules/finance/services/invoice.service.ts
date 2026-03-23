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
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['branch'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const subtotal = Number(amount);
    const vatAmount = subtotal * vat;
    const total = subtotal + vatAmount;

    const invoice = this.invoiceRepository.create({
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

    return this.invoiceRepository.save(invoice);
  }

  async findByProject(projectId: string) {
    return this.invoiceRepository.find({
      where: { projectId },
      order: { issueDate: 'DESC' },
    });
  }
}
