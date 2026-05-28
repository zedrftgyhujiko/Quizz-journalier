const PAGES_URL = "https://zedrftgyhujiko.github.io/Quizz-journalier/";

async function main() {
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquante");

  const response = await fetch(`https://ntfy.sh/${process.env.NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      "Title": "Quiz AR du jour",
      "Priority": "high",
      "Tags": "stethoscope",
      "Click": PAGES_URL,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: "Ton quiz du jour est pret ! Appuie pour l'ouvrir.",
  });

  if (!response.ok) throw new Error(`ntfy erreur ${response.status}`);
  console.log("Notification envoyee !");
}

main().catch(err => { console.error("Erreur :", err.message); process.exit(1); });
