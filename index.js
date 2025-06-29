const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const leoProfanity = require('leo-profanity');
const badwordsIt = require('./badwords-it');
const callAssistantAPI = require('./green-hat');

leoProfanity.loadDictionary();
leoProfanity.add(leoProfanity.getDictionary('it'));
leoProfanity.add(badwordsIt);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const cappelli = [
  { nome: 'bianco', descrizione: 'Fornisci fatti e dati oggettivi.' },
  { nome: 'rosso', descrizione: 'Esprimi sentimenti, intuizioni ed emozioni, senza dover giustificare o spiegare.' },
  { nome: 'nero', descrizione: 'Evidenzia rischi e criticità.' },
  { nome: 'giallo', descrizione: 'Metti in luce benefici e aspetti positivi.' },
  { nome: 'verde', descrizione: 'Proponi idee creative e alternative.' },
  { nome: 'blu', descrizione: 'Gestisci e sintetizza il pensiero.' },
];

const intenzioni = {
  chiarimento: {
    descrizione: "L’utente desidera chiarire e comprendere meglio una situazione o un problema.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli per pensare, fornisci una risposta che aiuti a fare luce sull’argomento in modo semplice, ordinato e strutturato.",
    cappelli: {
      bianco: "Fornisci 5 fatti e dati oggettivi rilevanti.",
      rosso: "Esprimi sentimenti, intuizioni o emozioni che potrebbero emergere in chi cerca chiarezza.",
      nero: "Evidenzia i potenziali rischi da chiarire.",
      giallo: "Sottolinea i possibili benefici e punti di forza da comprendere meglio.",
      verde: "Suggerisci prospettive alternative per chiarire meglio la questione.",
      blu: "Organizza le informazioni e guida il processo di chiarimento."
    }
  },
  valutazione: {
    descrizione: "L’utente desidera valutare l’efficacia o validità di un’idea o situazione.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli per pensare, dai una risposta orientata all’analisi e al giudizio, con esempi concreti.",
    cappelli: {
      bianco: "Fornisci direttamente la lista di al massimo 5 fatti e dati oggettivi utili alla valutazione, vai a capo di 2 righe dopo ogni fatto. Quando indossi il cappello bianco devi imitare un computer.Il computer è imparziale e obiettivo.Non offre proposte, interpretazioni e non esprime opinioni.Devi cercare e concentrarti sulle informazioni, solo fatti.Devi privilegiare informazioni che appartengono a fatti controllati e accertati.Solo se fatti controllati e accertati non sono sufficienti, puoi fornire fatti creduti, cioè considerati veri ma non controllati fino in fondo. Quest'ultimi fatti (fatti creduti, considerati veri ma non controllati) devono essere forniti se provvisti di una «cornice» appropriata che indichi il loro grado di verosimiglianza.Una scala della verosomiglianza accettata è la seguente:sempre vero, quasi sempre vero, generalmente vero, vero almeno nella metà dei casi, spesso. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Bianco:', conclusioni o spiegazioni",
      rosso: 'Quando indossi il cappello rosso esprimi presentimenti, intuizioni, impressioni, sensazioni sull idea da valutare. Non devi mai cercare di giustificare o spiegare ragioni e motivi sulle tue sensazioni o dar loro una base logica. Non introdurre premesse o annunci del tipo "Indossando il cappello rosso." Evita formulazioni troppo estreme o drammatiche. Mantieni un tono empatico, umano e rispettoso, come se parlassi con qualcuno che stimi. Puoi fare riferimento a due ampie categorie: la categoria delle comuni emozioni che tutti conosciamo, dalle più forti come la paura e l’antipatia, alle più sottili come il sospetto; la categoria delle valutazioni complesse che portano a presentimenti, intuizioni, impressioni, predilezioni, apprezzamenti estetici, e altri sentimenti meno definibili. Usa frasi tipo: "Ho una sensazione positiva, anche se non so bene perché", "Qualcosa non mi convince del tutto", "Mi ispira fiducia" Vai a capo dopo ogni punto e limitati a un massimo di 5 punti',
      nero: "Quando indossi il cappello nero devi individuare ciò che è falso, scorretto o sbagliato. Metti in luce ciò che è in disaccordo con l esperienza e il sapere comuni. Spieghi perché una cosa non potrà funzionare. Addita i rischi e i pericoli. Indica le lacune di un progetto. Puoi mettere in evidenza errori di procedura e di metodo nello svolgimento del pensiero. Puoi stabilire paragoni con l esperienza passata per vedere quale accordo vi sia tra questa e l idea in esame. Puoi proiettare l idea nel futuro per valutarne possibilità di errore o fallimento. Puoi porre domande negative. Sulla base di queste analisi fornisci direttamente la lista di al massimo 5 valutazioni negative.",
      giallo: "Quando indossi il cappello giallo fornisci la lista di al massimo 5 punti ( restituisci solo una lista numerata, senza introduzioni, conclusioni o spiegazioni ): per sviluppare ogni punto devi essere positivo e costruttivo, devi cercare e valutare guadagni e benefici e poi devi cercare una base logica su cui fondarli. Offri inoltre suggerimenti, proposte, opportunità concrete ed efficienti.",
      verde: "Proponi varianti o miglioramenti all’idea.",
      blu: "Riassumi i punti chiave per trarre una conclusione valutativa."
    }
  },
  generazione: {
    descrizione: "L’utente desidera generare nuove idee o alternative creative.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli per pensare, favorisci la creatività anche con proposte fuori dagli schemi.",
    cappelli: {
      bianco: "Fornisci almeno 10 dati oggettivi come base per nuove idee.",
      rosso: "Esplora sensazioni o intuizioni che potrebbero ispirare idee originali.",
      nero: "Individua ostacoli da superare per innovare.",
      giallo: "Mostra benefici e potenzialità di nuove proposte.",
      verde: "Genera almeno 3 idee creative e fuori dagli schemi.",
      blu: "Organizza il processo di generazione delle idee e suggerisci i prossimi passi."
    }
  }
};

function checkRipetizioniBanali(testo) {
  return /(\b\w+\b)(?:\s+\1){2,}/i.test(testo);
}

async function callSemanticModeration(testo) {
  const prompt = `Sei un moderatore di contenuti esperto che valuta testi in italiano. 
Leggi questa frase: "${testo}"
Classifica il contenuto come:
- OFFENSIVO
- POTENZIALMENTE RISCHIOSO
- NO-SENSE
- ACCETTABILE`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Sei un moderatore di contenuti.' },
        { role: 'user', content: prompt }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const text = response.data.choices[0].message.content.trim();
  const category = text.split(/[ ,.\n]/)[0].toUpperCase();
  return { category, text };
}

async function callOpenAI(prompt, temperature = 0) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Sei un assistente che ragiona secondo la tecnica dei Sei Cappelli di De Bono.' },
        { role: 'user', content: prompt }
      ],
      temperature: temperature
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content.trim();
}

app.post('/sei-cappelli', async (req, res) => {
  const { domanda, cappello, intenzione } = req.body;

  if (!domanda || !cappello || !intenzione) {
    return res.status(400).json({ errore: 'domanda, cappello o intenzione mancanti.' });
  }

  // Controllo parolacce
  if (leoProfanity.check(domanda)) {
    return res.status(400).json({ errore: 'La domanda contiene linguaggio inappropriato.' });
  }

  // Controllo ripetizioni
  if (checkRipetizioniBanali(domanda)) {
    return res.status(400).json({ errore: 'La domanda contiene ripetizioni sospette o senza senso.' });
  }

  // Moderazione semantica
  try {
    const moderazione = await callSemanticModeration(domanda);
    if (['OFFENSIVO', 'POTENZIALMENTE', 'NO-SENSE'].includes(moderazione.category)) {
      return res.status(400).json({ errore: `Contenuto non accettabile: ${moderazione.text}` });
    }
  } catch (err) {
    console.error('Errore nella moderazione:', err.message);
    return res.status(500).json({ errore: 'Errore nella moderazione del contenuto.' });
  }

  if (cappello.toLowerCase() === 'verde') {
    try {
      const risposta = await callAssistantAPI(domanda);
      return res.json({ verde: risposta });
    } catch (error) {
      console.error('Errore nel cappello verde:', error.message);
      return res.status(500).json({ errore: 'Errore nella generazione di idee creative.' });
    }
  }

  const cappelloObj = cappelli.find(c => c.nome === cappello.toLowerCase());
  if (!cappelloObj) {
    return res.status(400).json({ errore: 'cappello non valido.' });
  }

  const intenzioneLower = intenzione.toLowerCase();
  if (!intenzioni[intenzioneLower]) {
    return res.status(400).json({ errore: 'intenzione non valida.' });
  }

  const prompt = `
Intenzione: ${intenzioneLower}
Obiettivo: ${intenzioni[intenzioneLower].descrizione}

${intenzioni[intenzioneLower].guidaGenerale}

Cappello ${cappelloObj.nome.toUpperCase()}: ${intenzioni[intenzioneLower].cappelli[cappelloObj.nome]}

Domanda/idea dell’utente: "${domanda}"
`;

  const temperature = (cappelloObj.nome === 'rosso' && intenzioneLower === 'valutazione') ? 0.8 : 0;

  try {
    const risposta = await callOpenAI(prompt, temperature);
    res.json({ [cappelloObj.nome]: risposta });
  } catch (error) {
    console.error('Errore nell\'interazione con OpenAI:', error.message);
    res.status(500).json({ errore: 'Errore nella generazione della risposta.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});