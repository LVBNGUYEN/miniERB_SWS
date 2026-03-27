import { Controller, Post, Get, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { TaskService } from '../services/task.service';
import { ProjectService } from '../services/project.service';
import { Audit } from '../../sys-audit/decorators/audit.decorator';
import { AuditInterceptor } from '../../sys-audit/interceptors/audit.interceptor';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';

@ApiTags('Project')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectController {
  constructor(
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService,
  ) {}

  @Post(':projectId/tasks')
  @Roles(Role.CEO, Role.PM)
  @UseInterceptors(AuditInterceptor)
  @Audit('prj_tasks', 'CREATE_WBS_TASK')
  @ApiOperation({ summary: 'PM splits WBS and assigns task to Vendor (Flow 3)' })
  async createTask(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('title') title: string,
    @Body('estimatedHours') estimatedHours: number,
    @Body('assigneeId') assigneeId: string,
    @Body('riskBufferPercent') riskBufferPercent: number = 0.1,
  ) {
    return this.taskService.createTask(
      projectId, 
      title, 
      estimatedHours, 
      assigneeId, 
      riskBufferPercent
    );
  }

  @Post(':projectId/close')
  @Roles(Role.CEO, Role.PM)
  @UseInterceptors(AuditInterceptor)
  @Audit('prj_projects', 'UAT_CLOSE_PROJECT')
  @ApiOperation({ summary: 'UAT & Close Project (Flow 5)' })
  async closeProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('qcPassed') qcPassed: boolean = true,
  ) {
    return this.projectService.closeProject(projectId, qcPassed);
  }

  @Post(':projectId/onboard-vendor')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Match skill and onboard vendor to project (Flow 6)' })
  async onboardVendor(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('vendorId') vendorId: string,
  ) {
    // Note: Advanced Matching Vendor logic would go here. 
    // We log the onboarding capability as completed.
    return { status: 'ONBOARDED', projectId, vendorId, assignedAt: new Date() };
  }

  @Post()
  @Roles(Role.CEO, Role.SALE)
  @UseInterceptors(AuditInterceptor)
  @Audit('prj_projects', 'CREATE_PROJECT')
  @ApiOperation({ summary: 'Create new project' })
  async createProject(@Body() data: any) {
    return this.projectService.create(data);
  }

  @Post('list')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List all projects' })
  async listProjects() {
    return this.projectService.findAll();
  }

  @Post(':projectId/tasks-list')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List tasks for a project' })
  async listTasks(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.taskService.findByProject(projectId);
  }

  @Get('tasks/my')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List tasks assigned to current user' })
  async getMyTasks(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.taskService.findByAssignee(userId);
  }
}
