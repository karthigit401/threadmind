/* ThreadMind v2 — app.js | Gemini-powered */

const PROXY = 'https://hidden-river-ba9f.kgod6900.workers.dev/';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

let matcherImg = null, finderImg = null, paletteImg = null;
let savedLooks = JSON.parse(localStorage.getItem('threadmind_saved') || '[]');

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initUploads();
  initSkinBtns();
  initTagBtns();
  document.getElementById('matcherBtn').addEventListener('click', runMatcher);
  document.getElementById('builderBtn').addEventListener('click', runBuilder);
  document.getElementById('finderBtn').addEventListener('click', runFinder);
  document.getElementById('paletteBtn').addEventListener('click', runPalette);
  renderSaved();
});

/* ─────────────────────────────────────────
   TABS
───────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

/* ─────────────────────────────────────────
   UPLOADS
───────────────────────────────────────── */
function initUploads() {
  setupUpload('matcherFile', 'matcherDrop', 'matcherPreview', d => matcherImg = d);
  setupUpload('finderFile', 'finderDrop', 'finderPreview', d => finderImg = d);
  setupUpload('paletteFile', 'paletteDrop', 'palettePreview', d => paletteImg = d);
}

function setupUpload(inputId, zoneId, previewId, onLoad) {
  const input = document.getElementById(inputId);
  const zone = document.getElementById(zoneId);
  const preview = document.getElementById(previewId);

  const handle = file => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onLoad(ev.target.result.split(',')[1]);
      preview.src = ev.target.result;
      preview.style.display = 'block';
      zone.querySelector('.upload-icon').textContent = '✓';
      zone.querySelector('.upload-text').textContent = file.name;
    };
    reader.readAsDataURL(file);
  };

  input.addEventListener('change', e => handle(e.target.files[0]));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--gold)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => { e.preventDefault(); zone.style.borderColor = ''; handle(e.dataTransfer.files[0]); });
}

/* ─────────────────────────────────────────
   SKIN + TAG BUTTONS
───────────────────────────────────────── */
function initSkinBtns() {
  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.skin-row').querySelectorAll('.skin-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function initTagBtns() {
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
  });
}

/* ─────────────────────────────────────────
   GEMINI API CALL
───────────────────────────────────────── */
async function callGemini(prompt, imageBase64 = null) {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) throw new Error('Please paste your free Gemini API key in the bar above.');

  const parts = [{ text: prompt }];
  if (imageBase64) {
    parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } });
  }

  const url = `${GEMINI_URL}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return text.replace(/```json|```/g, '').trim();
}

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function getActiveTags(selector) {
  return Array.from(document.querySelectorAll(`${selector}.active`)).map(b => b.textContent.trim()).join(', ') || 'Casual';
}

function getActiveSkin(rowId) {
  const btn = document.querySelector(`#${rowId} .skin-btn.active`);
  return btn ? btn.dataset.tone : 'dark';
}

function shopLinks(query, pin, platforms = ['Amazon', 'Flipkart', 'Myntra']) {
  const q = encodeURIComponent(query);
  const pinParam = pin ? `&pincode=${pin}` : '';
  const map = {
    Amazon: [`https://www.amazon.in/s?k=${q}${pinParam}`, 'amz'],
    Flipkart: [`https://www.flipkart.com/search?q=${q}`, 'flip'],
    Myntra: [`https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`, 'myn']
  };
  return platforms.map(p => `<a href="${map[p][0]}" class="shop-link ${map[p][1]}" target="_blank" rel="noopener">${p} →</a>`).join('');
}

function priceEstimate(budget) {
  const map = {
    'Under ₹500': ['~₹299', '~₹349', '~₹399'],
    '₹500–₹1,500': ['~₹599', '~₹799', '~₹999'],
    '₹1,500–₹3,000': ['~₹1,299', '~₹1,799', '~₹2,199'],
    '₹3,000+': ['~₹3,499', '~₹4,299', '~₹5,999'],
    'Under ₹2,000': ['~₹799', '~₹999', '~₹1,299'],
    '₹2,000–₹5,000': ['~₹1,999', '~₹2,499', '~₹3,299'],
    '₹5,000–₹10,000': ['~₹4,999', '~₹6,499', '~₹7,999'],
    '₹10,000+': ['~₹10,999', '~₹13,499', '~₹16,999'],
    '₹500–₹2,000': ['~₹599', '~₹899', '~₹1,299'],
    '₹2,000–₹5,000': ['~₹1,999', '~₹2,999', '~₹3,999'],
    'Any budget': ['~₹999', '~₹1,499', '~₹1,999'],
  };
  const arr = map[budget] || ['~₹799', '~₹999', '~₹1,299'];
  return { amz: arr[0], flip: arr[1], myn: arr[2] };
}

function setLoading(elId, msg = 'Analysing...', sub = 'Powered by Google Gemini · Free') {
  document.getElementById(elId).innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <div class="loading-text">${msg}</div>
      <div class="loading-sub">${sub}</div>
    </div>`;
}

function setErr(elId, msg) {
  document.getElementById(elId).textContent = msg;
}

function saveToLocalStorage() {
  localStorage.setItem('threadmind_saved', JSON.stringify(savedLooks));
}

/* ─────────────────────────────────────────
   TAB 1: MATCHER
───────────────────────────────────────── */
async function runMatcher() {
  setErr('matcherErr', '');
  const pin = document.getElementById('matcherPin').value;
  const budget = document.getElementById('matcherBudget').value;
  const color = document.getElementById('matcherColor').value;
  const sleeve = document.getElementById('matcherSleeve').value;
  const fabric = document.getElementById('matcherFabric').value;
  const skin = getActiveSkin('matcherSkin');
  const body = getActiveTags('.body-tag');
  const occ = getActiveTags('.occ-tag');

  setLoading('matcherResults', 'Finding your perfect matches...', 'AI is reading your garment');
  document.getElementById('matcherBtn').disabled = true;

  const prompt = `You are ThreadMind, an expert Indian fashion stylist. ${matcherImg ? 'Analyse the uploaded garment image.' : 'Assume a white Kerala kasavu mundu with gold border.'}
Return ONLY valid JSON, no markdown fences:
{
  "garment": { "type": "string", "color": "string", "pattern": "string", "style": "string" },
  "stylist_note": "2 sentences about the garment and its vibe",
  "suggestions": [
    {
      "item": "specific garment name with color+fabric+collar",
      "type": "Kurta/Shirt/etc",
      "reason": "1 sentence why it pairs well and suits ${skin} skin and ${body} body type",
      "search_query": "exact Amazon/Flipkart/Myntra search string",
      "color": "color name"
    }
  ]
}
Give exactly 4 suggestions. Skin: ${skin}, Body: ${body}, Occasion: ${occ}, Budget: ${budget}, Color: ${color}, Sleeve: ${sleeve}, Fabric: ${fabric}. Prioritise colours that flatter ${skin} skin.`;

  try {
    const raw = await callGemini(prompt, matcherImg);
    const result = JSON.parse(raw);
    renderMatcher(result, budget, pin);
  } catch(e) {
    setErr('matcherErr', e.message);
    document.getElementById('matcherResults').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
  }
  document.getElementById('matcherBtn').disabled = false;
}

function renderMatcher(result, budget, pin) {
  const chips = [result.garment?.type, result.garment?.color, result.garment?.style].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');
  const prices = priceEstimate(budget);

  const cards = (result.suggestions || []).map((s, i) => `
    <div class="sug-card">
      <div class="sug-header">
        <div class="sug-type">${s.type || 'Item'}</div>
        <div class="sug-name">${s.item}</div>
      </div>
      <div class="sug-reason">${s.reason}</div>
      <div class="price-row">
        <span class="price-badge amz">Amazon ${prices.amz}</span>
        <span class="price-badge flip">Flipkart ${prices.flip}</span>
        <span class="price-badge myn">Myntra ${prices.myn}</span>
      </div>
      <div class="sug-links">
        ${shopLinks(s.search_query, pin)}
        <button class="save-btn" onclick="saveLook('${encodeURIComponent(JSON.stringify({item:s.item,type:s.type,reason:s.reason,query:s.search_query}))}', 'Match')">Save ♡</button>
      </div>
    </div>`).join('');

  document.getElementById('matcherResults').innerHTML = `
    <div class="analysis-card">
      <h3>Garment analysis</h3>
      <div class="chip-row">${chips}</div>
      <div class="style-notes">${result.stylist_note || ''}</div>
    </div>
    <div class="suggestions-grid">${cards}</div>
    ${pin ? `<p style="font-size:11px;color:var(--ink-faint);text-align:center;margin-top:10px">Prices are estimates · Pincode ${pin} · Confirm on each platform</p>` : ''}
  `;
}

/* ─────────────────────────────────────────
   TAB 2: OUTFIT BUILDER
───────────────────────────────────────── */
async function runBuilder() {
  setErr('builderErr', '');
  const occ = getActiveTags('.builder-occ');
  const skin = document.getElementById('builderSkin').value;
  const body = document.getElementById('builderBody').value;
  const budget = document.getElementById('builderBudget').value;
  const vibe = document.getElementById('builderVibe').value;
  const pin = document.getElementById('builderPin').value;

  setLoading('builderResults', 'Building your complete outfit...', 'Top · Bottom · Footwear · Accessories');
  document.getElementById('builderBtn').disabled = true;

  const prompt = `You are ThreadMind, an expert Indian fashion stylist. Create a complete outfit for: Occasion: ${occ}, Skin tone: ${skin}, Body type: ${body}, Budget: ${budget}, Style vibe: ${vibe}.
Return ONLY valid JSON, no markdown fences:
{
  "outfit_title": "catchy name for this look",
  "occasion_note": "1 sentence about why this works for the occasion",
  "items": [
    {
      "category": "Top/Bottom/Footwear/Watch/Accessory/etc",
      "emoji": "single relevant emoji",
      "name": "specific product name with color+fabric",
      "reason": "why this works for ${skin} skin, ${body} body",
      "estimated_price": "₹XXX",
      "search_query": "exact search string"
    }
  ],
  "total_estimated": "₹XXXX",
  "stylist_tip": "1 sentence pro tip to elevate the look"
}
Include: top, bottom, footwear, and 2 accessories. Keep total within ${budget}.`;

  try {
    const raw = await callGemini(prompt);
    const result = JSON.parse(raw);
    renderBuilder(result, pin);
  } catch(e) {
    setErr('builderErr', e.message);
    document.getElementById('builderResults').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
  }
  document.getElementById('builderBtn').disabled = false;
}

function renderBuilder(result, pin) {
  const items = (result.items || []).map(item => `
    <div class="outfit-item">
      <div class="outfit-item-icon">${item.emoji || '👔'}</div>
      <div class="outfit-item-body">
        <div class="outfit-item-cat">${item.category}</div>
        <div class="outfit-item-name">${item.name}</div>
        <div class="outfit-item-reason">${item.reason}</div>
        <div class="outfit-item-links">
          <span class="outfit-price">${item.estimated_price}</span>
          ${shopLinks(item.search_query, pin)}
          <button class="save-btn" onclick="saveLook('${encodeURIComponent(JSON.stringify({item:item.name,type:item.category,reason:item.reason,query:item.search_query}))}', 'Builder')">Save ♡</button>
        </div>
      </div>
    </div>`).join('');

  document.getElementById('builderResults').innerHTML = `
    <div class="analysis-card">
      <h3>${result.outfit_title || 'Your complete look'}</h3>
      <div class="style-notes">${result.occasion_note || ''}</div>
    </div>
    <div class="outfit-grid">${items}</div>
    <div class="budget-summary">
      <div>
        <div class="budget-label">Total estimated budget</div>
        ${result.stylist_tip ? `<div style="font-size:12px;color:var(--gold-dark);margin-top:3px">💡 ${result.stylist_tip}</div>` : ''}
      </div>
      <div class="budget-total">${result.total_estimated || ''}</div>
    </div>
  `;
}

/* ─────────────────────────────────────────
   TAB 3: FIND THIS DRESS
───────────────────────────────────────── */
async function runFinder() {
  setErr('finderErr', '');
  if (!finderImg) { setErr('finderErr', 'Please upload a photo first.'); return; }
  const budget = document.getElementById('finderBudget').value;
  const pin = document.getElementById('finderPin').value;

  setLoading('finderResults', 'Identifying the outfit...', 'AI is reading colors, cut & style');
  document.getElementById('finderBtn').disabled = true;

  const prompt = `You are ThreadMind, a fashion identification expert. Analyse the uploaded outfit photo.
Return ONLY valid JSON, no markdown fences:
{
  "identified": {
    "garment_type": "string",
    "color": "string",
    "pattern": "string",
    "fabric_guess": "string",
    "style": "string",
    "brand_guess": "string or Unknown"
  },
  "description": "2 sentence description of what you see",
  "similar_products": [
    {
      "name": "specific similar product name",
      "match_reason": "why this is similar",
      "search_query": "exact Amazon/Flipkart/Myntra search string",
      "estimated_price": "₹XXX"
    }
  ]
}
Give exactly 4 similar products within budget: ${budget}.`;

  try {
    const raw = await callGemini(prompt, finderImg);
    const result = JSON.parse(raw);
    renderFinder(result, pin);
  } catch(e) {
    setErr('finderErr', e.message);
    document.getElementById('finderResults').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
  }
  document.getElementById('finderBtn').disabled = false;
}

function renderFinder(result, pin) {
  const id = result.identified || {};
  const chips = [id.garment_type, id.color, id.style, id.fabric_guess].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');

  const cards = (result.similar_products || []).map(s => `
    <div class="sug-card">
      <div class="sug-header">
        <div class="sug-type">Similar product</div>
        <div class="sug-name">${s.name}</div>
      </div>
      <div class="sug-reason">${s.match_reason}</div>
      <div class="price-row"><span class="price-badge amz">${s.estimated_price}</span></div>
      <div class="sug-links">
        ${shopLinks(s.search_query, pin)}
        <button class="save-btn" onclick="saveLook('${encodeURIComponent(JSON.stringify({item:s.name,type:'Similar',reason:s.match_reason,query:s.search_query}))}', 'Finder')">Save ♡</button>
      </div>
    </div>`).join('');

  document.getElementById('finderResults').innerHTML = `
    <div class="analysis-card">
      <h3>What we found</h3>
      <div class="chip-row">${chips}</div>
      ${id.brand_guess && id.brand_guess !== 'Unknown' ? `<div class="chip" style="margin-top:6px">Possible brand: ${id.brand_guess}</div>` : ''}
      <div class="style-notes">${result.description || ''}</div>
    </div>
    <div class="suggestions-grid">${cards}</div>
  `;
}

/* ─────────────────────────────────────────
   TAB 4: COLOR PALETTE
───────────────────────────────────────── */
async function runPalette() {
  setErr('paletteErr', '');
  if (!paletteImg) { setErr('paletteErr', 'Please upload a garment photo first.'); return; }
  const skin = getActiveSkin('paletteSkin');

  setLoading('paletteResults', 'Extracting your color story...', 'Reading hues, tones & undertones');
  document.getElementById('paletteBtn').disabled = true;

  const prompt = `You are ThreadMind, a colour theory expert for Indian fashion. Analyse the uploaded garment's colors.
Return ONLY valid JSON, no markdown fences:
{
  "primary_color": "color name",
  "secondary_colors": ["color1", "color2"],
  "accent_color": "color name",
  "hex_suggestions": [
    { "name": "color name", "hex": "#XXXXXX", "role": "primary/secondary/accent/complement" }
  ],
  "palette_mood": "1 sentence describing the palette vibe",
  "pairs_well_with": ["color1", "color2", "color3", "color4"],
  "avoid_with": ["color1", "color2"],
  "skin_tone_note": "1 sentence about how this palette works for ${skin} skin tone",
  "styling_tips": ["tip1", "tip2", "tip3"]
}
Give 5 hex suggestions, 4 pairs well, 2 avoid.`;

  try {
    const raw = await callGemini(prompt, paletteImg);
    const result = JSON.parse(raw);
    renderPalette(result);
  } catch(e) {
    setErr('paletteErr', e.message);
    document.getElementById('paletteResults').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-text">${e.message}</div></div>`;
  }
  document.getElementById('paletteBtn').disabled = false;
}

function renderPalette(result) {
  const swatches = (result.hex_suggestions || []).map(s => `
    <div class="swatch">
      <div class="swatch-color" style="background:${s.hex}"></div>
      <div class="swatch-name">${s.name}</div>
    </div>`).join('');

  const pairsWell = (result.pairs_well_with || []).map(c => `<span class="good-tag">${c}</span>`).join('');
  const avoid = (result.avoid_with || []).map(c => `<span class="avoid-tag">${c}</span>`).join('');
  const tips = (result.styling_tips || []).map(t => `<li style="font-size:13px;color:var(--ink-muted);margin-bottom:5px;line-height:1.5">${t}</li>`).join('');

  document.getElementById('paletteResults').innerHTML = `
    <div class="analysis-card">
      <h3>Your color palette</h3>
      <div class="color-swatches" style="margin-bottom:10px">${swatches}</div>
      <div class="style-notes">${result.palette_mood || ''}</div>
    </div>
    <div class="card" style="margin-bottom:10px">
      <div class="palette-section">
        <h3>Pairs beautifully with</h3>
        <div class="color-swatches">${pairsWell}</div>
      </div>
      <div class="palette-section" style="margin-top:12px">
        <h3>Avoid pairing with</h3>
        <div class="avoid-list">${avoid}</div>
      </div>
    </div>
    <div class="card">
      <h3 style="font-size:11px;font-weight:500;letter-spacing:.8px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:10px">Skin tone note</h3>
      <div class="style-notes" style="margin-bottom:12px">${result.skin_tone_note || ''}</div>
      <h3 style="font-size:11px;font-weight:500;letter-spacing:.8px;text-transform:uppercase;color:var(--ink-faint);margin-bottom:8px">Styling tips</h3>
      <ul style="padding-left:16px">${tips}</ul>
    </div>
  `;
}

/* ─────────────────────────────────────────
   SAVE / SHARE LOOKS
───────────────────────────────────────── */
function saveLook(encodedData, source) {
  try {
    const data = JSON.parse(decodeURIComponent(encodedData));
    const look = {
      id: Date.now(),
      source,
      item: data.item,
      type: data.type,
      reason: data.reason,
      query: data.query,
      savedAt: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
    };
    savedLooks.unshift(look);
    saveToLocalStorage();
    renderSaved();
    alert('Look saved! ♡ Check your Saved Looks tab.');
  } catch(e) {
    console.error('Save error', e);
  }
}

function renderSaved() {
  const grid = document.getElementById('savedGrid');
  const empty = document.getElementById('savedEmpty');
  if (!savedLooks.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = savedLooks.map(look => `
    <div class="saved-card" id="saved-${look.id}">
      <div class="saved-card-title">${look.item}</div>
      <div class="saved-card-meta">${look.type} · Saved from ${look.source} · ${look.savedAt}</div>
      <div class="saved-card-items">${look.reason}</div>
      <div class="saved-card-actions">
        <a href="https://www.amazon.in/s?k=${encodeURIComponent(look.query)}" target="_blank" class="action-btn">Amazon →</a>
        <a href="https://www.flipkart.com/search?q=${encodeURIComponent(look.query)}" target="_blank" class="action-btn">Flipkart →</a>
        <button class="action-btn" onclick="openShare(${look.id})">Share</button>
        <button class="action-btn danger" onclick="deleteLook(${look.id})">Delete</button>
      </div>
    </div>`).join('');
}

function deleteLook(id) {
  savedLooks = savedLooks.filter(l => l.id !== id);
  saveToLocalStorage();
  renderSaved();
}

function openShare(id) {
  const look = savedLooks.find(l => l.id === id);
  if (!look) return;
  document.getElementById('shareText').value =
`🧵 ThreadMind Look

Item: ${look.item}
Type: ${look.type}
Why: ${look.reason}

🛍️ Shop it:
Amazon: https://www.amazon.in/s?k=${encodeURIComponent(look.query)}
Flipkart: https://www.flipkart.com/search?q=${encodeURIComponent(look.query)}
Myntra: https://www.myntra.com/${encodeURIComponent(look.query.replace(/\s+/g,'-'))}

Found with ThreadMind — AI Fashion Assistant`;
  document.getElementById('shareModal').style.display = 'flex';
}

function closeShare() {
  document.getElementById('shareModal').style.display = 'none';
}

function copyShare() {
  const ta = document.getElementById('shareText');
  ta.select();
  document.execCommand('copy');
  alert('Copied to clipboard!');
}

document.getElementById('shareModal').addEventListener('click', e => {
  if (e.target === document.getElementById('shareModal')) closeShare();
});
