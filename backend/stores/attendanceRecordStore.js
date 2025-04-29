const { poolPromise } = require("../config/db");

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
      .input("user_id", userId)
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
      .input("user_id", record.user_id)
      .input("attendance_date", record.attendance_date)
      .input("start_time", record.start_time || null)
      .input("end_time", record.end_time || null)
      .execute("sp_InsertAttendanceRecord");
  },

  // 明細だけの更新（合計には触れない）
  async update(record) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", record.id)
      .input("StartTime", record.start_time || "")
      .input("EndTime", record.end_time || "")
      .input("OvertimeHours", parseFloat(record.overtime_hours) || 0)
      .input("PaidLeaveDays", parseFloat(record.paid_leave_days) || 0)
      .input("Note", record.note || "")
      .execute("sp_UpdateAttendanceRecordSimple");
  },

  // 削除
  async delete(id) {
    const pool = await poolPromise;
    await pool.request().input("id", id).execute("sp_DeleteAttendanceRecord");
  },
};

module.exports = AttendanceRecordStore;
