import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { IamController } from './iam.controller';
import { IamService } from './iam.service';
import { User } from './entities/user.entity';
import { AuthCredential } from './entities/auth-credential.entity';
import { Branch } from '../system/entities/branch.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OwnershipGuard } from './guards/ownership.guard';
import { SysAuditModule } from '../sys-audit/sys-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthCredential, Branch]),
    SysAuditModule,
    PassportModule,
    JwtModule.register({
      // In a real configuration, use ConfigModule to pull secret from .env
      secret: process.env.JWT_SECRET || 'super-secret-key', 
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [IamController],
  providers: [IamService, JwtStrategy, OwnershipGuard],
  exports: [IamService, JwtModule, PassportModule, OwnershipGuard],
})
export class IamModule {}
