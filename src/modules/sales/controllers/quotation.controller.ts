import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { QuotationService } from '../services/quotation.service';
import { CreateQuotationDto, UpdateQuotationStatusDto, UpdateQuotationDto } from '../dto/quotation.dto';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { Roles } from '../../iam/decorators/roles.decorator';
import { Role } from '../../iam/entities/role.enum';

@Controller('sales/quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  @Roles(Role.SALE, Role.CEO, Role.PM)
  create(@Body() createDto: CreateQuotationDto, @Req() req: any) {
    return this.quotationService.create(createDto, req.user.id);
  }

  @Get()
  @Roles(Role.SALE, Role.CEO, Role.PM, Role.CLIENT)
  findAll(@Req() req: any) {
    return this.quotationService.findAll(req.user);
  }

  @Get(':id')
  @Roles(Role.SALE, Role.CEO, Role.PM, Role.CLIENT)
  findOne(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SALE, Role.CEO, Role.PM)
  update(@Param('id') id: string, @Body() updateDto: UpdateQuotationDto, @Req() req: any) {
    return this.quotationService.update(id, updateDto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.SALE, Role.CEO, Role.PM, Role.CLIENT) // Client uses this to APPROVE
  updateStatus(@Param('id') id: string, @Body() updateDto: UpdateQuotationStatusDto, @Req() req: any) {
    return this.quotationService.updateStatus(id, updateDto, req.user);
  }
}
