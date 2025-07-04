const ventaglio = require('./green-hat/ventaglio');
const entrataCasuale = require('./green-hat/entrata_casuale');

const strategies = {
  ventaglio,
  entrata_casuale: entrataCasuale,
};

const strategieValutazione = ['ventaglio', 'entrata_casuale'];

async function runGreenHatStrategies(intenzione, params) {
  console.log(`🎯 Esecuzione strategie cappello verde - Intenzione: ${intenzione}`);
  
  if (intenzione === 'valutazione') {
    console.log('🔄 Esecuzione multiple strategie per valutazione...');
    const results = await Promise.all(
      strategieValutazione.map(async (nome) => {
        console.log(`📋 Esecuzione strategia: ${nome}`);
        const result = await strategies[nome](params);
        return { strategia: nome, ...result };
      })
    );
    console.log(`✅ Completate ${results.length} strategie`);
    return results;
  } else {
    const { strategia } = params;
    if (!strategia || !strategies[strategia]) {
      throw new Error('Strategia non valida');
    }
    console.log(`📋 Esecuzione singola strategia: ${strategia}`);
    const result = await strategies[strategia](params);
    return [{ strategia, ...result }];
  }
}

module.exports = runGreenHatStrategies;
