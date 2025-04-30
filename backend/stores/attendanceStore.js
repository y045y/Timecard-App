const { poolPromise } = require("../config/db");
const sql = require("mssql");

const AttendanceStore = {
  async punchIn({ userId, attendanceDate, startTime }) {
    console.log("🔔 punchIn", { userId, attendanceDate, startTime });

    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("StartTime", sql.Time, new Date(`1970-01-01T${startTime}:00Z`))
      .execute("sp_PunchIn");
  },

  async punchOut({ userId, attendanceDate, endTime }) {
    console.log("🔔 punchOut", { userId, attendanceDate, endTime });

    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("EndTime", sql.Time, new Date(`1970-01-01T${endTime}:00Z`))
      .execute("sp_PunchOut");
  },
};

module.exports = AttendanceStore;
