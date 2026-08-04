const EPSILON = 1e-9;

function compareTuple(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (Math.abs(left[index] - right[index]) > EPSILON) return left[index] - right[index];
  }
  return 0;
}

function expandElements(elements) {
  const pieces = [];
  for (const element of elements) {
    for (let copy = 1; copy <= element.quantity; copy += 1) {
      pieces.push({
        key: `${element.sourceRowNumber ?? element.id}:${copy}`,
        id: element.id,
        copy,
        orderId: element.orderId,
        lengthMm: element.lengthMm,
        widthMm: element.widthMm,
        rotationAllowed: element.rotationAllowed,
        edges: { ...element.edges }
      });
    }
  }
  return pieces;
}

function orientations(piece, kerfMm) {
  const normal = {
    occupiedWidthMm: piece.lengthMm + kerfMm,
    occupiedHeightMm: piece.widthMm + kerfMm,
    widthMm: piece.lengthMm,
    heightMm: piece.widthMm,
    rotated: false
  };
  if (!piece.rotationAllowed || Math.abs(piece.lengthMm - piece.widthMm) <= EPSILON) return [normal];
  return [
    normal,
    {
      occupiedWidthMm: piece.widthMm + kerfMm,
      occupiedHeightMm: piece.lengthMm + kerfMm,
      widthMm: piece.widthMm,
      heightMm: piece.lengthMm,
      rotated: true
    }
  ];
}

function placementScore(free, orientation, heuristic) {
  const leftoverWidth = free.widthMm - orientation.occupiedWidthMm;
  const leftoverHeight = free.heightMm - orientation.occupiedHeightMm;
  const shortSide = Math.min(leftoverWidth, leftoverHeight);
  const longSide = Math.max(leftoverWidth, leftoverHeight);
  const area = free.widthMm * free.heightMm - orientation.occupiedWidthMm * orientation.occupiedHeightMm;
  if (heuristic === 'area') return [area, shortSide, longSide, free.yMm, free.xMm];
  if (heuristic === 'long') return [longSide, shortSide, area, free.yMm, free.xMm];
  if (heuristic === 'bottom') return [free.yMm + orientation.occupiedHeightMm, free.xMm, area, shortSide, longSide];
  return [shortSide, longSide, area, free.yMm, free.xMm];
}

function chooseSplitMode(free, orientation, heuristic) {
  if (heuristic === 'vertical') return 'vertical-first';
  if (heuristic === 'horizontal') return 'horizontal-first';
  const remainingWidth = free.widthMm - orientation.occupiedWidthMm;
  const remainingHeight = free.heightMm - orientation.occupiedHeightMm;
  if (heuristic === 'shorter-leftover') return remainingWidth <= remainingHeight ? 'vertical-first' : 'horizontal-first';
  if (heuristic === 'longer-leftover') return remainingWidth >= remainingHeight ? 'vertical-first' : 'horizontal-first';
  const verticalLargestChild = Math.max(remainingWidth * free.heightMm, orientation.occupiedWidthMm * remainingHeight);
  const horizontalLargestChild = Math.max(free.widthMm * remainingHeight, remainingWidth * orientation.occupiedHeightMm);
  return verticalLargestChild <= horizontalLargestChild ? 'vertical-first' : 'horizontal-first';
}

function regionOf(node) {
  return { xMm: node.xMm, yMm: node.yMm, widthMm: node.widthMm, heightMm: node.heightMm };
}

function makeFree(xMm, yMm, widthMm, heightMm) {
  return { type: 'free', xMm, yMm, widthMm, heightMm };
}

function makeSplit(direction, region, first, second) {
  return { type: 'split', direction, ...region, first, second };
}

function replaceFreeLeaf(freeLeaf, piece, orientation, splitMode) {
  const region = regionOf(freeLeaf);
  const remainingWidth = region.widthMm - orientation.occupiedWidthMm;
  const remainingHeight = region.heightMm - orientation.occupiedHeightMm;
  const pieceNode = {
    type: 'piece', ...region,
    widthMm: orientation.occupiedWidthMm,
    heightMm: orientation.occupiedHeightMm,
    pieceKey: piece.key
  };
  const newLeaves = [];
  let replacement = pieceNode;

  if (splitMode === 'vertical-first') {
    let left = pieceNode;
    if (remainingHeight > EPSILON) {
      const bottom = makeFree(region.xMm, region.yMm + orientation.occupiedHeightMm, orientation.occupiedWidthMm, remainingHeight);
      newLeaves.push(bottom);
      left = makeSplit('horizontal', {
        xMm: region.xMm, yMm: region.yMm,
        widthMm: orientation.occupiedWidthMm, heightMm: region.heightMm
      }, pieceNode, bottom);
    }
    if (remainingWidth > EPSILON) {
      const right = makeFree(region.xMm + orientation.occupiedWidthMm, region.yMm, remainingWidth, region.heightMm);
      newLeaves.push(right);
      replacement = makeSplit('vertical', region, left, right);
    } else replacement = left;
  } else {
    let top = pieceNode;
    if (remainingWidth > EPSILON) {
      const right = makeFree(region.xMm + orientation.occupiedWidthMm, region.yMm, remainingWidth, orientation.occupiedHeightMm);
      newLeaves.push(right);
      top = makeSplit('vertical', {
        xMm: region.xMm, yMm: region.yMm,
        widthMm: region.widthMm, heightMm: orientation.occupiedHeightMm
      }, pieceNode, right);
    }
    if (remainingHeight > EPSILON) {
      const bottom = makeFree(region.xMm, region.yMm + orientation.occupiedHeightMm, region.widthMm, remainingHeight);
      newLeaves.push(bottom);
      replacement = makeSplit('horizontal', region, top, bottom);
    } else replacement = top;
  }

  for (const key of Object.keys(freeLeaf)) delete freeLeaf[key];
  Object.assign(freeLeaf, replacement);
  return newLeaves;
}

function createBoard(board) {
  const root = makeFree(0, 0, board.workingWidthMm + board.kerfMm, board.workingHeightMm + board.kerfMm);
  return { root, freeLeaves: [root], placements: [], occupiedAreaMm2: 0 };
}

function findPlacement(boardState, piece, kerfMm, heuristic) {
  let best = null;
  for (let freeIndex = 0; freeIndex < boardState.freeLeaves.length; freeIndex += 1) {
    const free = boardState.freeLeaves[freeIndex];
    for (const orientation of orientations(piece, kerfMm)) {
      if (orientation.occupiedWidthMm <= free.widthMm + EPSILON && orientation.occupiedHeightMm <= free.heightMm + EPSILON) {
        const score = placementScore(free, orientation, heuristic);
        if (!best || compareTuple(score, best.score) < 0) best = { freeIndex, free, orientation, score };
      }
    }
  }
  return best;
}

function pack(order, board, placementHeuristic, splitHeuristic, boardSelection) {
  const boards = [];
  for (const piece of order) {
    let selected = null;
    const boardIndexes = boards.map((_, index) => index);
    if (boardSelection === 'last-fit') boardIndexes.reverse();

    for (const boardIndex of boardIndexes) {
      const candidate = findPlacement(boards[boardIndex], piece, board.kerfMm, placementHeuristic);
      if (!candidate) continue;
      if (boardSelection === 'first-fit' || boardSelection === 'last-fit') {
        selected = { boardIndex, candidate };
        break;
      }
      const score = boardSelection === 'fullest-fit'
        ? [-boards[boardIndex].occupiedAreaMm2, ...candidate.score]
        : candidate.score;
      if (!selected || compareTuple(score, selected.score) < 0) selected = { boardIndex, candidate, score };
    }

    if (!selected) {
      const newBoard = createBoard(board);
      boards.push(newBoard);
      const candidate = findPlacement(newBoard, piece, board.kerfMm, placementHeuristic);
      if (!candidate) return { boards, unplacedPieces: [piece] };
      selected = { boardIndex: boards.length - 1, candidate };
    }

    const target = boards[selected.boardIndex];
    const { freeIndex, free, orientation } = selected.candidate;
    const splitMode = chooseSplitMode(free, orientation, splitHeuristic);
    const newLeaves = replaceFreeLeaf(free, piece, orientation, splitMode);
    target.freeLeaves.splice(freeIndex, 1, ...newLeaves);
    target.placements.push({
      key: piece.key, id: piece.id, copy: piece.copy, orderId: piece.orderId,
      xMm: free.xMm, yMm: free.yMm,
      widthMm: orientation.widthMm, heightMm: orientation.heightMm,
      rotated: orientation.rotated, edges: { ...piece.edges }
    });
    target.occupiedAreaMm2 += piece.lengthMm * piece.widthMm;
  }
  return { boards, unplacedPieces: [] };
}

function orderingVariants(pieces) {
  const comparators = [
    (left, right) => right.lengthMm * right.widthMm - left.lengthMm * left.widthMm,
    (left, right) => Math.max(right.lengthMm, right.widthMm) - Math.max(left.lengthMm, left.widthMm),
    (left, right) => Math.min(right.lengthMm, right.widthMm) - Math.min(left.lengthMm, left.widthMm),
    (left, right) => right.lengthMm - left.lengthMm || right.widthMm - left.widthMm,
    (left, right) => right.widthMm - left.widthMm || right.lengthMm - left.lengthMm,
    (left, right) => (right.lengthMm + right.widthMm) - (left.lengthMm + left.widthMm)
  ];
  const stable = (comparator) => [...pieces].sort((left, right) =>
    comparator(left, right) || String(left.key).localeCompare(String(right.key), 'en', { numeric: true }));
  const variants = comparators.map(stable);
  return [...variants, ...variants.map((variant) => [...variant].reverse())];
}

function usableFreeRectangle(free, board) {
  const widthMm = Math.max(0, Math.min(free.widthMm, board.workingWidthMm - free.xMm));
  const heightMm = Math.max(0, Math.min(free.heightMm, board.workingHeightMm - free.yMm));
  return { xMm: free.xMm, yMm: free.yMm, widthMm, heightMm, areaM2: widthMm * heightMm / 1_000_000 };
}

function rectanglesSeparated(left, right, kerfMm) {
  return left.xMm + left.widthMm + kerfMm <= right.xMm + EPSILON ||
    right.xMm + right.widthMm + kerfMm <= left.xMm + EPSILON ||
    left.yMm + left.heightMm + kerfMm <= right.yMm + EPSILON ||
    right.yMm + right.heightMm + kerfMm <= left.yMm + EPSILON;
}

function validateTree(node) {
  if (node.type === 'piece' || node.type === 'free') return true;
  if (node.type !== 'split' || !node.first || !node.second) return false;
  const first = regionOf(node.first);
  const second = regionOf(node.second);
  if (node.direction === 'vertical') {
    const valid = Math.abs(first.xMm - node.xMm) <= EPSILON &&
      Math.abs(first.yMm - node.yMm) <= EPSILON &&
      Math.abs(second.yMm - node.yMm) <= EPSILON &&
      Math.abs(first.heightMm - node.heightMm) <= EPSILON &&
      Math.abs(second.heightMm - node.heightMm) <= EPSILON &&
      Math.abs(first.widthMm + second.widthMm - node.widthMm) <= EPSILON &&
      Math.abs(second.xMm - (first.xMm + first.widthMm)) <= EPSILON;
    return valid && validateTree(node.first) && validateTree(node.second);
  }
  if (node.direction === 'horizontal') {
    const valid = Math.abs(first.xMm - node.xMm) <= EPSILON &&
      Math.abs(first.yMm - node.yMm) <= EPSILON &&
      Math.abs(second.xMm - node.xMm) <= EPSILON &&
      Math.abs(first.widthMm - node.widthMm) <= EPSILON &&
      Math.abs(second.widthMm - node.widthMm) <= EPSILON &&
      Math.abs(first.heightMm + second.heightMm - node.heightMm) <= EPSILON &&
      Math.abs(second.yMm - (first.yMm + first.heightMm)) <= EPSILON;
    return valid && validateTree(node.first) && validateTree(node.second);
  }
  return false;
}

function validatePackedBoards(boards, pieces, board) {
  const placements = boards.flatMap((entry) => entry.placements);
  let geometryValid = placements.length === pieces.length && new Set(placements.map((piece) => piece.key)).size === pieces.length;
  for (const packedBoard of boards) {
    if (!validateTree(packedBoard.root)) geometryValid = false;
    for (const piece of packedBoard.placements) {
      if (piece.xMm < -EPSILON || piece.yMm < -EPSILON ||
          piece.xMm + piece.widthMm > board.workingWidthMm + EPSILON ||
          piece.yMm + piece.heightMm > board.workingHeightMm + EPSILON) geometryValid = false;
    }
    for (let left = 0; left < packedBoard.placements.length; left += 1) {
      for (let right = left + 1; right < packedBoard.placements.length; right += 1) {
        if (!rectanglesSeparated(packedBoard.placements[left], packedBoard.placements[right], board.kerfMm)) geometryValid = false;
      }
    }
  }
  return {
    complete: placements.length === pieces.length,
    geometryValid,
    panelCutFeasible: geometryValid && boards.every((entry) => validateTree(entry.root))
  };
}

function summarizeBoards(packedBoards, board) {
  return packedBoards.map((packedBoard, index) => {
    const freeRectangles = packedBoard.freeLeaves
      .map((free) => usableFreeRectangle(free, board))
      .filter((free) => free.widthMm > EPSILON && free.heightMm > EPSILON)
      .sort((left, right) => right.areaM2 - left.areaM2);
    return {
      index: index + 1,
      widthMm: board.workingWidthMm,
      heightMm: board.workingHeightMm,
      pieces: packedBoard.placements,
      freeRectangles,
      largestFreeRectangle: freeRectangles[0] ?? null,
      panelCutFeasible: validateTree(packedBoard.root),
      cutTree: packedBoard.root
    };
  });
}

export function optimizeGuillotineGroup(elements, board, options = {}) {
  const pieces = expandElements(elements);
  const placementHeuristics = options.placementHeuristics ?? ['area', 'short', 'long', 'bottom'];
  const splitHeuristics = options.splitHeuristics ?? ['vertical', 'horizontal', 'shorter-leftover', 'longer-leftover', 'min-largest-child'];
  const boardSelections = options.boardSelections ?? ['best-fit', 'first-fit', 'last-fit', 'fullest-fit'];
  let best = null;
  let trials = 0;

  for (const order of orderingVariants(pieces)) {
    for (const placementHeuristic of placementHeuristics) {
      for (const splitHeuristic of splitHeuristics) {
        for (const boardSelection of boardSelections) {
          trials += 1;
          const packed = pack(order, board, placementHeuristic, splitHeuristic, boardSelection);
          if (packed.unplacedPieces.length) continue;
          const trialValidation = validatePackedBoards(packed.boards, pieces, board);
          if (!trialValidation.complete || !trialValidation.geometryValid || !trialValidation.panelCutFeasible) continue;
          const largestFreeArea = Math.max(0, ...packed.boards.flatMap((entry) =>
            entry.freeLeaves.map((free) => usableFreeRectangle(free, board).areaM2)));
          const freeRectangleCount = packed.boards.reduce((sum, entry) => sum + entry.freeLeaves.length, 0);
          const score = [packed.boards.length, -largestFreeArea, freeRectangleCount];
          if (!best || compareTuple(score, best.score) < 0) {
            best = { ...packed, validation: trialValidation, score, search: { placementHeuristic, splitHeuristic, boardSelection } };
          }
        }
      }
    }
  }

  if (!best) {
    return {
      physicalBoardCount: null,
      boards: [],
      unplacedPieces: pieces,
      metrics: { trials, pieceCount: pieces.length },
      validation: { complete: false, geometryValid: false, panelCutFeasible: false }
    };
  }

  const boards = summarizeBoards(best.boards, board);
  const pieceAreaM2 = pieces.reduce((sum, piece) => sum + piece.lengthMm * piece.widthMm / 1_000_000, 0);
  const workingBoardAreaM2 = board.workingWidthMm * board.workingHeightMm / 1_000_000;
  const physicalBoardCount = boards.length;

  return {
    physicalBoardCount,
    boards,
    unplacedPieces: best.unplacedPieces,
    metrics: {
      trials,
      pieceCount: pieces.length,
      pieceAreaM2,
      workingBoardAreaM2,
      areaLowerBound: Math.ceil(pieceAreaM2 / workingBoardAreaM2),
      wasteAreaM2: physicalBoardCount * workingBoardAreaM2 - pieceAreaM2,
      largestFreeRectangle: boards.map((entry) => entry.largestFreeRectangle).filter(Boolean)
        .sort((left, right) => right.areaM2 - left.areaM2)[0] ?? null,
      selectedSearch: best.search
    },
    validation: best.validation
  };
}
