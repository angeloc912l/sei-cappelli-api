const ventaglio = require('./ventaglio');
const entrataCasuale = require('./entrata_casuale');

const strategies = {
  ventaglio,
  entrata_casuale: entrataCasuale,
};

const strategieValutazione = ['ventaglio', 'entrata_casuale'];

async function runGreenHatStrategies(intenzione, params) {
  if (intenzione === 'valutazione') {
    const results = await Promise.all(
      strategieValutazione.map(async (nome) => {
        const result = await strategies[nome](params);
        return { strategia: nome, ...result };
      })
    );
    return results;
  } else {
    const { strategia } = params;
    if (!strategia || !strategies[strategia]) {
      throw new Error('Strategia non valida');
    }
    const result = await strategies[strategia](params);
    return [{ strategia, ...result }];
  }
}

module.exports = runGreenHatStrategies; 