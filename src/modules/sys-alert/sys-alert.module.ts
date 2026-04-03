import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SysAlert } from './entities/sys-alert.entity';
import { Project } from '../project/entities/project.entity';
import { Timesheet } from '../timesheet/entities/timesheet.entity';
import { SysAlertService } from './services/sys-alert.service';
import { SysAlertController } from './sys-alert.controller';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SysAlert, Project, Timesheet]),
    SystemModule
  ],
  controllers: [SysAlertController],
  providers: [SysAlertService],
  exports: [SysAlertService],
})
export class SysAlertModule {}
