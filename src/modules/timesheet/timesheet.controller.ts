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
import { LogHoursDto, RejectTimesheetDto, ClockInDto, ClockOutDto } from './dto/timesheet.dto';

@ApiTags('Timesheet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timesheets')
export class TimesheetController {
  constructor(private readonly timesheetService: TimesheetService) {}

  @Post()
  @Roles(Role.CEO, Role.PM, Role.VENDOR)
  @ApiOperation({ summary: 'Log hours for a task' })
  async logHours(@Body() dto: LogHoursDto, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.logHours(dto.taskId, dto.hours, userId, dto.snapshotPrice || 100, dto.notes);
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

  @Patch(':id/reject')
  @Roles(Role.CEO, Role.PM)
  @UseInterceptors(AuditInterceptor)
  @Audit('tms_timesheets', 'REJECT')
  @ApiOperation({ summary: 'Reject a timesheet contribution' })
  async reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectTimesheetDto, @CurrentUser() user: any) {
    const approverId = user.id || user.userId || user.sub;
    return this.timesheetService.rejectTimesheet(id, dto.reason || 'No reason provided', approverId);
  }

  @Get('pending')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'List pending timesheets for approval' })
  async getPending() {
    return this.timesheetService.findPending();
  }

  @Post('clock-in')
  @Roles(Role.VENDOR, Role.DEV, Role.PM)
  @ApiOperation({ summary: 'Start a work session (Clock-in)' })
  async clockIn(@Body() dto: ClockInDto, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.clockIn(dto.taskId, userId);
  }

  @Post('clock-out')
  @Roles(Role.VENDOR, Role.DEV, Role.PM)
  @ApiOperation({ summary: 'End a work session (Clock-out)' })
  async clockOut(@Body() dto: ClockOutDto, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.clockOut(userId, dto.notes);
  }

  @Post('cancel-session')
  @Roles(Role.VENDOR, Role.DEV, Role.PM)
  @ApiOperation({ summary: 'Cancel current session' })
  async cancel(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    await this.timesheetService.cancelSession(userId);
    return { success: true };
  }

  @Get('active')
  @Roles(Role.VENDOR, Role.DEV, Role.PM)
  @ApiOperation({ summary: 'Get current active work session' })
  async getActive(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    const session = await this.timesheetService.findActive(userId);
    return session || {}; // Ensure valid JSON response instead of empty string
  }

  @Get('my')
  @Roles(Role.VENDOR, Role.DEV, Role.PM, Role.CEO)
  @ApiOperation({ summary: 'List current user timesheets' })
  async getMy(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.timesheetService.findByUser(userId);
  }
}
