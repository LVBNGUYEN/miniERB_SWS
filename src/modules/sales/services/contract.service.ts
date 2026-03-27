import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Contract } from '../entities/contract.entity';
import { Quotation } from '../entities/quotation.entity';
import { ContractMilestone } from '../entities/contract-milestone.entity';
import { PkiService } from '../../pki/services/pki.service';
import { ProjectService } from '../../project/services/project.service';
import { User } from '../../iam/entities/user.entity';
@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
    @InjectRepository(ContractMilestone)
    private readonly milestoneRepository: Repository<ContractMilestone>,
    private readonly pkiService: PkiService,
    private readonly projectService: ProjectService,
    private readonly dataSource: DataSource,
  ) {}

  async signQuotationAndCreateContract(quotationId: string, signerId: string): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quotation = await queryRunner.manager.findOne(Quotation, {
        where: { id: quotationId },
      });
      const signer = await queryRunner.manager.findOne(User, { where: { id: signerId } });

      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (quotation.status === 'APPROVED') {
        throw new BadRequestException('Báo giá này đã được thực hiện.');
      }

      // 1. Mark quotation as processing
      quotation.status = 'APPROVED';
      await queryRunner.manager.save(quotation);

      // 2. Base Document Info
      const documentContent = JSON.stringify({
        title: quotation.title,
        amount: quotation.totalAmount,
        client: quotation.clientId,
        pm: quotation.pmId,
        initiator: signerId,
        timestamp: Date.now(),
      });
      
      // 3. Create Contract Object
      const contract = queryRunner.manager.create(Contract, {
        quotationId: quotation.id,
        contractNumber: `CT-${Date.now()}`,
        status: 'PENDING_INIT', // Initial status
        fileUrl: `/uploads/contracts/CT-${Date.now()}.pdf`,
        documentHash: '0xPENDING',
      });
      await queryRunner.manager.save(contract);

      // 4. PKI Signature Logic (Only for CEO/PM/CLIENT)
      // Rule: SALE requests but doesn't sign.
      if (signer?.role === 'SALE') {
        contract.status = 'WAITING_FOR_PM_SIGN'; // Moves to step 2: PM
        contract.documentHash = '0xREQUESTED_BY_SALE';
        await queryRunner.manager.save(contract);
      } else if (signer?.role === 'CEO' || signer?.role === 'PM') {
        // CEO/PM can sign step 1 directly
        const { documentHash, status: pkiStatus } = await this.pkiService.signDocument(contract.contractNumber, documentContent);
        contract.documentHash = documentHash;
        contract.status = pkiStatus === 'VERIFIED' ? 'WAITING_FOR_CLIENT_SIGN' : pkiStatus; // Move to step 2/3
        await queryRunner.manager.save(contract);
      }

      // 5. Trigger Flow 2: Initialize Project Auto
      const project = await this.projectService.initializeProjectFromContract(
        contract.id, 
        quotation, 
        queryRunner.manager
      );

      // 6. Create default milestones (Flow 26 logic)
      const milestonesData = [
        { name: 'Ký kết & Tạm ứng', amount: Number(quotation.totalAmount) * 0.3, order: 1, status: 'PAID' },
        { name: 'Hoàn thành Giai đoạn 1', amount: Number(quotation.totalAmount) * 0.4, order: 2, status: 'PENDING' },
        { name: 'Nghiệm thu & Bàn giao', amount: Number(quotation.totalAmount) * 0.3, order: 3, status: 'PENDING' },
      ];

      for (const mData of milestonesData) {
        const milestone = queryRunner.manager.create(ContractMilestone, {
          contractId: contract.id,
          ...mData,
        });
        await queryRunner.manager.save(milestone);
      }

      await queryRunner.commitTransaction();
      return { 
        ...contract, 
        projectId: project.id 
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMilestones(contractId: string): Promise<ContractMilestone[]> {
    return this.milestoneRepository.find({
      where: { contractId },
      order: { order: 'ASC' },
    });
  }

  async updateMilestoneStatus(milestoneId: string, status: string): Promise<ContractMilestone> {
    const milestone = await this.milestoneRepository.findOne({ where: { id: milestoneId } });
    if (!milestone) throw new NotFoundException('Milestone not found');
    milestone.status = status;
    if (status === 'COMPLETED') milestone.completedAt = new Date();
    return this.milestoneRepository.save(milestone);
  }

  async findAllContracts(): Promise<Contract[]> {
    return this.contractRepository.find({
      relations: ['quotation', 'quotation.client'],
      order: { createdAt: 'DESC' },
    });
  }

  async getContractStats(): Promise<any> {
    const contracts = await this.contractRepository.find({
      relations: ['quotation'],
    });
    const quotations = await this.quotationRepository.find();

    const totalValue = contracts.reduce((sum, c) => sum + Number(c.quotation.totalAmount), 0);
    const activeCount = contracts.filter(c => c.status === 'VERIFIED').length;
    const expiringCount = 5; // Placeholder for now
    const draftCount = quotations.filter(q => q.status === 'DRAFT').length;

    return {
      totalValue,
      activeCount,
      expiringCount,
      draftCount,
    };
  }

  async createContract(data: any): Promise<Contract> {
    const contract = this.contractRepository.create(data as Partial<Contract>);
    if (!contract.contractNumber) contract.contractNumber = `CT-${Date.now()}`;
    if (!contract.status) contract.status = 'PENDING_INIT';
    return this.contractRepository.save(contract);
  }
}
