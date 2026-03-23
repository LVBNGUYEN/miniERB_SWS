import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { TaskRequest } from './entities/task-request.entity';
import { ProjectService } from './services/project.service';
import { TaskService } from './services/task.service';
import { TaskRequestService } from './services/task-request.service';
import { ProjectController } from './controllers/project.controller';
import { TaskRequestController } from './controllers/task-request.controller';
import { SysAuditModule } from '../sys-audit/sys-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, TaskRequest]),
    SysAuditModule // Needed for AuditInterceptor
  ],
  controllers: [ProjectController, TaskRequestController],
  providers: [ProjectService, TaskService, TaskRequestService],
  exports: [ProjectService, TaskService, TaskRequestService],
})
export class ProjectModule {}
