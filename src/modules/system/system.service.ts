import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
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
}
