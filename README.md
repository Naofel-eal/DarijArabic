# Darija & Arabe — PWA d'apprentissage

Application web progressive (PWA) **légère, sans backend et hors-ligne** pour apprendre
l'arabe classique (MSA) et le darija marocain. Tout est stocké localement (`localStorage`)
sur l'appareil — aucun compte, aucun serveur.

## Fonctionnalités

- **Sections** — 8 sections créées par défaut au premier lancement (Lettres, Nombres,
  Couleurs, Animaux, Corps humain, Famille, Nourriture, Verbes). Création de sections
  personnalisées (type « mots » ou « verbes »).
- **Mots** — chaque entrée a 3 langues : Français / Arabe (MSA) + translittération /
  Darija + translittération. Champs arabes en RTL natif (`dir="rtl"`).
- **Verbes** — formulaire de conjugaison complet : 6 personnes × genre (masc./fém. aux
  2ᵉ et 3ᵉ personnes) × 3 temps (présent, passé, futur), en arabe **et** en darija.
- **Mode révision** — 10 mots aléatoires (toutes sections ou une seule). L'app affiche
  une langue tirée au sort, vous saisissez les 2 autres. Score + correction mot par mot.
  Les mots souvent ratés sont priorisés. La saisie tolère accents, harakat et espaces,
  et accepte le mot **ou** sa translittération.
- **Sauvegarde** — export / import JSON (remplacer ou fusionner), réinitialisation.
- **PWA** — `manifest` + service worker → installable et utilisable hors-ligne.

## Lancer en local

Un service worker exige `http(s)` (pas `file://`). Servez le dossier :

```bash
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Déploiement

Hébergez le dossier sur n'importe quel hébergement statique (GitHub Pages, Netlify,
Vercel, un simple serveur web). Aucune étape de build.

## Structure

```
index.html              Coquille de l'app + barre de navigation
css/style.css           Styles (mobile-first, RTL, palette marocaine)
js/db.js                Couche de données (localStorage, conjugaisons, export/import)
js/app.js               Routage + écrans + mode révision
manifest.webmanifest    Métadonnées PWA
sw.js                   Service worker (cache offline)
icons/                  Icônes (SVG + PNG 192/512/180)
```

## Limites volontaires (cette version)

Pas de compte / auth, pas de gamification complexe, pas de TTS/audio.
