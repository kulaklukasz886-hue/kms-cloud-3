import assert from 'node:assert/strict';
import { generateHha } from '../src/hha-generator.mjs';
import { validateHha } from '../src/hha-validator.mjs';

const JOB = 'TEST_KMS_HHA_U708_ST9_002';
const elements = [
  {
    id: 1,
    orderId: JOB,
    materialCode: 'U708 ST9',
    thicknessMm: 18,
    quantity: 1,
    lengthMm: 300,
    widthMm: 2400,
    rotationAllowed: true,
    edges: { front: '2mm' }
  },
  {
    id: 2,
    orderId: JOB,
    materialCode: 'U708 ST9',
    thicknessMm: 18,
    quantity: 1,
    lengthMm: 2400,
    widthMm: 300,
    rotationAllowed: false,
    edges: { front: '2mm' }
  },
  {
    id: 3,
    orderId: JOB,
    materialCode: 'U708 ST9',
    thicknessMm: 18,
    quantity: 2,
    lengthMm: 1000,
    widthMm: 500,
    rotationAllowed: true,
    edges: { front: '2mm' }
  },
  {
    id: 4,
    orderId: JOB,
    materialCode: 'U708 ST9',
    thicknessMm: 18,
    quantity: 1,
    lengthMm: 800,
    widthMm: 600,
    rotationAllowed: false,
    edges: { front: '2mm', left: '2mm' }
  },
  {
    id: 5,
    orderId: JOB,
    materialCode: 'U708 ST9',
    thicknessMm: 18,
    quantity: 3,
    lengthMm: 700,
    widthMm: 500,
    rotationAllowed: true,
    edges: { front: '2mm', left: '2mm', right: '2mm' }
  }
];

const options = { jobName: JOB, serial: 46237 };
const first = generateHha(elements, options);
const second = generateHha(elements, options);
assert.equal(first, second, 'HHA generation must be deterministic');

const result = validateHha(first, {
  elementRows: 5,
  expandedPieceCount: 8,
  materialCode: 'U708 ST9',
  requireOneToOneDimensions: true
});

assert.equal(result.valid, true);
assert.equal(result.oneToOneDimensions, true);
assert.deepEqual(result.elements.map((element) => element.rotation), [-1, 0, -1, 0, -1]);

assert.equal(result.elements[0].nominalLengthMm, 300);
assert.equal(result.elements[0].nominalWidthMm, 2400);
assert.equal(result.elements[0].productionLengthMm, 300);
assert.equal(result.elements[0].productionWidthMm, 2400);
assert.equal(result.elements[0].edges.front.code, '2mm');

assert.equal(result.elements[3].edges.front.code, '2mm');
assert.equal(result.elements[3].edges.left.code, '2mm');
assert.equal(result.elements[3].edges.right.code, '');

assert.equal(result.elements[4].edges.front.code, '2mm');
assert.equal(result.elements[4].edges.left.code, '2mm');
assert.equal(result.elements[4].edges.right.code, '2mm');

console.log('OK: U708 HHA rotation and mixed PCV test = 5 rows, 8 pieces, dimensions 1:1.');
