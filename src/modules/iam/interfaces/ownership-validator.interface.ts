export interface OwnershipValidator {
  /**
   * Verified if a specific resource is owned by the current user
   * @param resourceId The ID of the resource being requested
   * @param userId The ID of the current authenticated user
   * @param branchId The branch ID the user belongs to (optional, depending on entity scope)
   * @returns true if user has permission, false otherwise
   */
  verifyOwnership(resourceId: string, userId: string, branchId?: string): Promise<boolean>;
}
