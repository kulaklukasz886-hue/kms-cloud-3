import { estimatePlateRequirementFromCsv, parseKmsOptimizationCsv } from '../src/index.mjs';
import { generateHha, validateHha } from '../src/hha.mjs';

const $ = (selector) => document.querySelector(selector);
const state = { csvText: '', fileName: '', result: null, parsed: null };

const refs = {
  file: $('#csv-file'),
  paste: $('#csv-paste'),
  analyze: $('#analyze-button'),
  clear: $('#clear-button'),
  examples: $('#example-buttons'),
  status: $('#status'),
  summary: $('#summary'),
  groups: $('#groups'),
  boards: $('#boards'),
  downloadHha: $('#download-hha'),
  downloadJson: $('#download-json')
};

const examples = [
  ['320.REMIK', '../tests/fixtures/320.REMIK.csv'],
  ['955.FIZYK', '../tests/fixtures/955.FIZYK_W1000_ST9_18MM.csv'],
  ['902.ANTROPIK', '../tests/fixtures/902.ANTROPIK_D9163_BS_18MM.csv']
];

function setStatus(message, type = 'info') {
  refs.status.textContent = message;
  refs.status.dataset.type = type;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fmt(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('pl-PL', { maximumFractionDigits: digits });
}

function downloadText(fileName, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resetResults() {
  state.result = null;
  state.parsed = null;
  refs.summary.innerHTML = '';
  refs.groups.innerHTML = '';
  refs.boards.innerHTML = '';
  refs.downloadHha.disabled = true;
  refs.downloadJson.disabled = true;
  refs.downloadHha.removeAttribute('title');
}

function renderSummary(result) {
  const cards = [
    ['Wiersze CSV', result.source?.sourceRows],
    ['Formatki', result.source?.expandedPieceCount],
    ['Grupy materiałowe', result.metrics?.materialGroupCount],
    ['Fizyczne płyty', result.physicalBoardCount],
    ['Do zakupu', result.purchasePlan?.newBoardsToPurchase == null ? 'NIEUSTALONE' : result.purchasePlan.newBoardsToPurchase],
    ['Status', result.status]
  ];
  refs.summary.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>`).join('');
}

function renderGroups(result) {
  refs.groups.innerHTML = result.materialGroups.map((group) => `
    <article class="group-card">
      <div>
        <strong>${escapeHtml(group.material.materialCode)}</strong>
        <span>${escapeHtml(group.material.decorCode)} · ${fmt(group.material.thicknessMm, 1)} mm</span>
      </div>
      <dl>
        <div><dt>Pozycje</dt><dd>${group.elementRows}</dd></div>
        <div><dt>Formatki</dt><dd>${group.expandedPieceCount}</dd></div>
        <div><dt>Płyty</dt><dd>${group.physicalBoardCount}</dd></div>
        <div><dt>Dolna granica</dt><dd>${group.metrics.areaLowerBound}</dd></div>
      </dl>
    </article>`).join('');
}

function pieceFill(piece) {
  const seed = [...String(piece.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `hsl(${seed % 360} 48% 52%)`;
}

function boardSvg(board) {
  const pieces = board.pieces.map((piece) => {
    const small = piece.widthMm < 230 || piece.heightMm < 130;
    const label = small ? '' : `
      <text x="${piece.xMm + 12}" y="${piece.yMm + 30}" class="piece-id">${escapeHtml(piece.id)}.${piece.copy}</text>
      <text x="${piece.xMm + 12}" y="${piece.yMm + 54}" class="piece-size">${fmt(piece.widthMm, 1)}×${fmt(piece.heightMm, 1)}</text>`;
    return `
      <g>
        <rect x="${piece.xMm}" y="${piece.yMm}" width="${piece.widthMm}" height="${piece.heightMm}" fill="${pieceFill(piece)}" />
        ${label}
      </g>`;
  }).join('');

  const largest = board.largestFreeRectangle;
  const free = largest ? `
    <rect class="largest-free" x="${largest.xMm}" y="${largest.yMm}" width="${largest.widthMm}" height="${largest.heightMm}" />` : '';

  return `
    <article class="board-card">
      <header>
        <div><strong>Płyta ${board.index}</strong><span>${board.pieces.length} formatek</span></div>
        <span>${largest ? `Największa reszta ${fmt(largest.widthMm, 1)}×${fmt(largest.heightMm, 1)}` : 'Brak wykrytej reszty'}</span>
      </header>
      <div class="board-canvas">
        <svg viewBox="0 0 ${board.widthMm} ${board.heightMm}" role="img" aria-label="Rozkrój płyty ${board.index}">
          <rect class="board-background" x="0" y="0" width="${board.widthMm}" height="${board.heightMm}" />
          ${free}
          ${pieces}
        </svg>
      </div>
    </article>`;
}

function renderBoards(result) {
  refs.boards.innerHTML = result.materialGroups.map((group) => `
    <section class="material-board-section">
      <h2>${escapeHtml(group.material.materialCode)} · ${fmt(group.material.thicknessMm, 1)} mm</h2>
      <div class="board-grid">${group.boards.map(boardSvg).join('')}</div>
    </section>`).join('');
}

function updateHhaAvailability() {
  refs.downloadHha.disabled = true;
  if (!state.result || !state.parsed || state.result.materialGroups.length !== 1) return;
  try {
    const order = state.parsed.elements[0]?.orderId || 'KMS_TEST';
    const material = state.parsed.elements[0]?.materialCode || 'MATERIAL';
    const jobName = `${order}_${material}`.replace(/[^A-Za-z0-9_.-]+/g, '_').slice(0, 60);
    const hha = generateHha(state.parsed.elements, { jobName });
    validateHha(hha, {
      elementRows: state.parsed.sourceRows,
      expandedPieceCount: state.parsed.expandedPieceCount,
      materialCode: material,
      requireOneToOneDimensions: true
    });
    refs.downloadHha.disabled = false;
    refs.downloadHha.dataset.jobName = jobName;
  } catch (error) {
    refs.downloadHha.title = `HHA zablokowane: ${error.message}`;
  }
}

function analyzeCsv() {
  const csvText = refs.paste.value.trim() || state.csvText.trim();
  resetResults();
  if (!csvText) {
    setStatus('Wczytaj plik CSV albo wklej jego zawartość.', 'error');
    return;
  }
  try {
    setStatus('Trwa optymalizacja…');
    const parsed = parseKmsOptimizationCsv(csvText);
    const result = estimatePlateRequirementFromCsv(csvText);
    state.csvText = csvText;
    state.parsed = parsed;
    state.result = result;

    renderSummary(result);
    renderGroups(result);
    renderBoards(result);
    refs.downloadJson.disabled = false;
    updateHhaAvailability();

    const valid = result.validation.complete && result.validation.geometryValid && result.validation.panelCutFeasible;
    setStatus(
      valid
        ? `Gotowe: ${result.source.expandedPieceCount} formatek, ${result.physicalBoardCount} fizycznych płyt. Wynik testowy — nie jest liczbą do zakupu.`
        : 'Wynik został zablokowany przez walidację technologiczną.',
      valid ? 'success' : 'error'
    );
  } catch (error) {
    setStatus(error instanceof Error ? error.message : String(error), 'error');
  }
}

refs.file.addEventListener('change', async () => {
  const file = refs.file.files?.[0];
  if (!file) return;
  state.fileName = file.name;
  state.csvText = await file.text();
  refs.paste.value = state.csvText;
  setStatus(`Wczytano ${file.name}. Naciśnij „Optymalizuj”.`);
});

refs.analyze.addEventListener('click', analyzeCsv);
refs.clear.addEventListener('click', () => {
  state.csvText = '';
  state.fileName = '';
  refs.file.value = '';
  refs.paste.value = '';
  resetResults();
  setStatus('Ekran wyczyszczony.');
});

refs.downloadJson.addEventListener('click', () => {
  if (!state.result) return;
  const base = state.fileName.replace(/\.csv$/i, '') || state.parsed?.elements[0]?.orderId || 'kms-optymalizacja';
  downloadText(`${base}.optimization.json`, JSON.stringify(state.result, null, 2), 'application/json;charset=utf-8');
});

refs.downloadHha.addEventListener('click', () => {
  if (!state.parsed) return;
  try {
    const jobName = refs.downloadHha.dataset.jobName || 'KMS_TEST';
    const hha = generateHha(state.parsed.elements, { jobName });
    downloadText(`${jobName}.HHA`, hha, 'text/plain;charset=windows-1250');
  } catch (error) {
    setStatus(`Eksport HHA zablokowany: ${error.message}`, 'error');
  }
});

for (const [label, url] of examples) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'example-button';
  button.textContent = label;
  button.addEventListener('click', async () => {
    try {
      setStatus(`Wczytuję przykład ${label}…`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nie można wczytać przykładu ${label}`);
      state.csvText = await response.text();
      state.fileName = `${label}.csv`;
      refs.paste.value = state.csvText;
      analyzeCsv();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });
  refs.examples.append(button);
}

setStatus('Moduł testowy. Wczytaj CSV lub wybierz przypadek referencyjny.');
