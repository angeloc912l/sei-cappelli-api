const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const leoProfanity = require('leo-profanity');
const badwordsIt = require('./badwords-it');
const callAssistantAPI = require('./green-hat.js');
const mysql = require('mysql2/promise'); // <-- Poi importa mysql2

// ... altri require (es. leo-profanity, badwordsIt, ecc.)

// Configura il pool di connessioni MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// (Opzionale) Test di connessione
db.getConnection()
  .then(conn => {
    console.log('✅ Connessione al database MySQL riuscita!');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Errore di connessione al database MySQL:', err.message);
  });

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
    descrizione: "L'utente desidera chiarire e comprendere meglio una situazione o un problema.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli per pensare, fornisci una risposta che aiuti a fare luce sull'argomento in modo semplice, ordinato e strutturato.",
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
    descrizione: "L'utente desidera valutare l'efficacia o validità di un'idea o situazione.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli per pensare, dai una risposta orientata all'analisi e al giudizio, con esempi concreti.",
    cappelli: {
      bianco: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 fatti]\",\n  \"fatti_oggettivi\": [\n    \"1. [descrizione del fatto]\",\n    \"2. [descrizione del fatto]\", \n    \"3. [descrizione del fatto]\",\n    \"4. [descrizione del fatto]\",\n    \"5. [descrizione del fatto]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 fatti, non il testo placeholder.\n\nFornisci direttamente la lista di 5 fatti e dati oggettivi utili alla valutazione, vai a capo di 2 righe dopo ogni fatto. Quando indossi il cappello bianco devi imitare un computer.Il computer è imparziale e obiettivo.Non offre proposte, interpretazioni e non esprime opinioni.Devi cercare e concentrarti sulle informazioni, solo fatti.Devi privilegiare informazioni che appartengono a fatti controllati e accertati.Solo se fatti controllati e accertati non sono sufficienti, puoi fornire fatti creduti, cioè considerati veri ma non controllati fino in fondo. Quest'ultimi fatti (fatti creduti, considerati veri ma non controllati) devono essere forniti se provvisti di una «cornice» appropriata che indichi il loro grado di verosimiglianza.Una scala della verosomiglianza accettata è la seguente:sempre vero, quasi sempre vero, generalmente vero, vero almeno nella metà dei casi, spesso. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Bianco:', conclusioni o spiegazioni",
      rosso: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 sentimenti/intuizioni]\",\n  \"sentimenti_intuizioni\": [\n    \"1. [descrizione del sentimento/intuizione]\",\n    \"2. [descrizione del sentimento/intuizione]\", \n    \"3. [descrizione del sentimento/intuizione]\",\n    \"4. [descrizione del sentimento/intuizione]\",\n    \"5. [descrizione del sentimento/intuizione]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 sentimenti/intuizioni, non il testo placeholder.\n\nFornisci direttamente la lista di 5 sentimenti/intuizioni utili alla valutazione, vai a capo di 2 righe dopo ogni punto. Quando indossi il cappello rosso esprimi presentimenti, intuizioni, impressioni, sensazioni sull'idea da valutare. Non devi mai cercare di giustificare o spiegare ragioni e motivi sulle tue sensazioni o dar loro una base logica. Non introdurre premesse o annunci del tipo 'Indossando il cappello rosso.' Evita formulazioni troppo estreme o drammatiche. Mantieni un tono empatico, umano e rispettoso, come se parlassi con qualcuno che stimi. Puoi fare riferimento a due ampie categorie: la categoria delle comuni emozioni che tutti conosciamo, dalle più forti come la paura e l'antipatia, alle più sottili come il sospetto; la categoria delle valutazioni complesse che portano a presentimenti, intuizioni, impressioni, predilezioni, apprezzamenti estetici, e altri sentimenti meno definibili. Usa frasi tipo: 'Ho una sensazione positiva, anche se non so bene perché', 'Qualcosa non mi convince del tutto', 'Mi ispira fiducia'. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Rosso:', conclusioni o spiegazioni",
      nero: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 valutazioni negative]\",\n  \"valutazioni_negative\": [\n    \"1. [descrizione della valutazione negativa]\",\n    \"2. [descrizione della valutazione negativa]\", \n    \"3. [descrizione della valutazione negativa]\",\n    \"4. [descrizione della valutazione negativa]\",\n    \"5. [descrizione della valutazione negativa]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 valutazioni negative, non il testo placeholder.\n\nFornisci direttamente la lista di 5 valutazioni negative utili alla valutazione, vai a capo di 2 righe dopo ogni punto. Quando indossi il cappello nero devi individuare ciò che è falso, scorretto o sbagliato. Metti in luce ciò che è in disaccordo con l esperienza e il sapere comuni. Spieghi perché una cosa non potrà funzionare. Addita i rischi e i pericoli. Indica le lacune di un progetto. Puoi mettere in evidenza errori di procedura e di metodo nello svolgimento del pensiero. Puoi stabilire paragoni con l esperienza passata per vedere quale accordo vi sia tra questa e l idea in esame. Puoi proiettare l idea nel futuro per valutarne possibilità di errore o fallimento. Puoi porre domande negative. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Nero:', conclusioni o spiegazioni.",
      giallo: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 valutazioni positive]\",\n  \"valutazioni_positive\": [\n    \"1. [descrizione della valutazione positiva]\",\n    \"2. [descrizione della valutazione positiva]\", \n    \"3. [descrizione della valutazione positiva]\",\n    \"4. [descrizione della valutazione positiva]\",\n    \"5. [descrizione della valutazione positiva]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 valutazioni positive, non il testo placeholder.\n\nFornisci direttamente la lista di 5 valutazioni positive utili alla valutazione, vai a capo di 2 righe dopo ogni punto. Quando indossi il cappello giallo fornisci la lista di 5 punti: per sviluppare ogni punto devi essere positivo e costruttivo, devi cercare e valutare guadagni e benefici e poi devi cercare una base logica su cui fondarli. Offri inoltre suggerimenti, proposte, opportunità concrete ed efficienti. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Giallo:', conclusioni o spiegazioni",
      verde: "Proponi varianti o miglioramenti all'idea.",
      blu: "Riassumi i punti chiave per trarre una conclusione valutativa."
    }
  },
  generazione: {
    descrizione: "L'utente desidera chiarire un problema e generare idee e soluzioni creative con metodo strutturato.",
    guidaGenerale: "Utilizzando la tecnica dei 6 cappelli, fornisci un'analisi chiara e dati oggettivi per chiarire il problema, esprimi sensazioni, valuta rischi e benefici, e genera idee creative.",
    cappelli: {
      bianco: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 fatti]\",\n  \"fatti_oggettivi\": [\n    \"1. [descrizione del fatto]\",\n    \"2. [descrizione del fatto]\", \n    \"3. [descrizione del fatto]\",\n    \"4. [descrizione del fatto]\",\n    \"5. [descrizione del fatto]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 fatti, non il testo placeholder.\n\nFornisci direttamente la lista di 5 fatti e dati oggettivi utili alla valutazione, vai a capo di 2 righe dopo ogni fatto. Quando indossi il cappello bianco devi imitare un computer.Il computer è imparziale e obiettivo.Non offre proposte, interpretazioni e non esprime opinioni.Devi cercare e concentrarti sulle informazioni, solo fatti.Devi privilegiare informazioni che appartengono a fatti controllati e accertati.Solo se fatti controllati e accertati non sono sufficienti, puoi fornire fatti creduti, cioè considerati veri ma non controllati fino in fondo. Quest'ultimi fatti (fatti creduti, considerati veri ma non controllati) devono essere forniti se provvisti di una «cornice» appropriata che indichi il loro grado di verosimiglianza.Una scala della verosomiglianza accettata è la seguente:sempre vero, quasi sempre vero, generalmente vero, vero almeno nella metà dei casi, spesso. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Bianco:', conclusioni o spiegazioni",
      rosso: "Esprimi fino a 5 sensazioni o intuizioni che emergono relativamente al problema e a potenziali soluzioni.",
      nero: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 valutazioni negative]\",\n  \"valutazioni_negative\": [\n    \"1. [descrizione della valutazione negativa]\",\n    \"2. [descrizione della valutazione negativa]\", \n    \"3. [descrizione della valutazione negativa]\",\n    \"4. [descrizione della valutazione negativa]\",\n    \"5. [descrizione della valutazione negativa]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 valutazioni negative, non il testo placeholder.\n\nFornisci direttamente la lista di 5 valutazioni negative utili alla valutazione, vai a capo di 2 righe dopo ogni punto. Quando indossi il cappello nero e il discente presenta un problema, devi analizzarlo in profondità per evidenziarne criticità, limiti, rischi, elementi che potrebbero aggravarlo. Puoi anche esporre potenziali effetti collaterali negativi, errori di valutazione, segnali trascurati, o scelte controproducenti. Fai domande critiche se utili, proietta scenari peggiorativi, metti in luce cosa potrebbe non funzionare nel cercare di risolvere il problema. Ogni punto deve essere realistico, lucido e basato su logica o esperienza. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Nero:', conclusioni o spiegazioni.",
      giallo: "Rispondi sempre in formato JSON valido con questa struttura esatta:\n{\n  \"risposta\": \"[qui inserisci la risposta completa con tutti i 5 valutazioni positive]\",\n  \"valutazioni_positive\": [\n    \"1. [descrizione della valutazione positiva]\",\n    \"2. [descrizione della valutazione positiva]\", \n    \"3. [descrizione della valutazione positiva]\",\n    \"4. [descrizione della valutazione positiva]\",\n    \"5. [descrizione della valutazione positiva]\"\n  ]\n}\n\nIMPORTANTE: Nel campo \"risposta\" inserisci la risposta completa con tutti i 5 valutazioni positive, non il testo placeholder.\n\nFornisci direttamente la lista di 5 valutazioni positive utili alla valutazione, vai a capo di 2 righe dopo ogni punto. Quando indossi il cappello giallo fornisci la lista di 5 punti: per sviluppare ogni punto devi essere ottimista, costruttivo e focalizzato sui benefici. Trova opportunità, punti di forza nascosti, occasioni di crescita, spunti migliorativi, vantaggi collaterali o possibili soluzioni. Offri inoltre suggerimenti, proposte, opportunità concrete ed efficienti. Restituisci solo una lista numerata, senza introduzioni come 'Cappello Giallo:', conclusioni o spiegazioni.",
      verde: "Genera almeno 3 idee creative e alternative per affrontare il problema.",
      blu: "Organizza e riassumi le informazioni chiave e suggerisci i prossimi passi da intraprendere."
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
  const { domanda, cappello, intenzione, sessionUUID } = req.body;

  if (!domanda || !cappello || !intenzione) {
    return res.status(400).json({ errore: 'domanda, cappello o intenzione mancanti.' });
  }

  // Log dettagliato per debug
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] NUOVA RICHIESTA - Cappello: ${cappello}, Intenzione: ${intenzione}, Session: ${sessionUUID || 'N/A'}`);

  // Log della sessione (opzionale)
  if (sessionUUID) {
    console.log(`Richiesta da sessione: ${sessionUUID}`);
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
      // Chiama il dispatcher delle strategie del cappello verde
      const results = await callAssistantAPI(intenzione, { domanda, sessionUUID });
      
      // Salva tutte le risposte nel database se sessionUUID è presente
      if (sessionUUID) {
        try {
          // Salva ogni strategia separatamente con timestamp diversi
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const now = new Date();
            // Aggiungi millisecondi diversi per evitare conflitti
            now.setMilliseconds(now.getMilliseconds() + i);
            
            console.log(`💾 Tentativo salvataggio strategia: ${result.strategia}`);
            console.log(`📊 Dati strategia:`, {
              strategia: result.strategia,
              rispostaTesto: result.rispostaTesto ? 'Presente' : 'NULL',
              rispostaJSON: result.rispostaJSON ? 'Presente' : 'NULL',
              errore: result.errore
            });
            
            try {
              await db.query(
                `INSERT INTO interazioni_cappelli
                  (session_uuid, timestamp, domanda, cappello, intenzione, strategia, risposta_json, risposta_testo, errore, aggiornato_il)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
                 ON DUPLICATE KEY UPDATE
                   domanda = VALUES(domanda),
                   risposta_json = VALUES(risposta_json),
                   risposta_testo = VALUES(risposta_testo),
                   strategia = VALUES(strategia),
                   errore = NULL,
                   aggiornato_il = VALUES(aggiornato_il)`,
                [
                  sessionUUID,
                  now,
                  domanda,
                  cappello,
                  intenzione,
                  result.strategia,
                  JSON.stringify(result.rispostaJSON || {}),
                  result.rispostaTesto || '',
                  now
                ]
              );
              console.log(`✅ Risposta verde (strategia: ${result.strategia}) salvata nel database`);
            } catch (dbError) {
              console.error(`❌ Errore salvataggio strategia ${result.strategia}:`, dbError.message);
            }
          }
        } catch (dbError) {
          console.error('❌ Errore salvataggio DB verde:', dbError.message);
        }
      }
      
      // Restituisci entrambe le strategie per Storyline
      console.log('📊 Risultati strategie:', results);
      
      if (!results || results.length === 0) {
        console.error('❌ Nessuna risposta valida dalle strategie');
        return res.status(500).json({ errore: 'Nessuna risposta valida dalle strategie del cappello verde.' });
      }
      
      // Prepara le risposte per Storyline
      const risposteStrategie = results.map(result => ({
        strategia: result.strategia,
        risposta: result.rispostaTesto,
        json: result.rispostaJSON
      }));
      
      console.log('✅ Risposte inviate a Storyline:', risposteStrategie.length, 'strategie');
      return res.json({ 
        verde: risposteStrategie,
        strategie_count: risposteStrategie.length
      });
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

Domanda/idea dell'utente: "${domanda}"
`;

  const temperature = (cappelloObj.nome === 'rosso' && (intenzioneLower === 'valutazione' || intenzioneLower === 'generazione')) ? 0.8 : 0;

  try {
    const apiStartTime = Date.now();
    const risposta = await callOpenAI(prompt, temperature);
    const apiEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] TEMPO CHIAMATA API: ${apiEndTime - apiStartTime}ms`);
    
    // Parsing JSON per il cappello bianco, rosso, nero, giallo, verde e blu per valutazione e generazione
    if ((cappelloObj.nome === 'bianco' || cappelloObj.nome === 'rosso' || cappelloObj.nome === 'nero' || cappelloObj.nome === 'giallo' || cappelloObj.nome === 'verde' || cappelloObj.nome === 'blu') && (intenzioneLower === 'valutazione' || intenzioneLower === 'generazione')) {
      try {
        const startTime = Date.now();
        
        // Pulisci la risposta dai markdown code blocks
        let rispostaPulita = risposta;
        if (risposta.includes('```json')) {
          rispostaPulita = risposta.replace(/```json\s*/, '').replace(/\s*```/, '');
        }
        
        const cleanTime = Date.now();
        console.log(`[${new Date().toISOString()}] PULIZIA MARKDOWN: ${cleanTime - startTime}ms`);
        
        const rispostaJSON = JSON.parse(rispostaPulita);
        const rispostaPerStoryline = rispostaJSON.risposta;
        
        // Per tutti gli altri cappelli
        const strategia = 'default';
        
        // Salva su DB solo se sessionUUID è presente
        if (sessionUUID) {
          try {
            const now = new Date();
            await db.query(
              `INSERT INTO interazioni_cappelli
                (session_uuid, timestamp, domanda, cappello, intenzione, strategia, risposta_json, risposta_testo, errore, aggiornato_il)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
               ON DUPLICATE KEY UPDATE
                 domanda = VALUES(domanda),
                 risposta_json = VALUES(risposta_json),
                 risposta_testo = VALUES(risposta_testo),
                 strategia = VALUES(strategia),
                 errore = NULL,
                 aggiornato_il = VALUES(aggiornato_il)`,
              [
                sessionUUID,
                now,
                domanda,
                cappello,
                intenzione,
                strategia,
                JSON.stringify(rispostaJSON),
                rispostaPerStoryline,
                now
              ]
            );
            console.log('✅ Risposta salvata nel database');
          } catch (dbError) {
            console.error('❌ Errore salvataggio DB:', dbError.message);
          }
        }
        
        const parseTime = Date.now();
        console.log(`[${new Date().toISOString()}] PARSING JSON: ${parseTime - cleanTime}ms`);
        
        // Log del JSON completo per il futuro database
        console.log('JSON completo per database:', JSON.stringify(rispostaJSON));
        console.log('RISPOSTA PER STORYLINE:', rispostaPerStoryline);
        
        const totalTime = Date.now();
        console.log(`[${new Date().toISOString()}] TEMPO TOTALE PARSING: ${totalTime - startTime}ms`);
        console.log(`[${new Date().toISOString()}] RISPOSTA INVIATA - Cappello: ${cappelloObj.nome}`);
        
        res.json({ [cappelloObj.nome]: rispostaPerStoryline });
      } catch (jsonError) {
        console.error('Errore nel parsing JSON:', jsonError.message);
        console.error('Risposta ricevuta:', risposta);
        
        // Fallback: invia la risposta originale se il parsing fallisce
        res.json({ [cappelloObj.nome]: risposta });
      }
    } else {
      // Per tutti gli altri cappelli, comportamento normale
      console.log(`[${new Date().toISOString()}] RISPOSTA INVIATA - Cappello: ${cappelloObj.nome}`);
      
      res.json({ [cappelloObj.nome]: risposta });
    }
  } catch (error) {
    console.error('Errore nell\'interazione con OpenAI:', error.message);
    
    res.status(500).json({ errore: 'Errore nella generazione della risposta.' });
  }
});

// Endpoint per recuperare tutte le strategie di una sessione
app.get('/strategie/:sessionUUID', async (req, res) => {
  const { sessionUUID } = req.params;
  
  if (!sessionUUID) {
    return res.status(400).json({ errore: 'sessionUUID mancante.' });
  }

  try {
    const [rows] = await db.query(
      `SELECT cappello, intenzione, strategia, risposta_testo, risposta_json, timestamp
       FROM interazioni_cappelli
       WHERE session_uuid = ?
       ORDER BY timestamp ASC`,
      [sessionUUID]
    );

    console.log(`✅ Recuperate ${rows.length} strategie per sessione: ${sessionUUID}`);
    res.json({ strategie: rows });
  } catch (error) {
    console.error('❌ Errore nel recupero delle strategie:', error.message);
    res.status(500).json({ errore: 'Errore nel recupero delle strategie.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});