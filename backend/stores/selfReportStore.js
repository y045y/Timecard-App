const { poolPromise } = require("../config/db");

const SelfReportStore = {
  // 全件取得
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().execute("sp_GetSelfReports");
    return result.recordset;
  },

  // 追加
  async insert(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", report.user_id)
      .input("report_month", report.report_month)
      .input("total_overtime_hours", report.total_overtime_hours || 0)
      .input("total_paid_leave_days", report.total_paid_leave_days || 0)
      .input("holiday_work_count", report.holiday_work_count || 0)
      .input("holiday_work_hours", report.holiday_work_hours || 0)
      .input("late_count", report.late_count || 0)
      .input("late_hours", report.late_hours || 0)
      .input("early_leave_count", report.early_leave_count || 0)
      .input("early_leave_hours", report.early_leave_hours || 0)
      .input("note", report.note || "")
      .execute("sp_InsertSelfReport"); // ✅ 新しいストアド仕様に合わせた
  },

  // 更新
  async update(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id", report.id)
      .input("overtime_hours", report.total_overtime_hours || 0) // ←ここ「overtime_hours」
      .input("paid_leave_days", report.total_paid_leave_days || 0) // ←ここ「paid_leave_days」
      .input("holiday_work_count", report.holiday_work_count || 0)
      .input("holiday_work_hours", report.holiday_work_hours || 0)
      .input("late_count", report.late_count || 0)
      .input("late_hours", report.late_hours || 0)
      .input("early_leave_count", report.early_leave_count || 0)
      .input("early_leave_hours", report.early_leave_hours || 0)
      .input("note", report.note || "")
      .execute("sp_UpdateSelfReport");
  },
  // 削除
  async delete(id) {
    const pool = await poolPromise;
    await pool.request().input("id", id).execute("sp_DeleteSelfReport");
  },
};

module.exports = SelfReportStore;
