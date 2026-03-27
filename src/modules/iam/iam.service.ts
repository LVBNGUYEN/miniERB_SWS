import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SecuritySetting } from './entities/security-setting.entity';
import { Branch } from '../system/entities/branch.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OwnershipValidator } from './interfaces/ownership-validator.interface';
import { SysAuditService } from '../sys-audit/sys-audit.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class IamService implements OwnershipValidator {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SecuritySetting)
    private readonly securitySettingRepository: Repository<SecuritySetting>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly jwtService: JwtService,
    private readonly sysAuditService: SysAuditService,
  ) {}

  // ──────────────────────────────────────────────
  //  Private: Generate Access + Refresh token pair
  // ──────────────────────────────────────────────
  private async generateTokens(payload: JwtPayload) {
    // Access token — uses the default secret & expiry from JwtModule (15m)
    const access_token = this.jwtService.sign(payload);

    // Refresh token — uses a DIFFERENT secret and longer expiry (7d)
    const refresh_token = this.jwtService.sign(payload, {
      secret: REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });

    return { access_token, refresh_token };
  }

  // ──────────────────────────────────────────────
  //  Private: Hash and save refresh token to DB
  // ──────────────────────────────────────────────
  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  // ──────────────────────────────────────────────
  //  Sign Up
  // ──────────────────────────────────────────────
  async signUp(signUpDto: SignUpDto) {
    const { email, password, fullName, role, branchId } = signUpDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (branchId) {
      const branch = await this.branchRepository.findOne({ where: { id: branchId } });
      if (!branch) {
        throw new NotFoundException('Branch ID does not exist in sys_branches');
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      email,
      passwordHash,
      fullName,
      role: role || 'USER',
      branchId,
      status: 'ACTIVE',
      actorType: 'HUMAN',
    });

    await this.userRepository.save(user);

    return { message: 'User registered successfully', userId: user.id };
  }

  // ──────────────────────────────────────────────
  //  Create Vendor (Admin only)
  // ──────────────────────────────────────────────
  async createVendor(adminId: string, dto: CreateVendorDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Sinh mật khẩu ngẫu nhiên (dùng crypto.randomBytes để đảm bảo an toàn)
    const rawPassword = crypto.randomBytes(6).toString('base64url').slice(0, 8);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = this.userRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      passwordHash,
      role: 'VENDOR',
      skills: dto.skills,
      hourlyRate: dto.hourlyRate,
      actorType: 'HUMAN',
      status: 'ACTIVE',
    });

    await this.userRepository.save(user);

    // Ghi Audit
    await this.sysAuditService.createLog({
      userId: adminId,
      action: 'CREATE',
      tableName: 'iam_users',
      recordId: user.id,
      oldValue: null,
      newValue: { email: user.email, role: user.role, hourlyRate: user.hourlyRate },
      actorType: 'HUMAN',
    });

    return {
      message: 'Vendor created successfully',
      vendorId: user.id,
      // Note: temporaryPassword is NOT returned in the response for security.
      // Deliver via email/notification system.
    };
  }

  // ──────────────────────────────────────────────
  //  Sign In — returns access_token + refresh_token
  //  • Lockout after 5 failed attempts (15 min)
  //  • Audit logged on success and failure
  //  • FE routing: use `user.role` to redirect:
  //      CEO           → /admin
  //      BRANCH_PM     → /pm
  //      VENDOR        → /vendor
  // ──────────────────────────────────────────────
  async signIn(signInDto: SignInDto) {
    const { email, password } = signInDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is blocked/inactive');
    }

    // ——— Lockout check ———
    // Wrap in new Date() to normalize in case ORM returns a string (e.g. SQLite)
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
      );
    }

    // ——— Password validation ———
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const newAttempts = (user.loginAttempts ?? 0) + 1;
      const updates: Partial<User> = { loginAttempts: newAttempts };

      if (newAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        updates.loginAttempts = 0; // reset counter so next window starts fresh
      }

      await this.userRepository.update(user.id, updates);

      // Audit: failed login (note: if lockout triggered, loginAttempts was reset to 0 in DB)
      await this.sysAuditService.createLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        tableName: 'iam_users',
        recordId: user.id,
        oldValue: null,
        newValue: {
          email: user.email,
          attempt: newAttempts >= 5 ? 'LOCKOUT_TRIGGERED' : newAttempts,
        },
        actorType: 'HUMAN',
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // ——— Success: reset lockout counters ———
    await this.userRepository.update(user.id, { loginAttempts: 0, lockedUntil: null });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    // Audit: successful login
    await this.sysAuditService.createLog({
      userId: user.id,
      action: 'LOGIN',
      tableName: 'iam_users',
      recordId: user.id,
      oldValue: null,
      newValue: { email: user.email, role: user.role },
      actorType: 'HUMAN',
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
      },
    };
  }

  // ──────────────────────────────────────────────
  //  Refresh Tokens — Rotation strategy
  // ──────────────────────────────────────────────
  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    // 1. Verify the refresh token signature & expiry
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refresh_token, {
        secret: REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // 2. Find user in DB
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access denied');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User is blocked/inactive');
    }

    // 3. Compare refresh token with stored hash
    const isTokenValid = await bcrypt.compare(refresh_token, user.refreshTokenHash);
    if (!isTokenValid) {
      // Possible token reuse attack — revoke all tokens for safety
      await this.userRepository.update(user.id, { refreshTokenHash: null });
      throw new ForbiddenException('Refresh token reuse detected. All sessions revoked.');
    }

    // 4. Issue new token pair (rotation)
    const newPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const tokens = await this.generateTokens(newPayload);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // ──────────────────────────────────────────────
  //  Logout — invalidate refresh token
  // ──────────────────────────────────────────────
  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshTokenHash: null });
    return { message: 'Logged out successfully' };
  }

  // ──────────────────────────────────────────────
  //  FIDO2 (unchanged placeholders)
  // ──────────────────────────────────────────────
  async generateFido2Options(email: string) {
    return { challenge: 'MOCK_CHALLENGE_STRING', rp: { name: 'Mini-ERP' } };
  }

  async verifyFido2(email: string, signatureValue: string) {
    return { message: 'FIDO2 Verification successful (Mocked)', user: email };
  }

  // ──────────────────────────────────────────────
  //  Profile
  // ──────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  // ──────────────────────────────────────────────
  //  Ownership Validation Demo
  // ──────────────────────────────────────────────
  async verifyOwnership(resourceId: string, userId: string, branchId?: string): Promise<boolean> {
    // For this demo: a user "owns" their own user resource.
    // In a real project, this would check if (project.createdBy === userId) etc.
    return resourceId === userId;
  }

  async findAllUsers() {
    return this.userRepository.find({
      select: ['id', 'email', 'fullName', 'role', 'status'],
      order: { fullName: 'ASC' }
    });
  }

  async findPms() {
    return this.userRepository.find({
      where: { role: 'PM' },
      select: ['id', 'email', 'fullName'],
      order: { fullName: 'ASC' }
    });
  }

  async getSecuritySettings(): Promise<SecuritySetting> {
    let setting = await this.securitySettingRepository.findOne({ where: {} });
    if (!setting) {
      setting = this.securitySettingRepository.create({
        mfaEnabled: true,
        ipWhitelisting: '127.0.0.1, 192.168.1.1',
        sessionTimeout: 12,
        apiKeyActive: true,
      });
      await this.securitySettingRepository.save(setting);
    }
    return setting;
  }

  async updateSecuritySettings(updateData: Partial<SecuritySetting>): Promise<SecuritySetting> {
    const setting = await this.getSecuritySettings();
    Object.assign(setting, updateData);
    return this.securitySettingRepository.save(setting);
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.status = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    return this.userRepository.save(user);
  }

  async resetUserPassword(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const defaultPasswordHash = await bcrypt.hash('reset123456', 10);
    user.passwordHash = defaultPasswordHash;
    await this.userRepository.save(user);
    return { message: 'Password has been reset to reset123456' };
  }
}
