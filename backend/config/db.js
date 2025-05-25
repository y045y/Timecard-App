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
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    // encrypt: false,
    encrypt: true,
    trustServerCertificate: true,
    // instanceName: process.env.DB_INSTANCE,
  },
};

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
