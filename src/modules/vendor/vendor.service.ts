import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../iam/entities/user.entity';
import { SysAuditService } from '../sys-audit/sys-audit.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly sysAuditService: SysAuditService,
  ) {}

  async getVendorDetails(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, role: 'VENDOR' },
      select: ['id', 'email', 'fullName', 'skills', 'hourlyRate', 'scorecard', 'status'],
    });

    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    return user;
  }

  async updateVendor(adminOrPmId: string, id: string, dto: UpdateVendorDto) {
    const user = await this.userRepository.findOne({ where: { id, role: 'VENDOR' } });

    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    const updates: Partial<User> = {};
    let isChanged = false;

    // We keep track of oldValue vs newValue for Audit Log
    const oldValue: any = {};
    const newValue: any = {};

    if (dto.hourlyRate !== undefined) {
      // TypeORM returns decimal columns as strings to preserve precision.
      // Cast to Number for strict equality check.
      if (Number(dto.hourlyRate) !== Number(user.hourlyRate)) {
        oldValue.hourlyRate = user.hourlyRate;
        newValue.hourlyRate = dto.hourlyRate;
        updates.hourlyRate = dto.hourlyRate;
        isChanged = true;
      }
    }

    if (dto.scorecard !== undefined) {
      // Basic JSON compare
      const oldScoreStr = JSON.stringify(user.scorecard);
      const newScoreStr = JSON.stringify(dto.scorecard);
      if (oldScoreStr !== newScoreStr) {
        oldValue.scorecard = user.scorecard;
        newValue.scorecard = dto.scorecard;
        updates.scorecard = dto.scorecard;
        isChanged = true;
      }
    }

    if (isChanged) {
      await this.userRepository.update(id, updates);

      await this.sysAuditService.createLog({
        userId: adminOrPmId,
        action: 'UPDATE_VENDOR_PROFILE',
        tableName: 'iam_users',
        recordId: id,
        oldValue,
        newValue,
        actorType: 'HUMAN',
      });
    }

    return this.getVendorDetails(id);
  }
}
