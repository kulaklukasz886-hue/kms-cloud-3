function parseDecimal(value) {
  return Number(String(value).replace(',', '.'));
}

function parseEdge(line, prefix) {
  const match = line.match(new RegExp(`${prefix}\\"([^\\"]*)\\" \\"([^\\"]*)\\" 1 ([0-9]+,[0-9])`));
  if (!match) throw new Error(`Missing ${prefix} edge block`);
  return { code: match[1], label: match[2], deductionMm: parseDecimal(match[3]) };
}

function parseElementLine(line) {
  const match = line.match(/^E([^ ]+) 1796 \"([^\"]+)\" \"\" \"\" \"([^\"]+)\" (\d+) ([0-9]+,[0-9]) ([0-9]+,[0-9]) (-1|0) ([0-9]+,[0-9]) ([0-9]+,[0-9])/);
  if (!match) throw new Error(`Invalid E line: ${line.slice(0, 80)}`);
  return {
    id: match[1],
    elementLabel: match[2],
    materialCode: match[3],
    quantity: Number(match[4]),
    nominalLengthMm: parseDecimal(match[5]),
    nominalWidthMm: parseDecimal(match[6]),
    rotation: Number(match[7]),
    productionLengthMm: parseDecimal(match[8]),
    productionWidthMm: parseDecimal(match[9]),
    edges: {
      front: parseEdge(line, 'v'),
      back: parseEdge(line, 'h'),
      left: parseEdge(line, 'l'),
      right: parseEdge(line, 'r')
    }
  };
}

export function validateHha(hhaText, expected = {}) {
  if (typeof hhaText !== 'string' || !hhaText.trim()) throw new TypeError('hhaText must be non-empty');
  const lines = hhaText.trim().split(/\r?\n/);
  if (!lines[0].startsWith('\"HHOS 2.3.1.4 \"')) throw new Error('Invalid HHOS header');
  if (!lines.includes('OE-1 -1 -1') || !lines.includes('OM-1 -1 0 -1 -1 -1 -1')) {
    throw new Error('Missing required HHOS control lines');
  }

  const elements = lines.filter((line) => /^E[^ ]+ /.test(line)).map(parseElementLine);
  const materialLine = lines.find((line) => line.startsWith('M\"'));
  const boardLine = lines.find((line) => line.startsWith('SM0 '));
  const thicknessLine = lines.find((line) => line.startsWith('SOO'));
  if (!materialLine || !boardLine || !thicknessLine) throw new Error('Missing HHA material or board footer');

  const totalQuantity = elements.reduce((sum, element) => sum + element.quantity, 0);
  const oneToOneDimensions = elements.every((element) =>
    element.nominalLengthMm === element.productionLengthMm &&
    element.nominalWidthMm === element.productionWidthMm);
  const rotationsValid = elements.every((element) => element.rotation === 0 || element.rotation === -1);

  if (expected.elementRows != null && elements.length !== expected.elementRows) {
    throw new Error(`Expected ${expected.elementRows} element rows, got ${elements.length}`);
  }
  if (expected.expandedPieceCount != null && totalQuantity !== expected.expandedPieceCount) {
    throw new Error(`Expected ${expected.expandedPieceCount} pieces, got ${totalQuantity}`);
  }
  if (expected.materialCode && !materialLine.startsWith(`M\"${expected.materialCode}\"`)) {
    throw new Error(`Expected material ${expected.materialCode}`);
  }
  if (expected.requireOneToOneDimensions !== false && !oneToOneDimensions) {
    throw new Error('HHA contains dimension deductions; expected 1:1 dimensions');
  }
  if (!rotationsValid) throw new Error('Invalid HHA rotation encoding');

  return {
    valid: true,
    lineCount: lines.length,
    elementRows: elements.length,
    expandedPieceCount: totalQuantity,
    materialLine,
    thicknessLine,
    boardLine,
    oneToOneDimensions,
    rotationsValid,
    elements
  };
}
