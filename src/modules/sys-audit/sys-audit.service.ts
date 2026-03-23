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

  async getLogs(filter: { userId?: string; tableName?: string; action?: string }) {
    return this.auditLogRepository.find({
      where: filter,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }
}
