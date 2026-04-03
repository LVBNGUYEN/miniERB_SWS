import { Controller, Post, Get, Put, Body, Param, ParseUUIDPipe, UseGuards, UseInterceptors, Req, HttpCode } from '@nestjs/common';
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
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { CreateTaskDto } from '../dto/task.dto';

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
    @Body() dto: CreateTaskDto,
    @Req() req: any
  ) {
    return this.taskService.create(
      { ...dto, projectId },
      req.user.id
    );
  }

  @Post(':projectId/close')
  @Roles(Role.CEO, Role.PM)
  @HttpCode(201)
  @UseInterceptors(AuditInterceptor)
  @Audit('prj_projects', 'UAT_CLOSE_PROJECT')
  @ApiOperation({ summary: 'UAT & Close Project (Flow 5)' })
  async closeProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('qcPassed') qcPassed: boolean = true,
    @Req() req: any
  ) {
    return this.projectService.closeProject(projectId, qcPassed, req.user);
  }

  @Post(':projectId/onboard-vendor')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Match skill and onboard vendor to project (Flow 6)' })
  async onboardVendor(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('vendorId', ParseUUIDPipe) vendorId: string,
  ) {
    return { status: 'ONBOARDED', projectId, vendorId, assignedAt: new Date() };
  }

  @Post()
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Create new project' })
  async createProject(@Body() createDto: CreateProjectDto, @Req() req: any) {
    return this.projectService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT, Role.DEV)
  @ApiOperation({ summary: 'List all projects with tenant isolation' })
  async listProjects(@Req() req: any) {
    return this.projectService.findAll(req.user);
  }

  // Fallback for Frontend Dashboards using POST /projects/list
  @Post('list')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT, Role.DEV)
  @HttpCode(200)
  async listProjectsPost(@Req() req: any) {
    return this.projectService.findAll(req.user);
  }

  // Fallback for Dashboard initial data calls
  @Post('initial-data')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT, Role.DEV)
  @HttpCode(200)
  async getInitialData(@Req() req: any) {
    const projects = await this.projectService.findAll(req.user);
    return { projects, stats: { active: projects.length } };
  }
  
  @Get(':id')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'Get details of a project' })
  async getProject(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.projectService.findOne(id, req.user);
  }
  
  @Put(':id')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Update a project' })
  async updateProject(@Param('id', ParseUUIDPipe) id: string, @Body() updateDto: UpdateProjectDto, @Req() req: any) {
    return this.projectService.update(id, updateDto, req.user);
  }

  @Get(':projectId/tasks')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List tasks for a project via GET' })
  async listTasksGet(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req: any) {
    return this.taskService.findAll(req.user, projectId);
  }

  @Post(':projectId/tasks-list')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List tasks for a project via POST' })
  async listTasks(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req: any) {
    return this.taskService.findAll(req.user, projectId);
  }

  @Get('tasks/my')
  @Roles(Role.CEO, Role.PM, Role.VENDOR, Role.SALE, Role.CLIENT, Role.DEV)
  @ApiOperation({ summary: 'List tasks assigned to current user' })
  async getMyTasks(@CurrentUser() user: any) {
    return this.taskService.findAll(user);
  }
}
