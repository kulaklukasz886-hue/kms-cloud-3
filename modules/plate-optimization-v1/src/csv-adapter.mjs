function numberField(value, field, rowNumber) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`row ${rowNumber}: ${field} must be a finite number`);
  }
  return number;
}

export function parseKmsOptimizationCsv(csvText) {
  if (typeof csvText !== 'string' || !csvText.trim()) {
    throw new TypeError('csvText must be a non-empty string');
  }

  const elements = csvText.trim().split(/\r?\n/).filter(Boolean).map((line, index) => {
    const fields = line.split(';');
    const rowNumber = index + 1;
    if (fields.length !== 17) {
      throw new Error(`row ${rowNumber} must have exactly 17 CSV fields`);
    }

    const quantity = numberField(fields[6], 'quantity', rowNumber);
    const rotationCsv = numberField(fields[8], 'rotation', rowNumber);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError(`row ${rowNumber}: quantity must be a positive integer`);
    }
    if (rotationCsv !== 0 && rotationCsv !== 1) {
      throw new RangeError(`row ${rowNumber}: rotation must be 0 or 1`);
    }

    const materialCode = String(fields[3] ?? '').trim();
    if (!materialCode) throw new Error(`row ${rowNumber}: material code is required`);

    return {
      id: fields[2] || `row-${rowNumber}`,
      sourceRowNumber: rowNumber,
      orderId: String(fields[0] ?? '').trim(),
      materialCode,
      decorCode: materialCode,
      thicknessMm: numberField(fields[7], 'thickness', rowNumber),
      lengthMm: numberField(fields[4], 'length', rowNumber),
      widthMm: numberField(fields[5], 'width', rowNumber),
      quantity,
      rotationAllowed: rotationCsv === 1,
      edges: {
        front: fields[10] ?? '',
        back: fields[11] ?? '',
        left: fields[12] ?? '',
        right: fields[13] ?? ''
      }
    };
  });

  return {
    elements,
    sourceRows: elements.length,
    expandedPieceCount: elements.reduce((sum, element) => sum + element.quantity, 0),
    dimensionPolicy: 'nominal-hha',
    pcvDimensionDeductionApplied: false
  };
}
