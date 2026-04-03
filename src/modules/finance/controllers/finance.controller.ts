import { Controller, Post, Get, Body, Param, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { PnLService } from '../services/pnl.service';
import { CreateInvoiceDto, RegisterPaymentDto } from '../dto/invoice-payment.dto';

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
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Create an invoice for a project (Flow 10)' })
  async createInvoice(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.createInvoice(projectId, dto.amount);
  }

  @Post('payments/:invoiceId')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Register a client payment (Flow 11)' })
  async registerPayment(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.paymentService.registerClientPayment(invoiceId, dto.amount, dto.reference);
  }

  @Get('pnl/:projectId')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Calculate Project P&L using Strategy Pattern (Flow 12)' })
  async getPnL(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.pnlService.calculateProjectPNL(projectId);
  }

  @Get('vendor-report')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Get summary of all vendor debts with SQL aggregation' })
  async getVendorReport() {
    return this.paymentService.getVendorDebtSummary();
  }

  @Get('report/pnl')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Get multi-project P&L report (Flow 14)' })
  async getPnLReport() {
    return this.pnlService.calculateAllProjectsPNL();
  }

  @Post('vendor-debt/:debtId/pay')
  @Roles(Role.CEO, Role.PM)
  @ApiOperation({ summary: 'Pay a vendor debt (Flow 13)' })
  async payVendorDebt(@Param('debtId', ParseUUIDPipe) debtId: string) {
    return this.paymentService.payVendorDebt(debtId);
  }

  @Get('invoices/:projectId')
  @Roles(Role.CEO, Role.PM, Role.CLIENT)
  @ApiOperation({ summary: 'Get invoices for a project with ownership check' })
  async getInvoices(@Param('projectId', ParseUUIDPipe) projectId: string, @Req() req: any) {
    return this.invoiceService.findByProject(projectId, req.user);
  }

  @Post('invoices/:invoiceId/pay')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Client pay and sign invoice with PKI (Flow 11)' })
  async payInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: RegisterPaymentDto,
  ) {
    return this.invoiceService.payInvoice(invoiceId, dto.signature || dto.reference);
  }

  @Get('earnings/my')
  @Roles(Role.VENDOR)
  @ApiOperation({ summary: 'Get current vendor earnings summary (Flow 13)' })
  async getMyEarnings(@Req() req: any) {
    return this.paymentService.getVendorEarnings(req.user.id);
  }
}
