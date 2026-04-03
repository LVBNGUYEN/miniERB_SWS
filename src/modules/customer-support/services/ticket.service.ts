import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Ticket, TicketStatus, TicketType } from '../entities/ticket.entity';
import { QuotationStatus } from '../../sales/entities/quotation-status.enum';
import { SysAuditService } from '../../sys-audit/sys-audit.service';
import { Project } from '../../project/entities/project.entity';
import { Quotation } from '../../sales/entities/quotation.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly dataSource: DataSource,
    private readonly sysAuditService: SysAuditService,
  ) {}

  async createTicket(data: Partial<Ticket>): Promise<Ticket> {
    const ticket = this.ticketRepository.create(data);
    return this.ticketRepository.save(ticket);
  }

  async categorizeTicket(ticketId: string, type: TicketType, reqUserId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const oldStatus = ticket.status;
    const oldType = ticket.ticketType;

    ticket.ticketType = type;
    if (type === TicketType.CHANGE_REQUEST) {
      ticket.status = TicketStatus.PENDING_QUOTATION;
    }

    const savedTicket = await this.ticketRepository.save(ticket);

    // Phát sinh SysAuditLog
    await this.sysAuditService.createLog({
      userId: reqUserId,
      tableName: 'csk_tickets',
      recordId: ticket.id,
      action: 'CATEGORIZE',
      oldValue: { ticketType: oldType, status: oldStatus },
      newValue: { ticketType: savedTicket.ticketType, status: savedTicket.status },
    });

    return savedTicket;
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
      ticket.status = TicketStatus.EVALUATED;
      await queryRunner.manager.save(ticket);

      // System Auto-Generates New CR Quotation based on Project's properties
      const quotation = queryRunner.manager.create(Quotation, {
        branchId: ticket.project.branchId,
        clientId: ticket.clientId,
        pmId: ticket.project.pmId || ticket.clientId, // Fallback PM if none exists
        title: `CR BÁO GIÁ: ${ticket.title}`,
        totalEstimatedHours: estimatedHours,
        totalAmount: estimatedHours * hourlyRate,
        status: QuotationStatus.DRAFT,
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

  async findAllTickets(user: any): Promise<Ticket[]> {
    const userId = user.id || user.userId || user.sub;
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.project', 'project')
      .leftJoinAndSelect('ticket.client', 'client')
      .leftJoinAndSelect('ticket.blameUser', 'blameUser');

    // CEO and PM see all tickets, CLIENT sees their own, VENDOR/DEV see projects they are assigned to
    if (user.role === 'CLIENT') {
      query.andWhere('ticket.clientId = :userId', { userId });
    } else if (user.role === 'VENDOR' || user.role === 'DEV') {
      query.innerJoin('prj_tasks', 't', 't.project_id = ticket.project_id AND t.assignee_id = :userId', { userId });
    }

    query.orderBy('ticket.createdAt', 'DESC');
    return query.getMany();
  }

  async getTicketsByProject(projectId: string) {
    return this.ticketRepository.find({
      where: { projectId },
      relations: ['client', 'blameUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(ticketId: string, status: TicketStatus, reqUserId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id: ticketId }});
    if (!ticket) throw new NotFoundException('Ticket not found');
    
    const oldStatus = ticket.status;
    ticket.status = status;
    const saved = await this.ticketRepository.save(ticket);
    
    await this.sysAuditService.createLog({
      userId: reqUserId,
      tableName: 'csk_tickets',
      action: 'UPDATE_STATUS',
      recordId: ticket.id,
      oldValue: { status: oldStatus },
      newValue: { status: saved.status },
    });
    return saved;
  }
}
