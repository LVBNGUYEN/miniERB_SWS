import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit_metadata';

export interface AuditMetadata {
  tableName: string;
  action: string;
}

export const Audit = (tableName: string, action: string) =>
  SetMetadata(AUDIT_METADATA_KEY, { tableName, action });
