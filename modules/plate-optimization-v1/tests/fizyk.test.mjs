import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BOARD, estimatePlateRequirementFromCsv } from '../src/index.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.join(directory, 'fixtures', '955.FIZYK_W1000_ST9_18MM.csv');
const csv = fs.readFileSync(csvPath, 'utf8');

for (const [index, line] of csv.trim().split(/\r?\n/).entries()) {
  assert.equal(line.split(';').length, 17, `row ${index + 1} must have exactly 17 fields`);
}

const first = estimatePlateRequirementFromCsv(csv);
const second = estimatePlateRequirementFromCsv(csv);

assert.equal(first.source.sourceRows, 22);
assert.equal(first.source.expandedPieceCount, 104);
assert.equal(first.source.dimensionPolicy, 'nominal-hha');
assert.equal(first.source.pcvDimensionDeductionApplied, false);

assert.equal(first.materialGroups.length, 1);
assert.equal(first.materialGroups[0].material.materialCode, 'W1000 ST9');
assert.equal(first.materialGroups[0].material.thicknessMm, 18);
assert.equal(first.materialGroups[0].metrics.areaLowerBound, 8);

assert.equal(first.physicalBoardCount, 9, 'KMS must match the verified HolzHer result for 955 FIZYK');
assert.equal(first.boards.length, 9);
assert.equal(first.validation.complete, true);
assert.equal(first.validation.geometryValid, true);
assert.equal(first.validation.panelCutFeasible, true);
assert.equal(first.safeForTestDisplay, true);
assert.equal(first.purchasePlan.newBoardsToPurchase, null);
assert.equal(first.automaticPurchasingAllowed, false);
assert.ok(first.boards.every((board) => board.panelCutFeasible === true));

const pieces = first.boards.flatMap((board) => board.pieces);
assert.equal(pieces.length, 104);
assert.equal(new Set(pieces.map((piece) => piece.key)).size, 104);

for (const board of first.boards) {
  for (const piece of board.pieces) {
    assert.ok(piece.xMm >= 0 && piece.yMm >= 0);
    assert.ok(piece.xMm + piece.widthMm <= DEFAULT_BOARD.workingWidthMm + 1e-9);
    assert.ok(piece.yMm + piece.heightMm <= DEFAULT_BOARD.workingHeightMm + 1e-9);
  }
  for (let left = 0; left < board.pieces.length; left += 1) {
    for (let right = left + 1; right < board.pieces.length; right += 1) {
      const a = board.pieces[left];
      const b = board.pieces[right];
      const separated =
        a.xMm + a.widthMm + DEFAULT_BOARD.kerfMm <= b.xMm + 1e-9 ||
        b.xMm + b.widthMm + DEFAULT_BOARD.kerfMm <= a.xMm + 1e-9 ||
        a.yMm + a.heightMm + DEFAULT_BOARD.kerfMm <= b.yMm + 1e-9 ||
        b.yMm + b.heightMm + DEFAULT_BOARD.kerfMm <= a.yMm + 1e-9;
      assert.equal(separated, true, `collision on board ${board.index}`);
    }
  }
}

const signature = (result) => JSON.stringify(result.boards.map((board) =>
  board.pieces.map((piece) => [piece.key, piece.xMm, piece.yMm, piece.widthMm, piece.heightMm, piece.rotated])));
assert.equal(signature(first), signature(second), '955 FIZYK optimization must be deterministic');

console.log('OK: 955 FIZYK = 22 rows, 104 pieces, 9 guillotine boards matching HolzHer.');
