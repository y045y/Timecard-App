const { poolPromise } = require("../config/db");
const sql = require("mssql");

/**
 * SettingsStore
 * - 汎用設定の取得・保存
 * - 日時の処理は一切含まない
 * - 使用例：closing_start_day = "26"
 */
const SettingsStore = {
  // 設定取得（存在しない場合 null）
  async get(key) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("key", sql.NVarChar(50), key)
      .query("SELECT [value] FROM settings WHERE [key] = @key");

    return result.recordset[0]?.value || null;
  },

  // 設定保存（MERGEによるUPSERT）
  async set(key, value) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("key", sql.NVarChar(50), key)
      .input("value", sql.NVarChar(255), value).query(`
        MERGE settings AS target
        USING (SELECT @key AS [key], @value AS [value]) AS source
        ON (target.[key] = source.[key])
        WHEN MATCHED THEN
          UPDATE SET [value] = source.[value]
        WHEN NOT MATCHED THEN
          INSERT ([key], [value]) VALUES (source.[key], source.[value]);
      `);
  },
};

module.exports = SettingsStore;
