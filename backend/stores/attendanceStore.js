const { poolPromise } = require("../config/db");
const sql = require("mssql");

const AttendanceStore = {
  async punchIn({ userId, attendanceDate, startTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("StartTime", sql.VarChar(5), startTime) // ← ここ修正
      .execute("sp_PunchIn");
  },

  async punchOut({ userId, attendanceDate, endTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("EndTime", sql.VarChar(5), endTime) // ← ここも修正
      .execute("sp_PunchOut");
  },
  async updateSimple(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, record.id)
      .input("StartTime", sql.VarChar(5), record.startTime || null)
      .input("EndTime", sql.VarChar(5), record.endTime || null)
      .input("OvertimeHours", sql.Float, parseFloat(record.overtime) || 0)
      .input("PaidLeaveDays", sql.Float, parseFloat(record.paidLeave) || 0)
      .input("Note", sql.NVarChar(255), record.note || "")
      .execute("sp_UpdateAttendanceRecordSimple");
  },
  async bulkUpdate(records) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("json", sql.NVarChar(sql.MAX), JSON.stringify(records))
      .execute("sp_BulkUpdateAttendanceRecords");
  },
};

module.exports = AttendanceStore;
