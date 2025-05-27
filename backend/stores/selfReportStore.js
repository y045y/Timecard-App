const { poolPromise } = require("../config/db");
const sql = require("mssql");

/**
 * SelfReportStore（JST準拠版）
 * - report_month: "YYYY-MM" 文字列
 * - 時間は float型で処理（"1.0", "0.5"など）
 */
const SelfReportStore = {
  // 全件取得
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().execute("sp_GetSelfReports");
    return result.recordset;
  },

  // 登録（新規self_reports追加）
  async insert(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", sql.Int, report.user_id)
      .input("report_month", sql.Char(7), report.report_month) // "YYYY-MM"
      .input("total_overtime_hours", sql.Float, report.totalOvertimeHours || 0)
      .input("total_paid_leave_days", sql.Float, report.totalPaidLeaveDays || 0)
      .input("holiday_work_count", sql.Float, report.holidayWorkCount || 0)
      .input("holiday_work_hours", sql.Float, report.holidayWorkHours || 0)
      .input("late_count", sql.Float, report.lateCount || 0)
      .input("late_hours", sql.Float, report.lateHours || 0)
      .input("early_leave_count", sql.Float, report.earlyLeaveCount || 0)
      .input("early_leave_hours", sql.Float, report.earlyLeaveHours || 0)
      .input("note", sql.NVarChar(255), report.note || "")
      .execute("sp_InsertSelfReport");
  },

  // 更新（既存self_reportsの修正）
  async update(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, report.id)
      .input("HolidayWorkCount", sql.Float, report.holiday_work_count)
      .input("HolidayWorkHours", sql.Float, report.holiday_work_hours)
      .input("LateCount", sql.Float, report.late_count)
      .input("LateHours", sql.Float, report.late_hours)
      .input("EarlyLeaveCount", sql.Float, report.early_leave_count)
      .input("EarlyLeaveHours", sql.Float, report.early_leave_hours)
      .input("Note", sql.NVarChar(255), report.note)
      .input("TotalOvertimeHours", sql.Float, report.total_overtime_hours)
      .input("TotalPaidLeaveDays", sql.Float, report.total_paid_leave_days)
      .execute("sp_UpdateSelfReport");
  },

  // 削除（ID指定）
  async delete(id) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, id)
      .execute("sp_DeleteSelfReport");
  },

  // ユーザー＆月指定で1件取得
  async findByUserAndMonth(userId, month) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("user_id", sql.Int, userId)
      .input("report_month", sql.Char(7), month) // "YYYY-MM"
      .query(`
        SELECT TOP 1 * FROM self_reports
        WHERE user_id = @user_id AND report_month = @report_month
      `);
    return result.recordset[0];
  },
};

module.exports = SelfReportStore;
