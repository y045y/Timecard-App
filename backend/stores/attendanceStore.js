const { poolPromise } = require("../config/db");
const sql = require("mssql");

/**
 * AttendanceStore（JST準拠版）
 * - すべての日時・時間は JST形式で文字列として渡す前提
 * - 例: attendanceDate = "2025-05-28", startTime/endTime = "08:30"
 */
const AttendanceStore = {
  // 出勤打刻
  async punchIn({ userId, attendanceDate, startTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate) // "YYYY-MM-DD"
      .input("StartTime", sql.VarChar(5), startTime) // "HH:mm"
      .execute("sp_PunchIn");
  },

  // 退勤打刻
  async punchOut({ userId, attendanceDate, endTime }) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate) // "YYYY-MM-DD"
      .input("EndTime", sql.VarChar(5), endTime) // "HH:mm"
      .execute("sp_PunchOut");
  },

  // 明細1件更新（シンプル）
  async updateSimple(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, record.id)
      .input("StartTime", sql.VarChar(5), record.startTime || null) // "HH:mm"
      .input("EndTime", sql.VarChar(5), record.endTime || null) // "HH:mm"
      .input("OvertimeHours", sql.Float, parseFloat(record.overtime) || 0)
      .input("PaidLeaveDays", sql.Float, parseFloat(record.paidLeave) || 0)
      .input("Note", sql.NVarChar(255), record.note || "")
      .execute("sp_UpdateAttendanceRecordSimple");
  },

  // 一括更新（JSON化）
  async bulkUpdate(records) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("json", sql.NVarChar(sql.MAX), JSON.stringify(records))
      .execute("sp_BulkUpdateAttendanceRecords");
  },
};

module.exports = AttendanceStore;
