const axios = require('axios');

module.exports = async function ventaglioStrategy(params) {
  const { domanda, session_uuid, ...rest } = params;
  try {
    const response = await axios.post(process.env.OPENAI_VENTAGLIO_API_URL, 
      { domanda, session_uuid, ...rest },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      }
    );
    const data = response.data;
    return {
      risposta_testo: data.risposta_testo,
      risposta_json: data.risposta_json,
      errore: null
    };
  } catch (err) {
    return {
      risposta_testo: null,
      risposta_json: null,
      errore: err.message
    };
  }
}; 