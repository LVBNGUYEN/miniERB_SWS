import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Type,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleRef } from '@nestjs/core';
import { REQUIRE_OWNERSHIP_KEY } from '../decorators/require-ownership.decorator';
import { OwnershipValidator } from '../interfaces/ownership-validator.interface';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const validatorClass = this.reflector.get<Type<OwnershipValidator>>(
      REQUIRE_OWNERSHIP_KEY,
      context.getHandler(),
    );

    // If there's no validator class specified, assume ownership check is not needed
    if (!validatorClass) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id; // Normally the ID is in the route params

    // Require both user and resource ID to perform an ownership check
    if (!user || !user.userId) { 
        throw new ForbiddenException('User context missing for ownership check.');
    }

    // --- ADMINISTRATIVE OVERRIDE ---
    // If the user is a GLOBAL_ADMIN, they can bypass ownership checks
    if (user.role === 'GLOBAL_ADMIN') {
        return true;
    }

    if (!resourceId) {
        throw new ForbiddenException('Resource ID missing for ownership check.');
    }

    // Retrieve the validator service instance from the DI container.
    // Use { strict: false } to allow resolving services from other modules.
    let validatorService: OwnershipValidator;
    try {
      validatorService = this.moduleRef.get(validatorClass, { strict: false });
    } catch (e) {
       console.error(`Failed to resolve ownership validator: ${validatorClass.name}`, e);
       throw new ForbiddenException('Configuration error: Ownership validation service not found.');
    }

    // Perform the actual validation
    const hasOwnership = await validatorService.verifyOwnership(
      resourceId,
      user.userId,
      user.branchId
    );

    if (!hasOwnership) {
      throw new ForbiddenException('You do not have permission to access or modify this resource.');
    }

    return true;
  }
}
