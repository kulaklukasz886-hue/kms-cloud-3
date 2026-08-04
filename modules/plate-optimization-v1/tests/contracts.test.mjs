import assert from 'node:assert/strict';
import {
  DEFAULT_BOARD,
  estimatePlateRequirement,
  validateAndGroupElements
} from '../src/index.mjs';

const elements = [
  {
    id: 1,
    orderId: 'TEST-001',
    materialCode: 'EGGER',
    decorCode: 'U708 ST9',
    thicknessMm: 18,
    lengthMm: 1000,
    widthMm: 500,
    quantity: 2,
    rotationAllowed: false,
    edges: { front: '2MM' }
  },
  {
    id: 2,
    orderId: 'TEST-001',
    materialCode: 'EGGER',
    decorCode: 'U708 ST9',
    thicknessMm: 18,
    lengthMm: 700,
    widthMm: 300,
    quantity: 1,
    rotationAllowed: true,
    edges: {}
  }
];

const prepared = validateAndGroupElements(elements);
assert.deepEqual(prepared.board, DEFAULT_BOARD);
assert.equal(prepared.groups.length, 1);
assert.equal(prepared.groups[0].elements[0].lengthMm, 1000);
assert.equal(prepared.groups[0].elements[0].widthMm, 500);
assert.equal(prepared.groups[0].elements[0].edges.front, '2MM');

const result = estimatePlateRequirement(elements);
assert.equal(result.status, 'test-result');
assert.equal(result.physicalBoardCount, 1);
assert.equal(result.purchasePlan.newBoardsToPurchase, null);
assert.equal(result.automaticPurchasingAllowed, false);
assert.equal(result.validation.materialGroupsValid, true);
assert.equal(result.validation.complete, true);
assert.equal(result.validation.geometryValid, true);
assert.equal(result.validation.panelCutFeasible, true);
assert.equal(result.safeForTestDisplay, true);

const mixed = estimatePlateRequirement([
  ...elements,
  { ...elements[0], id: 3, decorCode: 'W960 SM', materialCode: 'EGGER-W960', quantity: 1 }
]);
assert.equal(mixed.materialGroups.length, 2);
assert.equal(mixed.physicalBoardCount, 2, 'each material group requires its own physical board');

assert.throws(() => validateAndGroupElements([{ ...elements[0], lengthMm: 2800 }]),
  /does not fit|exceeds maximum/);

console.log('OK: KMS Plate Optimization v1 contracts and material grouping verified.');
