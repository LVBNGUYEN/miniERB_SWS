import { Controller, Post, Param, Body, ParseUUIDPipe, UseGuards, UseInterceptors, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import { ContractService } from '../services/contract.service';
import { Audit } from '../../sys-audit/decorators/audit.decorator';
import { AuditInterceptor } from '../../sys-audit/interceptors/audit.interceptor';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly contractService: ContractService) {}

  @Post('quotations/:id/sign')
  @Roles(Role.CEO, Role.SALE)
  @UseInterceptors(AuditInterceptor)
  @Audit('sls_contracts', 'SIGN_QUOTATION_AND_INIT_PROJECT')
  @ApiOperation({ summary: 'Initiate 3-layer signature flow (SALE or CEO as Initiator)' })
  async signQuotationAndCreateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    const signerId = user.id || user.userId || user.sub;
    return this.contractService.signQuotationAndCreateContract(id, signerId);
  }

  @Get('contracts')
  @Roles(Role.CEO, Role.PM, Role.SALE, Role.CLIENT)
  @ApiOperation({ summary: 'List all contracts (Filtered by role)' })
  async listContracts(@CurrentUser() user: any) {
    return this.contractService.findAllContracts(user);
  }

  @Get('contracts/stats')
  @Roles(Role.CEO, Role.PM, Role.SALE)
  @ApiOperation({ summary: 'Get contract statistics' })
  async getStats() {
    return this.contractService.getContractStats();
  }

  @Get('contracts/:id/milestones')
  @Roles(Role.CEO, Role.PM, Role.SALE)
  @ApiOperation({ summary: 'Lấy danh sách các mốc giai đoạn (Milestones) của hợp đồng' })
  async getMilestones(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.getMilestones(id);
  }

  @Patch('contracts/milestones/:id')
  @Roles(Role.CEO, Role.SALE)
  @ApiOperation({ summary: 'Cập nhật trạng thái mốc giai đoạn (Milestones)' })
  async updateMilestone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string
  ) {
    return this.contractService.updateMilestoneStatus(id, status);
  }
  @Post('contracts')
  @Roles(Role.CEO, Role.SALE)
  @UseInterceptors(AuditInterceptor)
  @Audit('sls_contracts', 'CREATE_CONTRACT_MANUAL')
  @ApiOperation({ summary: 'Tạo hợp đồng thủ công (không qua quy trình báo giá)' })
  async createContract(@Body() data: any) {
    return this.contractService.createContract(data);
  }
}
