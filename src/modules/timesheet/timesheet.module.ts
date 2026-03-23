import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Timesheet } from './entities/timesheet.entity';
import { TimesheetService } from './timesheet.service';
import { TimesheetController } from './timesheet.controller';
import { SysAlertModule } from '../sys-alert/sys-alert.module';
import { SysAuditModule } from '../sys-audit/sys-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Timesheet]),
    SysAlertModule,
    SysAuditModule,
  ],
  controllers: [TimesheetController],
  providers: [TimesheetService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
