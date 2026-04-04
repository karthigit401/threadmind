/* ThreadMind — app.js */

let skinTone = 'dark';
let imageBase64 = null;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initSkinBtns();
  initTagBtns();
  initPlatBtns();
  initFileUpload();
  initPincode();
  document.getElementById('goBtn').addEventListener('click', findMatches);
});

/* ── Skin tone ── */
function initSkinBtns() {
  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      skinTone = btn.dataset.tone;
    });
  });
}

/* ── Occasion tags ── */
function initTagBtns() {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

/* ── Platform buttons ── */
function initPlatBtns() {
  document.querySelectorAll('.plat-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

/* ── File upload ── */
function initFileUpload() {
  const input = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');

  input.addEventListener('change', e => handleFile(e.target.files[0]));

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--gold)';
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '';
  });
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = ev => {
    imageBase64 = ev.target.result.split(',')[1];
    const prev = document.getElementById('preview');
    prev.src = ev.target.result;
    prev.style.display = 'block';
    document.querySelector('.upload-icon').textContent = '✓';
    document.querySelector('.upload-text').textContent = file.name;
    document.querySelector('.upload-sub').textContent = 'Image ready · click to change';
  };
  reader.readAsDataURL(file);
}

/* ── Pincode ── */
function initPincode() {
  const input = document.getElementById('pincode');
  const note = document.getElementById('pinNote');
  const check = () => {
    note.style.display = (input.value.length === 6 && /^\d+$/.test(input.value)) ? 'block' : 'none';
  };
  input.addEventListener('input', check);
  check();
}

/* ── Helpers ── */
function getOccasions() {
  const tags = Array.from(document.querySelectorAll('.tag-btn.active')).map(b => b.textContent);
  return tags.length ? tags.join(', ') : 'Casual';
}

function getPlatforms() {
  return Array.from(document.querySelectorAll('.plat-btn.active')).map(b => b.textContent);
}

function buildSearchUrl(platform, query, pincode) {
  const q = encodeURIComponent(query);
  if (platform === 'Amazon') {
    const pin = pincode ? `&pincode=${pincode}` : '';
    return `https://www.amazon.in/s?k=${q}${pin}`;
  }
  if (platform === 'Flipkart') return `https://www.flipkart.com/search?q=${q}`;
  if (platform === 'Myntra') return `https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`;
  return '#';
}

function showError(msg) {
  const el = document.getElementById('errMsg');
  el.textContent = msg;
}

function clearError() {
  document.getElementById('errMsg').textContent = '';
}

/* ── Main: Find matches ── */
async function findMatches() {
  clearError();

  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) { showError('Please enter your Anthropic API key to continue.'); return; }
  if (!apiKey.startsWith('sk-ant-')) { showError('API key should start with sk-ant-'); return; }

  const occasions = getOccasions();
  const budget = document.getElementById('budget').value;
  const colorPref = document.getElementById('colorPref').value;
  const sleeve = document.getElementById('sleeve').value;
  const fabric = document.getElementById('fabric').value;
  const pincode = document.getElementById('pincode').value;
  const platforms = getPlatforms();

  if (!platforms.length) { showError('Please select at least one shopping platform.'); return; }

  const btn = document.getElementById('goBtn');
  btn.disabled = true;

  const resultsEl = document.getElementById('results-section');
  const inputEl = document.getElementById('input-section');
  resultsEl.style.display = 'block';
  resultsEl.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">Analysing your garment…</div>
      <div class="loading-sub">Matching styles, colours & occasions</div>
    </div>`;

  const systemPrompt = `You are ThreadMind, an expert Indian fashion stylist. Analyse the garment and return ONLY a valid JSON object with NO markdown fences, NO preamble. Structure:
{
  "garment": { "type": "string", "color": "string", "pattern": "string", "style": "string" },
  "stylist_note": "2 sentences: what the garment is, what vibe it gives",
  "suggestions": [
    {
      "item": "specific garment name with color+fabric+collar style",
      "type": "garment type (Kurta / Shirt / etc)",
      "reason": "1 sentence why it pairs well",
      "search_query": "exact search string for Amazon/Flipkart/Myntra",
      "color": "color name"
    }
  ]
}
Give exactly 4 suggestions. Inputs: skin tone = ${skinTone}, occasion = ${occasions}, budget = ${budget}, color preference = ${colorPref}, sleeve = ${sleeve}, fabric = ${fabric}. Prioritise colours that flatter ${skinTone} skin beautifully. Be very specific in item names and search queries.`;

  const userContent = imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: `Analyse this garment. Skin: ${skinTone}, Occasion: ${occasions}, Budget: ${budget}, Color: ${colorPref}, Sleeve: ${sleeve}, Fabric: ${fabric}` }
      ]
    : `No image. Assume white Kerala kasavu mundu with gold border. Skin: ${skinTone}, Occasion: ${occasions}, Budget: ${budget}, Color: ${colorPref}, Sleeve: ${sleeve}, Fabric: ${fabric}. Suggest 4 matching half kurtas.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content.find(b => b.type === 'text')?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    inputEl.style.display = 'none';
    renderResults(result, platforms, pincode);
  } catch (err) {
    resultsEl.style.display = 'none';
    showError('Error: ' + (err.message || 'Something went wrong. Please try again.'));
  }

  btn.disabled = false;
}

/* ── Render results ── */
function renderResults(result, platforms, pincode) {
  const resultsEl = document.getElementById('results-section');

  const platClass = { Amazon: 'amz', Flipkart: 'flip', Myntra: 'myn' };

  const shopLinks = (query) =>
    platforms.map(p =>
      `<a href="${buildSearchUrl(p, query, pincode)}" class="shop-link ${platClass[p]}" target="_blank" rel="noopener">${p} →</a>`
    ).join('');

  const chips = [result.garment?.type, result.garment?.color, result.garment?.style]
    .filter(Boolean)
    .map(c => `<span class="chip">${c}</span>`)
    .join('');

  const cards = (result.suggestions || []).map(s => `
    <div class="sug-card">
      <div class="sug-header">
        <div class="sug-type">${s.type || 'Item'}</div>
        <div class="sug-name">${s.item}</div>
      </div>
      <div class="sug-reason">${s.reason}</div>
      <div class="sug-links">${shopLinks(s.search_query)}</div>
    </div>
  `).join('');

  resultsEl.innerHTML = `
    <div class="results-header">
      <div class="results-title">Your style picks</div>
      <button class="reset-btn" onclick="resetApp()">← Start over</button>
    </div>
    <div class="analysis-card">
      <h3>Garment analysis</h3>
      <div class="chip-row">${chips}</div>
      <div class="style-notes">${result.stylist_note || ''}</div>
    </div>
    <div class="suggestions-grid">${cards}</div>
    ${pincode ? `<div class="pin-footer">Delivery to ${pincode} · Confirm delivery date on each platform after clicking</div>` : ''}
  `;
}

/* ── Reset ── */
function resetApp() {
  document.getElementById('input-section').style.display = 'block';
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('results-section').innerHTML = '';
  document.getElementById('goBtn').disabled = false;
  clearError();
}
