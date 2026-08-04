import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BOARD, estimatePlateRequirementFromCsv } from '../src/index.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(directory, 'fixtures', '902.ANTROPIK_D9163_BS_18MM.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

for (const [index, line] of csv.trim().split(/\r?\n/).entries()) {
  assert.equal(line.split(';').length, 17, `row ${index + 1} must have exactly 17 fields`);
}

const first = estimatePlateRequirementFromCsv(csv);
const second = estimatePlateRequirementFromCsv(csv);

assert.equal(first.source.sourceRows, 37);
assert.equal(first.source.expandedPieceCount, 93);
assert.equal(first.source.dimensionPolicy, 'nominal-hha');
assert.equal(first.source.pcvDimensionDeductionApplied, false);

assert.equal(first.materialGroups.length, 1);
assert.equal(first.materialGroups[0].material.materialCode, 'D9163 BS');
assert.equal(first.materialGroups[0].material.thicknessMm, 18);

assert.equal(first.physicalBoardCount, 7,
  '902 ANTROPIK requires 7 physical full boards in the KMS guillotine simulation');
assert.equal(first.boards.length, 7);
assert.equal(first.validation.complete, true);
assert.equal(first.validation.geometryValid, true);
assert.equal(first.validation.panelCutFeasible, true);
assert.equal(first.safeForTestDisplay, true);
assert.equal(first.purchasePlan.newBoardsToPurchase, null);
assert.equal(first.automaticPurchasingAllowed, false);
assert.ok(first.boards.every((board) => board.panelCutFeasible === true));

const pieces = first.boards.flatMap((board) => board.pieces);
assert.equal(pieces.length, 93);
assert.equal(new Set(pieces.map((piece) => piece.key)).size, 93);

for (const board of first.boards) {
  for (const piece of board.pieces) {
    assert.ok(piece.xMm >= 0 && piece.yMm >= 0);
    assert.ok(piece.xMm + piece.widthMm <= DEFAULT_BOARD.workingWidthMm + 1e-9);
    assert.ok(piece.yMm + piece.heightMm <= DEFAULT_BOARD.workingHeightMm + 1e-9);
  }
}

const productionPlanMaterialUsage = 6.5;
assert.notEqual(first.physicalBoardCount, productionPlanMaterialUsage,
  'Physical full-board count must remain separate from fractional material-plan usage');
assert.equal(first.purchasePlan.newBoardsToPurchase, null,
  'Fractional production-plan usage must not be converted automatically into a purchase quantity');

const signature = (result) => JSON.stringify(result.boards.map((board) =>
  board.pieces.map((piece) => [piece.key, piece.xMm, piece.yMm, piece.widthMm, piece.heightMm, piece.rotated])));
assert.equal(signature(first), signature(second), '902 ANTROPIK optimization must be deterministic');

console.log('OK: 902 ANTROPIK = 37 rows, 93 pieces, 7 physical boards; production plan usage 6.50 remains separate.');
