import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Notification } from './entities/notification.entity';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async createBranch(createBranchDto: CreateBranchDto) {
    const { code, name, currency, timezone } = createBranchDto;
    
    const existing = await this.branchRepository.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Branch with code ${code} already exists`);
    }

    const branch = this.branchRepository.create({
      code,
      name,
      currency,
      timezone,
    });

    return this.branchRepository.save(branch);
  }

  async getAllBranches() {
    return this.branchRepository.find();
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20
    });
  }

  async markNotificationRead(id: string) {
    const notif = await this.notificationRepository.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Notification not found');
    notif.isRead = true;
    return this.notificationRepository.save(notif);
  }

  async createNotification(userId: string, title: string, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }
}
