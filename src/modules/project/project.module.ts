import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskRequest } from './entities/task-request.entity';
import { Timesheet } from './entities/timesheet.entity';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { TaskRequestService } from './services/task-request.service';
import { TimesheetService } from './services/timesheet.service';
import { ProjectController } from './controllers/project.controller';
import { TaskController } from './controllers/task.controller';
import { TaskRequestController } from './controllers/task-request.controller';
import { TimesheetController } from './controllers/timesheet.controller';
import { SysAuditModule } from '../sys-audit/sys-audit.module';
import { IamModule } from '../iam/iam.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, TaskRequest, Timesheet]),
    SysAuditModule, // Needed for AuditInterceptor
    IamModule
  ],
  controllers: [ProjectController, TaskController, TaskRequestController, TimesheetController],
  providers: [ProjectService, TaskService, TaskRequestService, TimesheetService],
  exports: [ProjectService, TaskService, TaskRequestService, TimesheetService],
})
export class ProjectModule {}
