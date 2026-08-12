/**
 * Cria o banco de dados MySQL definido em DB_DATABASE (.env), se ainda não
 * existir. Uso único de setup local — não faz parte do runtime da API.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  const dbName = process.env.DB_DATABASE;
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`Banco '${dbName}' pronto (criado ou já existente).`);

  const [rows] = await connection.query('SHOW DATABASES LIKE ?', [dbName]);
  console.log('Confirmação SHOW DATABASES:', rows);

  await connection.end();
}

main().catch((err) => {
  console.error('Falha ao criar o banco:', err.message);
  process.exit(1);
});
