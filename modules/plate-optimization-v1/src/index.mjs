import { createOptimizationResult } from './contracts.mjs';

const DEFAULT_BOARD = Object.freeze({
  commercialWidthMm: 2800,
  commercialHeightMm: 2070,
  workingWidthMm: 2770,
  workingHeightMm: 2040,
  kerfMm: 4.4,
  maxElementDimensionMm: 2770
});

function finitePositive(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new RangeError(`${field} must be a positive finite number`);
  }
  return number;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function materialKey(element) {
  return [
    normalizeText(element.materialCode),
    normalizeText(element.decorCode),
    finitePositive(element.thicknessMm, 'thicknessMm')
  ].join('::');
}

export function validateAndGroupElements(elements, boardConfig = {}) {
  if (!Array.isArray(elements) || elements.length === 0) {
    throw new TypeError('elements must be a non-empty array');
  }

  const board = { ...DEFAULT_BOARD, ...boardConfig };
  const groups = new Map();
  const warnings = [];

  for (const [index, source] of elements.entries()) {
    const row = index + 1;
    const lengthMm = finitePositive(source.lengthMm, `element ${row}.lengthMm`);
    const widthMm = finitePositive(source.widthMm, `element ${row}.widthMm`);
    const quantity = finitePositive(source.quantity ?? 1, `element ${row}.quantity`);

    if (!Number.isInteger(quantity)) {
      throw new RangeError(`element ${row}.quantity must be an integer`);
    }

    const materialCode = normalizeText(source.materialCode);
    const decorCode = normalizeText(source.decorCode);
    if (!materialCode || !decorCode) {
      throw new Error(`element ${row} must contain materialCode and decorCode`);
    }

    const rotationAllowed = source.rotationAllowed === true;
    const fitsNormally = lengthMm <= board.workingWidthMm && widthMm <= board.workingHeightMm;
    const fitsRotated = rotationAllowed && widthMm <= board.workingWidthMm && lengthMm <= board.workingHeightMm;
    if (!fitsNormally && !fitsRotated) {
      throw new RangeError(`element ${row} does not fit the working field`);
    }
    if (Math.max(lengthMm, widthMm) > board.maxElementDimensionMm) {
      throw new RangeError(`element ${row} exceeds maximum element dimension`);
    }

    const element = {
      id: source.id ?? `row-${row}`,
      orderId: normalizeText(source.orderId),
      materialCode,
      decorCode,
      thicknessMm: finitePositive(source.thicknessMm, `element ${row}.thicknessMm`),
      lengthMm,
      widthMm,
      quantity,
      rotationAllowed,
      edges: { ...(source.edges ?? {}) }
    };

    // PCV is preserved as technological metadata only. Dimensions are never reduced here.
    const key = materialKey(element);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(element);
  }

  return {
    board,
    groups: [...groups.entries()].map(([key, groupedElements]) => ({ key, elements: groupedElements })),
    warnings
  };
}

export function estimatePlateRequirement(elements, boardConfig = {}) {
  const prepared = validateAndGroupElements(elements, boardConfig);

  return createOptimizationResult({
    status: 'awaiting-optimizer',
    materialGroups: prepared.groups.map((group) => ({
      key: group.key,
      elementRows: group.elements.length,
      expandedPieceCount: group.elements.reduce((sum, element) => sum + element.quantity, 0)
    })),
    physicalBoardCount: null,
    boards: [],
    warnings: [
      ...prepared.warnings,
      'Geometry optimizer is not implemented yet.',
      'Automatic purchasing remains blocked.'
    ],
    validation: {
      complete: false,
      geometryValid: false,
      panelCutFeasible: false,
      materialGroupsValid: true
    }
  });
}

export { DEFAULT_BOARD };