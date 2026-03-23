import { Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { PnLService } from '../services/pnl.service';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
    private readonly pnlService: PnLService,
  ) {}

  @Post('invoices/:projectId')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @ApiOperation({ summary: 'Create an invoice for a project (Flow 10)' })
  async createInvoice(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body('amount') amount: number,
  ) {
    return this.invoiceService.createInvoice(projectId, amount);
  }

  @Post('payments/:invoiceId')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @ApiOperation({ summary: 'Register a client payment (Flow 11)' })
  async registerPayment(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body('amount') amount: number,
    @Body('reference') reference: string,
  ) {
    return this.paymentService.registerClientPayment(invoiceId, amount, reference);
  }

  @Get('pnl/:projectId')
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @ApiOperation({ summary: 'Calculate Project P&L using Strategy Pattern (Flow 12)' })
  async getPnL(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.pnlService.calculateProjectPNL(projectId);
  }
}
