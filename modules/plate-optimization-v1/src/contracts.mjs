export const PLATE_OPTIMIZATION_CONTRACT_VERSION = '1.0.0-alpha.1';

export function createPurchasePlan({
  status = 'not-evaluated',
  newBoardsToPurchase = null,
  warnings = [],
  requiresOwnerApproval = true
} = {}) {
  if (status === 'not-evaluated' && newBoardsToPurchase !== null) {
    throw new Error('newBoardsToPurchase must remain null until purchase planning is evaluated');
  }
  if (newBoardsToPurchase !== null && (!Number.isInteger(newBoardsToPurchase) || newBoardsToPurchase < 0)) {
    throw new RangeError('newBoardsToPurchase must be null or a non-negative integer');
  }

  return {
    contract: 'PurchasePlan',
    contractVersion: PLATE_OPTIMIZATION_CONTRACT_VERSION,
    status,
    newBoardsToPurchase,
    warnings: [...warnings],
    requiresOwnerApproval: Boolean(requiresOwnerApproval)
  };
}

export function createOptimizationResult({
  status = 'blocked',
  materialGroups = [],
  physicalBoardCount = null,
  boards = [],
  warnings = [],
  validation = {}
} = {}) {
  if (physicalBoardCount !== null && (!Number.isInteger(physicalBoardCount) || physicalBoardCount < 0)) {
    throw new RangeError('physicalBoardCount must be null or a non-negative integer');
  }

  const normalizedValidation = {
    complete: validation.complete === true,
    geometryValid: validation.geometryValid === true,
    panelCutFeasible: validation.panelCutFeasible === true,
    materialGroupsValid: validation.materialGroupsValid === true
  };

  const safeForTestDisplay = Object.values(normalizedValidation).every(Boolean);

  return {
    contract: 'PlateOptimizationResult',
    contractVersion: PLATE_OPTIMIZATION_CONTRACT_VERSION,
    status: safeForTestDisplay ? status : 'blocked',
    materialGroups: [...materialGroups],
    physicalBoardCount,
    boards: [...boards],
    purchasePlan: createPurchasePlan(),
    warnings: [...warnings],
    validation: normalizedValidation,
    safeForTestDisplay,
    automaticPurchasingAllowed: false
  };
}