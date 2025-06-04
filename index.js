const express = require('express');
const axios = require('axios');
const cors = require('cors');           // <-- importa cors
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());                       // <-- abilita CORS per tutte le origini 1
app.use(express.json());

app.post('/sei-cappelli', async (req, res) => {
  const { domanda } = req.body;
  console.log('Domanda ricevuta:', domanda);

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'Sei un assistente che applica la tecnica dei Sei Cappelli di De Bono. Rispondi ragionando con i sei cappelli uno per uno.'
          },
          { role: 'user', content: domanda }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const risposta = response.data.choices[0].message.content;
    res.json({ risposta });
  } catch (error) {
    console.error('Errore API:', error.response?.data || error.message);
    res.status(500).json({ errore: 'Errore nella richiesta all\'Assistant API' });
  }
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});