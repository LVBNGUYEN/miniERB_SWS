import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamModule } from '../iam/iam.module';
import { Project } from './entities/project.entity';
import { Task } from './entities/task.entity';
import { Baseline } from './entities/baseline.entity';
import { ProjectMember } from './entities/project-member.entity';

@Module({
  imports: [
    IamModule,
    TypeOrmModule.forFeature([Project, Task, Baseline, ProjectMember]),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class ProjectModule {}
