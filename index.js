const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const leoProfanity = require('leo-profanity');
const badwordsIt = require('./badwords-it');

// Carica il dizionario inglese di default
leoProfanity.loadDictionary();

// Aggiunge il dizionario italiano
leoProfanity.add(leoProfanity.getDictionary('it'));

// Aggiunge parole personalizzate (opzionale)
leoProfanity.add(badwordsIt);

// Ora la lista contiene inglese + italiano + personalizzate
// Puoi usarla così:
const listaParolacce = leoProfanity.list();

// Funzione per verificare una parola
function isBadWord(word) {
  return leoProfanity.check(word);
}


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const cappelli = [
  { nome: 'bianco', descrizione: 'Fornisci fatti e dati oggettivi.' },
  { nome: 'rosso', descrizione: 'Esprimi sentimenti, intuizioni ed emozioni.' },
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
      bianco: "Fornisci 5 fatti e dati oggettivi per aiutare la valutazione. Evita interpretazioni, opinioni personali o frasi ipotetiche come “potrebbe” o “forse”. Riporta solo informazioni concrete, verificabili e prive di deduzioni, conseguenze o suggerimenti. Almeno uno dei fatti deve includere numeri o percentuali.",
      rosso: "Esprimi reazioni emotive o intuitive sull’idea da valutare.",
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

  // ✅ Log delle variabili ricevute (visibili su Render)
  console.log('📥 Richiesta ricevuta da Storyline');
  console.log('🧠 Domanda:', domanda);
  console.log('🎩 Cappello:', cappello);
  console.log('🎯 Intenzione:', intenzione);

  if (!domanda || !cappello || !intenzione) {
    return res.status(400).json({ errore: 'domanda, cappello o intenzione mancanti.' });
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

  // ✅ Log anche del prompt generato (utile per debugging)
  console.log("📄 Prompt generato per OpenAI:\n", prompt);

  try {
    const risposta = await callOpenAI(prompt);
    res.json({ [cappelloObj.nome]: risposta });
  } catch (error) {
    console.error('❌ Errore API:', error.response?.data || error.message);
    res.status(500).json({ errore: 'Errore nella richiesta all\'Assistant API' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});