const fs = require("fs");
const path = require("path");

const PAGES_URL = "https://zedrftgyhujiko.github.io/Quizz-journalier/";

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
<title>Quiz AR</title>
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
  .badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-bottom: 12px; text-transform: uppercase; }
  .badge-facile { background: #d1fae5; color: #065f46; }
  .badge-intermediaire { background: #fef3c7; color: #92400e; }
  .badge-difficile { background: #fee2e2; color: #991b1b; }
  .context { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #1a56a0; }
  .question { font-size: 16px; font-weight: 600; line-height: 1.5; color: #1e293b; margin-bottom: 16px; }
  .options { display: flex; flex-direction: column; gap: 8px; }
  .opt { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; background: white; text-align: left; font-size: 14px; line-height: 1.4; color: #334155; width: 100%; }
  .opt:hover:not(:disabled) { border-color: #1a56a0; background: #eff6ff; }
  .opt-letter { font-weight: 700; color: #1a56a0; min-width: 18px; }
  .opt.correct { border-color: #059669; background: #d1fae5; color: #064e3b; }
  .opt.correct .opt-letter { color: #059669; }
  .opt.wrong { border-color: #dc2626; background: #fee2e2; color: #7f1d1d; }
  .opt.wrong .opt-letter { color: #dc2626; }
  .opt.reveal { border-color: #059669; background: #d1fae5; color: #064e3b; }
  .opt:disabled { cursor: default; }
  .explanation { margin-top: 14px; padding: 12px 14px; background: #eff6ff; border-radius: 10px; border-left: 3px solid #1a56a0; font-size: 13px; line-height: 1.6; color: #1e40af; }
  .next-btn { display: block; width: 100%; margin-top: 14px; padding: 13px; background: #1a56a0; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
  .score-big { font-size: 64px; font-weight: 700; color: #1a56a0; line-height: 1; text-align: center; padding-top: 10px; }
  .score-total { font-size: 18px; color: #64748b; margin-top: 4px; text-align: center; }
  .score-msg { font-size: 15px; font-weight: 600; margin-top: 12px; color: #1e293b; text-align: center; margin-bottom: 10px; }
  .review-item { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
  .review-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .review-ok { background: #d1fae5; color: #059669; }
  .review-ko { background: #fee2e2; color: #dc2626; }
  .review-q { font-size: 13px; color: #1e293b; line-height: 1.4; }
  .review-answer { font-size: 12px; color: #64748b; margin-top: 2px; }
  .restart-btn { display: block; width: 100%; margin-top: 16px; padding: 13px; background: #f1f5f9; color: #1e293b; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
<div class="container" id="app"></div>
<script>
const DATA = ${quizData};
let current = 0, selected = null, revealed = false, answers = [];
function scoreMsg(s,t){const p=s/t;if(p>=0.9)return"Excellent ! Maitrise solide.";if(p>=0.7)return"Bon niveau, quelques points a consolider.";if(p>=0.5)return"Correct, revisions recommandees.";return"A retravailler.";}
function render(){
  const app=document.getElementById('app');
  const qs=DATA.questions;
  if(current>=qs.length){
    const score=answers.filter((a,i)=>a===qs[i].correct).length;
    let h='<div class="header"><div class="header-date">'+DATA.dateStr+'</div><div class="header-topic">'+DATA.topic+'</div><div class="progress-wrap"><div class="progress-fill" style="width:100%"></div></div><div class="progress-txt">Termine</div></div>';
    h+='<div class="card"><div class="score-big">'+score+'/'+qs.length+'</div><div class="score-total">'+Math.round(score/qs.length*100)+'%</div><div class="score-msg">'+scoreMsg(score,qs.length)+'</div></div>';
    h+='<div class="card"><div style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;margin-bottom:12px">Recapitulatif</div>';
    qs.forEach((q,i)=>{const ok=answers[i]===q.correct;h+='<div class="review-item"><div class="review-icon '+(ok?'review-ok':'review-ko')+'">'+(ok?'✓':'✗')+'</div><div><div class="review-q">Q'+q.num+'. '+q.question+'</div>'+(!ok?'<div class="review-answer">Reponse : '+q.correct+'</div>':'')+'</div></div>';});
    h+='<button class="restart-btn" onclick="restart()">Recommencer</button></div>';
    app.innerHTML=h;return;
  }
  const q=qs[current];
  const pct=(current/qs.length*100).toFixed(0);
  const bc=q.difficulty==='difficile'?'badge-difficile':q.difficulty&&q.difficulty.includes('interm')?'badge-intermediaire':'badge-facile';
  let h='<div class="header"><div class="header-date">'+DATA.dateStr+'</div><div class="header-topic">'+DATA.topic+'</div><div class="progress-wrap"><div class="progress-fill" style="width:'+pct+'%"></div></div><div class="progress-txt">Question '+(current+1)+' / '+qs.length+'</div></div>';
  h+='<div class="card"><span class="badge '+bc+'">'+q.difficulty+'</span>';
  if(q.context)h+='<div class="context">'+q.context+'</div>';
  h+='<div class="question">'+q.question+'</div><div class="options" id="opts">';
  ['A','B','C','D'].forEach(l=>{
    let cls='';
    if(revealed){if(l===q.correct)cls=selected===l?'correct':'reveal';else if(l===selected)cls='wrong';}
    h+='<button class="opt '+cls+'" data-l="'+l+'"'+(revealed?' disabled':'')+"><span class='opt-letter'>"+l+"</span><span>"+q.options[l]+"</span></button>";
  });
  h+='</div>';
  if(revealed){h+='<div class="explanation"><strong>Reponse : '+q.correct+'</strong> — '+q.explanation+'</div><button class="next-btn" onclick="next()">'+(current<qs.length-1?'Question suivante →':'Voir les resultats →')+'</button>';}
  h+='</div>';
  app.innerHTML=h;
  if(!revealed){document.getElementById('opts').addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(!b)return;selected=b.dataset.l;answers[current]=selected;revealed=true;render();});}
}
function next(){current++;selected=null;revealed=false;render();}
function restart(){current=0;selected=null;revealed=false;answers=[];render();}
render();
</script>
</body>
</html>`;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");

  const topic = getTodayTopic();
  console.log(`Theme : ${topic}`);

  console.log("Generation...");
  const data = await generateQuiz(topic);
  console.log(`${data.questions.length} questions generees`);

  const dateStr = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const html = generateHTML(topic, data.questions, dateStr);

  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync(path.join("docs", "index.html"), html, "utf8");
  console.log("docs/index.html cree");
}

main().catch(err => { console.error("Erreur :", err.message); process.exit(1); });
