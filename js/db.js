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
const CURRENT_SEED_VERSION = 3;

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

  const dzU = ['صفر', 'واحد', 'جوج', 'تلاتة', 'ربعة', 'خمسة', 'ستة', 'سبعة', 'تمنية', 'تسعود'];
  const dzUc = ['', 'واحد', 'تنين', 'تلاتة', 'ربعة', 'خمسة', 'ستة', 'سبعة', 'تمنية', 'تسعة']; // unités en composé (21-99)
  const dzTeen = ['عشرة', 'حضاش', 'طناش', 'تلطاش', 'ربعطاش', 'خمسطاش', 'سطاش', 'سبعطاش', 'تمنطاش', 'تسعطاش'];
  const dzTens = { 2: 'عشرين', 3: 'تلاتين', 4: 'ربعين', 5: 'خمسين', 6: 'ستين', 7: 'سبعين', 8: 'تمانين', 9: 'تسعين' };
  const dzHund = { 100: 'مية', 200: 'ميتين', 300: 'تلت مية', 400: 'ربع مية', 500: 'خمس مية', 600: 'ست مية', 700: 'سبع مية', 800: 'تمن مية', 900: 'تسع مية' };
  const dzThou = { 1000: 'ألف', 2000: 'ألفين', 3000: 'تلت آلاف', 4000: 'ربع آلاف', 5000: 'خمس آلاف', 6000: 'ست آلاف', 7000: 'سبع آلاف', 8000: 'تمن آلاف', 9000: 'تسع آلاف' };

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
    if (n === 999) return 'تسع مية وتسعة وتسعين';
    if (n >= 100) return dzHund[n];
    if (n < 10) return dzU[n];
    if (n < 20) return dzTeen[n - 10];
    const t = Math.floor(n / 10), u = n % 10;
    if (u === 0) return dzTens[t];
    return dzUc[u] + ' و' + dzTens[t];
  }

  const list = [];
  for (let n = 1; n <= 100; n++) list.push(n);
  [200, 300, 400, 500, 600, 700, 800, 900, 999, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000].forEach((n) => list.push(n));
  return list.map((n) => ({ fr: fr(n), ar: ar(n), dz: dz(n) }));
}

const SEED_WORDS = {
  // Alphabet arabe complet (le glyphe est identique en MSA et en darija).
  'Lettres': [
    { fr: 'Alif', ar: 'أ', dz: 'أ' }, { fr: 'Ba', ar: 'ب', dz: 'ب' },
    { fr: 'Ta', ar: 'ت', dz: 'ت' }, { fr: 'Tha', ar: 'ث', dz: 'ث' },
    { fr: 'Jim', ar: 'ج', dz: 'ج' }, { fr: 'Ha', ar: 'ح', dz: 'ح' },
    { fr: 'Kha', ar: 'خ', dz: 'خ' }, { fr: 'Dal', ar: 'د', dz: 'د' },
    { fr: 'Dhal', ar: 'ذ', dz: 'ذ' }, { fr: 'Ra', ar: 'ر', dz: 'ر' },
    { fr: 'Zay', ar: 'ز', dz: 'ز' }, { fr: 'Sin', ar: 'س', dz: 'س' },
    { fr: 'Shin', ar: 'ش', dz: 'ش' }, { fr: 'Sad', ar: 'ص', dz: 'ص' },
    { fr: 'Dad', ar: 'ض', dz: 'ض' }, { fr: 'Ṭa', ar: 'ط', dz: 'ط' },
    { fr: 'Ẓa', ar: 'ظ', dz: 'ظ' }, { fr: 'Ayn', ar: 'ع', dz: 'ع' },
    { fr: 'Ghayn', ar: 'غ', dz: 'غ' }, { fr: 'Fa', ar: 'ف', dz: 'ف' },
    { fr: 'Qaf', ar: 'ق', dz: 'ق' }, { fr: 'Kaf', ar: 'ك', dz: 'ك' },
    { fr: 'Lam', ar: 'ل', dz: 'ل' }, { fr: 'Mim', ar: 'م', dz: 'م' },
    { fr: 'Nun', ar: 'ن', dz: 'ن' }, { fr: 'Hâ', ar: 'ه', dz: 'ه' },
    { fr: 'Waw', ar: 'و', dz: 'و' }, { fr: 'Ya', ar: 'ي', dz: 'ي' },
  ],
  'Nombres': buildNumbers(),
  'Couleurs': [
    { fr: 'rouge', ar: 'أَحْمَر', dz: 'حمر' }, { fr: 'bleu', ar: 'أَزْرَق', dz: 'زرق' },
    { fr: 'vert', ar: 'أَخْضَر', dz: 'خضر' }, { fr: 'jaune', ar: 'أَصْفَر', dz: 'صفر' },
    { fr: 'noir', ar: 'أَسْوَد', dz: 'كحل' }, { fr: 'blanc', ar: 'أَبْيَض', dz: 'بيض' },
    { fr: 'gris', ar: 'رَمَادِيّ', dz: 'كري' }, { fr: 'marron', ar: 'بُنِّيّ', dz: 'قهوي' },
  ],
  'Animaux': [
    { fr: 'chat', ar: 'قِطَّة', dz: 'قطّ' }, { fr: 'chien', ar: 'كَلْب', dz: 'كلب' },
    { fr: 'cheval', ar: 'حِصَان', dz: 'عود' }, { fr: 'âne', ar: 'حِمَار', dz: 'حمار' },
    { fr: 'mouton', ar: 'خَرُوف', dz: 'حولي' }, { fr: 'vache', ar: 'بَقَرَة', dz: 'بڭرة' },
    { fr: 'poule', ar: 'دَجَاجَة', dz: 'دجاجة' }, { fr: 'chameau', ar: 'جَمَل', dz: 'جمل' },
    { fr: 'oiseau', ar: 'طَائِر', dz: 'طير' }, { fr: 'poisson', ar: 'سَمَكَة', dz: 'حوتة' },
  ],
  'Corps humain': [
    { fr: 'tête', ar: 'رَأْس', dz: 'راس' }, { fr: 'œil', ar: 'عَيْن', dz: 'عين' },
    { fr: 'main', ar: 'يَد', dz: 'يدّ' }, { fr: 'pied', ar: 'قَدَم', dz: 'رجل' },
    { fr: 'bouche', ar: 'فَم', dz: 'فمّ' }, { fr: 'nez', ar: 'أَنْف', dz: 'نيف' },
    { fr: 'cheveux', ar: 'شَعْر', dz: 'شعر' }, { fr: 'ventre', ar: 'بَطْن', dz: 'كرش' },
    { fr: 'cœur', ar: 'قَلْب', dz: 'قلب' }, { fr: 'oreille', ar: 'أُذُن', dz: 'ودن' },
  ],
  'Famille': [
    { fr: 'père', ar: 'أَب', dz: 'بّا' }, { fr: 'mère', ar: 'أُمّ', dz: 'يمّا' },
    { fr: 'frère', ar: 'أَخ', dz: 'خو' }, { fr: 'sœur', ar: 'أُخْت', dz: 'أخت' },
    { fr: 'fils', ar: 'اِبْن', dz: 'ولد' }, { fr: 'fille', ar: 'بِنْت', dz: 'بنت' },
    { fr: 'grand-père', ar: 'جَدّ', dz: 'جدّ' }, { fr: 'grand-mère', ar: 'جَدَّة', dz: 'حنّة' },
    { fr: 'mari', ar: 'زَوْج', dz: 'راجل' }, { fr: 'épouse', ar: 'زَوْجَة', dz: 'مرا' },
  ],
  'Nourriture': [
    { fr: 'pain', ar: 'خُبْز', dz: 'خبز' }, { fr: 'eau', ar: 'مَاء', dz: 'ما' },
    { fr: 'lait', ar: 'حَلِيب', dz: 'حليب' }, { fr: 'viande', ar: 'لَحْم', dz: 'لحم' },
    { fr: 'œuf', ar: 'بَيْضَة', dz: 'بيضة' }, { fr: 'thé', ar: 'شَاي', dz: 'أتاي' },
    { fr: 'café', ar: 'قَهْوَة', dz: 'قهوة' }, { fr: 'sucre', ar: 'سُكَّر', dz: 'سكّر' },
    { fr: 'sel', ar: 'مِلْح', dz: 'ملحة' }, { fr: 'pomme', ar: 'تُفَّاحَة', dz: 'تفاحة' },
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
      fr: 'manger', ar_base: 'أَكَلَ', dz_base: 'كلا',
      conj: buildConj({
        present: {
          '1sg_n': ['آكُلُ', 'كناكل'], '2sg_m': ['تَأْكُلُ', 'كتاكل'], '2sg_f': ['تَأْكُلِينَ', 'كتاكلي'],
          '3sg_m': ['يَأْكُلُ', 'كياكل'], '3sg_f': ['تَأْكُلُ', 'كتاكل'], '1pl_n': ['نَأْكُلُ', 'كناكلو'],
          '2pl_m': ['تَأْكُلُونَ', 'كتاكلو'], '2pl_f': ['تَأْكُلْنَ', 'كتاكلو'],
          '3pl_m': ['يَأْكُلُونَ', 'كياكلو'], '3pl_f': ['يَأْكُلْنَ', 'كياكلو'],
        },
        passe: {
          '1sg_n': ['أَكَلْتُ', 'كليت'], '2sg_m': ['أَكَلْتَ', 'كليتي'], '2sg_f': ['أَكَلْتِ', 'كليتي'],
          '3sg_m': ['أَكَلَ', 'كلا'], '3sg_f': ['أَكَلَتْ', 'كلات'], '1pl_n': ['أَكَلْنَا', 'كلينا'],
          '2pl_m': ['أَكَلْتُمْ', 'كليتو'], '2pl_f': ['أَكَلْتُنَّ', 'كليتو'],
          '3pl_m': ['أَكَلُوا', 'كلاو'], '3pl_f': ['أَكَلْنَ', 'كلاو'],
        },
        futur: {
          '1sg_n': ['سَآكُلُ', 'غادي ناكل'], '2sg_m': ['سَتَأْكُلُ', 'غادي تاكل'], '2sg_f': ['سَتَأْكُلِينَ', 'غادي تاكلي'],
          '3sg_m': ['سَيَأْكُلُ', 'غادي ياكل'], '3sg_f': ['سَتَأْكُلُ', 'غادي تاكل'], '1pl_n': ['سَنَأْكُلُ', 'غادي ناكلو'],
          '2pl_m': ['سَتَأْكُلُونَ', 'غادي تاكلو'], '2pl_f': ['سَتَأْكُلْنَ', 'غادي تاكلو'],
          '3pl_m': ['سَيَأْكُلُونَ', 'غادي ياكلو'], '3pl_f': ['سَيَأْكُلْنَ', 'غادي ياكلو'],
        },
      }),
    },
    {
      fr: 'boire', ar_base: 'شَرِبَ', dz_base: 'شرب',
      conj: buildConj({
        present: {
          '1sg_n': ['أَشْرَبُ', 'كنشرب'], '2sg_m': ['تَشْرَبُ', 'كتشرب'], '2sg_f': ['تَشْرَبِينَ', 'كتشربي'],
          '3sg_m': ['يَشْرَبُ', 'كيشرب'], '3sg_f': ['تَشْرَبُ', 'كتشرب'], '1pl_n': ['نَشْرَبُ', 'كنشربو'],
          '2pl_m': ['تَشْرَبُونَ', 'كتشربو'], '2pl_f': ['تَشْرَبْنَ', 'كتشربو'],
          '3pl_m': ['يَشْرَبُونَ', 'كيشربو'], '3pl_f': ['يَشْرَبْنَ', 'كيشربو'],
        },
        passe: {
          '1sg_n': ['شَرِبْتُ', 'شربت'], '2sg_m': ['شَرِبْتَ', 'شربتي'], '2sg_f': ['شَرِبْتِ', 'شربتي'],
          '3sg_m': ['شَرِبَ', 'شرب'], '3sg_f': ['شَرِبَتْ', 'شربات'], '1pl_n': ['شَرِبْنَا', 'شربنا'],
          '2pl_m': ['شَرِبْتُمْ', 'شربتو'], '2pl_f': ['شَرِبْتُنَّ', 'شربتو'],
          '3pl_m': ['شَرِبُوا', 'شربو'], '3pl_f': ['شَرِبْنَ', 'شربو'],
        },
        futur: {
          '1sg_n': ['سَأَشْرَبُ', 'غادي نشرب'], '2sg_m': ['سَتَشْرَبُ', 'غادي تشرب'], '2sg_f': ['سَتَشْرَبِينَ', 'غادي تشربي'],
          '3sg_m': ['سَيَشْرَبُ', 'غادي يشرب'], '3sg_f': ['سَتَشْرَبُ', 'غادي تشرب'], '1pl_n': ['سَنَشْرَبُ', 'غادي نشربو'],
          '2pl_m': ['سَتَشْرَبُونَ', 'غادي تشربو'], '2pl_f': ['سَتَشْرَبْنَ', 'غادي تشربو'],
          '3pl_m': ['سَيَشْرَبُونَ', 'غادي يشربو'], '3pl_f': ['سَيَشْرَبْنَ', 'غادي يشربو'],
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
// Upsert par `fr` : met à jour l'arabe (MSA) d'un mot déjà là (ex. ajout
// des voyelles) sans créer de doublon, ajoute les entrées manquantes, et
// préserve le darija ainsi que les mots ajoutés par l'utilisateur.
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
        cur.ar = it.ar;            // applique les voyelles / met à jour le MSA
        if (!cur.dz) cur.dz = it.dz;
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
        cur.ar_base = v.ar_base;                       // MSA vocalisé
        cur.conj = mergeConjAr(cur.conj, v.conj);      // applique le MSA, garde le darija
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

// Fusionne une conjugaison : prend le MSA (ar) du seed, conserve le darija (dz) existant.
function mergeConjAr(existing, seed) {
  if (!existing) return seed;
  const out = {};
  ['present', 'passe', 'futur'].forEach((t) => {
    out[t] = {};
    Object.keys(seed[t]).forEach((k) => {
      const ex = existing[t] && existing[t][k];
      out[t][k] = { ar: seed[t][k].ar, dz: ex && ex.dz ? ex.dz : seed[t][k].dz };
    });
  });
  return out;
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
