import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { SystemService } from '../../system/system.service';
import { Contract } from '../../sales/entities/contract.entity';
import { Quotation } from '../../sales/entities/quotation.entity';

@Injectable()
export class PkiService {
  constructor(
    private readonly systemService: SystemService,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
  ) {}

  async getDocuments() {
    const contracts = await this.contractRepository.find({ relations: ['quotation'] });
    const quotations = await this.quotationRepository.find();

    const contractDocs = contracts.map(c => ({
      id: c.id,
      name: c.quotation?.title || `Hợp đồng ${c.contractNumber}`,
      date: new Date(c.createdAt).toLocaleDateString('vi-VN'),
      status: c.status,
      size: '2.4 MB',
      type: 'Hợp đồng',
    }));

    const quotationDocs = quotations.filter(q => q.status === 'PENDING').map(q => ({
      id: q.id,
      name: `Báo giá: ${q.title}`,
      date: new Date(q.createdAt).toLocaleDateString('vi-VN'),
      status: 'Chờ duyệt',
      size: '1.2 MB',
      type: 'Báo giá',
    }));

    return [...contractDocs, ...quotationDocs];
  }

  async getCertificates() {
    return [
      {
        id: 'cert-1',
        issuer: 'VNPT-CA Global',
        expiresAt: '2026-12-12',
        algorithm: 'RSA-4096 / SHA-256',
        status: 'Active',
      },
    ];
  }

  async signDocument(
    documentId: string,
    documentContent: string,
  ): Promise<{ documentHash: string; signature: string; status: string }> {
    const documentHash = crypto.createHash('sha256').update(documentContent || documentId).digest('hex');
    const signature = crypto.createHmac('sha256', 'mock-ca-private-key').update(documentHash).digest('hex');

    // Update real Document Status if it's a contract
    const contract = await this.contractRepository.findOne({ 
      where: [{ id: documentId }, { contractNumber: documentId }] 
    });
    
    if (contract) {
      contract.status = 'VERIFIED'; // Mark as active after signature
      contract.documentHash = documentHash;
      await this.contractRepository.save(contract);
    }

    return {
      documentHash,
      signature,
      status: 'SIGNED_AND_VERIFIED',
    };
  }

  async verifySignature(documentContent: string, signature: string): Promise<boolean> {
    const documentHash = crypto.createHash('sha256').update(documentContent).digest('hex');
    const expectedSignature = crypto.createHmac('sha256', 'mock-ca-private-key').update(documentHash).digest('hex');

    return signature === expectedSignature;
  }

  async rejectDocument(
    documentId: string,
    reason: string,
    rejecterRole: string,
    initiatorId: string,
  ): Promise<any> {
    await this.systemService.createNotification(
      initiatorId,
      `Yêu cầu ký số bị TỪ CHỐI (${rejecterRole})`,
      `Văn bản mã số ${documentId} đã bị từ chối. Lý do: ${reason}`
    );

    return {
      documentId,
      status: 'REJECTED',
      reason,
      message: 'Thông báo từ chối đã được gửi về người khởi tạo.'
    };
  }
}
