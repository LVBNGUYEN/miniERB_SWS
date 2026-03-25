import { Controller, Post, Param, ParseUUIDPipe, UseGuards, UseInterceptors, Get } from '@nestjs/common';
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
  @Roles(Role.GLOBAL_ADMIN, Role.SALE)
  @UseInterceptors(AuditInterceptor)
  @Audit('sls_contracts', 'SIGN_QUOTATION_AND_INIT_PROJECT')
  @ApiOperation({ summary: 'Sign quotation with PKI and Init Project (Flow 1 & 2)' })
  async signQuotationAndCreateContract(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any
  ) {
    const signerId = user.id || user.userId || user.sub;
    return this.contractService.signQuotationAndCreateContract(id, signerId);
  }

  @Get('contracts')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM, Role.SALE)
  @ApiOperation({ summary: 'List all contracts' })
  async listContracts() {
    return this.contractService.findAllContracts();
  }

  @Get('contracts/stats')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM, Role.SALE)
  @ApiOperation({ summary: 'Get contract statistics' })
  async getStats() {
    return this.contractService.getContractStats();
  }
}
