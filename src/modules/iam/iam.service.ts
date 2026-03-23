import { Injectable, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Branch } from '../system/entities/branch.entity';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { OwnershipValidator } from './interfaces/ownership-validator.interface';
import * as bcrypt from 'bcrypt';

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';
const REFRESH_TOKEN_EXPIRY = '7d';

@Injectable()
export class IamService implements OwnershipValidator {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly jwtService: JwtService,
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
  //  Sign In — returns access_token + refresh_token
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const tokens = await this.generateTokens(payload);

    // Save hashed refresh token to DB
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

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
      select: ['id', 'email', 'fullName', 'role'],
      order: { fullName: 'ASC' }
    });
  }

  async findPms() {
    return this.userRepository.find({
      where: { role: 'BRANCH_PM' },
      select: ['id', 'email', 'fullName'],
      order: { fullName: 'ASC' }
    });
  }
}
