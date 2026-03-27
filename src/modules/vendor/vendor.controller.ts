import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../iam/guards/jwt-auth.guard';
import { RolesGuard } from '../iam/guards/roles.guard';
import { Roles } from '../iam/decorators/roles.decorator';
import { Role } from '../iam/entities/role.enum';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('vendors')
@Controller('vendor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorController {
  constructor(private readonly vendorService: VendorService) { }

  @Get(':id')
  @Roles(Role.CEO, Role.PM)
  async getVendorDetails(@Param('id') id: string) {
    return this.vendorService.getVendorDetails(id);
  }

  @Patch(':id')
  @Roles(Role.CEO, Role.PM)
  async updateVendor(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorService.updateVendor(user.userId, id, dto);
  }
}
