// stores/userStore.js

const { poolPromise } = require("../config/db");
const sql = require("mssql");

const UserStore = {
  // 全ユーザー取得
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().execute("sp_GetUsers");
    return result.recordset;
  },

  // 新規ユーザー追加（created_at/updated_at はDBでJST補完）
  async insert(user) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", sql.NVarChar(50), user.name)
      .input("is_admin", sql.Bit, user.is_admin || 0)
      .execute("sp_InsertUser");
  },

  // ユーザー情報更新（updated_atはDB側でJST更新）
  async update(user) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, user.id)
      .input("name", sql.NVarChar(50), user.name)
      .input("is_admin", sql.Bit, user.is_admin)
      .execute("sp_UpdateUser");
  },

  // ユーザー削除
  async delete(id) {
    const pool = await poolPromise;
    await pool.request().input("id", sql.Int, id).execute("sp_DeleteUser");
  },
};

module.exports = UserStore;
