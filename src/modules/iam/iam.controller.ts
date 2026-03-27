import { Controller, Post, Body, Get, UseGuards, Param, Patch, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IamService } from './iam.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './entities/role.enum';
import { CurrentUser } from './decorators/current-user.decorator';
import { OwnershipGuard } from './guards/ownership.guard';
import { RequireOwnership } from './decorators/require-ownership.decorator';
import { Audit } from '../sys-audit/decorators/audit.decorator';
import { AuditInterceptor } from '../sys-audit/interceptors/audit.interceptor';

@ApiTags('IAM')
@UseInterceptors(AuditInterceptor)
@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) { }

  @Audit('iam_users', 'CREATE_USER')
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.iamService.signUp(signUpDto);
  }

  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.iamService.signIn(signInDto);
  }

  // ── Create Vendor (Admin Only) ──
  @ApiBearerAuth()
  @Roles(Role.GLOBAL_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('vendor')
  async createVendor(@CurrentUser() user: any, @Body() createVendorDto: CreateVendorDto) {
    return this.iamService.createVendor(user.userId, createVendorDto);
  }

  // ── Refresh Token (public) ──
  @Post('auth/refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.iamService.refreshTokens(refreshTokenDto);
  }

  // ── Logout ──
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout(@CurrentUser() user: any) {
    return this.iamService.logout(user.userId);
  }

  @Post('auth/fido2/generate-options')
  async fido2Generate(@Body('email') email: string) {
    return this.iamService.generateFido2Options(email);
  }

  @Post('auth/fido2/verify')
  async fido2Verify(@Body('email') email: string, @Body('signatureValue') signatureValue: string) {
    return this.iamService.verifyFido2(email, signatureValue);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.iamService.getProfile(user.userId);
  }

  @ApiBearerAuth()
  @Roles(Role.CEO, Role.PM)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin-board')
  getAdminBoard() {
    return { message: 'Welcome to the admin board' };
  }

  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @RequireOwnership(IamService)
  @Get('user/:id')
  async getUserById(@Param('id') id: string) {
    return this.iamService.getProfile(id);
  }

  @ApiBearerAuth()
  @Roles(Role.CEO, Role.PM, Role.SALE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('pm-list')
  async listPms() {
    return this.iamService.findPms();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users')
  async findAll() {
    return this.iamService.findAllUsers();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cấu hình bảo mật hệ thống (Admin only)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('settings')
  async getSettings() {
    return this.iamService.getSecuritySettings();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình bảo mật hệ thống (Admin only)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Audit('iam_settings', 'UPDATE_SECURITY_SETTINGS')
  @Patch('settings')
  async updateSettings(@Body() updateData: any) {
    return this.iamService.updateSecuritySettings(updateData);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khóa hoặc mở khóa người dùng (Admin only)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Audit('iam_users', 'TOGGLE_USER_STATUS')
  @Patch('user/:id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    return this.iamService.toggleUserStatus(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset mật khẩu người dùng về mặc định (Admin only)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Audit('iam_users', 'RESET_PASSWORD')
  @Post('user/:id/reset-password')
  async resetPassword(@Param('id') id: string) {
    return this.iamService.resetUserPassword(id);
  }
}
