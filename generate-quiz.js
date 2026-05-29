const fs = require("fs");
const path = require("path");

const PAGES_BASE = "https://zedrftgyhujiko.github.io/Quizz-journalier";
const HISTORY_FILE = "history.json";

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch (e) {}
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

async function apiCall(messages, maxTokens = 500, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, messages }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.content.map(b => b.text || "").join("").replace(/```json|```/g, "").trim();
      }
      const errText = await resp.text();
      if (resp.status >= 500 && attempt < retries) {
        console.log(`    Tentative ${attempt}/${retries} échouée (${resp.status}), retry dans 10s...`);
        await new Promise(r => setTimeout(r, 10000));
      } else {
        throw new Error(`API ${resp.status}: ${errText}`);
      }
    } catch (e) {
      if (attempt < retries && (e.message.includes("fetch") || e.message.includes("503"))) {
        console.log(`    Tentative ${attempt}/${retries} — erreur réseau, retry dans 10s...`);
        await new Promise(r => setTimeout(r, 10000));
      } else {
        throw e;
      }
    }
  }
}

async function generateTopic(history) {
  const done = history.map(h => `- ${h.topic}`).join("\n") || "Aucun thème encore traité.";
  const prompt = `Tu es un expert en anesthésie-réanimation (DESC). Propose UN thème de révision très spécifique et clinique pour un interne avancé en DESC anesthésie-réanimation.

Thèmes déjà traités (ne pas répéter) :
${done}

Niveau attendu (exemples) :
- "Gestion des anticoagulants et antiplaquettaires en périopératoire"
- "Anesthésie pour patient avec rétrécissement aortique serré non opéré"
- "Prise en charge de la défaillance ventriculaire droite aiguë en réanimation"
- "Anesthésie pour césarienne en urgence extrême (code rouge)"
- "Bloc interscalénique : indications, technique et complications"
- "Choc anaphylactique peranesthésique : diagnostic et traitement"
- "Anesthésie du patient cirrhotique Child-Pugh B/C"
- "Gestion des voies aériennes difficiles prévues : stratégie et outils"

Réponds UNIQUEMENT en JSON valide :
{ "topic": "Titre très précis et clinique", "cat": "Catégorie (ex: Cardio-anesthésie, ALR, Obstétrique, Périopératoire, Voies aériennes, Réanimation, Urgences peranesthésiques...)" }`;
  return JSON.parse(await apiCall([{ role: "user", content: prompt }], 300));
}

async function generateContent(topic) {
  const prompt = `Tu es un expert sénior en anesthésie-réanimation (DESC/PH) et un pédagogue rigoureux. Génère une fiche de révision de haute qualité sur "${topic}".

PROCESSUS EN 2 TEMPS — tu dois faire les deux avant de répondre :
TEMPS 1 — Génère le contenu complet (cours + 10 QCM)
TEMPS 2 — Avant de répondre, relis et vérifie mentalement :
  • Chaque chiffre, seuil, grade de recommandation est-il exact ?
  • Chaque QCM a-t-il exactement UNE bonne réponse ?
  • Les distracteurs sont-ils vraiment plausibles (erreurs classiques d'internes) ?
  • Les références sont-elles réelles et récentes (≥ 2020 si possible) ?
  • Le cours est-il structuré et lisible (pas de blocs denses) ?
  Corrige tout problème avant de retourner le JSON.

FORMAT DES SECTIONS — utilise ces types d'items pour la lisibilité :
- type "text" : paragraphe court (2-3 lignes max), utilise **gras** pour les termes clés
- type "list" : liste de points factuels avec **gras** sur les termes importants
- type "warning" : piège clinique, contre-indication, erreur fréquente
- type "formula" : formule, seuil chiffré, critère diagnostique précis

Réponds UNIQUEMENT en JSON valide, sans markdown autour :
{
  "course": {
    "intro": "Introduction clinique percutante en 2-3 phrases — pourquoi ce sujet est crucial en pratique",
    "sections": [
      {
        "title": "Définitions / Rappels essentiels",
        "items": [
          { "type": "text", "content": "Texte court avec **termes clés** en gras" },
          { "type": "list", "items": ["**Terme** : définition précise", "**Terme** : définition précise"] },
          { "type": "warning", "content": "Piège ou erreur fréquente à éviter" },
          { "type": "formula", "content": "Formule ou seuil : valeur numérique précise" }
        ]
      }
    ],
    "keypoints": [
      "**Point 1** : explication courte et actionnable",
      "**Point 2** : ...",
      "**Point 3** : ...",
      "**Point 4** : ...",
      "**Point 5** : ..."
    ],
    "references": ["Auteurs — Titre — Journal Année", "SFAR/SRLF/ESICM/ESA — Sujet — Année"]
  },
  "questions": [
    {
      "num": 1,
      "difficulty": "expert",
      "context": "Contexte clinique réaliste et précis (1-2 phrases, optionnel)",
      "question": "Question précise niveau DESC ?",
      "options": { "A": "Option plausible", "B": "Option plausible", "C": "Option plausible", "D": "Option plausible" },
      "correct": "B",
      "explanation": "Réponse B correcte car [raison précise]. Piège A : [pourquoi erroné]. Piège C : [pourquoi erroné]."
    }
  ]
}

Sections obligatoires (adapte les titres au thème) :
1. Définitions / Rappels essentiels
2. Physiopathologie / Mécanismes
3. Évaluation / Diagnostic
4. Stratégie de prise en charge (détaillée, avec seuils et doses si pertinent)
5. Complications et leur gestion
6. Recommandations clés (avec grades et années)

Règles QCM absolues :
- 10 questions TOUTES de niveau expert/difficile
- Distracteurs = erreurs classiques d'internes avancés (vraisemblables, pas absurdes)
- Explication = nomme le piège principal de chaque mauvaise réponse
- Varie les types : dose/seuil, mécanisme, indication, contre-indication, complication, conduite à tenir`;

  return JSON.parse(await apiCall([{ role: "user", content: prompt }], 16000));
}

// Convertit les items de section en HTML lisible
function renderItems(items) {
  if (!items || !Array.isArray(items)) return "";
  return items.map(item => {
    if (!item) return "";
    if (item.type === "list") {
      const lis = (item.items || []).map(i => `<li>${md(i)}</li>`).join("");
      return `<ul class="content-list">${lis}</ul>`;
    }
    if (item.type === "warning") {
      return `<div class="content-warning">⚠️ ${md(item.content)}</div>`;
    }
    if (item.type === "formula") {
      return `<div class="content-formula">📐 ${md(item.content)}</div>`;
    }
    // type "text" ou autre
    return `<p class="content-text">${md(item.content || "")}</p>`;
  }).join("");
}

// Convertit markdown simple en HTML
function md(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/• /g, "")
    .replace(/\n/g, "<br>");
}

function catColor(cat) {
  const map = {
    "Cardio-anesthésie":    { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
    "Obstétrique":          { bg: "#fce7f3", text: "#831843", border: "#f9a8d4" },
    "ALR":                  { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
    "Périopératoire":       { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
    "Réanimation":          { bg: "#dcfce7", text: "#14532d", border: "#86efac" },
    "Neuroréanimation":     { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
    "Voies aériennes":      { bg: "#ccfbf1", text: "#134e4a", border: "#5eead4" },
    "Urgences peranesthésiques": { bg: "#ffedd5", text: "#7c2d12", border: "#fdba74" },
    "Pédiatrie":            { bg: "#fdf4ff", text: "#581c87", border: "#e879f9" },
    "Pharmacologie":        { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  };
  for (const key of Object.keys(map)) {
    if (cat && cat.toLowerCase().includes(key.toLowerCase())) return map[key];
  }
  return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" };
}

function generateDailyHTML(entry) {
  const { date, dateStr, topic, cat, course, questions } = entry;
  const c = catColor(cat);
  const qData = JSON.stringify(questions);

  const sectionsHTML = (course.sections || []).map(s => `
    <div class="section">
      <div class="section-title">${s.title}</div>
      <div class="section-body">${renderItems(s.items)}</div>
    </div>`
  ).join("");

  const keypointsHTML = (course.keypoints || []).map((k, i) =>
    `<div class="keypoint"><span class="kp-num">${i + 1}</span><span>${md(k)}</span></div>`
  ).join("");

  const refsHTML = (course.references || []).map(r =>
    `<div class="ref"><span class="ref-dot">📄</span>${r}</div>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AR – ${topic}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;min-height:100vh;padding:16px;font-size:15px}
.container{max-width:720px;margin:0 auto}
.back{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b;text-decoration:none;margin-bottom:12px;padding:6px 12px;background:white;border-radius:8px;border:1px solid #e2e8f0}
.back:hover{background:#f8fafc}
.header{background:#1a3a5c;color:white;border-radius:16px;padding:20px;margin-bottom:16px}
.header-meta{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.cat-badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${c.bg};color:${c.text}}
.header-date{font-size:12px;opacity:0.7}
.header-topic{font-size:17px;font-weight:700;line-height:1.4}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tab{flex:1;padding:11px;background:white;border:1.5px solid #e2e8f0;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;color:#64748b;text-align:center;transition:all .15s}
.tab.active{background:#1a3a5c;color:white;border-color:#1a3a5c}
.card{background:white;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.intro{font-size:15px;line-height:1.8;color:#334155;margin-bottom:20px;padding-bottom:18px;border-bottom:2px solid #f1f5f9;font-style:italic}
.section{margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #f1f5f9}
.section:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.section-title{font-size:12px;font-weight:800;color:#1a3a5c;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;padding:6px 12px;background:#eff6ff;border-radius:6px;display:inline-block}
.section-body{padding-left:4px}
.content-text{font-size:14px;line-height:1.8;color:#374151;margin-bottom:10px}
.content-list{padding-left:0;list-style:none;margin-bottom:10px}
.content-list li{font-size:14px;line-height:1.7;color:#374151;padding:4px 0 4px 20px;position:relative;border-bottom:1px solid #f8fafc}
.content-list li:last-child{border-bottom:none}
.content-list li::before{content:"→";position:absolute;left:0;color:#1a3a5c;font-weight:700;font-size:12px;top:6px}
.content-warning{font-size:14px;line-height:1.7;color:#92400e;background:#fef3c7;border-left:3px solid #f59e0b;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:10px}
.content-formula{font-size:13px;line-height:1.7;color:#1e40af;background:#eff6ff;border-left:3px solid #3b82f6;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:10px;font-family:monospace}
.kp-box{border-radius:12px;padding:16px;margin-bottom:16px;background:linear-gradient(135deg,#1a3a5c 0%,#1e4976 100%)}
.kp-title{font-size:11px;font-weight:700;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
.keypoint{font-size:14px;color:white;line-height:1.6;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start}
.kp-num{width:22px;height:22px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
.refs-box{background:#f8fafc;border-radius:12px;padding:14px;border:1px solid #e2e8f0}
.refs-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
.ref{font-size:13px;color:#64748b;margin-bottom:6px;line-height:1.5;display:flex;gap:8px}
.ref-dot{flex-shrink:0}
.btn{display:block;width:100%;margin-top:16px;padding:13px;background:#1a3a5c;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}
.btn:hover{opacity:.9}
.btn-sec{background:#f1f5f9;color:#1e293b}
.progress-wrap{background:#e2e8f0;border-radius:4px;height:4px;margin-bottom:16px}
.progress-fill{background:#1a3a5c;height:4px;border-radius:4px;transition:width .3s}
.q-num{font-size:13px;color:#64748b;margin-bottom:14px;font-weight:500}
.q-diff{display:inline-block;font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;margin-bottom:10px}
.d-expert{background:#fdf2f8;color:#9d174d}
.d-difficile{background:#fee2e2;color:#991b1b}
.d-intermediaire{background:#fef3c7;color:#92400e}
.q-context{font-size:13px;color:#64748b;line-height:1.6;margin-bottom:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;border-left:3px solid #1a3a5c}
.q-text{font-size:16px;font-weight:600;line-height:1.6;color:#1e293b;margin-bottom:16px}
.opts{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;border:1.5px solid #e2e8f0;border-radius:10px;cursor:pointer;background:white;text-align:left;font-size:14px;line-height:1.5;color:#334155;width:100%;transition:all .12s}
.opt:hover:not(:disabled){border-color:#1a3a5c;background:#f0f7ff}
.opt-l{font-weight:800;color:#1a3a5c;min-width:20px;font-size:15px}
.opt.correct{border-color:#059669;background:#d1fae5;color:#064e3b}
.opt.correct .opt-l{color:#059669}
.opt.wrong{border-color:#dc2626;background:#fee2e2;color:#7f1d1d}
.opt.wrong .opt-l{color:#dc2626}
.opt.reveal{border-color:#059669;background:#ecfdf5;color:#064e3b}
.opt:disabled{cursor:default}
.expl{margin-top:14px;padding:14px;background:#eff6ff;border-radius:10px;border-left:4px solid #1a3a5c;font-size:14px;line-height:1.7;color:#1e40af}
.expl strong{font-weight:700;color:#1e3a8a}
.score-wrap{text-align:center;padding:16px 0}
.score-big{font-size:68px;font-weight:800;color:#1a3a5c;line-height:1}
.score-pct{font-size:18px;color:#64748b;margin-top:6px}
.score-msg{font-size:15px;font-weight:600;margin-top:12px;color:#1e293b}
.review-item{display:flex;gap:10px;padding:12px 0;border-bottom:1px solid #f1f5f9;align-items:flex-start}
.r-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.r-ok{background:#d1fae5;color:#059669}.r-ko{background:#fee2e2;color:#dc2626}
.r-q{font-size:14px;color:#1e293b;line-height:1.5}
.r-ans{font-size:12px;color:#64748b;margin-top:3px}
strong{font-weight:700}
</style>
</head>
<body>
<div class="container">
  <a href="./index.html" class="back">← Menu des révisions</a>
  <div class="header">
    <div class="header-meta">
      <span class="cat-badge">${cat}</span>
      <span class="header-date">${dateStr}</span>
    </div>
    <div class="header-topic">${topic}</div>
  </div>
  <div class="tabs">
    <button class="tab active" id="tc" onclick="showTab('cours')">📖 Cours</button>
    <button class="tab" id="tq" onclick="showTab('quiz')">🎯 Quiz · 10 questions</button>
  </div>
  <div id="cp">
    <div class="card">
      <div class="intro">${course.intro}</div>
      ${sectionsHTML}
    </div>
    <div class="card">
      <div class="kp-box">
        <div class="kp-title">⚡ Les 5 points clés à retenir</div>
        ${keypointsHTML}
      </div>
    </div>
    <div class="card">
      <div class="refs-box">
        <div class="refs-title">📚 Références</div>
        ${refsHTML}
      </div>
    </div>
    <button class="btn" onclick="showTab('quiz')">Passer au quiz →</button>
  </div>
  <div id="qp" style="display:none"><div id="qa"></div></div>
</div>
<script>
function showTab(t){
  document.getElementById('cp').style.display=t==='cours'?'block':'none';
  document.getElementById('qp').style.display=t==='quiz'?'block':'none';
  document.getElementById('tc').className='tab'+(t==='cours'?' active':'');
  document.getElementById('tq').className='tab'+(t==='quiz'?' active':'');
  if(t==='quiz')rQ();
}
const QS=${qData};
let cur=0,sel=null,rev=false,ans=[],started=false;
function scoreMsg(s,t){const p=s/t;if(p>=0.9)return"🎯 Excellent — niveau DESC solide.";if(p>=0.7)return"👍 Bon niveau — consolide les lacunes.";if(p>=0.5)return"📚 Correct — révisions nécessaires.";return"🔁 À retravailler en priorité.";}
function rQ(){
  const app=document.getElementById('qa');
  if(!started){started=true;cur=0;sel=null;rev=false;ans=[];}
  if(cur>=QS.length){
    const score=ans.filter((a,i)=>a===QS[i].correct).length;
    let h='<div class="card"><div class="score-wrap"><div class="score-big">'+score+'/'+QS.length+'</div><div class="score-pct">'+Math.round(score/QS.length*100)+'%</div><div class="score-msg">'+scoreMsg(score,QS.length)+'</div></div></div>';
    h+='<div class="card"><div style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px">Récapitulatif</div>';
    QS.forEach((q,i)=>{const ok=ans[i]===q.correct;h+='<div class="review-item"><div class="r-icon '+(ok?'r-ok':'r-ko')+'">'+(ok?'✓':'✗')+'</div><div><div class="r-q">Q'+q.num+'. '+q.question+'</div>'+(!ok?'<div class="r-ans">Ta réponse : '+(ans[i]||'—')+' · Bonne réponse : '+q.correct+'</div>':'')+'</div></div>';});
    h+='<button class="btn btn-sec" style="margin-top:16px" onclick="restartQ()">Recommencer le quiz</button></div>';
    app.innerHTML=h;return;
  }
  const q=QS[cur];const pct=(cur/QS.length*100).toFixed(0);
  const diff=q.difficulty||'difficile';
  const dc=diff==='expert'?'d-expert':diff.includes('interm')?'d-intermediaire':'d-difficile';
  let h='<div class="progress-wrap"><div class="progress-fill" style="width:'+pct+'%"></div></div>';
  h+='<div class="q-num">Question '+(cur+1)+' sur '+QS.length+'</div>';
  h+='<div class="card"><span class="q-diff '+dc+'">'+diff+'</span>';
  if(q.context)h+='<div class="q-context">'+q.context+'</div>';
  h+='<div class="q-text">'+q.question+'</div><div class="opts" id="opts">';
  ['A','B','C','D'].forEach(l=>{
    let cls='';
    if(rev){if(l===q.correct)cls=sel===l?'correct':'reveal';else if(l===sel)cls='wrong';}
    h+='<button class="opt '+cls+'" data-l="'+l+'"'+(rev?' disabled':'')+"><span class='opt-l'>"+l+"</span><span>"+q.options[l]+"</span></button>";
  });
  h+='</div>';
  if(rev)h+='<div class="expl"><strong>Réponse : '+q.correct+'</strong> — '+q.explanation+'</div><button class="btn" onclick="nQ()">'+(cur<QS.length-1?'Question suivante →':'Voir les résultats →')+'</button>';
  h+='</div>';
  app.innerHTML=h;
  if(!rev)document.getElementById('opts').addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;sel=b.dataset.l;ans[cur]=sel;rev=true;rQ();});
}
function nQ(){cur++;sel=null;rev=false;rQ();}
function restartQ(){cur=0;sel=null;rev=false;ans=[];started=false;rQ();}
</script>
</body>
</html>`;
}

function generateIndexHTML(history) {
  const cards = [...history].reverse().map(e => {
    const c = catColor(e.cat);
    return `<a href="./${e.date}.html" class="card-link">
      <div class="card" style="border-left:4px solid ${c.border}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span class="badge" style="background:${c.bg};color:${c.text}">${e.cat}</span>
          <span class="card-date">${e.dateStr}</span>
        </div>
        <div class="card-topic">${e.topic}</div>
      </div>
    </a>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Révisions AR</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;padding:16px}
.container{max-width:720px;margin:0 auto}
.header{background:#1a3a5c;color:white;border-radius:16px;padding:24px;margin-bottom:20px}
.header-title{font-size:22px;font-weight:700;margin-bottom:4px}
.header-sub{font-size:14px;opacity:.75}
.stats{display:flex;gap:12px;margin-top:16px}
.stat{background:rgba(255,255,255,.15);border-radius:10px;padding:10px 16px;text-align:center;flex:1}
.stat-num{font-size:26px;font-weight:700}
.stat-label{font-size:11px;opacity:.8;margin-top:2px}
.section-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
.card-link{text-decoration:none;display:block;margin-bottom:10px}
.card{background:white;border-radius:14px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);transition:transform .15s,box-shadow .15s}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.12)}
.badge{font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.card-date{font-size:12px;color:#94a3b8}
.card-topic{font-size:15px;font-weight:600;color:#1e293b;line-height:1.4;margin-top:6px}
</style>
</head><body>
<div class="container">
  <div class="header">
    <div class="header-title">Mes révisions AR</div>
    <div class="header-sub">Anesthésie-Réanimation · DESC</div>
    <div class="stats">
      <div class="stat"><div class="stat-num">${history.length}</div><div class="stat-label">Séances</div></div>
      <div class="stat"><div class="stat-num">${history.length * 10}</div><div class="stat-label">Questions</div></div>
    </div>
  </div>
  <div class="section-title">Toutes les séances</div>
  ${cards || '<div style="text-align:center;padding:40px;color:#94a3b8">Aucune séance pour l\'instant</div>'}
</div></body></html>`;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquante");

  const history = loadHistory();

  console.log("1/3 — Génération du thème...");
  const topicObj = await generateTopic(history);
  console.log(`    Thème : ${topicObj.topic} [${topicObj.cat}]`);

  console.log("2/3 — Génération cours + 10 questions (avec auto-vérification intégrée)...");
  const content = await generateContent(topicObj.topic);
  console.log(`    ${content.questions.length} questions générées et vérifiées`);

  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  const dateStr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const entry = { date, dateStr, topic: topicObj.topic, cat: topicObj.cat, course: content.course, questions: content.questions };
  history.push(entry);
  saveHistory(history);

  console.log("3/3 — Génération des pages HTML...");
  fs.mkdirSync("docs", { recursive: true });
  for (const e of history) {
    fs.writeFileSync(path.join("docs", `${e.date}.html`), generateDailyHTML(e), "utf8");
  }
  fs.writeFileSync(path.join("docs", "index.html"), generateIndexHTML(history), "utf8");
  console.log(`    docs/ prêt : ${history.length} séance(s)`);
}

main().catch(err => { console.error("Erreur :", err.message); process.exit(1); });

