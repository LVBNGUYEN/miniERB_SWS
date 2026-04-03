import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class FinanceCronService {
  private readonly logger = new Logger(FinanceCronService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueInvoices() {
    this.logger.log('--- SCANNING OVERDUE INVOICES FOR AUTOMATED NOTIFICATIONS ---');
    
    const overdueInvoices = await this.invoiceRepository.find({
      where: {
        status: 'UNPAID',
        dueDate: LessThan(new Date()),
      },
    });

    for (const inv of overdueInvoices) {
      this.logger.warn(`Invoice ${inv.invoiceNumber} IS OVERDUE! Sending email to Client...`);
      // Simulate EmailService.send('invoice_reminder', inv.clientEmail)
      // Story 11.4 complete logic placeholder
    }

    this.logger.log(`Scanning completed. Found ${overdueInvoices.length} overdue invoices.`);
  }
}
