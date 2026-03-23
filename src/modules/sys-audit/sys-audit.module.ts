import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { SysAuditService } from './sys-audit.service';
import { SysAuditController } from './sys-audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [SysAuditController],
  providers: [SysAuditService],
  exports: [SysAuditService],
})
export class SysAuditModule {}
