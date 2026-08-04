const SUPPORTED_EDGE_CODES = Object.freeze({
  F: '4 4 5 5',
  FL: '0 4 3 5',
  FLR: '0 0 3 3'
});

function text(value, field) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${field} is required`);
  if (normalized.includes('"') || /[\r\n]/.test(normalized)) {
    throw new Error(`${field} contains unsupported characters`);
  }
  return normalized;
}

function positiveNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new RangeError(`${field} must be positive`);
  return number;
}

function positiveInteger(value, field) {
  const number = positiveNumber(value, field);
  if (!Number.isInteger(number)) throw new RangeError(`${field} must be an integer`);
  return number;
}

function mm(value) {
  return `${Number(value).toFixed(1).replace('.', ',')}`;
}

function normalizeEdge(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return '';
  if (normalized === '2mm') return '2mm';
  if (normalized === '1mm') return '1mm';
  throw new Error(`Unsupported edge value: ${value}`);
}

function edgeSignature(edges) {
  return [
    edges.front ? 'F' : '',
    edges.back ? 'B' : '',
    edges.left ? 'L' : '',
    edges.right ? 'R' : ''
  ].join('');
}

function edgeCodes(edges) {
  const signature = edgeSignature(edges);
  const codes = SUPPORTED_EDGE_CODES[signature];
  if (!codes) {
    throw new Error(`Unsupported HHA edge combination for validated v1 test: ${signature || 'NONE'}`);
  }
  return codes;
}

function edgeBlock(prefix, value) {
  if (!value) return `${prefix}\"\" \"\" 1 0,0 0,0 0,0 0,0`;
  if (value === '1mm') return `${prefix}\"1mm\" \"Pcv1mm\" 1 0,0 0,0 0,0 0,0`;
  return `${prefix}\"2mm\" \"2mm\" 1 1,0 0,0 0,0 0,0`;
}

function excelSerial(date) {
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const excelEpoch = Date.UTC(1899, 11, 30);
  return Math.floor((utc - excelEpoch) / 86400000);
}

function normalizeElements(elements) {
  if (!Array.isArray(elements) || !elements.length) throw new TypeError('elements must be a non-empty array');
  return elements.map((source, index) => {
    const row = index + 1;
    const edges = {
      front: normalizeEdge(source.edges?.front),
      back: normalizeEdge(source.edges?.back),
      left: normalizeEdge(source.edges?.left),
      right: normalizeEdge(source.edges?.right)
    };
    return {
      id: text(source.id ?? row, `element ${row}.id`),
      orderId: text(source.orderId, `element ${row}.orderId`),
      materialCode: text(source.materialCode, `element ${row}.materialCode`),
      thicknessMm: positiveNumber(source.thicknessMm, `element ${row}.thicknessMm`),
      quantity: positiveInteger(source.quantity ?? 1, `element ${row}.quantity`),
      lengthMm: positiveNumber(source.lengthMm, `element ${row}.lengthMm`),
      widthMm: positiveNumber(source.widthMm, `element ${row}.widthMm`),
      rotationAllowed: source.rotationAllowed === true,
      edges,
      codes: edgeCodes(edges)
    };
  });
}

function elementLine(element, jobName) {
  const rotation = element.rotationAllowed ? -1 : 0;
  const length = mm(element.lengthMm);
  const width = mm(element.widthMm);
  return [
    `E${element.id} 1796 \"${element.id}\" \"\" \"\" \"${element.materialCode}\" ${element.quantity}`,
    `${length} ${width} ${rotation} ${length} ${width}`,
    `0,0 0,0 0,0 0,0 ${element.codes} -1 0 \"\" ${element.quantity}`,
    `0 0 0 0 0 0 0 1 \"\" 0`,
    `I\"\" \"\" \"${element.orderId}\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"${jobName}\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\"`,
    edgeBlock('v', element.edges.front),
    edgeBlock('h', element.edges.back),
    edgeBlock('l', element.edges.left),
    edgeBlock('r', element.edges.right),
    `W0,0 0,0 0,0 0,0 0,0 0,0 0,0 0,0 0 0 0 0`
  ].join(' ');
}

export function generateHha(elements, options = {}) {
  const normalized = normalizeElements(elements);
  const first = normalized[0];
  for (const element of normalized) {
    if (element.materialCode !== first.materialCode) throw new Error('HHA file must contain one material');
    if (element.thicknessMm !== first.thicknessMm) throw new Error('HHA file must contain one thickness');
  }

  const jobName = text(options.jobName ?? `${first.orderId}_${first.materialCode}_${first.thicknessMm}MM`, 'jobName');
  const serial = Number.isInteger(options.serial) ? options.serial : excelSerial(options.date ?? new Date());
  const commercialWidthMm = positiveNumber(options.commercialWidthMm ?? 2800, 'commercialWidthMm');
  const commercialHeightMm = positiveNumber(options.commercialHeightMm ?? 2070, 'commercialHeightMm');
  const trimMm = positiveNumber(options.trimMm ?? 14, 'trimMm');

  const lines = [
    `\"HHOS 2.3.1.4 \" 18 \"\" ${serial} ${serial} 1`,
    `OA4,5 4250,0 4250,0 1 0 0 0 0 0 10,0 0 0 \"\" 0 0 999 999 0 100,0`,
    `OE-1 -1 -1`,
    `OM-1 -1 0 -1 -1 -1 -1`,
    `OI\"\" \"\" \"\" \"\" \"\" \"\" \"\" \"\"`,
    ...normalized.map((element) => elementLine(element, jobName)),
    `M\"${first.materialCode}\" 0 -1 -1 0 1`,
    `SOO1000,0 400,0 0,000 0,0 0,0 0,0 0,0 3 2 4 1 0 0 0 -1 -1 0 ${mm(first.thicknessMm)} 0 0,00 30,0 655 2000,0 1500,0 0,000 0 9999,0 9999,0 9999,0 9999,0 0,250 0`,
    `SOE0 15,0 15,0 15,0 15,0 \"\" \"\" \"\" \"\" \"\" \"---\" \"\" \"\"`,
    `SOM-1 -1 0 0 0 25,0 0 4200 6500 0 0 0 -1 0 20,0 5,0 -1 1,0 -50,0 0 -1 1 500 0 500 0 15`,
    `SOH\"\" 0 0,0 0,0 \"\" 0`,
    `SOV\"\" 0 0,0 0,0 \"\" 0`,
    `SOS0,0 0,00 0,00 0,00 0,00 0,00 0,00 0,00 0,00 0 0`,
    `SM0 \"\" ${mm(commercialWidthMm)} ${mm(commercialHeightMm)} 9999 0 100 ${mm(trimMm)} ${mm(trimMm)} ${mm(trimMm)} ${mm(trimMm)} -1 0 0 0 0,00 0`
  ];

  return `${lines.join('\r\n')}\r\n`;
}
