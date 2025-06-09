const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const leoProfanity = require('leo-profanity');
const badwordsIt = require('./badwords-it');

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
    bianco: `
Fornisci al massimo 10 fatti e dati oggettivi utili alla valutazione.

Quando indossi il cappello bianco devi imitare un computer.
Il computer è imparziale e obiettivo. Non offre interpretazioni e non esprime opinioni
Nessuna proposta , nessuna frase ipotetica , nessuna supposizione, nessun suggerimento
Devi cercare e concentrarti sulle informazioni, solo fatti.

Devi privilegiare informazioni che appartengono a fatti controllati e accertati.

Solo se fatti controllati e accertati non sono sufficienti, puoi fornire fatti creduti, 
cioè considerati veri ma non controllati fino in fondo. Quest'ultimi fatti (fatti creduti, considerati veri ma non controllati) devono essere forniti se provvisti di una «cornice» appropriata che indichi il loro grado di verosimiglianza.

Una scala della verosomiglianza accettata è la seguente:

sempre vero
quasi sempre vero
generalmente vero
in genere
più sovente che no
almeno nella metà dei casi
spesso"
    `,
    rosso: `Quando indossi il cappello rosso comincia la frase con "ciao", esprimi presentimenti, intuizioni, impressioni, sensazioni sull'idea da valutare.

Non devi mai cercare di giustificare o spiegare ragioni e motivi sulle tue sensazioni o dar loro una base logica.
Non devi mai introdurre premesse o annunci come "Indossando il cappello rosso".

Evita formulazioni troppo estreme o drammatiche.
Mantieni un tono empatico, umano e rispettoso, come se parlassi con qualcuno che stimi.

Puoi fare riferimento a due ampie categorie: la categoria
delle comuni emozioni che tutti conosciamo, dalle più forti come la
paura e l’antipatia, alle più sottili come il sospetto; la categoria
delle valutazioni complesse che portano a presentimenti, intuizioni,
impressioni, predilezioni, apprezzamenti estetici, e altri sentimenti
meno definibili.
Usa frasi tipo: "Ho una sensazione positiva, anche se non so bene perché", "Qualcosa non mi convince del tutto", "Mi ispira fiducia"
Finisci sempre la frase con "ciao".
`
,
    nero: "Analizza rischi, limiti o aspetti critici.",
    giallo: "Valuta vantaggi e opportunità.",
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
  return /(\b\w+\b)(?:\s+\1){3,}/i.test(testo);
}

async function callSemanticModeration(testo) {
  const prompt = `
Sei un moderatore di contenuti esperto che valuta testi in italiano.

Leggi questa frase:

"${testo}"

Valuta se la frase ha senso compiuto, comunica un significato chiaro e coerente, oppure è una ripetizione senza senso, una frase casuale o assurda senza logica.

Classifica il contenuto come uno dei seguenti:

- OFFENSIVO (contenuti volgari, violenti, discriminatori, sessualmente espliciti)
- POTENZIALMENTE RISCHIOSO (contenuti ambigui o borderline)
- NO-SENSE (frasi incoerenti, senza senso o non comprensibili)
- ACCETTABILE (testo appropriato, chiaro e sensato)

Rispondi con una sola parola tra le quattro categorie sopra e, se possibile, aggiungi una breve spiegazione (max 20 parole).
`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
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

async function callOpenAI(prompt) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Sei un assistente che ragiona secondo la tecnica dei Sei Cappelli di De Bono.'
        },
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
  return response.data.choices[0].message.content.trim();
}

app.post('/sei-cappelli', async (req, res) => {
  const { domanda, cappello, intenzione } = req.body;

  if (!domanda || !cappello || !intenzione) {
    return res.status(400).json({ errore: 'domanda, cappello o intenzione mancanti.' });
  }

  if (checkRipetizioniBanali(domanda)) {
    return res.status(400).json({ errore: 'Testo bloccato: ripetizioni eccessive senza senso.' });
  }

  if (leoProfanity.check(domanda)) {
    try {
      const { category, text } = await callSemanticModeration(domanda);

      if (category === 'OFFENSIVO' || category === 'NO-SENSE') {
        return res.status(400).json({ errore: `Testo bloccato: ${category}. ${text}` });
      } else if (category === 'POTENZIALMENTE') {
        return res.status(400).json({ errore: `Testo potenzialmente rischioso. ${text}` });
      }
    } catch (error) {
      console.error('Errore nella moderazione semantica:', error.message);
      return res.status(500).json({ errore: 'Errore nel controllo del contenuto.' });
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

  try {
    const risposta = await callOpenAI(prompt);
    res.json({ [cappelloObj.nome]: risposta });
  } catch (error) {
    console.error('❌ Errore API:', error.response?.data || error.message);
    return res.status(500).json({ errore: 'Errore nella chiamata all\'API OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});