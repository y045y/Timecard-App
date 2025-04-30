const { poolPromise } = require("../config/db");
const sql = require("mssql");

const SelfReportStore = {
  // 全件取得
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().execute("sp_GetSelfReports");
    return result.recordset;
  },

  // 追加（self_reports）
  async insert(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("user_id", report.user_id)
      .input("report_month", report.report_month)
      .input(
        "total_overtime_hours",
        parseFloat(report.total_overtime_hours) || 0
      )
      .input(
        "total_paid_leave_days",
        parseFloat(report.total_paid_leave_days) || 0
      )
      .input("holiday_work_count", report.holiday_work_count || "0")
      .input("holiday_work_hours", parseFloat(report.holiday_work_hours) || 0)
      .input("late_count", report.late_count || "0")
      .input("late_hours", parseFloat(report.late_hours) || 0)
      .input("early_leave_count", report.early_leave_count || "0")
      .input("early_leave_hours", parseFloat(report.early_leave_hours) || 0)
      .input("note", report.note || "")
      .execute("sp_InsertSelfReport");
  },

  // 更新（self_reports）
  async update(report) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("Id", sql.Int, report.id)
      .input(
        "HolidayWorkCount",
        sql.Float,
        parseFloat(report.holiday_work_count) || 0
      )
      .input(
        "HolidayWorkHours",
        sql.Float,
        parseFloat(report.holiday_work_hours) || 0
      )
      .input("LateCount", sql.Float, parseFloat(report.late_count) || 0)
      .input("LateHours", sql.Float, parseFloat(report.late_hours) || 0)
      .input(
        "EarlyLeaveCount",
        sql.Float,
        parseFloat(report.early_leave_count) || 0
      )
      .input(
        "EarlyLeaveHours",
        sql.Float,
        parseFloat(report.early_leave_hours) || 0
      )
      .input("Note", sql.NVarChar, report.note || "")
      .input(
        "TotalOvertimeHours",
        sql.Float,
        parseFloat(report.total_overtime_hours) || 0
      )
      .input(
        "TotalPaidLeaveDays",
        sql.Float,
        parseFloat(report.total_paid_leave_days) || 0
      )
      .execute("sp_UpdateSelfReport");
  },

  // 削除（self_reports）
  async delete(id) {
    const pool = await poolPromise;
    await pool.request().input("id", id).execute("sp_DeleteSelfReport");
  },
};

module.exports = SelfReportStore;
