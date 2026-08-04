import { createOptimizationResult } from './contracts.mjs';
import { parseKmsOptimizationCsv } from './csv-adapter.mjs';
import { optimizeGuillotineGroup } from './guillotine-engine.mjs';

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
  if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${field} must be a positive finite number`);
  return number;
}

function finiteNonNegative(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new RangeError(`${field} must be a non-negative finite number`);
  return number;
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeBoard(boardConfig) {
  const source = { ...DEFAULT_BOARD, ...boardConfig };
  const board = {
    commercialWidthMm: finitePositive(source.commercialWidthMm, 'commercialWidthMm'),
    commercialHeightMm: finitePositive(source.commercialHeightMm, 'commercialHeightMm'),
    workingWidthMm: finitePositive(source.workingWidthMm, 'workingWidthMm'),
    workingHeightMm: finitePositive(source.workingHeightMm, 'workingHeightMm'),
    kerfMm: finiteNonNegative(source.kerfMm, 'kerfMm'),
    maxElementDimensionMm: finitePositive(source.maxElementDimensionMm, 'maxElementDimensionMm')
  };
  if (board.workingWidthMm > board.commercialWidthMm || board.workingHeightMm > board.commercialHeightMm) {
    throw new RangeError('working field must not exceed commercial board dimensions');
  }
  return board;
}

function materialKey(element) {
  return [element.materialCode, element.decorCode, element.thicknessMm].join('::');
}

export function validateAndGroupElements(elements, boardConfig = {}) {
  if (!Array.isArray(elements) || elements.length === 0) throw new TypeError('elements must be a non-empty array');
  const board = normalizeBoard(boardConfig);
  const groups = new Map();
  const warnings = [];

  for (const [index, source] of elements.entries()) {
    const row = index + 1;
    const lengthMm = finitePositive(source.lengthMm, `element ${row}.lengthMm`);
    const widthMm = finitePositive(source.widthMm, `element ${row}.widthMm`);
    const quantity = finitePositive(source.quantity ?? 1, `element ${row}.quantity`);
    if (!Number.isInteger(quantity)) throw new RangeError(`element ${row}.quantity must be an integer`);

    const materialCode = normalizeText(source.materialCode);
    const decorCode = normalizeText(source.decorCode) || materialCode;
    if (!materialCode) throw new Error(`element ${row} must contain materialCode`);

    const rotationAllowed = source.rotationAllowed === true;
    const fitsNormally = lengthMm <= board.workingWidthMm && widthMm <= board.workingHeightMm;
    const fitsRotated = rotationAllowed && widthMm <= board.workingWidthMm && lengthMm <= board.workingHeightMm;
    if (!fitsNormally && !fitsRotated) throw new RangeError(`element ${row} does not fit the working field`);
    if (Math.max(lengthMm, widthMm) > board.maxElementDimensionMm) {
      throw new RangeError(`element ${row} exceeds maximum element dimension`);
    }

    const element = {
      id: source.id ?? `row-${row}`,
      sourceRowNumber: source.sourceRowNumber ?? row,
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

    const key = materialKey(element);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(element);
  }

  return {
    board,
    groups: [...groups.entries()].map(([key, groupedElements]) => ({
      key,
      material: {
        materialCode: groupedElements[0].materialCode,
        decorCode: groupedElements[0].decorCode,
        thicknessMm: groupedElements[0].thicknessMm
      },
      elements: groupedElements
    })),
    warnings
  };
}

export function estimatePlateRequirement(elements, boardConfig = {}, options = {}) {
  const prepared = validateAndGroupElements(elements, boardConfig);
  const groupResults = prepared.groups.map((group) => {
    const optimization = optimizeGuillotineGroup(group.elements, prepared.board, options);
    return {
      key: group.key,
      material: group.material,
      elementRows: group.elements.length,
      expandedPieceCount: group.elements.reduce((sum, element) => sum + element.quantity, 0),
      ...optimization
    };
  });

  const validation = {
    complete: groupResults.every((group) => group.validation.complete),
    geometryValid: groupResults.every((group) => group.validation.geometryValid),
    panelCutFeasible: groupResults.every((group) => group.validation.panelCutFeasible),
    materialGroupsValid: true
  };
  const allSafe = Object.values(validation).every(Boolean);
  const physicalBoardCount = allSafe ? groupResults.reduce((sum, group) => sum + group.physicalBoardCount, 0) : null;
  const boards = allSafe
    ? groupResults.flatMap((group) => group.boards.map((board) => ({ ...board, materialGroupKey: group.key })))
    : [];

  return createOptimizationResult({
    status: allSafe ? 'test-result' : 'blocked',
    engine: {
      name: 'KMS Guillotine Plate Optimizer',
      version: '1.0.0-alpha.2',
      mode: 'deterministic-multistart-guillotine'
    },
    sourceDimensionPolicy: 'nominal-hha',
    materialGroups: groupResults,
    physicalBoardCount,
    boards,
    metrics: {
      materialGroupCount: groupResults.length,
      expandedPieceCount: groupResults.reduce((sum, group) => sum + group.expandedPieceCount, 0),
      pieceAreaM2: groupResults.reduce((sum, group) => sum + (group.metrics.pieceAreaM2 ?? 0), 0),
      wasteAreaM2: groupResults.reduce((sum, group) => sum + (group.metrics.wasteAreaM2 ?? 0), 0)
    },
    warnings: [
      ...prepared.warnings,
      'Test result only. Automatic purchasing remains blocked.',
      'HolzHer remains responsible for PCV dimension correction and final NCR optimization.'
    ],
    validation
  });
}

export function estimatePlateRequirementFromCsv(csvText, boardConfig = {}, options = {}) {
  const parsed = parseKmsOptimizationCsv(csvText);
  const result = estimatePlateRequirement(parsed.elements, boardConfig, options);
  return {
    ...result,
    source: {
      type: 'kms-csv-17',
      sourceRows: parsed.sourceRows,
      expandedPieceCount: parsed.expandedPieceCount,
      dimensionPolicy: parsed.dimensionPolicy,
      pcvDimensionDeductionApplied: parsed.pcvDimensionDeductionApplied
    }
  };
}

export { DEFAULT_BOARD, parseKmsOptimizationCsv };
