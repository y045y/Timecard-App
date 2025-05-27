const { poolPromise } = require("../config/db");
const sql = require("mssql");

/**
 * 勤怠レコードに対するデータ操作層（JST前提）
 *  - 日付：文字列 "YYYY-MM-DD"
 *  - 時刻：文字列 "HH:mm"
 */
const AttendanceRecordStore = {
  // 全件取得（昇順）
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
  SELECT 
      id,
      user_id,
      attendance_date,
      CONVERT(VARCHAR(5), start_time, 108) AS start_time,
      CONVERT(VARCHAR(5), end_time, 108) AS end_time,
      overtime_hours,
      paid_leave_days,
      note
      FROM attendance_records
      ORDER BY attendance_date ASC
  `);
    return result.recordset;
  },

  // user_id指定で取得（昇順）
  async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool.request().input("user_id", sql.Int, userId)
      .query(`
    SELECT 
        id,
        user_id,
        attendance_date,
        CONVERT(VARCHAR(5), start_time, 108) AS start_time,
        CONVERT(VARCHAR(5), end_time, 108) AS end_time,
        overtime_hours,
        paid_leave_days,
        note
      FROM attendance_records 
      WHERE user_id = @user_id 
      ORDER BY attendance_date ASC

    `);
    return result.recordset;
  },

  // 新規追加（出勤打刻）
  async insert(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", sql.Int, record.user_id)
      .input("attendance_date", sql.Date, record.attendance_date) // "YYYY-MM-DD"
      .input("start_time", sql.VarChar(5), record.start_time || null) // "HH:mm"
      .input("end_time", sql.VarChar(5), record.end_time || null) // "HH:mm" or null
      .execute("sp_InsertAttendanceRecord");
  },

  // 明細のみ更新（合計欄・summaryは別で更新）
  async update(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, record.id)
      .input("StartTime", sql.VarChar(5), record.start_time || "") // "HH:mm" or ""
      .input("EndTime", sql.VarChar(5), record.end_time || "") // "HH:mm" or ""
      .input("OvertimeHours", sql.Float, parseFloat(record.overtime_hours) || 0)
      .input(
        "PaidLeaveDays",
        sql.Float,
        parseFloat(record.paid_leave_days) || 0
      )
      .input("Note", sql.NVarChar(255), record.note || "")
      .execute("sp_UpdateAttendanceRecordSimple");
  },

  // レコード削除（ID指定）
  async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .execute("sp_DeleteAttendanceRecord");
  },
};

module.exports = AttendanceRecordStore;
