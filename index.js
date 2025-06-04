const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

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
  const { domanda } = req.body;
  if (!domanda || domanda.trim() === '') {
    return res.status(400).json({ errore: 'Domanda mancante o vuota.' });
  }

  try {
    const promises = cappelli.map(cappello => {
      const prompt = `Applica il cappello ${cappello.nome.toUpperCase()} sulla seguente domanda/idea: "${domanda}". ${cappello.descrizione}`;
      return callOpenAI(prompt).then(risposta => ({ [cappello.nome]: risposta }));
    });

    const resultsArray = await Promise.all(promises);
    const risultati = Object.assign({}, ...resultsArray);

    res.json(risultati);
  } catch (error) {
    console.error('Errore API:', error.response?.data || error.message);
    res.status(500).json({ errore: 'Errore nella richiesta all\'Assistant API' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});