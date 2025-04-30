const { poolPromise } = require("../config/db");
const sql = require("mssql");

const AttendanceStore = {
  async punchIn({ userId, attendanceDate, startTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("StartTime", sql.Time, startTime) // ← そのまま渡す
      .execute("sp_PunchIn");
  },

  async punchOut({ userId, attendanceDate, endTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("EndTime", sql.Time, endTime) // ← そのまま渡す
      .execute("sp_PunchOut");
  },
};

module.exports = AttendanceStore;
