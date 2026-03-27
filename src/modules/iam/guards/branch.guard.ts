import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../entities/role.enum';

@Injectable()
export class BranchGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin can see everything
    if (user.role === Role.CEO) {
      return true;
    }

    // For others, check if the resource being accessed belongs to their branch
    // This assumes the resource/query has a branchId or the route implies it
    const { params, query, body } = request;
    const resourceBranchId = params.branchId || query.branchId || body.branchId;

    if (resourceBranchId && resourceBranchId !== user.branchId) {
      throw new ForbiddenException('You do not have access to this branch data');
    }

    return true;
  }
}
