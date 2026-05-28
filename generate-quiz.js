
Quizz journalier
/
Claude a terminé la réponse.
Y'a possibilité avec claude de faire des quizz journalier sur un truc pour me faire réviser en anesthésie réanimation

21:28

Architected daily anesthesia quiz tool avec API Claude
Architected daily anesthesia quiz tool avec API Claude
Oui, tout à fait — je peux construire un outil alimenté par l'API Claude qui génère des QCM frais chaque jour sur les sujets que tu choisis. Avec sauvegarde du quiz du jour pour ne pas le régénérer à chaque rechargement.



L'outil est prêt. Voilà comment ça marche :

Ce que ça fait

Tu choisis un thème (12 disponibles : voies aériennes, pharmacologie, choc, RCP, ALR, ventilation, sédation, analgésie, pancréatite, méningite, hémostase, monitorage)
Claude génère des QCM cliniques niveau DESC avec contexte clinique, distracteurs plausibles, et explication détaillée de chaque réponse
Le quiz du jour est mis en cache — si tu le recharges le même jour sur le même thème, il s'affiche instantanément sans re-générer
Quelques détails pratiques

5, 8 ou 10 questions au choix
Difficulté variée (facile / intermédiaire / difficile) et références aux guidelines quand pertinent (SFAR, SFMU, SPILF…)
Score final avec revue question par question
Si tu veux ajouter des thèmes (ex. urgences obstétricales, PICS, pédiatrie…), ou intégrer des niveaux GRADE comme dans tes quizz de guidelines, dis-le moi.

Ce serait possible d'automatiser le truc en mode je reçois une notification chaque jour avec mon quizz à faire

21:33

Évalué la faisabilité et architecturé une solution d'automatisation quotidienne
Évalué la faisabilité et architecturé une solution d'automatisation quotidienne
Bonne idée, mais ça dépasse ce que Claude.ai peut faire seul — il faudrait un planificateur externe. La bonne nouvelle : c'est faisable en ~10 minutes avec GitHub Actions (gratuit, zero serveur). Le principe :

Chaque matin à l'heure que tu veux
→ GitHub lance un script automatiquement
→ Le script appelle l'API Claude → génère ton quiz
→ T'envoie un email HTML avec les questions du jour
Je te génère tout le code prêt à l'emploi. Tu as un compte GitHub ?

Q : Tu as un compte GitHub ?
R : Non, mais je peux en créer un

Q : Tu préfères recevoir le quiz comment ?
R : Notification téléphone (via app)

21:37

Architected GitHub Actions workflow with ntfy notifications
Architected GitHub Actions workflow with ntfy notifications
Parfait. On va utiliser ntfy.sh — une app gratuite de push notifications (iOS & Android) qui reçoit des messages via une simple requête HTTP. Couplée à GitHub Actions, c'est la solution la plus simple.

L'architecture finale :

GitHub Actions (cron 7h00)
  → génère le quiz via API Claude
  → pousse une notif sur ntfy.sh
  → ton téléphone vibre 📳
Je te génère tout le code maintenant.


Exécuté 3 commandes, 3 fichiers créés, lu un fichier
Exécuté 3 commandes, 3 fichiers créés, lu un fichier
Tout est dans le zip. Voilà ce que tu reçois chaque matin sur ton téléphone :

🏥 Quiz du jour — Ventilation mécanique

📅 jeudi 28 mai

🟢 Q1. Patient de 67 ans, SDRA modéré...
   A) VT 8 mL/kg PBW, PEP 5 cmH₂O
   B) VT 6 mL/kg PBW, PEP 10 cmH₂O
   ...

🟡 Q2. Critères de Berlin, PaO₂/FiO₂...
   ...

━━━━━━━━━━━━━━━
💡 Réponses — réfléchis d'abord !
━━━━━━━━━━━━━━━

Q1 → B : Le protocole ARDSNet recommande...
Q2 → ...
Les 4 étapes pour démarrer :

Téléphone → installe l'app ntfy (iOS/Android, gratuite) → crée ton topic (ex: quiz-ar-dupont)
github.com → crée un compte → nouveau repository privé
Upload les 2 fichiers du zip dans le repo (le README explique tout, étape par étape)
Settings → Secrets → ajoute ta clé API Anthropic + ton topic ntfy
Ensuite lance un test manuel depuis l'onglet Actions → 30 secondes plus tard ton téléphone vibre.

Coût total : ~3€/an (API Claude uniquement, tout le reste est gratuit). Le thème tourne automatiquement sur 18 modules différents.


Daily quiz ar
ZIP 
Ce serait possible d'automatiser le truc en mode je reçois une notification chaque jour avec mon quizz à faireg

21:40
Comment ça 3 euros par an si je fais un quizz par jour ça va couter plus non ?

21:43

Recalculated quiz costs and validated initial estimate accuracy
Recalculated quiz costs and validated initial estimate accuracy
Bonne question, le raisonnement est valide — voilà le calcul détaillé :

Par quiz généré (5 questions + explications) :

Tokens	Prix Sonnet ($/million)	Coût
Input (prompt système + question)	~400	$3	~$0.0012
Output (JSON 5 questions)	~700	$15	~$0.0105
Total			~$0.012
Soit environ 1,1 centime d'euro par quiz.

Sur un an :

365 jours × 0,011 € = ~4 € / an
J'avais arrondi à 0,01 € dans le README, ce qui donne ~3,65 €. C'est correct — l'ordre de grandeur est bon, disons 4-5 €/an pour être précis.

Tu pensais à quoi comme montant ? Si tu imaginais des dizaines d'euros, c'est parce que les gens confondent souvent avec les abonnements Claude Pro ($20/mois) — mais là on appelle directement l'API qui facture à l'usage, et un quiz c'est une infime quantité de tokens.

ou je trouve la clé

21:44

Localisé la requête concernant une clé API
Localisé la requête concernant une clé API
Sur console.anthropic.com :

Crée un compte (ou connecte-toi)
Menu gauche → "API Keys"
"Create Key" → copie la clé (elle commence par sk-ant-...)
⚠️ Elle ne s'affiche qu'une seule fois — copie-la direct dans les secrets GitHub sans la noter ailleurs.

Il faut aussi ajouter un peu de crédit (minimum $5) dans "Billing" pour activer l'API. Avec 4€/an de consommation, ce premier rechargement te dure plus d'un an.

je dois la mettre où la clé du coup

21:49

Excavated prior documentation pour clarifier placement clé API
Excavated prior documentation pour clarifier placement clé API
Dans les secrets GitHub de ton repository :

Ouvre ton repo GitHub → Settings (onglet en haut)
Menu gauche → Secrets and variables → Actions
"New repository secret"
Ajoute les 2 secrets :
Name	Secret
ANTHROPIC_API_KEY	sk-ant-... (ta clé Anthropic)
NTFY_TOPIC	le nom de ton topic ntfy (ex: quiz-ar-dupont)
C'est tout — GitHub les injecte automatiquement dans le script au moment où il tourne. Tu n'as jamais la clé en clair dans ton code.

Et maintenant

21:52

Orchestrated next steps after initial setup completion
Orchestrated next steps after initial setup completion
Tu as bien uploadé les 2 fichiers dans le repo ?

generate-quiz.js à la racine
daily-quiz.yml dans .github/workflows/
Si oui → teste maintenant :

Onglet Actions dans ton repo
Clique sur "Quiz quotidien Anesthésie-Réanimation" dans la liste à gauche
Bouton "Run workflow" → "Run workflow" (vert)
Attends ~30 secondes → ton téléphone devrait vibrer 📳
Dis-moi ce qui se passe — si ça plante, il y a un log d'erreur dans Actions qui me permet de diagnostiquer.

J'ai fait action j'ai pas quizz quotidien

21:55

Diagnostiqué problème de workflow manquant dans le repository
Diagnostiqué problème de workflow manquant dans le repository
Le fichier daily-quiz.yml n'est probablement pas au bon endroit. Vérifie dans ton repo :

La structure doit être exactement :

ton-repo/
├── generate-quiz.js
└── .github/
    └── workflows/
        └── daily-quiz.yml
Comment vérifier : Dans ton repo GitHub, clique sur le dossier .github → puis workflows → tu dois voir daily-quiz.yml dedans.

Si le dossier .github n'existe pas, voilà comment créer les fichiers au bon endroit directement sur GitHub :

Dans ton repo → "Add file" → "Create new file"
Dans le champ nom du fichier, tape exactement :
.github/workflows/daily-quiz.yml
GitHub va créer les dossiers automatiquement
Colle le contenu du fichier daily-quiz.yml du zip
"Commit changes"
Dis-moi ce que tu vois dans ton repo actuellement — je te guide étape par étape.

Capture d’écran 2026-05-28 à 21.56.25.png
21:56

The user prompt is empty, so I cannot determine the primary language. However, based on the thinking block provided, here is my summary: Identified file location discrepancy and prescribed content transfer
The user prompt is empty, so I cannot determine the primary language. However, based on the thinking block provided, here is my summary: Identified file location discrepancy and prescribed content transfer
Parfait, t'es au bon endroit ! Le fichier est vide — colle ce contenu dedans :

yaml
name: Quiz quotidien Anesthésie-Réanimation

on:
  schedule:
    - cron: "0 5 * * *"
  workflow_dispatch:

jobs:
  send-quiz:
    runs-on: ubuntu-latest
    steps:
      - name: Récupérer le code
        uses: actions/checkout@v4

      - name: Configurer Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Générer et envoyer le quiz
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NTFY_TOPIC: ${{ secrets.NTFY_TOPIC }}
        run: node generate-quiz.js
Ensuite clique sur "Commit changes" (bouton vert en haut à droite). Dis-moi quand c'est fait !

fait

21:57
Maintenant va dans l'onglet Actions en haut de ton repo.

Tu devrais voir "Quiz quotidien Anesthésie-Réanimation" dans la liste à gauche — clique dessus puis "Run workflow" pour tester.

Qu'est-ce que tu vois ?

c'est bon

21:57
🎉 Ton téléphone a vibré ?

bah non parce que c'est pas connecté au tel

21:58
Ah oui ! Il faut installer l'app ntfy sur ton téléphone et créer ton topic. C'est l'étape finale :

Sur ton téléphone :

Installe l'app ntfy (App Store ou Play Store, gratuite)
Ouvre l'app → "+" en bas
Tape un nom de topic unique, ex: quiz-ar-dupont → Subscribe
Ensuite sur GitHub, ajoute le secret qui manque :

Settings → Secrets and variables → Actions
"New repository secret"
Name : NTFY_TOPIC / Secret : quiz-ar-dupont (le nom que t'as choisi)
Puis retourne dans Actions → "Run workflow" pour retester.

Tu as iOS ou Android ?

Capture d’écran 2026-05-28 à 22.00.41.png
22:00

I cannot provide a summary because the user prompt is empty. Please provide the user's actual question or request
I cannot provide a summary because the user prompt is empty. Please provide the user's actual question or request
Il y a une erreur dans le script. Clique sur "send-quiz" (le lien rouge) pour voir le log complet — il y a un message d'erreur précis dedans.

C'est probablement un des secrets manquants (ANTHROPIC_API_KEY ou NTFY_TOPIC). Envoie-moi une capture du log et je te dis exactement quoi corriger.

Capture d’écran 2026-05-28 à 22.01.08.png
22:01

Identified outdated model reference and resolved API compatibility issue
Identified outdated model reference and resolved API compatibility issue
Le problème est clair — le nom du modèle dans le script est obsolète. Il faut le mettre à jour.

Dans ton repo, ouvre generate-quiz.js → clique sur le crayon ✏️ pour éditer → trouve cette ligne :

js
model: "claude-sonnet-4-20250514",
Remplace-la par :

js
model: "claude-sonnet-4-6",
Commit changes → puis relance le workflow depuis Actions. Ça devrait passer cette fois !

Capture d’écran 2026-05-28 à 22.05.00.png
22:05

Diagnosed JSON truncation issue and prescribed token limit increase
Diagnosed JSON truncation issue and prescribed token limit increase
Bon progrès — le modèle répond maintenant mais le JSON est tronqué. Le max_tokens est trop bas (1000), la réponse se coupe en plein milieu.

Dans generate-quiz.js, trouve cette ligne :

js
max_tokens: 1000,
Remplace par :

js
max_tokens: 4000,
Commit → relance le workflow. Cette fois ça devrait passer !

ça fait 1min ca charge

22:07
C'est normal, le modèle génère 5 questions détaillées — ça prend 30-60 secondes. Attends encore un peu, dis-moi ce que donne le résultat !

Capture d’écran 2026-05-28 à 22.07.38.png
Coco vérifie moi tout ce que t'as fait sinon on va pas y arriver

22:07

Identified encoding bug and orchestrated comprehensive file reconstruction
Identified encoding bug and orchestrated comprehensive file reconstruction
Bonne idée, je reprends tout depuis le début proprement. Le quiz se génère bien (✅ ligne 9) mais les emojis dans le message font planter l'envoi ntfy. Je corrige tout d'un coup.


Exécuté 2 commandes, lu un fichier
Exécuté 2 commandes, lu un fichier
Voilà le fichier corrigé. Les 3 bugs fixés :

✅ Bon nom de modèle (claude-sonnet-4-6)
✅ max_tokens: 4000 (JSON plus tronqué)
✅ Emojis supprimés du message → plus d'erreur d'encodage
À faire : dans ton repo GitHub, ouvre generate-quiz.js → crayon ✏️ → sélectionne tout → colle le contenu du nouveau fichier → Commit → relance le workflow.


Generate quiz
JS 
J'ai reçu la notif je fais quoi avec

22:11

Orchestrated quiz engagement strategy with answers
Orchestrated quiz engagement strategy with answers
C'est en marche ! 🎉

Le format de la notif c'est :

En haut → les 5 questions avec les 4 choix (A/B/C/D)
En bas après --- REPONSES --- → les bonnes réponses + explications
L'idée c'est de lire les questions, réfléchir, puis scroller vers le bas pour voir les corrections.

Chaque matin à 7h tu reçois automatiquement ton quiz sur un nouveau thème — ça tourne sur 18 modules différents donc tu couvres tout le programme du DESC sur quelques semaines.

Tu veux qu'on améliore le format de la notif ou qu'on ajoute des trucs ?

J'ai reçu ça : You received a file: attachment.txt

22:12

Orchestrated message splitting strategy to circumvent attachment conversion
Orchestrated message splitting strategy to circumvent attachment conversion
Le message est trop long, ntfy l'a converti en fichier. Je vais couper en 2 notifications :

Notif 1 → les 5 questions (tu réfléchis)
Notif 2 → les réponses (30 secondes après)
Remplace le contenu de generate-quiz.js par cette version :


Exécuté 2 commandes, lu un fichier
Exécuté 2 commandes, lu un fichier
Remplace le fichier dans GitHub comme d'habitude → Commit → Run workflow.

Cette fois tu vas recevoir 2 notifications :

La 1ère avec les 5 questions → tu réfléchis
La 2ème 30 secondes après avec les réponses + explications

Generate quiz
JS 
Attends mais coco je veux un quizz interactif pas uniquement du texte

22:12

Architected interactive quiz with GitHub Pages hosting solution
Architected interactive quiz with GitHub Pages hosting solution
Ah oui tu as raison, c'est bien mieux ! On va faire ça proprement :

Tu reçois une notif → tu tappes dessus → ça ouvre une page web interactive dans ton navigateur avec le vrai quiz cliquable, score, explications, tout.

On va utiliser GitHub Pages (gratuit, inclus dans GitHub) pour héberger la page. Le workflow génère le quiz chaque matin, crée la page HTML, et t'envoie le lien.

Je réécris tout maintenant.


Exécuté 3 commandes, lu un fichier
Exécuté 3 commandes, lu un fichier
Voilà les 2 fichiers mis à jour. 3 étapes pour finaliser :

1. Activer GitHub Pages Dans ton repo → Settings → Pages → Source : "Deploy from a branch" → Branch : main → Folder : /docs → Save

GitHub te donne une URL du style https://zedrftgyhujiko.github.io/Quizz-journalier/

2. Ajouter le secret PAGES_URL Settings → Secrets → New secret → PAGES_URL = ton URL GitHub Pages

3. Remplacer les 2 fichiers dans ton repo avec ceux ci-dessus → Commit → Run workflow

Résultat : tu reçois une notif → tu appuies → le quiz s'ouvre dans ton navigateur avec questions cliquables, feedback immédiat et score final.


Generate quiz
JS 

Daily quiz
YML 
c'est payant non

22:15
Non, GitHub Pages c'est gratuit pour les repos publics.

Mais ton repo est en privé (tu l'as mis privé pour protéger ta clé API) — et là GitHub Pages nécessite un abonnement payant pour les repos privés.

Deux solutions :

Option A — Rendre le repo public ✅ Gratuit

Aucun risque car ta clé API est dans les secrets, pas dans le code
Le code visible ne contient aucune donnée sensible
Option B — Séparer en 2 repos ✅ Gratuit aussi

Un repo privé avec le script + les secrets (le workflow tourne là)
Un repo public juste pour héberger la page HTML
L'option A est la plus simple. Tu veux la tenter ?

oui

22:15
Dans ton repo GitHub :

Settings → scroll jusqu'à "Danger Zone" en bas → "Change visibility" → "Make public" → confirme

Dis-moi quand c'est fait et on active GitHub Pages !

J'ai pas l'url qui s'affiche

22:18

Diagnosed GitHub Pages activation requirement
Diagnosed GitHub Pages activation requirement
Il faut d'abord l'activer. Dans ton repo :

Settings → Pages (menu gauche) →

Source : "Deploy from a branch"
Branch : main
Folder : / (root) pour l'instant → Save
L'URL apparaît en haut de la page Pages après quelques secondes. Envoie-moi une capture si tu vois pas.

Capture d’écran 2026-05-28 à 22.18.56.png
22:19

I notice the user prompt is empty, so I cannot determine the primary language. However, based on the thinking block content, here is a summary: Deduced GitHub Pages URL and outlined deployment prerequisites
I notice the user prompt is empty, so I cannot determine the primary language. However, based on the thinking block content, here is a summary: Deduced GitHub Pages URL and outlined deployment prerequisites
C'est bon, je vois tout ce qu'il faut ! GitHub Pages est bien configuré sur /docs.

Ton URL c'est :

https://zedrftgyhujiko.github.io/Quizz-journalier/
Maintenant ajoute ce secret dans Settings → Secrets → New repository secret :

Name : PAGES_URL
Secret : https://zedrftgyhujiko.github.io/Quizz-journalier/
Ensuite remplace les 2 fichiers dans ton repo avec ceux que je t'ai donnés tout à l'heure (generate-quiz.js et daily-quiz.yml), puis Run workflow.

Le workflow va créer le fichier docs/index.html et GitHub Pages va publier l'URL automatiquement.

redonnes les fichiers

22:19

A exécuté une commande, lu un fichier
A exécuté une commande, lu un fichier
Les voilà. Dans ton repo GitHub :

Clique sur generate-quiz.js → ✏️ → sélectionne tout → colle → Commit
Clique sur .github/workflows/daily-quiz.yml → ✏️ → sélectionne tout → colle → Commit
Actions → Run workflow

Generate quiz
JS 

Daily quiz
YML 






Claude est une IA et peut faire des erreurs. Veuillez vérifier les réponses.
Generate quiz · JS
const fs = require("fs");
const path = require("path");
 
const TOPICS = [
  "Voies aériennes et intubation difficile",
  "Pharmacologie anesthésique (curares, morphiniques, halogénés)",
  "États de choc (septique, hémorragique, anaphylactique, cardiogénique)",
  "Réanimation cardio-pulmonaire (RCP adulte)",
  "Anesthésie locorégionale (rachianesthésie, péridurale, blocs périphériques)",
  "Ventilation mécanique et SDRA",
  "Sédation-analgésie en réanimation",
  "Analgésie et douleur aiguë",
  "Pancréatite aiguë sévère",
  "Méningites bactériennes et encéphalites",
  "Hémostase, coagulopathies et transfusion",
  "Monitorage peropératoire (BIS, TOF, Vigileo)",
  "Sepsis et choc septique",
  "Insuffisance rénale aiguë en réanimation",
  "Traumatologie grave et damage control",
  "Anesthésie du patient à estomac plein",
  "Complications peranesthésiques",
  "Période postopératoire et SSPI",
];
 
function getTodayTopic() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return TOPICS[dayOfYear % TOPICS.length];
}
 
async function generateQuiz(topic) {
  const prompt = `Tu es un formateur expert en anesthésie-réanimation pour internes français (DESC).
Génère exactement 5 QCM cliniques de niveau DESC sur : "${topic}".
 
Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après :
{
  "questions": [
    {
      "num": 1,
      "difficulty": "intermédiaire",
      "context": "Contexte clinique optionnel (1-2 phrases max)",
      "question": "Question précise ?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "B",
      "explanation": "Explication pédagogique en 2-3 phrases justifiant la bonne réponse et les pièges."
    }
  ]
}
 
Règles : contextes cliniques réalistes, une seule bonne réponse, distracteurs plausibles, références guidelines récentes (SFAR, SRLF, ESA). 2 faciles, 2 intermédiaires, 1 difficile.`;
 
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
 
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Anthropic ${response.status}: ${err}`);
  }
 
  const data = await response.json();
  const text = data.content.map((b) => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
 
function generateHTML(topic, questions, dateStr) {
  const quizData = JSON.stringify({ topic, questions, dateStr });
 
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quiz AR – ${topic}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; min-height: 100vh; padding: 16px; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: #1a56a0; color: white; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .header-date { font-size: 12px; opacity: 0.8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .header-topic { font-size: 17px; font-weight: 600; }
  .progress-wrap { background: rgba(255,255,255,0.3); border-radius: 4px; height: 4px; margin-top: 14px; }
  .progress-fill { background: white; height: 4px; border-radius: 4px; transition: width 0.3s; }
  .progress-txt { font-size: 12px; opacity: 0.8; margin-top: 6px; }
  .card { background: white; border-radius: 16px; padding: 20px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
  .badge-facile { background: #d1fae5; color: #065f46; }
  .badge-intermediaire { background: #fef3c7; color: #92400e; }
  .badge-difficile { background: #fee2e2; color: #991b1b; }
  .context { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1a56a0; }
  .question { font-size: 16px; font-weight: 600; line-height: 1.5; color: #1e293b; margin-bottom: 16px; }
  .options { display: flex; flex-direction: column; gap: 8px; }
  .opt { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.15s; background: white; text-align: left; font-size: 14px; line-height: 1.4; color: #334155; }
  .opt:hover:not(:disabled) { border-color: #1a56a0; background: #eff6ff; }
  .opt-letter { font-weight: 700; color: #1a56a0; min-width: 18px; }
  .opt.correct { border-color: #059669; background: #d1fae5; color: #064e3b; }
  .opt.correct .opt-letter { color: #059669; }
  .opt.wrong { border-color: #dc2626; background: #fee2e2; color: #7f1d1d; }
  .opt.wrong .opt-letter { color: #dc2626; }
  .opt.reveal { border-color: #059669; background: #d1fae5; color: #064e3b; }
  .opt.reveal .opt-letter { color: #059669; }
  .opt:disabled { cursor: default; }
  .explanation { margin-top: 14px; padding: 12px 14px; background: #eff6ff; border-radius: 10px; border-left: 3px solid #1a56a0; font-size: 13px; line-height: 1.6; color: #1e40af; }
  .explanation strong { font-weight: 700; }
  .next-btn { display: block; width: 100%; margin-top: 14px; padding: 13px; background: #1a56a0; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
  .next-btn:hover { opacity: 0.9; }
  .score-header { text-align: center; padding: 10px 0; }
  .score-big { font-size: 64px; font-weight: 700; color: #1a56a0; line-height: 1; }
  .score-total { font-size: 18px; color: #64748b; margin-top: 4px; }
  .score-msg { font-size: 15px; font-weight: 600; margin-top: 12px; color: #1e293b; }
  .review-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; align-items: flex-start; }
  .review-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .review-ok { background: #d1fae5; color: #059669; }
  .review-ko { background: #fee2e2; color: #dc2626; }
  .review-q { font-size: 13px; color: #1e293b; line-height: 1.4; }
  .review-answer { font-size: 12px; color: #64748b; margin-top: 2px; }
  .restart-btn { display: block; width: 100%; margin-top: 16px; padding: 13px; background: #f1f5f9; color: #1e293b; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .hidden { display: none; }
</style>
</head>
<body>
<div class="container" id="app"></div>
<script>
const DATA = ${quizData};
let current = 0;
let selected = null;
let revealed = false;
let answers = [];
 
function scoreMsg(s, t) {
  const p = s/t;
  if (p >= 0.9) return "Excellent ! Maîtrise solide du sujet.";
  if (p >= 0.7) return "Bon niveau — quelques points à consolider.";
  if (p >= 0.5) return "Résultats corrects — révisions recommandées.";
  return "À retravailler — repasse ce sujet bientôt.";
}
 
function render() {
  const app = document.getElementById('app');
  const qs = DATA.questions;
 
  if (current >= qs.length) {
    const score = answers.filter((a,i) => a === qs[i].correct).length;
    app.innerHTML = \`
      <div class="header">
        <div class="header-date">\${DATA.dateStr}</div>
        <div class="header-topic">\${DATA.topic}</div>
        <div class="progress-wrap"><div class="progress-fill" style="width:100%"></div></div>
        <div class="progress-txt">Quiz terminé</div>
      </div>
      <div class="card">
        <div class="score-header">
          <div class="score-big">\${score}/\${qs.length}</div>
          <div class="score-total">\${Math.round(score/qs.length*100)}% de bonnes réponses</div>
          <div class="score-msg">\${scoreMsg(score, qs.length)}</div>
        </div>
      </div>
      <div class="card">
        <div style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Récapitulatif</div>
        \${qs.map((q,i) => {
          const ok = answers[i] === q.correct;
          return \`<div class="review-item">
            <div class="review-icon \${ok ? 'review-ok' : 'review-ko'}">\${ok ? '✓' : '✗'}</div>
            <div>
              <div class="review-q">Q\${q.num}. \${q.question}</div>
              \${!ok ? \`<div class="review-answer">Ta réponse : \${answers[i] || '—'} · Bonne réponse : \${q.correct}</div>\` : ''}
            </div>
          </div>\`;
        }).join('')}
        <button class="restart-btn" onclick="restart()">Recommencer</button>
      </div>
    \`;
    return;
  }
 
  const q = qs[current];
  const pct = (current / qs.length * 100).toFixed(0);
  const letters = ['A','B','C','D'];
  const badgeClass = q.difficulty === 'difficile' ? 'badge-difficile' : q.difficulty === 'intermédiaire' ? 'badge-intermediaire' : 'badge-facile';
 
  app.innerHTML = \`
    <div class="header">
      <div class="header-date">\${DATA.dateStr}</div>
      <div class="header-topic">\${DATA.topic}</div>
      <div class="progress-wrap"><div class="progress-fill" style="width:\${pct}%"></div></div>
      <div class="progress-txt">Question \${current+1} / \${qs.length}</div>
    </div>
    <div class="card">
      <span class="badge \${badgeClass}">\${q.difficulty}</span>
      \${q.context ? \`<div class="context">\${q.context}</div>\` : ''}
      <div class="question">\${q.question}</div>
      <div class="options" id="opts">
        \${letters.map(l => {
          let cls = '';
          if (revealed) {
            if (l === q.correct) cls = selected === l ? 'correct' : 'reveal';
            else if (l === selected) cls = 'wrong';
          }
          return \`<button class="opt \${cls}" data-l="\${l}" \${revealed ? 'disabled' : ''}>
            <span class="opt-letter">\${l}</span>
            <span>\${q.options[l]}</span>
          </button>\`;
        }).join('')}
      </div>
      \${revealed ? \`
        <div class="explanation"><strong>Réponse : \${q.correct}</strong> — \${q.explanation}</div>
        <button class="next-btn" onclick="next()">\${current < qs.length-1 ? 'Question suivante →' : 'Voir les résultats →'}</button>
      \` : ''}
    </div>
  \`;
 
  if (!revealed) {
    document.getElementById('opts').addEventListener('click', e => {
      const btn = e.target.closest('[data-l]');
      if (!btn) return;
      selected = btn.dataset.l;
      answers[current] = selected;
      revealed = true;
      render();
    });
  }
}
 
function next() {
  current++;
  selected = null;
  revealed = false;
  render();
}
 
function restart() {
  current = 0; selected = null; revealed = false; answers = [];
  render();
}
 
render();
</script>
</body>
</html>`;
}
 
async function sendNotif(ntfyTopic, title, message, url) {
  const response = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
    method: "POST",
    headers: {
      "Title": title,
      "Priority": "high",
      "Tags": "stethoscope",
      "Click": url,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: message,
  });
  if (!response.ok) throw new Error(`ntfy erreur ${response.status}`);
}
 
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquante");
  if (!process.env.PAGES_URL) throw new Error("PAGES_URL manquante");
 
  const topic = getTodayTopic();
  console.log(`Thème : ${topic}`);
 
  console.log("Génération du quiz...");
  const data = await generateQuiz(topic);
  console.log(`${data.questions.length} questions générées`);
 
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long"
  });
 
  const html = generateHTML(topic, data.questions, dateStr);
  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync(path.join("docs", "index.html"), html, "utf8");
  console.log("Fichier docs/index.html créé");
 
  const url = process.env.PAGES_URL;
  const notifMsg = `${topic} — ${data.questions.length} questions\nAppuie pour ouvrir le quiz interactif`;
  await sendNotif(process.env.NTFY_TOPIC, "Quiz AR du jour", notifMsg, url);
  console.log(`Notification envoyée → ${url}`);
}
 
main().catch(err => { console.error("Erreur :", err.message); process.exit(1); });
 
