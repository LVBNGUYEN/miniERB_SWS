import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class SysAuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      ...data,
      actorType: data.actorType || 'USER',
    });
    return this.auditLogRepository.save(log);
  }

  async getLogs(filter: { userId?: string; tableName?: string; action?: string; search?: string; startDate?: string; endDate?: string }) {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filter.userId) {
      query.andWhere('audit.userId = :userId', { userId: filter.userId });
    }
    if (filter.tableName) {
      query.andWhere('audit.tableName = :tableName', { tableName: filter.tableName });
    }
    if (filter.action) {
      query.andWhere('audit.action = :action', { action: filter.action });
    }
    if (filter.search) {
      query.andWhere('(audit.recordId::text LIKE :search OR CAST(audit.oldValue AS text) LIKE :search OR CAST(audit.newValue AS text) LIKE :search)', { search: `%${filter.search}%` });
    }
    if (filter.startDate) {
      query.andWhere('audit.createdAt >= :startDate', { startDate: new Date(filter.startDate) });
    }
    if (filter.endDate) {
      query.andWhere('audit.createdAt <= :endDate', { endDate: new Date(filter.endDate) });
    }

    return query.getMany();
  }

  async exportToCsv(logs: AuditLog[]): Promise<string> {
    const header = 'ID,User,Table,Action,RecordID,OldValue,NewValue,Timestamp\n';
    const rows = logs.map(log => {
      const user = log.user?.fullName || 'System';
      return `"${log.id}","${user}","${log.tableName}","${log.action}","${log.recordId}","${JSON.stringify(log.oldValue).replace(/"/g, '""')}","${JSON.stringify(log.newValue).replace(/"/g, '""')}","${log.createdAt}"`;
    }).join('\n');
    return header + rows;
  }
}
