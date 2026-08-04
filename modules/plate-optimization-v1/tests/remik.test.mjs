import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BOARD, estimatePlateRequirementFromCsv } from '../src/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const csvText = fs.readFileSync(path.join(here, 'fixtures', '320.REMIK.csv'), 'utf8').trim();
const result = estimatePlateRequirementFromCsv(csvText);

assert.equal(result.source.sourceRows, 33);
assert.equal(result.source.expandedPieceCount, 96);
assert.equal(result.source.dimensionPolicy, 'nominal-hha');
assert.equal(result.source.pcvDimensionDeductionApplied, false);
assert.equal(result.metrics.expandedPieceCount, 96);
assert.equal(result.materialGroups.length, 1);
assert.equal(result.physicalBoardCount, 5, '320.REMIK must resolve to 5 guillotine boards');
assert.equal(result.status, 'test-result');
assert.equal(result.validation.complete, true);
assert.equal(result.validation.geometryValid, true);
assert.equal(result.validation.panelCutFeasible, true);
assert.equal(result.purchasePlan.newBoardsToPurchase, null);
assert.equal(result.automaticPurchasingAllowed, false);

const group = result.materialGroups[0];
assert.equal(group.metrics.areaLowerBound, 5,
  'lower bound must use the 2770 x 2040 working field and nominal HHA dimensions');
assert.equal(group.metrics.pieceCount, 96);
assert.equal(group.boards.length, 5);
assert.equal(group.boards.every((board) => board.panelCutFeasible), true);

const placements = group.boards.flatMap((board) => board.pieces.map((piece) => ({ ...piece, board })));
assert.equal(placements.length, 96);
assert.equal(new Set(placements.map((piece) => piece.key)).size, 96);
for (const piece of placements) {
  assert.ok(piece.xMm >= 0 && piece.yMm >= 0);
  assert.ok(piece.xMm + piece.widthMm <= DEFAULT_BOARD.workingWidthMm + 1e-6);
  assert.ok(piece.yMm + piece.heightMm <= DEFAULT_BOARD.workingHeightMm + 1e-6);
}

for (const board of group.boards) {
  for (let leftIndex = 0; leftIndex < board.pieces.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < board.pieces.length; rightIndex += 1) {
      const left = board.pieces[leftIndex];
      const right = board.pieces[rightIndex];
      const separated = left.xMm + left.widthMm + DEFAULT_BOARD.kerfMm <= right.xMm + 1e-6 ||
        right.xMm + right.widthMm + DEFAULT_BOARD.kerfMm <= left.xMm + 1e-6 ||
        left.yMm + left.heightMm + DEFAULT_BOARD.kerfMm <= right.yMm + 1e-6 ||
        right.yMm + right.heightMm + DEFAULT_BOARD.kerfMm <= left.yMm + 1e-6;
      assert.equal(separated, true, `pieces ${left.key} and ${right.key} must preserve kerf`);
    }
  }
}

const firstRunSummary = JSON.stringify({
  boardCount: result.physicalBoardCount,
  search: group.metrics.selectedSearch,
  boards: group.boards.map((board) => board.pieces)
});
const repeated = estimatePlateRequirementFromCsv(csvText);
const secondRunSummary = JSON.stringify({
  boardCount: repeated.physicalBoardCount,
  search: repeated.materialGroups[0].metrics.selectedSearch,
  boards: repeated.materialGroups[0].boards.map((board) => board.pieces)
});
assert.equal(secondRunSummary, firstRunSummary, 'optimization must be deterministic');

console.log('OK: 320.REMIK = 96 pieces, 5 guillotine boards, nominal HHA dimensions, no collisions.');
