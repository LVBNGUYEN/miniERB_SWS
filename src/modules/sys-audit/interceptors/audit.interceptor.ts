import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SysAuditService } from '../sys-audit.service';
import { AUDIT_METADATA_KEY, AuditMetadata } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private readonly auditService: SysAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { user, body, params, method } = request;

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const action = auditMetadata.action || method;
          const tableName = auditMetadata.tableName;
          
          // Identify recordId from response if possible, or params
          const recordId = response?.id || params?.id;

          await this.auditService.createLog({
            userId: user?.id,
            action,
            tableName,
            recordId,
            newValue: body,
            // For complex Audit, we could fetch old values here but it requires DB access per entity
          });
        } catch (error) {
          console.error('Audit Log Error:', error);
        }
      }),
    );
  }
}
