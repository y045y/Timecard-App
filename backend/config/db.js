// config/db.js
require("dotenv").config();
console.log(
  "✅ DB_SERVER (直接確認):",
  process.env.DB_SERVER || "環境変数なし"
);

const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE,
  options: {
    // encrypt: false,
    encrypt: true,
    trustServerCertificate: true,
    // instanceName: process.env.DB_INSTANCE,
  },
};
console.log("🌐 全環境変数", {
  DB_SERVER: process.env.DB_SERVER,
  DB_USER: process.env.DB_USER,
  DB_DATABASE: process.env.DB_DATABASE,
});

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then((pool) => {
    console.log("✅ MSSQL Connected!");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err);
  });

module.exports = {
  sql,
  poolPromise,
};
