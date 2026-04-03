import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskRequest } from './entities/task-request.entity';
import { Timesheet } from '../timesheet/entities/timesheet.entity';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { TaskRequestService } from './services/task-request.service';
import { ProjectController } from './controllers/project.controller';
import { TaskController } from './controllers/task.controller';
import { TaskRequestController } from './controllers/task-request.controller';
import { SysAuditModule } from '../sys-audit/sys-audit.module';
import { IamModule } from '../iam/iam.module';
import { TimesheetModule } from '../timesheet/timesheet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, TaskRequest, Timesheet]),
    SysAuditModule, 
    IamModule,
    TimesheetModule 
  ],
  controllers: [ProjectController, TaskController, TaskRequestController],
  providers: [ProjectService, TaskService, TaskRequestService],
  exports: [ProjectService, TaskService, TaskRequestService],
})
export class ProjectModule {}
