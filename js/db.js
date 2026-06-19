/* ============================================================
   db.js — Couche de stockage local (localStorage)
   Toutes les données de l'app sont conservées dans une seule
   clé JSON. Pas de backend, fonctionne hors-ligne.
   ============================================================ */

const STORAGE_KEY = 'darija-arabic-data-v1';

// Sections créées par défaut au premier lancement (vides).
const DEFAULT_SECTIONS = [
  { name: 'Lettres', type: 'word' },
  { name: 'Nombres', type: 'word' },
  { name: 'Couleurs', type: 'word' },
  { name: 'Animaux', type: 'word' },
  { name: 'Corps humain', type: 'word' },
  { name: 'Famille', type: 'word' },
  { name: 'Nourriture', type: 'word' },
  { name: 'Verbes', type: 'verb' },
];

// Définition de la grille de conjugaison.
const PERSONS = [
  { key: '1sg',   label: '1ʳᵉ sing. (je)',        genders: ['n'] },
  { key: '2sg',   label: '2ᵉ sing. (tu)',         genders: ['m', 'f'] },
  { key: '3sg',   label: '3ᵉ sing. (il/elle)',    genders: ['m', 'f'] },
  { key: '1pl',   label: '1ʳᵉ pl. (nous)',        genders: ['n'] },
  { key: '2pl',   label: '2ᵉ pl. (vous)',         genders: ['m', 'f'] },
  { key: '3pl',   label: '3ᵉ pl. (ils/elles)',    genders: ['m', 'f'] },
];
const TENSES = [
  { key: 'present', label: 'Présent' },
  { key: 'passe',   label: 'Passé' },
  { key: 'futur',   label: 'Futur' },
];
const GENDER_LABEL = { m: 'masc.', f: 'fém.', n: '' };

// --------- Identifiants ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// --------- Lecture / écriture brute ----------
function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Lecture du stockage impossible', e);
    return null;
  }
}

function saveRaw(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// État en mémoire
let state = null;

function init() {
  state = loadRaw();
  if (!state || !Array.isArray(state.sections)) {
    state = { version: 1, sections: [], words: [] };
    DEFAULT_SECTIONS.forEach((s) => {
      state.sections.push({ id: uid(), name: s.name, type: s.type });
    });
    persist();
  }
  return state;
}

function persist() {
  saveRaw(state);
}

// --------- Sections ----------
function getSections() {
  return state.sections.map((s) => ({
    ...s,
    count: state.words.filter((w) => w.sectionId === s.id).length,
  }));
}

function getSection(id) {
  return state.sections.find((s) => s.id === id) || null;
}

function addSection(name, type = 'word') {
  const section = { id: uid(), name: name.trim(), type };
  state.sections.push(section);
  persist();
  return section;
}

function renameSection(id, name) {
  const s = getSection(id);
  if (s) { s.name = name.trim(); persist(); }
}

function deleteSection(id) {
  state.sections = state.sections.filter((s) => s.id !== id);
  state.words = state.words.filter((w) => w.sectionId !== id);
  persist();
}

// --------- Mots ----------
function getWords(sectionId) {
  return state.words.filter((w) => w.sectionId === sectionId);
}

function getWord(id) {
  return state.words.find((w) => w.id === id) || null;
}

function getAllWords() {
  return state.words;
}

// Construit une grille de conjugaison vide.
function emptyConjugation() {
  const conj = {};
  TENSES.forEach((t) => {
    conj[t.key] = {};
    PERSONS.forEach((p) => {
      p.genders.forEach((g) => {
        conj[t.key][`${p.key}_${g}`] = { ar: '', dz: '' };
      });
    });
  });
  return conj;
}

function addWord(sectionId, data) {
  const section = getSection(sectionId);
  const base = { id: uid(), sectionId, missCount: 0, seenCount: 0 };
  let word;
  if (section && section.type === 'verb') {
    word = {
      ...base,
      type: 'verb',
      fr: data.fr || '',
      ar_base: data.ar_base || '',
      ar_base_tr: data.ar_base_tr || '',
      dz_base: data.dz_base || '',
      dz_base_tr: data.dz_base_tr || '',
      conj: data.conj || emptyConjugation(),
    };
  } else {
    word = {
      ...base,
      type: 'word',
      fr: data.fr || '',
      ar: data.ar || '',
      ar_tr: data.ar_tr || '',
      dz: data.dz || '',
      dz_tr: data.dz_tr || '',
    };
  }
  state.words.push(word);
  persist();
  return word;
}

function updateWord(id, data) {
  const w = getWord(id);
  if (!w) return;
  Object.assign(w, data);
  persist();
  return w;
}

function deleteWord(id) {
  state.words = state.words.filter((w) => w.id !== id);
  persist();
}

// Statistiques de révision (priorisation des mots ratés)
function recordResult(id, success) {
  const w = getWord(id);
  if (!w) return;
  w.seenCount = (w.seenCount || 0) + 1;
  if (!success) w.missCount = (w.missCount || 0) + 1;
  else if (w.missCount > 0) w.missCount = Math.max(0, w.missCount - 1);
  persist();
}

// --------- Export / Import ----------
function exportData() {
  return JSON.stringify(state, null, 2);
}

function importData(json, merge = false) {
  const incoming = typeof json === 'string' ? JSON.parse(json) : json;
  if (!incoming || !Array.isArray(incoming.sections) || !Array.isArray(incoming.words)) {
    throw new Error('Fichier invalide : sections ou mots manquants.');
  }
  if (merge) {
    // Fusion : on ajoute sans écraser (nouveaux ids pour éviter collisions).
    const idMap = {};
    incoming.sections.forEach((s) => {
      const newId = uid();
      idMap[s.id] = newId;
      state.sections.push({ id: newId, name: s.name, type: s.type || 'word' });
    });
    incoming.words.forEach((w) => {
      const newSectionId = idMap[w.sectionId];
      if (newSectionId) {
        state.words.push({ ...w, id: uid(), sectionId: newSectionId });
      }
    });
  } else {
    state = {
      version: incoming.version || 1,
      sections: incoming.sections,
      words: incoming.words,
    };
  }
  persist();
  return state;
}

window.DB = {
  init, persist,
  getSections, getSection, addSection, renameSection, deleteSection,
  getWords, getWord, getAllWords, addWord, updateWord, deleteWord,
  emptyConjugation, recordResult,
  exportData, importData,
  PERSONS, TENSES, GENDER_LABEL,
};
