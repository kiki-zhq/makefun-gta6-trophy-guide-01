// Leonida Legends — GTA VI trophy guide and tracker.
// Loads app/data/trophies.json, renders a filterable checklist, saves earned
// trophies in localStorage, exports/imports progress, hides story spoilers
// in the list until they are earned, and opens a per-trophy detail view.

const STORAGE_KEY = 'leonida-legends-progress-v1';
const DATA_URL = 'data/trophies.json';

const listEl = document.getElementById('trophyList');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const gradeCounts = document.getElementById('gradeCounts');
const resultCount = document.getElementById('resultCount');
const emptyNote = document.getElementById('emptyNote');
const statusLine = document.getElementById('statusLine');

const gradeFilter = document.getElementById('gradeFilter');
const kindFilter = document.getElementById('kindFilter');
const missableOnly = document.getElementById('missableOnly');
const hideEarned = document.getElementById('hideEarned');
const spoilerToggle = document.getElementById('spoilerToggle');
const searchBox = document.getElementById('searchBox');

const overlay = document.getElementById('detailOverlay');
const detailClose = document.getElementById('detailClose');
const detailName = document.getElementById('detailName');
const detailDesc = document.getElementById('detailDesc');
const detailGrade = document.getElementById('detailGrade');
const detailKind = document.getElementById('detailKind');
const detailMissable = document.getElementById('detailMissable');
const detailGuide = document.getElementById('detailGuide');
const detailSources = document.getElementById('detailSources');
const detailEarned = document.getElementById('detailEarned');

let trophies = [];
let earned = loadEarned();
let detailId = null;

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function flash(message) {
  statusLine.textContent = message;
  window.clearTimeout(flash.timer);
  flash.timer = window.setTimeout(() => { statusLine.textContent = ''; }, 4000);
}

function spoilersOn() {
  return spoilerToggle.checked;
}

function isSpoiled(trophy) {
  return spoilersOn() && trophy.kind === 'story' && !earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function pill(text, cls) {
  const span = document.createElement('span');
  span.className = 'pill ' + cls;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = trophies.length;
  const got = trophies.filter((t) => earned.has(t.id)).length;
  progressText.textContent = got + ' of ' + total + ' earned';
  const pct = total ? Math.round((got / total) * 100) : 0;
  progressPct.textContent = pct + '%';
  progressFill.style.width = pct + '%';
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  gradeCounts.textContent = grades
    .map((g) => {
      const all = trophies.filter((t) => t.grade === g).length;
      const done = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
      return gradeLabel(g) + ' ' + done + '/' + all;
    })
    .join(' · ');
}

function filteredTrophies() {
  const grade = gradeFilter.value;
  const kind = kindFilter.value;
  const query = searchBox.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false;
    if (kind !== 'all' && t.kind !== kind) return false;
    if (missableOnly.checked && !t.missable) return false;
    if (hideEarned.checked && earned.has(t.id)) return false;
    if (query) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function renderList() {
  const shown = filteredTrophies();
  listEl.textContent = '';
  emptyNote.hidden = shown.length > 0;
  resultCount.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies';

  for (const trophy of shown) {
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(trophy.id) ? ' earned' : '');
    card.dataset.id = String(trophy.id);

    const top = document.createElement('div');
    top.className = 'card-top';
    const name = document.createElement('h3');
    name.textContent = isSpoiled(trophy) ? 'Story trophy — hidden' : trophy.name;
    top.appendChild(name);
    top.appendChild(pill(gradeLabel(trophy.grade), trophy.grade));
    card.appendChild(top);

    if (isSpoiled(trophy)) {
      const mask = document.createElement('p');
      mask.className = 'spoiler-mask';
      mask.textContent = 'Spoiler hidden — earn this trophy, or open it, to see its name and guide.';
      card.appendChild(mask);
    } else {
      const desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = trophy.description;
      card.appendChild(desc);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.appendChild(pill(kindLabel(trophy.kind), 'kind'));
    if (trophy.missable) meta.appendChild(pill('Missable', 'missable'));
    card.appendChild(meta);

    const earnedBox = document.createElement('label');
    earnedBox.className = 'earned-box';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.setAttribute('aria-label', 'Earned: ' + trophy.name);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      setEarned(trophy.id, box.checked);
    });
    earnedBox.appendChild(box);
    earnedBox.appendChild(document.createTextNode('Earned'));
    card.appendChild(earnedBox);

    card.addEventListener('click', (event) => {
      if (event.target === box) return;
      openDetail(trophy.id);
    });
    listEl.appendChild(card);
  }
  renderProgress();
}

function setEarned(id, value) {
  if (value) earned.add(id);
  else earned.delete(id);
  saveEarned();
  renderList();
  if (detailId === id) syncDetailEarned();
}

function renderAll() {
  renderList();
}

function openDetail(id) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy) return;
  detailId = id;
  // Opening a trophy is a deliberate choice, so the detail view shows the
  // full guide even when the list hides story spoilers.
  detailGrade.textContent = '';
  detailGrade.appendChild(pill(gradeLabel(trophy.grade) + ' trophy', trophy.grade));
  detailName.textContent = trophy.name;
  detailDesc.textContent = trophy.description;
  detailKind.textContent = 'Kind: ' + kindLabel(trophy.kind) + '  ·  Trophy ' + trophy.id + ' of ' + trophies.length;
  detailMissable.textContent = trophy.missable
    ? '⚠ Missable — ' + trophy.missable_reason
    : 'Not missable — ' + trophy.missable_reason;
  detailGuide.textContent = trophy.guide;
  detailSources.textContent = '';
  for (const source of trophy.sources || []) {
    const item = document.createElement('li');
    item.textContent = source;
    detailSources.appendChild(item);
  }
  syncDetailEarned();
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function syncDetailEarned() {
  detailEarned.checked = earned.has(detailId);
}

function closeDetail() {
  detailId = null;
  overlay.hidden = true;
  document.body.style.overflow = '';
  if (location.hash.startsWith('#trophy-')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

detailEarned.addEventListener('change', () => {
  if (detailId !== null) setEarned(detailId, detailEarned.checked);
});
detailClose.addEventListener('click', closeDetail);
overlay.addEventListener('click', (event) => {
  if (event.target === overlay) closeDetail();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !overlay.hidden) closeDetail();
  // Press "/" anywhere (outside a text field) to jump to the search box.
  if (event.key === '/' && document.activeElement !== searchBox && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT') {
    event.preventDefault();
    searchBox.focus();
  }
});

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    guide: 'Leonida Legends',
    exported: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash('Progress exported (' + payload.earned.length + ' earned).');
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const ids = Array.isArray(data) ? data : data.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const valid = new Set(trophies.map((t) => t.id));
      const next = new Set();
      for (const id of ids) {
        if (valid.has(id)) next.add(id);
      }
      earned = next;
      saveEarned();
      renderAll();
      flash('Progress imported (' + next.size + ' earned).');
    } catch {
      flash('That file could not be imported — it is not a progress export from this guide.');
    }
  };
  reader.readAsText(file);
}

document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importInput').addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) importProgress(file);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies?')) {
    earned = new Set();
    saveEarned();
    renderAll();
    flash('Progress reset.');
  }
});

for (const control of [gradeFilter, kindFilter, missableOnly, hideEarned, spoilerToggle]) {
  control.addEventListener('change', renderList);
}
searchBox.addEventListener('input', renderList);

function applyDeepLinks() {
  const params = new URLSearchParams(location.search);
  const grade = params.get('grade');
  if (grade && ['platinum', 'gold', 'silver', 'bronze'].includes(grade)) {
    gradeFilter.value = grade;
    renderList();
  }
  if (location.hash === '#roadmap') {
    document.getElementById('roadmap').scrollIntoView();
  } else if (location.hash.startsWith('#trophy-')) {
    const id = Number(location.hash.slice('#trophy-'.length));
    if (Number.isInteger(id)) openDetail(id);
  } else if (location.hash === '#trophies') {
    document.getElementById('trophies').scrollIntoView();
  }
}

window.addEventListener('hashchange', applyDeepLinks);

fetch(DATA_URL)
  .then((response) => {
    if (!response.ok) throw new Error('trophies.json failed to load');
    return response.json();
  })
  .then((data) => {
    trophies = data.trophies || data;
    renderAll();
    applyDeepLinks();
  })
  .catch(() => {
    resultCount.textContent = 'The trophy data could not be loaded. Check that data/trophies.json is present.';
  });
