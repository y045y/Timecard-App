// config/db.js

const sql = require("mssql");

const dbConfig = {
  user: "sa",
  password: "Hsadmin9007",
  server: "localhost", // ★PC名ではなくlocalhostにする（IP直打ちでもいい）
  database: "Kintai",
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: "SQLEXPRESS01", // ★ここにインスタンス名を書く！！
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
