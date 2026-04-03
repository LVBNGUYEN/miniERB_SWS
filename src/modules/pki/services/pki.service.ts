import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { SystemService } from '../../system/system.service';
import { Contract } from '../../sales/entities/contract.entity';
import { Quotation } from '../../sales/entities/quotation.entity';
import { Task } from '../../project/entities/task.entity';
import { TaskStatus } from '../../project/entities/task-status.enum';
import { Role } from '../../iam/entities/role.enum';
import { ProjectService } from '../../project/services/project.service';
import { TimesheetService } from '../../timesheet/timesheet.service';

@Injectable()
export class PkiService {
  constructor(
    private readonly systemService: SystemService,
    private readonly projectService: ProjectService,
    private readonly timesheetService: TimesheetService,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async getDocuments(user: any) {
    const isAdmin = user.role === Role.CEO || user.role === Role.PM || user.role === Role.SALE;
    
    // 1. Contracts
    const contractQuery = this.contractRepository.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.quotation', 'quotation');
    
    if (!isAdmin && user.role === Role.CLIENT) {
      contractQuery.where('quotation.clientId = :clientId', { clientId: user.id });
    }
    const contracts = await contractQuery.getMany();

    // 2. Quotations
    const quotationQuery = this.quotationRepository.createQueryBuilder('quotation');
    if (!isAdmin) {
      if (user.role === Role.CLIENT) {
        quotationQuery.where('quotation.clientId = :clientId', { clientId: user.id });
      } else if (user.role === Role.PM) {
        quotationQuery.where('quotation.pmId = :pmId', { pmId: user.id });
      } else {
        // Other roles don't see quotations by default unless admin
        quotationQuery.where('1=0');
      }
    }
    const quotations = await quotationQuery.getMany();

    // 3. Tasks (Task Orders for Vendors)
    const taskQuery = this.taskRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project');
    
    if (!isAdmin) {
      if (user.role === Role.VENDOR || user.role === Role.DEV) {
        taskQuery.where('task.assigneeId = :userId', { userId: user.id });
      } else {
        taskQuery.where('1=0');
      }
    }
    const tasks = await taskQuery.getMany();

    const contractDocs = contracts.map(c => ({
      id: c.id,
      name: c.quotation?.title || `Hợp đồng ${c.contractNumber}`,
      date: new Date(c.createdAt).toLocaleDateString('vi-VN'),
      status: c.status,
      size: '2.4 MB',
      type: 'Hợp đồng',
    }));

    const quotationDocs = quotations.map(q => ({
      id: q.id,
      name: `Báo giá: ${q.title}`,
      date: new Date(q.createdAt).toLocaleDateString('vi-VN'),
      status: q.status === 'PENDING' ? 'Chờ duyệt' : q.status,
      size: '1.2 MB',
      type: 'Báo giá',
    }));

    const taskDocs = tasks.map(t => ({
      id: t.id,
      name: `Task Order: ${t.title}`,
      date: new Date(t.createdAt).toLocaleDateString('vi-VN'),
      status: t.status,
      size: '512 KB',
      type: 'Task Order / Biên bản',
    }));

    return [...contractDocs, ...quotationDocs, ...taskDocs];
  }

  async getCertificates() {
    return [
      {
        id: 'cert-1',
        issuer: 'VNPT-CA Global',
        expiresAt: '2026-12-12',
        algorithm: 'RSA-4096 / SHA-256',
        status: 'Active',
      },
    ];
  }

  async signDocument(
    documentId: string,
    documentContent: string,
  ): Promise<{ documentHash: string; signature: string; status: string }> {
    const documentHash = crypto.createHash('sha256').update(documentContent || documentId).digest('hex');
    const signature = crypto.createHmac('sha256', 'mock-ca-private-key').update(documentHash).digest('hex');

    // Update real Document Status if it's a contract
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(documentId);
    const contract = await this.contractRepository.findOne({ 
      where: isUuid 
        ? [{ id: documentId }, { contractNumber: documentId }] 
        : [{ contractNumber: documentId }]
    });
    
    if (contract) {
      contract.status = 'VERIFIED'; // Mark as active after signature
      contract.documentHash = documentHash;
      await this.contractRepository.save(contract);

      // Story 14.1: Trigger project creation from signed contract
      if (contract.quotationId) {
         const quotation = await this.quotationRepository.findOne({ where: { id: contract.quotationId } });
         if (quotation) {
            await this.projectService.initializeProjectFromContract(contract.id, quotation);
         }
      }
    }

    // Update Task Status if it's a task/biên bản
    if (isUuid && !contract) {
       const task = await this.taskRepository.findOne({ where: { id: documentId } });
       if (task) {
          task.status = TaskStatus.DONE; // Completion sign
          await this.taskRepository.save(task);
          
          // Story 14.2: Auto-approve all pending timesheets to sync P&L
          await this.timesheetService.approveAllForTask(documentId);
       }
    }

    return {
      documentHash,
      signature,
      status: 'SIGNED_AND_VERIFIED',
    };
  }

  async verifySignature(documentContent: string, signature: string): Promise<boolean> {
    const documentHash = crypto.createHash('sha256').update(documentContent).digest('hex');
    const expectedSignature = crypto.createHmac('sha256', 'mock-ca-private-key').update(documentHash).digest('hex');

    return signature === expectedSignature;
  }

  async rejectDocument(
    documentId: string,
    reason: string,
    rejecterRole: string,
    initiatorId: string,
  ): Promise<any> {
    await this.systemService.createNotification(
      initiatorId,
      `Yêu cầu ký số bị TỪ CHỐI (${rejecterRole})`,
      `Văn bản mã số ${documentId} đã bị từ chối. Lý do: ${reason}`
    );

    return {
      documentId,
      status: 'REJECTED',
      reason,
      message: 'Thông báo từ chối đã được gửi về người khởi tạo.'
    };
  }
}
