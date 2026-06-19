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

// ============================================================
//  Données de démarrage (seed) — FR / Arabe (MSA) / Darija
//  Seed versionné : on n'ajoute que les entrées manquantes
//  (déduplication par contenu), sans toucher aux ajouts perso.
// ============================================================
const CURRENT_SEED_VERSION = 4;

// Génère les nombres 1→100, puis 200…900, 999, 1000…9000.
function buildNumbers() {
  const frU = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const frT = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const frTens = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
  const frHund = { 100: 'cent', 200: 'deux cents', 300: 'trois cents', 400: 'quatre cents', 500: 'cinq cents', 600: 'six cents', 700: 'sept cents', 800: 'huit cents', 900: 'neuf cents' };
  const frThou = { 1000: 'mille', 2000: 'deux mille', 3000: 'trois mille', 4000: 'quatre mille', 5000: 'cinq mille', 6000: 'six mille', 7000: 'sept mille', 8000: 'huit mille', 9000: 'neuf mille' };

  const arU = ['صِفْر', 'وَاحِد', 'اِثْنَان', 'ثَلَاثَة', 'أَرْبَعَة', 'خَمْسَة', 'سِتَّة', 'سَبْعَة', 'ثَمَانِيَة', 'تِسْعَة'];
  const arTeen = ['عَشَرَة', 'أَحَدَ عَشَرَ', 'اِثْنَا عَشَرَ', 'ثَلَاثَةَ عَشَرَ', 'أَرْبَعَةَ عَشَرَ', 'خَمْسَةَ عَشَرَ', 'سِتَّةَ عَشَرَ', 'سَبْعَةَ عَشَرَ', 'ثَمَانِيَةَ عَشَرَ', 'تِسْعَةَ عَشَرَ'];
  const arTens = { 2: 'عِشْرُون', 3: 'ثَلَاثُون', 4: 'أَرْبَعُون', 5: 'خَمْسُون', 6: 'سِتُّون', 7: 'سَبْعُون', 8: 'ثَمَانُون', 9: 'تِسْعُون' };
  const arHund = { 100: 'مِئَة', 200: 'مِئَتَان', 300: 'ثَلَاثُمِئَة', 400: 'أَرْبَعُمِئَة', 500: 'خَمْسُمِئَة', 600: 'سِتُّمِئَة', 700: 'سَبْعُمِئَة', 800: 'ثَمَانُمِئَة', 900: 'تِسْعُمِئَة' };
  const arThou = { 1000: 'أَلْف', 2000: 'أَلْفَان', 3000: 'ثَلَاثَة آلَاف', 4000: 'أَرْبَعَة آلَاف', 5000: 'خَمْسَة آلَاف', 6000: 'سِتَّة آلَاف', 7000: 'سَبْعَة آلَاف', 8000: 'ثَمَانِيَة آلَاف', 9000: 'تِسْعَة آلَاف' };

  const dzU = ['zero', 'wahed', 'jouj', 'tlata', 'reb3a', 'khamsa', 'setta', 'seb3a', 'tmenya', 'tes3oud'];
  const dzUc = ['', 'wahed', 'tnayn', 'tlata', 'reb3a', 'khamsa', 'setta', 'seb3a', 'tmenya', 'tes3a']; // unités en composé (21-99)
  const dzTeen = ['3achra', '7dach', 'tnach', 'teltach', 'reb3tach', 'khamstach', 'settach', 'seb3tach', 'tmentach', 'tes3tach'];
  const dzTens = { 2: '3achrin', 3: 'tlatin', 4: 'reb3in', 5: 'khamsin', 6: 'settin', 7: 'seb3in', 8: 'tmanin', 9: 'tes3in' };
  const dzHund = { 100: 'mya', 200: 'mytin', 300: 'telt mya', 400: 'rbe3 mya', 500: 'khams mya', 600: 'sett mya', 700: 'sbe3 mya', 800: 'tmen mya', 900: 'tse3 mya' };
  const dzThou = { 1000: 'alf', 2000: 'alfayn', 3000: 'telt alaf', 4000: 'rbe3 alaf', 5000: 'khams alaf', 6000: 'sett alaf', 7000: 'sbe3 alaf', 8000: 'tmen alaf', 9000: 'tse3 alaf' };

  function fr(n) {
    if (n >= 1000) return frThou[n];
    if (n === 999) return 'neuf cent quatre-vingt-dix-neuf';
    if (n >= 100) return frHund[n];
    if (n < 10) return frU[n];
    if (n < 20) return frT[n - 10];
    if (n < 70) { const t = Math.floor(n / 10), u = n % 10; if (u === 0) return frTens[t]; if (u === 1) return frTens[t] + ' et un'; return frTens[t] + '-' + frU[u]; }
    if (n < 80) { if (n === 71) return 'soixante et onze'; return 'soixante-' + frT[n - 70]; }
    if (n < 90) { const u = n - 80; if (u === 0) return 'quatre-vingts'; return 'quatre-vingt-' + frU[u]; }
    return 'quatre-vingt-' + frT[n - 90];
  }
  function ar(n) {
    if (n >= 1000) return arThou[n];
    if (n === 999) return 'تِسْعُمِئَة وَتِسْعَة وَتِسْعُون';
    if (n >= 100) return arHund[n];
    if (n < 10) return arU[n];
    if (n < 20) return arTeen[n - 10];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return arTens[t];
    return arU[u] + ' وَ' + arTens[t];
  }
  function dz(n) {
    if (n >= 1000) return dzThou[n];
    if (n === 999) return 'tse3 mya w tes3a w tes3in';
    if (n >= 100) return dzHund[n];
    if (n < 10) return dzU[n];
    if (n < 20) return dzTeen[n - 10];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return dzTens[t];
    return dzUc[u] + ' w ' + dzTens[t];
  }

  const list = [];
  for (let n = 1; n <= 100; n++) list.push(n);
  [200, 300, 400, 500, 600, 700, 800, 900, 999, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].forEach((n) => list.push(n));
  return list.map((n) => ({ fr: fr(n), ar: ar(n), dz: dz(n) }));
}

const SEED_WORDS = {
  // Alphabet arabe complet (le glyphe est identique en MSA et en darija).
  'Lettres': [
    { fr: 'Alif', ar: 'أ', dz: 'a' }, { fr: 'Ba', ar: 'ب', dz: 'b' },
    { fr: 'Ta', ar: 'ت', dz: 't' }, { fr: 'Tha', ar: 'ث', dz: 'th' },
    { fr: 'Jim', ar: 'ج', dz: 'j' }, { fr: 'Ha', ar: 'ح', dz: '7' },
    { fr: 'Kha', ar: 'خ', dz: 'kh' }, { fr: 'Dal', ar: 'د', dz: 'd' },
    { fr: 'Dhal', ar: 'ذ', dz: 'dh' }, { fr: 'Ra', ar: 'ر', dz: 'r' },
    { fr: 'Zay', ar: 'ز', dz: 'z' }, { fr: 'Sin', ar: 'س', dz: 's' },
    { fr: 'Shin', ar: 'ش', dz: 'ch' }, { fr: 'Sad', ar: 'ص', dz: 's' },
    { fr: 'Dad', ar: 'ض', dz: 'd' }, { fr: 'Ṭa', ar: 'ط', dz: 't' },
    { fr: 'Ẓa', ar: 'ظ', dz: 'dh' }, { fr: 'Ayn', ar: 'ع', dz: '3' },
    { fr: 'Ghayn', ar: 'غ', dz: 'gh' }, { fr: 'Fa', ar: 'ف', dz: 'f' },
    { fr: 'Qaf', ar: 'ق', dz: '9' }, { fr: 'Kaf', ar: 'ك', dz: 'k' },
    { fr: 'Lam', ar: 'ل', dz: 'l' }, { fr: 'Mim', ar: 'م', dz: 'm' },
    { fr: 'Nun', ar: 'ن', dz: 'n' }, { fr: 'Hâ', ar: 'ه', dz: 'h' },
    { fr: 'Waw', ar: 'و', dz: 'w' }, { fr: 'Ya', ar: 'ي', dz: 'y' },
  ],
  'Nombres': buildNumbers(),
  'Couleurs': [
    { fr: 'rouge', ar: 'أَحْمَر', dz: '7mer' }, { fr: 'bleu', ar: 'أَزْرَق', dz: 'zre9' },
    { fr: 'vert', ar: 'أَخْضَر', dz: 'khder' }, { fr: 'jaune', ar: 'أَصْفَر', dz: 'sfer' },
    { fr: 'noir', ar: 'أَسْوَد', dz: 'k7el' }, { fr: 'blanc', ar: 'أَبْيَض', dz: 'byed' },
    { fr: 'gris', ar: 'رَمَادِيّ', dz: 'gri' }, { fr: 'marron', ar: 'بُنِّيّ', dz: '9ehwi' },
  ],
  'Animaux': [
    { fr: 'chat', ar: 'قِطَّة', dz: '9ett' }, { fr: 'chien', ar: 'كَلْب', dz: 'kelb' },
    { fr: 'cheval', ar: 'حِصَان', dz: '3oud' }, { fr: 'âne', ar: 'حِمَار', dz: '7mar' },
    { fr: 'mouton', ar: 'خَرُوف', dz: '7awli' }, { fr: 'vache', ar: 'بَقَرَة', dz: 'begra' },
    { fr: 'poule', ar: 'دَجَاجَة', dz: 'djaja' }, { fr: 'chameau', ar: 'جَمَل', dz: 'jmel' },
    { fr: 'oiseau', ar: 'طَائِر', dz: 'tir' }, { fr: 'poisson', ar: 'سَمَكَة', dz: '7outa' },
  ],
  'Corps humain': [
    { fr: 'tête', ar: 'رَأْس', dz: 'ras' }, { fr: 'œil', ar: 'عَيْن', dz: '3in' },
    { fr: 'main', ar: 'يَد', dz: 'yedd' }, { fr: 'pied', ar: 'قَدَم', dz: 'rjel' },
    { fr: 'bouche', ar: 'فَم', dz: 'fomm' }, { fr: 'nez', ar: 'أَنْف', dz: 'nif' },
    { fr: 'cheveux', ar: 'شَعْر', dz: 'ch3ar' }, { fr: 'ventre', ar: 'بَطْن', dz: 'kerch' },
    { fr: 'cœur', ar: 'قَلْب', dz: '9elb' }, { fr: 'oreille', ar: 'أُذُن', dz: 'wden' },
  ],
  'Famille': [
    { fr: 'père', ar: 'أَب', dz: 'bba' }, { fr: 'mère', ar: 'أُمّ', dz: 'yemma' },
    { fr: 'frère', ar: 'أَخ', dz: 'khou' }, { fr: 'sœur', ar: 'أُخْت', dz: 'okht' },
    { fr: 'fils', ar: 'اِبْن', dz: 'weld' }, { fr: 'fille', ar: 'بِنْت', dz: 'bent' },
    { fr: 'grand-père', ar: 'جَدّ', dz: 'jedd' }, { fr: 'grand-mère', ar: 'جَدَّة', dz: '7enna' },
    { fr: 'mari', ar: 'زَوْج', dz: 'rajel' }, { fr: 'épouse', ar: 'زَوْجَة', dz: 'mra' },
  ],
  'Nourriture': [
    { fr: 'pain', ar: 'خُبْز', dz: 'khobz' }, { fr: 'eau', ar: 'مَاء', dz: 'ma' },
    { fr: 'lait', ar: 'حَلِيب', dz: '7lib' }, { fr: 'viande', ar: 'لَحْم', dz: 'l7em' },
    { fr: 'œuf', ar: 'بَيْضَة', dz: 'bida' }, { fr: 'thé', ar: 'شَاي', dz: 'atay' },
    { fr: 'café', ar: 'قَهْوَة', dz: '9ehwa' }, { fr: 'sucre', ar: 'سُكَّر', dz: 'sokkar' },
    { fr: 'sel', ar: 'مِلْح', dz: 'mel7a' }, { fr: 'pomme', ar: 'تُفَّاحَة', dz: 'teffa7a' },
  ],
};

// Convertit une spec { tense: { cle: [ar, dz] } } en grille { tense: { cle: {ar,dz} } }
function buildConj(spec) {
  const out = {};
  ['present', 'passe', 'futur'].forEach((t) => {
    out[t] = {};
    Object.entries(spec[t]).forEach(([k, pair]) => { out[t][k] = { ar: pair[0], dz: pair[1] }; });
  });
  return out;
}

const SEED_VERBS = {
  'Verbes': [
    {
      fr: 'manger', ar_base: 'أَكَلَ', dz_base: 'kla',
      conj: buildConj({
        present: {
          '1sg_n': ['آكُلُ', 'kanakol'], '2sg_m': ['تَأْكُلُ', 'katakol'], '2sg_f': ['تَأْكُلِينَ', 'katakli'],
          '3sg_m': ['يَأْكُلُ', 'kayakol'], '3sg_f': ['تَأْكُلُ', 'katakol'], '1pl_n': ['نَأْكُلُ', 'kanaklou'],
          '2pl_m': ['تَأْكُلُونَ', 'kataklou'], '2pl_f': ['تَأْكُلْنَ', 'kataklou'],
          '3pl_m': ['يَأْكُلُونَ', 'kayaklou'], '3pl_f': ['يَأْكُلْنَ', 'kayaklou'],
        },
        passe: {
          '1sg_n': ['أَكَلْتُ', 'klit'], '2sg_m': ['أَكَلْتَ', 'kliti'], '2sg_f': ['أَكَلْتِ', 'kliti'],
          '3sg_m': ['أَكَلَ', 'kla'], '3sg_f': ['أَكَلَتْ', 'klat'], '1pl_n': ['أَكَلْنَا', 'klina'],
          '2pl_m': ['أَكَلْتُمْ', 'klitou'], '2pl_f': ['أَكَلْتُنَّ', 'klitou'],
          '3pl_m': ['أَكَلُوا', 'klaw'], '3pl_f': ['أَكَلْنَ', 'klaw'],
        },
        futur: {
          '1sg_n': ['سَآكُلُ', 'ghadi nakol'], '2sg_m': ['سَتَأْكُلُ', 'ghadi takol'], '2sg_f': ['سَتَأْكُلِينَ', 'ghadi takli'],
          '3sg_m': ['سَيَأْكُلُ', 'ghadi yakol'], '3sg_f': ['سَتَأْكُلُ', 'ghadi takol'], '1pl_n': ['سَنَأْكُلُ', 'ghadi naklou'],
          '2pl_m': ['سَتَأْكُلُونَ', 'ghadi taklou'], '2pl_f': ['سَتَأْكُلْنَ', 'ghadi taklou'],
          '3pl_m': ['سَيَأْكُلُونَ', 'ghadi yaklou'], '3pl_f': ['سَيَأْكُلْنَ', 'ghadi yaklou'],
        },
      }),
    },
    {
      fr: 'boire', ar_base: 'شَرِبَ', dz_base: 'chreb',
      conj: buildConj({
        present: {
          '1sg_n': ['أَشْرَبُ', 'kanchreb'], '2sg_m': ['تَشْرَبُ', 'katchreb'], '2sg_f': ['تَشْرَبِينَ', 'katchrebi'],
          '3sg_m': ['يَشْرَبُ', 'kaychreb'], '3sg_f': ['تَشْرَبُ', 'katchreb'], '1pl_n': ['نَشْرَبُ', 'kanchrebou'],
          '2pl_m': ['تَشْرَبُونَ', 'katchrebou'], '2pl_f': ['تَشْرَبْنَ', 'katchrebou'],
          '3pl_m': ['يَشْرَبُونَ', 'kaychrebou'], '3pl_f': ['يَشْرَبْنَ', 'kaychrebou'],
        },
        passe: {
          '1sg_n': ['شَرِبْتُ', 'chrebt'], '2sg_m': ['شَرِبْتَ', 'chrebti'], '2sg_f': ['شَرِبْتِ', 'chrebti'],
          '3sg_m': ['شَرِبَ', 'chreb'], '3sg_f': ['شَرِبَتْ', 'chrebat'], '1pl_n': ['شَرِبْنَا', 'chrebna'],
          '2pl_m': ['شَرِبْتُمْ', 'chrebtou'], '2pl_f': ['شَرِبْتُنَّ', 'chrebtou'],
          '3pl_m': ['شَرِبُوا', 'chrebou'], '3pl_f': ['شَرِبْنَ', 'chrebou'],
        },
        futur: {
          '1sg_n': ['سَأَشْرَبُ', 'ghadi nchreb'], '2sg_m': ['سَتَشْرَبُ', 'ghadi tchreb'], '2sg_f': ['سَتَشْرَبِينَ', 'ghadi tchrebi'],
          '3sg_m': ['سَيَشْرَبُ', 'ghadi ychreb'], '3sg_f': ['سَتَشْرَبُ', 'ghadi tchreb'], '1pl_n': ['سَنَشْرَبُ', 'ghadi nchrebou'],
          '2pl_m': ['سَتَشْرَبُونَ', 'ghadi tchrebou'], '2pl_f': ['سَتَشْرَبْنَ', 'ghadi tchrebou'],
          '3pl_m': ['سَيَشْرَبُونَ', 'ghadi ychrebou'], '3pl_f': ['سَيَشْرَبْنَ', 'ghadi ychrebou'],
        },
      }),
    },
  ],
};

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
    state = { version: 1, sections: [], words: [], seeded: false };
    DEFAULT_SECTIONS.forEach((s) => {
      state.sections.push({ id: uid(), name: s.name, type: s.type });
    });
  }
  seedDefaultsIfNeeded();
  persist();
  return state;
}

// Réconcilie le seed avec les sections par défaut encore présentes.
// Upsert par `fr` : met à jour en place l'arabe (MSA vocalisé) ET le darija
// (latin) d'un mot déjà présent, sans créer de doublon, ajoute les entrées
// manquantes, et préserve les mots ajoutés par l'utilisateur.
function seedDefaultsIfNeeded() {
  if ((state.seedVersion || 0) >= CURRENT_SEED_VERSION) return;
  const byName = {};
  state.sections.forEach((s) => { byName[s.name] = s; });

  Object.entries(SEED_WORDS).forEach(([sectionName, items]) => {
    const sec = byName[sectionName];
    if (!sec) return;
    const byFr = {};
    state.words.filter((w) => w.sectionId === sec.id && w.type !== 'verb')
      .forEach((w) => { if (!(w.fr in byFr)) byFr[w.fr] = w; });
    items.forEach((it) => {
      const cur = byFr[it.fr];
      if (cur) {
        cur.ar = it.ar;   // MSA vocalisé
        cur.dz = it.dz;   // darija en latin
      } else {
        const w = {
          id: uid(), sectionId: sec.id, type: 'word', missCount: 0, seenCount: 0,
          fr: it.fr, ar: it.ar, ar_tr: '', dz: it.dz, dz_tr: '',
        };
        state.words.push(w);
        byFr[it.fr] = w;
      }
    });
  });

  Object.entries(SEED_VERBS).forEach(([sectionName, items]) => {
    const sec = byName[sectionName];
    if (!sec) return;
    const byFr = {};
    state.words.filter((w) => w.sectionId === sec.id && w.type === 'verb')
      .forEach((w) => { if (!(w.fr in byFr)) byFr[w.fr] = w; });
    items.forEach((v) => {
      const cur = byFr[v.fr];
      if (cur) {
        cur.ar_base = v.ar_base;   // MSA vocalisé
        cur.dz_base = v.dz_base;   // darija en latin
        cur.conj = v.conj;
      } else {
        const w = {
          id: uid(), sectionId: sec.id, type: 'verb', missCount: 0, seenCount: 0,
          fr: v.fr, ar_base: v.ar_base, ar_base_tr: '', dz_base: v.dz_base, dz_base_tr: '', conj: v.conj,
        };
        state.words.push(w);
        byFr[v.fr] = w;
      }
    });
  });

  state.seedVersion = CURRENT_SEED_VERSION;
  state.seeded = true; // compat ancienne clé
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
