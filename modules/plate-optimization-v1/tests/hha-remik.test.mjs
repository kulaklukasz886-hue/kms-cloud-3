import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseKmsOptimizationCsv } from '../src/csv-adapter.mjs';
import { generateHha } from '../src/hha-generator.mjs';
import { validateHha } from '../src/hha-validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const csvText = fs.readFileSync(path.join(here, 'fixtures', '320.REMIK.csv'), 'utf8');
const parsed = parseKmsOptimizationCsv(csvText);
const options = {
  jobName: 'TEST_KMS_HHA_U708_ST9_001',
  serial: 46238,
  commercialWidthMm: 2800,
  commercialHeightMm: 2070,
  trimMm: 14
};

const hha = generateHha(parsed.elements, options);
const secondRun = generateHha(parsed.elements, options);
assert.equal(hha, secondRun, 'HHA output must be deterministic');

const report = validateHha(hha, {
  elementRows: 33,
  expandedPieceCount: 96,
  materialCode: 'U708 ST9',
  requireOneToOneDimensions: true
});

assert.equal(report.valid, true);
assert.equal(report.lineCount, 46);
assert.equal(report.oneToOneDimensions, true);
assert.equal(report.rotationsValid, true);
assert.ok(report.materialLine.startsWith('M\"U708 ST9\"'));
assert.ok(report.thicknessLine.includes(' 18,0 '));
assert.ok(report.boardLine.includes('2800,0 2070,0'));
assert.ok(report.boardLine.includes('14,0 14,0 14,0 14,0'));

const first = report.elements.find((element) => element.id === '1');
assert.deepEqual(
  [first.nominalLengthMm, first.nominalWidthMm, first.productionLengthMm, first.productionWidthMm],
  [480, 315, 480, 315],
  'KMS HHA must send dimensions 1:1'
);
assert.equal(first.edges.front.code, '2mm');
assert.equal(first.edges.front.deductionMm, 1);
assert.equal(first.rotation, 0);

const second = report.elements.find((element) => element.id === '2');
assert.equal(second.edges.front.code, '2mm');
assert.equal(second.edges.left.code, '2mm');
assert.deepEqual(
  [second.nominalLengthMm, second.nominalWidthMm, second.productionLengthMm, second.productionWidthMm],
  [640, 580, 640, 580]
);

const third = report.elements.find((element) => element.id === '3');
assert.equal(third.edges.front.code, '2mm');
assert.equal(third.edges.left.code, '2mm');
assert.equal(third.edges.right.code, '2mm');
assert.deepEqual(
  [third.nominalLengthMm, third.nominalWidthMm, third.productionLengthMm, third.productionWidthMm],
  [579, 580, 579, 580]
);

assert.throws(() => generateHha([{ ...parsed.elements[0], edges: {} }], options),
  /Unsupported HHA edge combination/,
  'Unknown edge combinations must be blocked instead of guessed');

console.log('OK: TEST_KMS_HHA_U708_ST9_001 = 33 rows, 96 pieces, dimensions 1:1, PCV metadata, valid HHOS structure.');
