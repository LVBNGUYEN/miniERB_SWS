import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from '../entities/quotation.entity';
import { QuotationStatus } from '../entities/quotation-status.enum';
import { SysAuditService } from '../../sys-audit/sys-audit.service';
import { CreateQuotationDto, UpdateQuotationStatusDto, UpdateQuotationDto } from '../dto/quotation.dto';
import { TicketStatus } from '../../customer-support/entities/ticket.entity';
import { TicketService } from '../../customer-support/services/ticket.service';
import { Role } from '../../iam/entities/role.enum';

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
    private readonly ticketService: TicketService,
    private readonly sysAuditService: SysAuditService,
  ) {}

  async create(createDto: CreateQuotationDto, userId: string) {
    const quotation = this.quotationRepository.create(createDto);
    quotation.status = QuotationStatus.DRAFT;
    
    const saved = await this.quotationRepository.save(quotation);
    
    if (createDto.ticketId) {
      await this.ticketService.updateStatus(createDto.ticketId, TicketStatus.EVALUATED, userId).catch(() => {});
    }
    
    await this.sysAuditService.createLog({
      userId,
      action: 'CREATE',
      tableName: 'sls_quotations',
      recordId: saved.id,
      newValue: saved,
    });
    
    return saved;
  }

  async findAll(user: any) {
    if (user.role === 'CLIENT') {
      return this.quotationRepository.find({
        where: { clientId: user.id },
        relations: ['client', 'pm', 'branch'],
        order: { createdAt: 'DESC' },
      });
    }
    return this.quotationRepository.find({
      relations: ['client', 'pm', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const quotation = await this.quotationRepository.findOne({ where: { id }, relations: ['client', 'pm', 'branch'] });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async update(id: string, updateDto: UpdateQuotationDto, userId: string) {
    const quotation = await this.findOne(id);
    if (quotation.status === QuotationStatus.APPROVED) {
      throw new BadRequestException('Cannot modify an approved quotation (Immutability Enforced)');
    }
    const oldValue = { title: quotation.title, totalAmount: quotation.totalAmount, description: quotation.description };
    Object.assign(quotation, updateDto);
    const saved = await this.quotationRepository.save(quotation);
    
    await this.sysAuditService.createLog({
      userId,
      tableName: 'sls_quotations',
      recordId: saved.id,
      action: 'UPDATE',
      oldValue,
      newValue: { title: saved.title, totalAmount: saved.totalAmount, description: saved.description },
    });
    return saved;
  }

  async updateStatus(id: string, updateDto: UpdateQuotationStatusDto, user: any) {
    const quotation = await this.findOne(id);
    
    if (quotation.status === QuotationStatus.APPROVED) {
      throw new BadRequestException('Cannot modify an approved quotation (Immutability Enforced)');
    }

    if (user.role === Role.SALE || user.role === Role.PM) {
      if (updateDto.status !== QuotationStatus.PENDING) {
        throw new BadRequestException('Sales/PM can only submit quotation for approval (DRAFT -> PENDING).');
      }
      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT quotations can be submitted.');
      }
    } else if (user.role === Role.CLIENT || user.role === Role.CEO) {
      if (user.role === Role.CLIENT && quotation.clientId !== user.id) {
        throw new ForbiddenException('You do not have permission to approve or reject this quotation. (IDOR Prevented)');
      }
      if (updateDto.status !== QuotationStatus.APPROVED && updateDto.status !== QuotationStatus.REJECTED) {
        throw new BadRequestException('Client/CEO can only APPROVE or REJECT pending quotations.');
      }
      if (quotation.status !== QuotationStatus.PENDING) {
        throw new BadRequestException('Only PENDING quotations can be approved or rejected.');
      }
    }

    const oldStatus = quotation.status;
    quotation.status = updateDto.status;
    
    const saved = await this.quotationRepository.save(quotation);

    await this.sysAuditService.createLog({
      userId: user.id,
      action: 'UPDATE_STATUS',
      tableName: 'sls_quotations',
      recordId: saved.id,
      oldValue: { status: oldStatus },
      newValue: { status: saved.status },
    });
    
    return saved;
  }
}
