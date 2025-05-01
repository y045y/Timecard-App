const { poolPromise } = require("../config/db");
const sql = require("mssql");

/**
 * "08:30" → Date("1970-01-01T08:30:00.000Z")
 * SQL Server の TIME 型に渡すため、基準日の UTC Date オブジェクトに変換する
 */
function parseTimeToDateObject(timeStr) {
  if (timeStr instanceof Date) return timeStr; // ← 追加（既にDateならそのまま）

  if (typeof timeStr !== "string") {
    console.error("⚠️ Invalid timeStr:", timeStr);
    throw new Error("timeStr must be a string like '08:30'");
  }

  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.error("⚠️ Invalid hour or minute:", h, m);
    throw new Error("Invalid hour or minute for time");
  }

  return new Date(Date.UTC(1970, 0, 1, hour, minute));
}

const AttendanceStore = {
  /**
   * 出勤打刻
   * @param {Object} params
   * @param {number} params.userId - ユーザーID
   * @param {string} params.attendanceDate - 日付 (例: "2025-05-02")
   * @param {string} params.startTime - 時刻 (例: "08:30")
   */
  async punchIn({ userId, attendanceDate, startTime }) {
    const parsedStart = parseTimeToDateObject(startTime);
    console.log("🕒 parsedStartTime:", parsedStart);

    const pool = await poolPromise;

    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("StartTime", sql.Time, parsedStart)
      .execute("sp_PunchIn");
  },

  /**
   * 退勤打刻
   * @param {Object} params
   * @param {number} params.userId - ユーザーID
   * @param {string} params.attendanceDate - 日付 (例: "2025-05-02")
   * @param {string} params.endTime - 時刻 (例: "18:00")
   */
  async punchOut({ userId, attendanceDate, endTime }) {
    const parsedEnd = parseTimeToDateObject(endTime);
    console.log("🕒 parsedEndTime:", parsedEnd);

    const pool = await poolPromise;

    await pool
      .request()
      .input("UserId", sql.Int, userId)
      .input("AttendanceDate", sql.Date, attendanceDate)
      .input("EndTime", sql.Time, parsedEnd)
      .execute("sp_PunchOut");
  },
};

module.exports = AttendanceStore;
