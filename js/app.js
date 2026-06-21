/* ============================================================
   app.js — Contrôleur d'interface + routage (vanilla JS)
   ============================================================ */

const SECTION_EMOJI = {
  'Lettres': '🔤', 'Nombres': '🔢', 'Couleurs': '🎨', 'Animaux': '🐫',
  'Corps humain': '🦵', 'Famille': '👨‍👩‍👧', 'Nourriture': '🍲', 'Verbes': '🏃',
};

const els = {
  app: document.getElementById('app'),
  title: document.getElementById('appTitle'),
  back: document.getElementById('backBtn'),
  headerAction: document.getElementById('headerAction'),
  modalRoot: document.getElementById('modalRoot'),
  toast: document.getElementById('toast'),
};

// État de navigation
let route = { name: 'home', params: {} };
let historyStack = [];

// --------- Utilitaires ----------
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null || c === false) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2200);
}

function emojiFor(section) {
  return SECTION_EMOJI[section.name] || (section.type === 'verb' ? '🏃' : '📚');
}

// --------- Navigation ----------
function navigate(name, params = {}, push = true) {
  // On mémorise la position de scroll de l'écran qu'on quitte pour la
  // restaurer si l'utilisateur revient en arrière.
  if (push) historyStack.push({ ...route, scroll: els.app.scrollTop });
  route = { name, params };
  render();
}

function goBack() {
  if (historyStack.length) {
    const prev = historyStack.pop();
    route = { name: prev.name, params: prev.params };
    render(prev.scroll || 0);
  } else {
    navigate('home', {}, false);
  }
}

els.back.addEventListener('click', goBack);

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    historyStack = [];
    navigate(tab.dataset.route, {}, false);
  });
});

// --------- Rendu principal ----------
function render(restoreScroll = 0) {
  clear(els.app);
  els.headerAction.hidden = true;
  els.headerAction.onclick = null;

  const showBack = route.name !== 'home' && route.name !== 'review' && route.name !== 'settings';
  els.back.hidden = !showBack && historyStack.length === 0;
  els.back.hidden = !showBack;

  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.route === route.name);
  });

  const view = VIEWS[route.name] || VIEWS.home;
  view(route.params);
  els.app.scrollTop = restoreScroll;
}

// ============================================================
//  ÉCRAN : ACCUEIL
// ============================================================
function viewHome() {
  els.title.textContent = 'Darija & Arabe';
  const sections = DB.getSections();
  const totalWords = sections.reduce((n, s) => n + s.count, 0);

  // Accès rapide révision
  els.app.appendChild(
    h('div', { class: 'quick-review-card', onClick: () => navigate('review') }, [
      h('div', { class: 'qr-ico' }, '🎯'),
      h('div', { class: 'qr-body' }, [
        h('div', { class: 'qr-title' }, 'Mode révision'),
        h('div', { class: 'qr-sub' }, `${totalWords} mot${totalWords > 1 ? 's' : ''} au total · session de 10`),
      ]),
      h('div', { class: 'chev' }, '›'),
    ])
  );

  // Accès « Tous les mots » avec recherche
  els.app.appendChild(
    h('div', { class: 'allwords-card', onClick: () => navigate('allWords') }, [
      h('div', { class: 'aw-ico' }, '🔍'),
      h('div', { class: 'aw-body' }, [
        h('div', { class: 'aw-title' }, 'Tous les mots'),
        h('div', { class: 'aw-sub' }, 'Parcourir et rechercher dans tout le vocabulaire'),
      ]),
      h('div', { class: 'chev' }, '›'),
    ])
  );

  els.app.appendChild(h('div', { class: 'section-title' }, 'Sections'));

  const list = h('div', { class: 'section-list' });
  sections.forEach((s) => {
    list.appendChild(
      h('div', { class: `section-card ${s.type === 'verb' ? 'verb' : ''}`, onClick: () => navigate('section', { id: s.id }) }, [
        h('div', { class: 'sec-emoji' }, emojiFor(s)),
        h('div', { class: 'sec-body' }, [
          h('div', { class: 'sec-name' }, [
            s.name,
            s.type === 'verb' ? h('span', { class: 'badge-verb' }, 'verbes') : null,
          ]),
          h('div', { class: 'sec-count' }, `${s.count} mot${s.count > 1 ? 's' : ''}`),
        ]),
        h('div', { class: 'chev' }, '›'),
      ])
    );
  });
  els.app.appendChild(list);

  // FAB ajouter section
  els.app.appendChild(
    h('button', { class: 'fab', 'aria-label': 'Nouvelle section', onClick: showAddSectionModal }, '+')
  );
}

function showAddSectionModal() {
  openModal('Nouvelle section', (body, close) => {
    const nameInput = h('input', { type: 'text', placeholder: 'Nom de la section', autofocus: true });
    const typeSelect = h('select', {}, [
      h('option', { value: 'word' }, 'Mots (3 langues)'),
      h('option', { value: 'verb' }, 'Verbes (conjugaison)'),
    ]);
    body.appendChild(h('div', { class: 'form' }, [
      h('div', { class: 'field' }, [h('label', {}, 'Nom'), nameInput]),
      h('div', { class: 'field' }, [h('label', {}, 'Type'), typeSelect]),
    ]));
    body.appendChild(h('div', { class: 'modal-actions' }, [
      h('button', { class: 'btn btn-ghost', onClick: close }, 'Annuler'),
      h('button', { class: 'btn btn-primary', onClick: () => {
        const name = nameInput.value.trim();
        if (!name) { nameInput.focus(); return; }
        DB.addSection(name, typeSelect.value);
        close();
        toast('Section créée');
        render();
      } }, 'Créer'),
    ]));
    setTimeout(() => nameInput.focus(), 50);
  });
}

// ============================================================
//  ÉCRAN : SECTION (liste de mots)
// ============================================================
function viewSection({ id }) {
  const section = DB.getSection(id);
  if (!section) { navigate('home', {}, false); return; }
  els.title.textContent = section.name;

  // Action d'en-tête : menu de la section (renommer / supprimer)
  els.headerAction.hidden = false;
  els.headerAction.textContent = '⋯';
  els.headerAction.onclick = () => showSectionMenu(section);

  const words = DB.getWords(id);

  if (words.length === 0) {
    els.app.appendChild(h('div', { class: 'empty-state' }, [
      h('span', { class: 'emoji' }, '📭'),
      h('p', {}, section.type === 'verb'
        ? 'Aucun verbe pour le moment. Ajoutez votre premier verbe à conjuguer.'
        : 'Aucun mot pour le moment. Ajoutez votre premier mot.'),
      h('button', { class: 'btn btn-primary', onClick: () => navigate('wordForm', { sectionId: id }) },
        section.type === 'verb' ? '+ Ajouter un verbe' : '+ Ajouter un mot'),
    ]));
  } else {
    const list = h('div', { class: 'word-list' });
    words.forEach((w) => list.appendChild(renderWordCard(w, section)));
    els.app.appendChild(list);
  }

  els.app.appendChild(
    h('button', { class: 'fab', 'aria-label': 'Ajouter', onClick: () => navigate('wordForm', { sectionId: id }) }, '+')
  );
}

function renderWordCard(w, section) {
  const onClick = () => navigate('wordForm', { sectionId: section.id, wordId: w.id });
  if (section.type === 'verb' || w.type === 'verb') {
    return h('div', { class: 'word-card', onClick }, [
      h('div', { class: 'word-fr' }, [
        w.fr || '(verbe)',
        w.missCount > 0 ? h('span', { class: 'stat-pill' }, `raté ×${w.missCount}`) : null,
      ]),
      h('div', { class: 'word-langs' }, [
        langRow('AR', 'ar', w.ar_base, w.ar_base_tr, true),
        langRow('MA', 'dz', w.dz_base, w.dz_base_tr, false),
      ]),
    ]);
  }
  return h('div', { class: 'word-card', onClick }, [
    h('div', { class: 'word-fr' }, [
      w.fr || '(sans français)',
      w.missCount > 0 ? h('span', { class: 'stat-pill' }, `raté ×${w.missCount}`) : null,
    ]),
    h('div', { class: 'word-langs' }, [
      langRow('AR', 'ar', w.ar, w.ar_tr, true),
      langRow('MA', 'dz', w.dz, w.dz_tr, false),
    ]),
  ]);
}

function langRow(label, cls, main, tr, isAr) {
  return h('div', { class: 'lang-row' }, [
    h('span', { class: `lang-tag ${cls}` }, label),
    h('span', { class: `lang-main ${isAr ? 'lang-ar ar-text' : ''}` }, main || '—'),
    tr ? h('span', { class: 'lang-tr' }, `(${tr})`) : null,
  ]);
}

function showSectionMenu(section) {
  openModal(section.name, (body, close) => {
    body.appendChild(h('div', { class: 'form' }, [
      h('button', { class: 'btn btn-ghost btn-block', onClick: () => { close(); showRenameSection(section); } }, '✏️  Renommer'),
      h('button', { class: 'btn btn-danger btn-block', onClick: () => {
        close();
        confirmModal(`Supprimer « ${section.name} » et tous ses mots ?`, () => {
          DB.deleteSection(section.id);
          toast('Section supprimée');
          navigate('home', {}, false);
        });
      } }, '🗑️  Supprimer la section'),
      h('button', { class: 'btn btn-ghost btn-block', onClick: close }, 'Fermer'),
    ]));
  });
}

function showRenameSection(section) {
  openModal('Renommer', (body, close) => {
    const input = h('input', { type: 'text', value: section.name });
    body.appendChild(h('div', { class: 'form' }, [
      h('div', { class: 'field' }, [h('label', {}, 'Nom'), input]),
    ]));
    body.appendChild(h('div', { class: 'modal-actions' }, [
      h('button', { class: 'btn btn-ghost', onClick: close }, 'Annuler'),
      h('button', { class: 'btn btn-primary', onClick: () => {
        if (input.value.trim()) { DB.renameSection(section.id, input.value); }
        close(); render();
      } }, 'Enregistrer'),
    ]));
    setTimeout(() => input.focus(), 50);
  });
}

// ============================================================
//  ÉCRAN : TOUS LES MOTS (avec recherche)
// ============================================================
function viewAllWords() {
  els.title.textContent = 'Tous les mots';
  const secMap = {};
  DB.getSections().forEach((s) => { secMap[s.id] = s; });
  const allWords = DB.getAllWords();

  const searchInput = h('input', {
    type: 'search', class: 'search-input', autocomplete: 'off',
    autocapitalize: 'none', placeholder: 'Rechercher (français, arabe, darija)…',
  });
  const results = h('div', { class: 'word-list' });

  function fieldsOf(w) {
    return w.type === 'verb'
      ? [w.fr, w.ar_base, w.ar_base_tr, w.dz_base, w.dz_base_tr]
      : [w.fr, w.ar, w.ar_tr, w.dz, w.dz_tr];
  }

  function renderResults() {
    const q = normalize(searchInput.value);
    clear(results);
    let words = allWords;
    if (q) words = words.filter((w) => fieldsOf(w).some((t) => normalize(t).includes(q)));

    if (words.length === 0) {
      results.appendChild(h('div', { class: 'empty-state' }, [
        h('span', { class: 'emoji' }, '🔍'),
        h('p', {}, allWords.length === 0
          ? 'Aucun mot enregistré pour l\'instant. Ajoutez des mots dans vos sections.'
          : 'Aucun résultat pour cette recherche.'),
      ]));
      return;
    }
    words.forEach((w) => {
      const section = secMap[w.sectionId];
      const card = renderWordCard(w, section || { id: w.sectionId, type: w.type });
      card.insertBefore(h('div', { class: 'word-section-tag' }, section ? section.name : '—'), card.firstChild);
      results.appendChild(card);
    });
  }

  searchInput.addEventListener('input', renderResults);
  els.app.appendChild(h('div', { class: 'search-bar' }, [searchInput]));
  els.app.appendChild(results);
  renderResults();
  setTimeout(() => searchInput.focus(), 50);
}

// ============================================================
//  ÉCRAN : FORMULAIRE MOT / VERBE
// ============================================================
function viewWordForm({ sectionId, wordId }) {
  const section = DB.getSection(sectionId);
  if (!section) { navigate('home', {}, false); return; }
  const isVerb = section.type === 'verb';
  const existing = wordId ? DB.getWord(wordId) : null;
  els.title.textContent = existing ? 'Modifier' : (isVerb ? 'Nouveau verbe' : 'Nouveau mot');

  isVerb ? renderVerbForm(section, existing) : renderWordFormSimple(section, existing);
}

function renderWordFormSimple(section, existing) {
  const fr = inputField('Français', existing?.fr, { placeholder: 'ex. maison' });
  const ar = inputField('Arabe (MSA)', existing?.ar, { rtl: true, noCorrect: true, placeholder: 'بيت' });
  const dz = inputField('Darija', existing?.dz, { noCorrect: true, placeholder: 'dar' });

  const form = h('div', { class: 'form' }, [
    h('div', { class: 'field' }, [h('label', {}, 'Français *'), fr.el]),
    h('div', { class: 'lang-block ar' }, [
      h('div', { class: 'lang-block-title' }, [h('span', { class: 'lang-tag ar' }, 'AR'), 'Arabe classique']),
      h('div', { class: 'field' }, [h('label', {}, 'Mot en arabe'), ar.el]),
    ]),
    h('div', { class: 'lang-block dz' }, [
      h('div', { class: 'lang-block-title' }, [h('span', { class: 'lang-tag dz' }, 'MA'), 'Darija marocain']),
      h('div', { class: 'field' }, [h('label', {}, 'Mot en darija'), dz.el]),
    ]),
    h('div', { class: 'btn-row' }, [
      existing ? h('button', { class: 'btn btn-danger', onClick: () => deleteWordFlow(existing, section) }, '🗑️') : null,
      h('button', { class: 'btn btn-primary btn-block', onClick: () => {
        const data = { fr: fr.el.value, ar: ar.el.value, dz: dz.el.value };
        if (!data.fr.trim() && !data.ar.trim() && !data.dz.trim()) { toast('Renseignez au moins un champ'); return; }
        if (existing) { DB.updateWord(existing.id, data); toast('Mot modifié'); }
        else { DB.addWord(section.id, data); toast('Mot ajouté'); }
        goBack();
      } }, existing ? 'Enregistrer' : 'Ajouter'),
    ]),
  ]);
  els.app.appendChild(form);
  setTimeout(() => fr.el.focus(), 50);
}

function renderVerbForm(section, existing) {
  const conj = existing?.conj || DB.emptyConjugation();
  const fr = inputField('Infinitif français', existing?.fr, { placeholder: 'ex. manger' });
  const arBase = inputField('Base AR', existing?.ar_base, { rtl: true, noCorrect: true, placeholder: 'أكل' });
  const dzBase = inputField('Base MA', existing?.dz_base, { noCorrect: true, placeholder: 'kla' });

  // Stocke les inputs de conjugaison pour la lecture à l'enregistrement
  const conjInputs = {};

  const form = h('div', { class: 'form' }, [
    h('div', { class: 'field' }, [h('label', {}, 'Infinitif français *'), fr.el]),
    h('div', { class: 'lang-block ar' }, [
      h('div', { class: 'lang-block-title' }, [h('span', { class: 'lang-tag ar' }, 'AR'), 'Racine / base']),
      h('div', { class: 'field' }, [h('label', {}, 'Base en arabe'), arBase.el]),
    ]),
    h('div', { class: 'lang-block dz' }, [
      h('div', { class: 'lang-block-title' }, [h('span', { class: 'lang-tag dz' }, 'MA'), 'Racine / base']),
      h('div', { class: 'field' }, [h('label', {}, 'Base en darija'), dzBase.el]),
    ]),
  ]);

  // Tableaux de conjugaison par temps
  DB.TENSES.forEach((tense) => {
    const block = h('div', { class: 'conj-tense' }, [h('h3', {}, tense.label)]);
    DB.PERSONS.forEach((person) => {
      person.genders.forEach((g) => {
        const cellKey = `${person.key}_${g}`;
        const cell = conj[tense.key]?.[cellKey] || { ar: '', dz: '' };
        const noCorrect = { spellcheck: 'false', autocorrect: 'off', autocapitalize: 'none', autocomplete: 'off' };
        const arIn = h('input', { type: 'text', dir: 'rtl', class: 'rtl', value: cell.ar || '', placeholder: 'AR', ...noCorrect });
        const dzIn = h('input', { type: 'text', value: cell.dz || '', placeholder: 'MA', ...noCorrect });
        conjInputs[`${tense.key}.${cellKey}`] = { ar: arIn, dz: dzIn };
        const genderLabel = DB.GENDER_LABEL[g] ? ` — ${DB.GENDER_LABEL[g]}` : '';
        block.appendChild(h('div', { class: 'conj-row' }, [
          h('div', { class: 'conj-person' }, person.label + genderLabel),
          h('div', { class: 'conj-inputs' }, [
            h('div', { class: 'field' }, [h('label', {}, 'AR'), arIn]),
            h('div', { class: 'field' }, [h('label', {}, 'MA'), dzIn]),
          ]),
        ]));
      });
    });
    form.appendChild(block);
  });

  form.appendChild(h('div', { class: 'btn-row' }, [
    existing ? h('button', { class: 'btn btn-danger', onClick: () => deleteWordFlow(existing, section) }, '🗑️') : null,
    h('button', { class: 'btn btn-primary btn-block', onClick: () => {
      const newConj = DB.emptyConjugation();
      DB.TENSES.forEach((tense) => {
        DB.PERSONS.forEach((person) => {
          person.genders.forEach((g) => {
            const cellKey = `${person.key}_${g}`;
            const ins = conjInputs[`${tense.key}.${cellKey}`];
            newConj[tense.key][cellKey] = { ar: ins.ar.value, dz: ins.dz.value };
          });
        });
      });
      const data = {
        fr: fr.el.value, ar_base: arBase.el.value,
        dz_base: dzBase.el.value, conj: newConj,
      };
      if (!data.fr.trim() && !data.ar_base.trim() && !data.dz_base.trim()) { toast('Renseignez au moins un champ'); return; }
      if (existing) { DB.updateWord(existing.id, data); toast('Verbe modifié'); }
      else { DB.addWord(section.id, data); toast('Verbe ajouté'); }
      goBack();
    } }, existing ? 'Enregistrer' : 'Ajouter le verbe'),
  ]));

  els.app.appendChild(form);
  setTimeout(() => fr.el.focus(), 50);
}

function inputField(label, value, opts = {}) {
  // Pas de correction auto sur l'arabe/darija (opts.noCorrect) : l'autocorrect
  // est plus gênant qu'utile. Le français garde le correcteur.
  const noCorrect = opts.noCorrect
    ? { spellcheck: 'false', autocorrect: 'off', autocapitalize: 'none', autocomplete: 'off' }
    : {};
  const el = h('input', {
    type: 'text',
    value: value || '',
    placeholder: opts.placeholder || '',
    class: opts.rtl ? 'rtl' : '',
    dir: opts.rtl ? 'rtl' : 'ltr',
    ...noCorrect,
  });
  return { el, label };
}

function deleteWordFlow(word, section) {
  confirmModal('Supprimer cet élément ?', () => {
    DB.deleteWord(word.id);
    toast('Supprimé');
    goBack();
  });
}

// ============================================================
//  ÉCRAN : MODE RÉVISION
// ============================================================
let reviewSession = null;

// Langue cible de la révision : on ne révise qu'une langue à la fois
// (Darija OU Arabe littéraire). Le dernier choix est mémorisé.
const TARGET_LABEL = { ar: 'Arabe littéraire', dz: 'Darija' };
const REVIEW_TARGET_KEY = 'darija-arabic-review-target';

function getSavedTarget() {
  try {
    const t = localStorage.getItem(REVIEW_TARGET_KEY);
    return t === 'ar' || t === 'dz' ? t : 'dz';
  } catch (_) { return 'dz'; }
}

function saveTarget(t) {
  try { localStorage.setItem(REVIEW_TARGET_KEY, t); } catch (_) {}
}

function viewReview() {
  els.title.textContent = 'Révision';
  if (reviewSession) {
    reviewSession.finished ? renderReviewResults() : renderReviewQuestion();
  } else {
    renderReviewSetup();
  }
}

// Construit une question de traduction pour un mot simple vers la langue cible.
// On montre le français (ou, à défaut, l'autre langue) et on saisit la cible.
function buildWordQuestion(w, target) {
  const expected = (w[target] || '').trim();
  if (!expected) return null; // pas de traduction dans la langue cible → on saute
  let promptLang = (w.fr && w.fr.trim()) ? 'fr'
    : ['ar', 'dz'].find((l) => l !== target && w[l] && w[l].trim());
  if (!promptLang) return null;
  return {
    kind: 'word', id: w.id, fr: w.fr || '', target,
    promptLang, promptVal: w[promptLang], promptTr: w[promptLang + '_tr'] || '',
    expected, expectedTr: w[target + '_tr'] || '',
    missCount: w.missCount || 0, answer: '', revealed: false, result: null,
  };
}

// Construit une question de conjugaison : on demande de conjuguer le verbe
// (donné en français) à un temps et une personne tirés au hasard, vers la cible.
function buildVerbQuestion(w, target) {
  const cells = [];
  if (w.conj) {
    DB.TENSES.forEach((t) => {
      DB.PERSONS.forEach((p) => {
        p.genders.forEach((g) => {
          const cell = w.conj[t.key]?.[`${p.key}_${g}`];
          const val = cell && (cell[target] || '').trim();
          if (val) cells.push({ tense: t, person: p, gender: g, expected: val });
        });
      });
    });
  }
  if (!cells.length) return null;
  const c = cells[Math.floor(Math.random() * cells.length)];
  return {
    kind: 'verb', id: w.id, fr: w.fr || '(verbe)', target,
    tense: c.tense, person: c.person, gender: c.gender,
    expected: c.expected, expectedTr: '',
    missCount: w.missCount || 0, answer: '', revealed: false, result: null,
  };
}

// Liste des questions disponibles pour une portée et une langue cible.
function buildQuestions(sectionId, target) {
  const words = sectionId ? DB.getWords(sectionId) : DB.getAllWords();
  return words
    .map((w) => (w.type === 'verb' ? buildVerbQuestion(w, target) : buildWordQuestion(w, target)))
    .filter(Boolean);
}

function renderReviewSetup() {
  const sections = DB.getSections().filter((s) => s.count > 0);
  const total = DB.getAllWords().length;

  const sectionSelect = h('select', {}, [
    h('option', { value: '' }, `Toutes les sections (${total} mots)`),
    ...sections.map((s) => h('option', { value: s.id }, `${s.name} (${s.count})`)),
  ]);

  // Sélecteur de langue cible (segmenté). Le dernier choix est présélectionné.
  let target = getSavedTarget();
  const seg = h('div', { class: 'seg-control' });
  const buttons = {};
  ['dz', 'ar'].forEach((t) => {
    const btn = h('button', {
      class: `seg-btn ${t === target ? 'active' : ''}`,
      onClick: () => {
        target = t;
        Object.entries(buttons).forEach(([k, b]) => b.classList.toggle('active', k === t));
      },
    }, TARGET_LABEL[t]);
    buttons[t] = btn;
    seg.appendChild(btn);
  });

  els.app.appendChild(h('div', { class: 'review-setup' }, [
    h('div', { class: 'review-card' }, [
      h('div', { style: 'font-size:2.5rem;margin-bottom:10px' }, '🎯'),
      h('h2', { style: 'margin-bottom:8px' }, 'Session de révision'),
      h('p', { style: 'color:var(--muted);line-height:1.5' },
        '10 questions tirées au hasard. On vous montre le français, vous traduisez dans la langue choisie. Pour les verbes, on indique le temps et la personne à conjuguer. Les éléments souvent ratés reviennent plus souvent.'),
    ]),
    h('div', { class: 'field' }, [h('label', {}, 'Langue cible'), seg]),
    h('div', { class: 'field' }, [h('label', {}, 'Portée'), sectionSelect]),
    total === 0
      ? h('div', { class: 'empty-state' }, [
          h('span', { class: 'emoji' }, '🌱'),
          h('p', {}, 'Ajoutez d\'abord quelques mots dans vos sections pour pouvoir réviser.'),
          h('button', { class: 'btn btn-primary', onClick: () => { historyStack = []; navigate('home', {}, false); } }, 'Aller aux sections'),
        ])
      : h('button', { class: 'btn btn-accent btn-block', onClick: () => startReview(sectionSelect.value || null, target) }, 'Démarrer la session'),
  ]));
}

function startReview(sectionId, target) {
  saveTarget(target);
  const pool = buildQuestions(sectionId, target);
  if (pool.length === 0) { toast(`Aucun élément à réviser en ${TARGET_LABEL[target].toLowerCase()}`); return; }

  // Priorisation : on duplique les questions ratées pour augmenter leur probabilité.
  const weighted = [];
  pool.forEach((q) => {
    const weight = 1 + Math.min(3, q.missCount || 0);
    for (let i = 0; i < weight; i++) weighted.push(q);
  });

  // Tirage sans doublon (par élément), max 10
  const picked = [];
  const usedIds = new Set();
  const shuffled = weighted.sort(() => Math.random() - 0.5);
  for (const q of shuffled) {
    if (picked.length >= 10) break;
    if (usedIds.has(q.id)) continue;
    usedIds.add(q.id);
    picked.push(q);
  }

  reviewSession = { questions: picked, index: 0, finished: false, score: 0, target };
  render();
}

const LANG_LABEL = { fr: 'Français', ar: 'Arabe', dz: 'Darija' };

function renderReviewQuestion() {
  const s = reviewSession;
  const q = s.questions[s.index];
  const targetLabel = TARGET_LABEL[q.target];
  const rtl = q.target === 'ar';

  els.title.textContent = `Révision ${s.index + 1}/${s.questions.length}`;
  els.headerAction.hidden = false;
  els.headerAction.textContent = '✕';
  els.headerAction.onclick = () => quitReview();

  // Barre de progression
  els.app.appendChild(h('div', { class: 'progress-bar' }, [
    h('span', { style: `width:${(s.index / s.questions.length) * 100}%` }),
  ]));

  // Carte de consigne : verbe (FR + temps + personne) ou mot simple (FR).
  if (q.kind === 'verb') {
    const genderLabel = DB.GENDER_LABEL[q.gender] ? ` (${DB.GENDER_LABEL[q.gender]})` : '';
    els.app.appendChild(h('div', { class: 'review-card' }, [
      h('div', { class: 'prompt-lang' }, `Conjuguez en ${targetLabel}`),
      h('div', { class: 'prompt-word' }, q.fr),
      h('div', { class: 'verb-params' }, [
        h('span', { class: 'verb-chip' }, q.tense.label),
        h('span', { class: 'verb-chip' }, q.person.label + genderLabel),
      ]),
    ]));
  } else {
    const isArPrompt = q.promptLang === 'ar';
    els.app.appendChild(h('div', { class: 'review-card' }, [
      h('div', { class: 'prompt-lang' }, `Traduisez en ${targetLabel}`),
      h('div', { class: `prompt-word ${isArPrompt ? 'ar-text' : ''}` }, q.promptVal),
      q.promptTr ? h('div', { class: 'prompt-tr' }, q.promptTr) : null,
    ]));
  }

  const input = h('input', {
    type: 'text', dir: rtl ? 'rtl' : 'ltr', class: rtl ? 'rtl' : '',
    placeholder: targetLabel, autocomplete: 'off', autocapitalize: 'none',
    spellcheck: 'false', autocorrect: 'off',
    readonly: q.revealed ? true : undefined,
    value: q.revealed ? (q.answer || '') : undefined,
  });
  els.app.appendChild(h('div', { class: 'review-answers' }, [
    h('div', { class: 'field' }, [h('label', {}, targetLabel), input]),
  ]));

  const isLast = s.index + 1 >= s.questions.length;

  // Phase 2 : la réponse a été validée → on affiche la correction
  if (q.revealed) {
    const good = matchAnswer(q.answer, q.expected, q.expectedTr);
    const expected = q.expected + (q.expectedTr ? ` (${q.expectedTr})` : '');
    els.app.appendChild(h('div', { class: `correction-item ${q.result ? 'good' : 'bad'}` }, [
      h('div', { class: 'ci-fr' }, q.result ? '✅ Correct' : '❌ Incorrect'),
      h('div', { class: 'correction-line' }, [
        h('strong', {}, `${targetLabel} : `),
        good
          ? h('span', { class: `ok ${rtl ? 'ar-text' : ''}` }, `✓ ${q.answer || ''}`)
          : h('span', {}, [
              q.answer ? h('span', { class: 'you' }, `✗ ${q.answer} → `) : h('span', { class: 'you' }, '(vide) → '),
              h('span', { class: `ok ${rtl ? 'ar-text' : ''}` }, expected),
            ]),
      ]),
    ]));

    els.app.appendChild(h('button', { class: 'btn btn-primary btn-block', onClick: () => {
      s.index++;
      if (s.index >= s.questions.length) s.finished = true;
      render();
    } }, isLast ? 'Terminer' : 'Suivant'));
    return;
  }

  // Phase 1 : saisie → « Valider » révèle la correction sans changer de question
  els.app.appendChild(h('button', { class: 'btn btn-primary btn-block', onClick: () => {
    q.answer = input.value.trim();
    const ok = matchAnswer(q.answer, q.expected, q.expectedTr);
    q.result = ok;
    q.revealed = true;
    DB.recordResult(q.id, ok);
    if (ok) s.score++;
    render();
  } }, 'Valider'));

  setTimeout(() => input.focus(), 50);
}

// Normalisation pour comparaison souple
function normalize(str) {
  return String(str || '')
    .toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents latins
    .replace(/[ً-ْٰ]/g, '')            // diacritiques arabes (harakat)
    .replace(/[\s\-_.,;!?']/g, '');
}

// Une réponse est acceptée si elle correspond au mot OU à sa translittération.
function matchAnswer(answer, expected, expectedTr) {
  const a = normalize(answer);
  if (!a) return false;
  if (expected && a === normalize(expected)) return true;
  if (expectedTr && a === normalize(expectedTr)) return true;
  return false;
}

function renderReviewResults() {
  const s = reviewSession;
  els.title.textContent = 'Résultats';
  els.headerAction.hidden = true;

  const pct = Math.round((s.score / s.questions.length) * 100);
  els.app.appendChild(h('div', { class: 'review-card' }, [
    h('div', { class: 'score-big' }, `${s.score}/${s.questions.length}`),
    h('div', { style: 'color:var(--muted);margin-top:4px' }, `${pct}% de réussite`),
    h('div', { style: 'font-size:2rem;margin-top:8px' }, pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'),
  ]));

  els.app.appendChild(h('div', { class: 'section-title', style: 'margin-top:22px' }, 'Correction'));

  s.questions.forEach((q) => {
    const targetLabel = TARGET_LABEL[q.target];
    const rtl = q.target === 'ar';
    const good = matchAnswer(q.answer, q.expected, q.expectedTr);
    const expected = q.expected + (q.expectedTr ? ` (${q.expectedTr})` : '');
    const lines = [];

    // Rappel de la consigne
    if (q.kind === 'verb') {
      const genderLabel = DB.GENDER_LABEL[q.gender] ? ` (${DB.GENDER_LABEL[q.gender]})` : '';
      lines.push(h('div', { class: 'correction-line' }, [
        h('strong', {}, 'Consigne : '),
        h('span', {}, `${q.tense.label}, ${q.person.label}${genderLabel}`),
      ]));
    } else {
      lines.push(h('div', { class: 'correction-line' }, [
        h('strong', {}, `${LANG_LABEL[q.promptLang]} : `),
        h('span', { class: q.promptLang === 'ar' ? 'ar-text' : '' }, q.promptVal),
      ]));
    }

    lines.push(h('div', { class: 'correction-line' }, [
      h('strong', {}, `${targetLabel} : `),
      good
        ? h('span', { class: `ok ${rtl ? 'ar-text' : ''}` }, `✓ ${q.answer || ''}`)
        : h('span', {}, [
            q.answer ? h('span', { class: 'you' }, `✗ ${q.answer} → `) : h('span', { class: 'you' }, '(vide) → '),
            h('span', { class: `ok ${rtl ? 'ar-text' : ''}` }, expected),
          ]),
    ]));

    els.app.appendChild(h('div', { class: `correction-item ${q.result ? 'good' : 'bad'}` }, [
      h('div', { class: 'ci-fr' }, q.fr || '—'),
      ...lines,
    ]));
  });

  els.app.appendChild(h('div', { class: 'btn-row', style: 'margin-top:20px' }, [
    h('button', { class: 'btn btn-ghost', onClick: () => { reviewSession = null; render(); } }, 'Retour'),
    h('button', { class: 'btn btn-accent', onClick: () => { reviewSession = null; render(); } }, 'Nouvelle session'),
  ]));
}

function quitReview() {
  confirmModal('Quitter la session en cours ?', () => {
    reviewSession = null;
    render();
  });
}

// ============================================================
//  ÉCRAN : DONNÉES (export / import)
// ============================================================
function viewSettings() {
  els.title.textContent = 'Données';
  const sections = DB.getSections();
  const totalWords = sections.reduce((n, s) => n + s.count, 0);

  els.app.appendChild(h('div', { class: 'settings-group' }, [
    h('h3', {}, '📊 Vue d\'ensemble'),
    h('p', {}, `${sections.length} sections · ${totalWords} mots enregistrés.`),
  ]));

  els.app.appendChild(h('div', { class: 'settings-group' }, [
    h('h3', {}, '🔄 Mise à jour'),
    h('p', {}, 'Recharge l\'application avec la dernière version publiée. Tes données ne sont pas touchées.'),
    h('button', { class: 'btn btn-primary btn-block', onClick: manualUpdate }, 'Mettre à jour maintenant'),
  ]));

  els.app.appendChild(h('div', { class: 'settings-group' }, [
    h('h3', {}, '⬇️ Exporter'),
    h('p', {}, 'Téléchargez une sauvegarde JSON de toutes vos données (sections, mots, conjugaisons).'),
    h('button', { class: 'btn btn-primary btn-block', onClick: doExport }, 'Exporter en JSON'),
  ]));

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
  fileInput.addEventListener('change', (e) => doImport(e.target.files[0]));

  els.app.appendChild(h('div', { class: 'settings-group' }, [
    h('h3', {}, '⬆️ Importer'),
    h('p', {}, 'Restaurez une sauvegarde. « Remplacer » écrase tout, « Fusionner » ajoute aux données existantes.'),
    fileInput,
    h('div', { class: 'btn-row' }, [
      h('button', { class: 'btn btn-ghost', onClick: () => { importMode = 'merge'; fileInput.click(); } }, 'Fusionner'),
      h('button', { class: 'btn btn-accent', onClick: () => { importMode = 'replace'; fileInput.click(); } }, 'Remplacer'),
    ]),
  ]));

  els.app.appendChild(h('div', { class: 'settings-group' }, [
    h('h3', {}, '⚠️ Réinitialiser'),
    h('p', {}, 'Efface toutes les données et recrée les sections par défaut vides.'),
    h('button', { class: 'btn btn-danger btn-block', onClick: () => {
      confirmModal('Tout effacer ? Cette action est irréversible.', () => {
        localStorage.removeItem('darija-arabic-data-v1');
        DB.init();
        toast('Données réinitialisées');
        render();
      });
    } }, 'Réinitialiser l\'application'),
  ]));

  els.app.appendChild(h('p', { style: 'text-align:center;color:var(--muted);font-size:0.75rem;margin-top:16px' },
    'Toutes les données restent sur cet appareil. Aucun compte, aucun serveur.'));
}

function doExport() {
  const data = DB.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: `darija-arabe-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('Sauvegarde téléchargée');
}

let importMode = 'replace';
function doImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      DB.importData(reader.result, importMode === 'merge');
      toast(importMode === 'merge' ? 'Données fusionnées' : 'Données importées');
      render();
    } catch (e) {
      toast('Import impossible : ' + e.message);
    }
  };
  reader.readAsText(file);
}

// ============================================================
//  MODALES
// ============================================================
function openModal(titleText, builder) {
  clear(els.modalRoot);
  const close = () => clear(els.modalRoot);
  const backdrop = h('div', { class: 'modal-backdrop', onClick: (e) => { if (e.target === backdrop) close(); } });
  const modal = h('div', { class: 'modal' }, [h('h2', {}, titleText)]);
  const body = h('div', {});
  modal.appendChild(body);
  backdrop.appendChild(modal);
  els.modalRoot.appendChild(backdrop);
  builder(body, close);
}

function confirmModal(message, onConfirm) {
  openModal('Confirmation', (body, close) => {
    body.appendChild(h('p', { style: 'margin-bottom:18px;line-height:1.5' }, message));
    body.appendChild(h('div', { class: 'modal-actions' }, [
      h('button', { class: 'btn btn-ghost', onClick: close }, 'Annuler'),
      h('button', { class: 'btn btn-danger', onClick: () => { close(); onConfirm(); } }, 'Confirmer'),
    ]));
  });
}

// ============================================================
//  Carte de routage
// ============================================================
const VIEWS = {
  home: viewHome,
  section: viewSection,
  allWords: viewAllWords,
  wordForm: viewWordForm,
  review: viewReview,
  settings: viewSettings,
};

// ============================================================
//  Démarrage
// ============================================================
DB.init();
render();

// ============================================================
//  PWA : enregistrement + détection de mise à jour
// ============================================================
let swReg = null;
let swRefreshing = false;

function showUpdateBanner(worker) {
  if (document.getElementById('updateBanner')) return;
  const banner = h('div', { id: 'updateBanner', class: 'update-banner' }, [
    h('span', {}, '✨ Nouvelle version disponible'),
    h('button', { class: 'btn-update', onClick: () => {
      banner.querySelector('.btn-update').textContent = 'Rechargement…';
      worker.postMessage({ type: 'SKIP_WAITING' });
    } }, 'Recharger'),
  ]);
  document.body.appendChild(banner);
}

// Bouton manuel (écran Données) : force la récupération de la dernière version.
async function manualUpdate() {
  toast('Recherche de mise à jour…');
  try {
    if ('serviceWorker' in navigator) {
      const reg = swReg || (await navigator.serviceWorker.getRegistration());
      if (reg) {
        try { await reg.update(); } catch (_) {}
        if (reg.waiting) {
          // Une nouvelle version est prête → on l'active, le reload suit (controllerchange).
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
      }
    }
    // Sinon : on vide le cache et on recharge pour garantir des fichiers frais.
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (_) { /* on recharge quand même */ }
  window.location.reload();
}

if ('serviceWorker' in navigator) {
  // Recharge la page une fois que le nouveau worker prend le contrôle.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      swReg = reg;
      // Une mise à jour est déjà en attente ?
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBanner(reg.waiting);
      // Détection d'une nouvelle version pendant l'utilisation.
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(nw);
          }
        });
      });
    }).catch((e) => console.warn('SW non enregistré', e));
  });
}
