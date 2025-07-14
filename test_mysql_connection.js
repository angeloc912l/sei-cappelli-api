const mysql = require('mysql2');

const connection = mysql.createConnection({
  host:     '86.107.36.185',
  user:     'zinstruk_bianco',
  password: 'C912l02114927_',
  database: 'zinstruk_cappelli',
  port:     3306
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Errore di connessione:', err.code, err.message);
    process.exit(1);
  } else {
    console.log('✅ Connessione riuscita!');
    connection.end();
    process.exit(0);
  }
}); 