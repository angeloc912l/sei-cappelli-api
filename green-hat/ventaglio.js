const fetch = require('node-fetch');

module.exports = async function ventaglioStrategy(params) {
  const { domanda, session_uuid, ...rest } = params;
  try {
    const response = await fetch(process.env.OPENAI_VENTAGLIO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ domanda, session_uuid, ...rest })
    });
    if (!response.ok) throw new Error('Assistant API ventaglio error');
    const data = await response.json();
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