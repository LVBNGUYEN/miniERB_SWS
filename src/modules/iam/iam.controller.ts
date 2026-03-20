import { Controller, Post, Body, Get, UseGuards, Param } from '@nestjs/common';
import { IamService } from './iam.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './entities/role.enum';
import { CurrentUser } from './decorators/current-user.decorator';
import { OwnershipGuard } from './guards/ownership.guard';
import { RequireOwnership } from './decorators/require-ownership.decorator';

@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.iamService.signUp(signUpDto);
  }

  @Post('sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.iamService.signIn(signInDto);
  }

  // ── Refresh Token (public — no JWT guard, uses refresh_token in body) ──
  @Post('auth/refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.iamService.refreshTokens(refreshTokenDto);
  }

  // ── Logout (protected — requires valid access token) ──
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

  // Protected route — any authenticated user
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.iamService.getProfile(user.userId);
  }

  // Protected route — Role Based Access Control (RBAC)
  @Roles(Role.GLOBAL_ADMIN, Role.BRANCH_PM)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin-board')
  getAdminBoard() {
    return { message: 'Welcome to the admin board' };
  }

  // ── IDOR Test Endpoint ──
  // Any user can try to access this, but OwnershipGuard will block them 
  // if they try to access an ID that isn't their own.
  @UseGuards(JwtAuthGuard, OwnershipGuard)
  @RequireOwnership(IamService)
  @Get('user/:id')
  async getUserById(@Param('id') id: string) {
    return this.iamService.getProfile(id);
  }
}
