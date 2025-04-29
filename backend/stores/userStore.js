// stores/userStore.js

const { poolPromise } = require("../config/db");

const UserStore = {
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().execute("sp_GetUsers");
    return result.recordset;
  },
  async insert(user) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("name", user.name)
      .input("is_admin", user.is_admin || 0)
      .execute("sp_InsertUser");
  },
  async update(user) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", user.id)
      .input("name", user.name)
      .input("is_admin", user.is_admin)
      .execute("sp_UpdateUser");
  },
  async delete(id) {
    const pool = await poolPromise;
    await pool.request().input("id", id).execute("sp_DeleteUser");
  },
};

module.exports = UserStore;
