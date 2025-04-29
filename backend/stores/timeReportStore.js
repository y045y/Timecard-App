const { poolPromise } = require("../config/db");

const TimeReportStore = {
  // 個人単位の勤怠（未修正）
  async getByUser(userId, startDate, endDate) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("UserId", userId)
      .input("StartDate", startDate)
      .input("EndDate", endDate)
      .execute("sp_GetTimeReport");

    return result.recordset; // ←これはOK
  },

  // 全体の勤怠＋合計
  async getAll(startDate, endDate) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("StartDate", startDate)
      .input("EndDate", endDate)
      .execute("sp_GetAllTimeReports");

    return {
      attendanceRecords: result.recordsets[0] || [],
      summaryRecords: result.recordsets[1] || [],
    };
  },
};

module.exports = TimeReportStore;
