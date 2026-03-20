import { SetMetadata, Type } from '@nestjs/common';
import { OwnershipValidator } from '../interfaces/ownership-validator.interface';

export const REQUIRE_OWNERSHIP_KEY = 'require_ownership';

/**
 * Decorator to specify the service that will validate ownership for this route.
 * @param validatorClass The service class (which must implement OwnershipValidator)
 */
export const RequireOwnership = (validatorClass: Type<OwnershipValidator>) => 
  SetMetadata(REQUIRE_OWNERSHIP_KEY, validatorClass);
