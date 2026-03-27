import { Controller, Get, Query, UseGuards, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';
import { SysAuditService } from './sys-audit.service';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class SysAuditController {
  constructor(private readonly auditService: SysAuditService) {}

  @Get('logs')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Lấy nhật ký kiểm toán với bộ lọc nâng cao (Flow 14)' })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('tableName') tableName?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getLogs({ userId, tableName, action, search, startDate, endDate });
  }

  @Get('export')
  @Roles(Role.CEO)
  @ApiOperation({ summary: 'Xuất nhật ký kiểm toán ra file CSV' })
  async exportLogs(
    @Query('userId') userId?: string,
    @Query('tableName') tableName?: string,
    @Query('action') action?: string,
  ) {
    const logs = await this.auditService.getLogs({ userId, tableName, action });
    return this.auditService.exportToCsv(logs);
  }
}
