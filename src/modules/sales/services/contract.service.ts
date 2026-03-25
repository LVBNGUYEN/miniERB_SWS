import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Contract } from '../entities/contract.entity';
import { Quotation } from '../entities/quotation.entity';
import { PkiService } from '../../pki/services/pki.service';
import { ProjectService } from '../../project/services/project.service';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
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

      if (!quotation) {
        throw new NotFoundException('Quotation not found');
      }

      if (quotation.status === 'APPROVED') {
        throw new BadRequestException('Quotation is already signed/approved');
      }

      // 1. Mark quotation as approved
      quotation.status = 'APPROVED';
      await queryRunner.manager.save(quotation);

      // 2. Mock PKI Signature Flow
      const documentContent = JSON.stringify({
        title: quotation.title,
        amount: quotation.totalAmount,
        client: quotation.clientId,
        pm: quotation.pmId,
        timestamp: Date.now(),
      });
      
      const { documentHash, status: pkiStatus } = await this.pkiService.signDocument(documentContent);

      // 3. Create Contract
      const contract = queryRunner.manager.create(Contract, {
        quotationId: quotation.id,
        contractNumber: `CT-${Date.now()}`,
        documentHash: documentHash,
        status: pkiStatus, // e.g. 'SIGNED_AND_VERIFIED'
        fileUrl: `/uploads/contracts/CT-${Date.now()}.pdf`,
      });
      await queryRunner.manager.save(contract);

      // 4. Trigger Flow 2: Initialize Project Auto
      // We pass the transaction manager to ensure atomic operations
      const project = await this.projectService.initializeProjectFromContract(
        contract.id, 
        quotation, 
        queryRunner.manager
      );

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
}
