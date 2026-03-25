import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PkiService {
  /**
   * Mock of a PKI CA Digital Signature (Flow 1)
   * In a real ERP, this would call VNPT CA, Viettel CA, etc. API to sign the document hash
   */
  async signDocument(documentContent: string): Promise<{ documentHash: string; signature: string; status: string }> {
    // 1. Hash the document
    const documentHash = crypto.createHash('sha256').update(documentContent).digest('hex');
    
    // 2. Mock PKI Signature (using a fake private key logic)
    const signature = crypto.createHmac('sha256', 'mock-ca-private-key').update(documentHash).digest('hex');

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
}
