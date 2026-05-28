# Quiz quotidien — Anesthésie-Réanimation 🏥

Reçois chaque matin un quiz de 5 QCM cliniques sur ton téléphone, générés par Claude.

---

## ⚡ Installation (10 minutes)

### Étape 1 — Installer l'app ntfy sur ton téléphone

- **Android** : [Play Store → ntfy](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
- **iPhone** : [App Store → ntfy](https://apps.apple.com/app/ntfy/id1625396347)

Ouvre l'app et note le nom de ton **topic personnel** (par exemple : `quiz-ar-dupont`).
> 💡 Choisis un nom unique et difficile à deviner (évite `quiz` tout seul).

Dans l'app ntfy : appuie sur **"+"** → saisit ton topic → **Subscribe**.

---

### Étape 2 — Créer un compte GitHub

Va sur [github.com](https://github.com) → **Sign up** → crée ton compte gratuit.

---

### Étape 3 — Créer le repository

1. Connecte-toi sur GitHub
2. Clique sur **"New repository"** (bouton vert en haut à droite)
3. Nom : `quiz-ar` (ou ce que tu veux)
4. Coche **"Private"** (pour garder ta clé API secrète)
5. Clique **"Create repository"**

---

### Étape 4 — Uploader les fichiers

Dans ton nouveau repository, clique sur **"uploading an existing file"** (ou "Add file" → "Upload files") :
- Uploade `generate-quiz.js`
- Crée le dossier `.github/workflows/` et uploade `daily-quiz.yml` dedans

> **Alternative rapide** : utilise [github.dev](https://github.dev) (VS Code dans le navigateur).

---

### Étape 5 — Ajouter tes secrets

Dans ton repository GitHub :
1. **Settings** → **Secrets and variables** → **Actions**
2. Clique **"New repository secret"** et ajoute :

| Nom | Valeur |
|-----|--------|
| `ANTHROPIC_API_KEY` | Ta clé API Anthropic (depuis [console.anthropic.com](https://console.anthropic.com)) |
| `NTFY_TOPIC` | Le nom de ton topic ntfy (ex: `quiz-ar-dupont`) |

---

### Étape 6 — Tester maintenant

1. Va dans l'onglet **"Actions"** de ton repository
2. Clique sur **"Quiz quotidien Anesthésie-Réanimation"**
3. Clique **"Run workflow"** → **"Run workflow"**
4. Attends 30 secondes → ton téléphone doit vibrer 📳

---

## ⏰ Changer l'heure de réception

Dans `.github/workflows/daily-quiz.yml`, modifie la ligne `cron` :

```yaml
- cron: "0 5 * * *"   # 7h00 Paris (heure d'été)
- cron: "0 6 * * *"   # 7h00 Paris (heure d'hiver)
- cron: "30 4 * * *"  # 6h30 Paris (heure d'été)
```

Format : `"minute heure * * *"` en UTC.

---

## 📚 Thèmes abordés (rotation automatique)

Le thème change chaque jour automatiquement :

1. Voies aériennes et intubation difficile
2. Pharmacologie anesthésique
3. États de choc
4. Réanimation cardio-pulmonaire
5. Anesthésie locorégionale
6. Ventilation mécanique et SDRA
7. Sédation-analgésie en réanimation
8. Analgésie et douleur aiguë
9. Pancréatite aiguë sévère
10. Méningites bactériennes
11. Hémostase et transfusion
12. Monitorage peropératoire
13. Sepsis et choc septique
14. Insuffisance rénale aiguë
15. Traumatologie grave
16. Anesthésie estomac plein
17. Complications peranesthésiques
18. Période postopératoire et SSPI

---

## 💰 Coût

| Service | Prix |
|---------|------|
| GitHub Actions | Gratuit (2000 min/mois inclus) |
| ntfy.sh | Gratuit |
| API Anthropic | ~0,01 € par quiz |

> Environ **3 € par an** pour 365 quiz.
