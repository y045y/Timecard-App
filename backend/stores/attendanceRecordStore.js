const { poolPromise } = require("../config/db");
const sql = require("mssql");

const AttendanceRecordStore = {
  // 全件取得
  async getAll() {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM attendance_records ORDER BY attendance_date ASC");
    return result.recordset;
  },

  // user_id指定で取得
  async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .query(
        "SELECT * FROM attendance_records WHERE user_id = @user_id ORDER BY attendance_date ASC"
      );
    return result.recordset;
  },

  // 追加（出勤記録）
  async insert(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", sql.Int, record.user_id)
      .input("attendance_date", sql.Date, record.attendance_date)
      .input("start_time", sql.VarChar(5), record.start_time || null)
      .input("end_time", sql.VarChar(5), record.end_time || null)
      .execute("sp_InsertAttendanceRecord");
  },

  // 明細だけの更新（合計には触れない）
  async update(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, record.id)
      .input("StartTime", sql.VarChar(5), record.start_time || "")
      .input("EndTime", sql.VarChar(5), record.end_time || "")
      .input("OvertimeHours", sql.Float, parseFloat(record.overtime_hours) || 0)
      .input(
        "PaidLeaveDays",
        sql.Float,
        parseFloat(record.paid_leave_days) || 0
      )
      .input("Note", sql.NVarChar(255), record.note || "")
      .execute("sp_UpdateAttendanceRecordSimple");
  },

  // 削除
  async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .execute("sp_DeleteAttendanceRecord");
  },
};

module.exports = AttendanceRecordStore;
