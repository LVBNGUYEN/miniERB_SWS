import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Project } from '../../project/entities/project.entity';
import { Quotation } from '../../sales/entities/quotation.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly dataSource: DataSource,
  ) {}

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.ticketRepository.create(data);
    return this.ticketRepository.save(ticket);
  }

  /**
   * Flow 4: Handle Change Request (CR) Evaluation
   * PM Evaluates Effort and system Auto-Generates a New Quotation for CR 
   */
  async evaluateChangeRequest(
    ticketId: string, 
    estimatedHours: number, 
    hourlyRate: number
  ): Promise<{ ticket: Ticket; quotation: Quotation }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(Ticket, {
        where: { id: ticketId },
        relations: ['project'],
      });

      if (!ticket || !ticket.project) {
        throw new NotFoundException('Ticket or Project not found');
      }

      // Mark CR Ticket as EVALUATED
      ticket.status = 'EVALUATED';
      await queryRunner.manager.save(ticket);

      // System Auto-Generates New CR Quotation based on Project's properties
      const quotation = queryRunner.manager.create(Quotation, {
        branchId: ticket.project.branchId,
        clientId: ticket.clientId,
        pmId: ticket.project.pmId || ticket.clientId, // Fallback PM if none exists
        title: `CR BÁO GIÁ: ${ticket.title}`,
        totalEstimatedHours: estimatedHours,
        totalAmount: estimatedHours * hourlyRate,
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Valid 15 days
      });
      await queryRunner.manager.save(quotation);

      await queryRunner.commitTransaction();
      return { ticket, quotation };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getTicketsByProject(projectId: string) {
    return this.ticketRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }
}
