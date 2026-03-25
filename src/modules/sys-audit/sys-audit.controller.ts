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
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @ApiOperation({ summary: 'Get system audit logs (Flow 14)' })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('tableName') tableName?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.getLogs({ userId, tableName, action });
  }
}
