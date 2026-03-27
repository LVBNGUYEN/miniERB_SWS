import { Controller, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe, UseInterceptors, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { Audit } from '../sys-audit/decorators/audit.decorator';
import { AuditInterceptor } from '../sys-audit/interceptors/audit.interceptor';

@ApiTags('Timesheet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  @Roles(Role.CEO, Role.PM, Role.VENDOR)
  @ApiOperation({ summary: 'Log hours for a task (Flow 4)' })
  async logHours(@Body() body: any) {
    const { taskId, hours, vendorId, snapshotPrice } = body;
    return this.timesheetService.logHours(taskId, hours, vendorId, snapshotPrice);
  }

  @Patch(':id/approve')
  @Roles(Role.CEO, Role.PM)
  @UseInterceptors(AuditInterceptor)
  @Audit('tms_timesheets', 'APPROVE')
  @ApiOperation({ summary: 'Approve a timesheet and record vendor debt' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const approverId = user.id || user.userId || user.sub;
    return this.timesheetService.approveTimesheet(id, approverId);
  }

  @Get('pending')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'List pending timesheets for approval' })
  async getPending() {
    return this.timesheetService.findPending();
  }

  @Get('my')
  @Roles(Role.CEO, Role.PM, Role.VENDOR)
  @ApiOperation({ summary: 'List current user timesheets' })
  async getMy(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.findByUser(userId);
  }
}
