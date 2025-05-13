import React, { useEffect, useState } from "react";
import axios from "axios";
import { isHoliday } from "@holiday-jp/holiday_jp";
// import { useSearchParams } from "react-router-dom";
import { getJSTDateString } from "../utils/timeFormatter";

function getDateRangeForMonth(baseMonth, startDay = 26) {
  const [year, month] = baseMonth.split("-").map(Number);
  const end = new Date(year, month, 25);
  const start = new Date(year, month - 1, startDay);
  return { start, end };
}

const TimeReportPage = ({
  userId,
  attendanceData = [],
  setAttendanceData = () => {},
}) => {
  const [summary, setSummary] = useState({
    holidayWorkCount: "0.0",
    holidayWorkHours: "0.0",
    lateCount: "0.0",
    lateHours: "0.0",
    earlyLeaveCount: "0.0",
    earlyLeaveHours: "0.0",
    summaryNote: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closingStartDay, setClosingStartDay] = useState(26);

  const getCurrentReportMonth = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    if (now.getDate() <= 25) {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
    }
    return `${year}-${String(month + 1).padStart(2, "0")}`;
  };

  const fetchAttendance = async (start, end) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance-records?user_id=${userId}`
      );
      const sqlRecords = res.data;

      const rangeDates = [];
      let current = new Date(start);
      while (current <= end) {
        rangeDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      const updatedData = rangeDates.map((date) => {
        const rowDateStr = getJSTDateString(date);

        const match = sqlRecords.find(
          (r) => getJSTDateString(r.attendance_date) === rowDateStr
        );
        console.log("🟢 date match:", rowDateStr, "→", match?.id);
        return match
          ? {
              date,
              id: match.id,
              startTime: match.start_time || "",
              endTime: match.end_time || "",
              overtime:
                match.overtime_hours != null
                  ? Number(match.overtime_hours).toFixed(1)
                  : "0.0",
              paidLeave:
                match.paid_leave_days != null
                  ? Number(match.paid_leave_days).toFixed(1)
                  : "",
              note: match.note || "",
            }
          : {
              date,
              startTime: "",
              endTime: "",
              overtime: "0.0",
              paidLeave: "",
              note: "",
            };
      });

      setAttendanceData(updatedData);
    } catch (err) {
      console.error("❌ 勤怠データ取得エラー", err);
    }
  };

  const fetchSummary = async (reportMonth) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/self-reports?month=${reportMonth}&user_id=${userId}`
      );
      const record = res.data;
      if (!record || Object.keys(record).length === 0) {
        setSummary({
          holidayWorkCount: "0.0",
          holidayWorkHours: "0.0",
          lateCount: "0.0",
          lateHours: "0.0",
          earlyLeaveCount: "0.0",
          earlyLeaveHours: "0.0",
          summaryNote: "",
        });
        return;
      }

      setSummary({
        holidayWorkCount: Number(record.holiday_work_count || 0).toFixed(1),
        holidayWorkHours: Number(record.holiday_work_hours || 0).toFixed(1),
        lateCount: Number(record.late_count || 0).toFixed(1),
        lateHours: Number(record.late_hours || 0).toFixed(1),
        earlyLeaveCount: Number(record.early_leave_count || 0).toFixed(1),
        earlyLeaveHours: Number(record.early_leave_hours || 0).toFixed(1),
        summaryNote: record.note || "",
      });
    } catch (err) {
      console.error("❌ サマリー取得エラー", err);
    }
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const reportMonth = getCurrentReportMonth();
        const settingRes = await axios.get(
          "http://localhost:5000/api/settings/closing-day"
        );
        const startDay = parseInt(settingRes.data.closing_start_day, 10);
        setClosingStartDay(startDay);

        const { start, end } = getDateRangeForMonth(reportMonth, startDay);

        // ⏱ APIを並列で呼び出す
        await Promise.all([
          fetchAttendance(start, end),
          fetchSummary(reportMonth),
        ]);
      } catch (err) {
        console.error("❌ 初期データ取得失敗", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId]);

  const handleChange = (index, field, value) => {
    const newData = [...attendanceData];
    newData[index][field] = value;
    setAttendanceData(newData);
  };

  const handleSummaryChange = (field, value) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  const overtimeSum = attendanceData.reduce((total, row) => {
    const value = parseFloat(row.overtime);
    return total + (isNaN(value) ? 0 : value);
  }, 0);

  const paidLeaveSum = attendanceData.reduce((total, row) => {
    const value = parseFloat(row.paidLeave);
    return total + (isNaN(value) ? 0 : value);
  }, 0);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth();
      if (now.getDate() <= 25) {
        month -= 1;
        if (month < 0) {
          month = 11;
          year -= 1;
        }
      }
      const reportMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

      // ✅ ここがポイント（サーバーと合わせたキー名にしてある）
      const attendancePayload = attendanceData.map((row) => ({
        id: row.id,
        user_id: userId,
        startTime: row.startTime || "",
        endTime: row.endTime || "",
        overtime: parseFloat(row.overtime) || 0,
        paidLeave: parseFloat(row.paidLeave) || 0,
        note: row.note || "",
      }));

      console.log(
        "📤 payload:",
        attendancePayload.find((r) => r.id === 69)
      );
      await axios.put(
        "http://localhost:5000/api/attendance-records/update-all",
        attendancePayload
      );

      const summaryPayload = {
        user_id: userId,
        report_month: reportMonth,
        total_overtime_hours: parseFloat(overtimeSum) || 0,
        total_paid_leave_days: parseFloat(paidLeaveSum) || 0,
        holiday_work_count: parseFloat(summary.holidayWorkCount) || 0,
        holiday_work_hours: parseFloat(summary.holidayWorkHours) || 0,
        late_count: parseFloat(summary.lateCount) || 0,
        late_hours: parseFloat(summary.lateHours) || 0,
        early_leave_count: parseFloat(summary.earlyLeaveCount) || 0,
        early_leave_hours: parseFloat(summary.earlyLeaveHours) || 0,
        note: summary.summaryNote || "",
      };

      await axios.post(
        "http://localhost:5000/api/self-reports",
        summaryPayload
      );

      alert("✅ 申請が完了しました！");

      const { start, end } = getDateRangeForMonth(reportMonth, closingStartDay);
      await fetchAttendance(start, end);
      await fetchSummary(reportMonth);
    } catch (err) {
      console.error("❌ 申請エラー:", err);
      alert("❌ 申請に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateWithWeekday = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day} (${weekday})`;
  };

  const compactSelectStyle = {
    fontWeight: "bold",
    width: "55px",
    margin: "0 auto",
    height: "28px",
    fontSize: "12px",
    padding: "2px 6px",
  };

  const freeInputStyle = {
    backgroundColor: "#fff9c4",
    border: "2px solid #007bff",
    fontSize: "12px",
    fontWeight: "bold",
    height: "28px",
    padding: "2px 6px",
  };

  const tableCellStyle = {
    padding: "4px 8px",
  };
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p>勤怠データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">
        勤怠入力画面（{closingStartDay}日締め）
      </h2>

      <div className="table-responsive">
        <table className="table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: "80px", ...tableCellStyle }}>日付</th>
              <th style={tableCellStyle}>出勤</th>
              <th style={tableCellStyle}>退勤</th>
              <th style={tableCellStyle}>残業</th>
              <th style={tableCellStyle}>有給</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((row, index) => {
              const weekday = new Date(row.date).getDay();
              let backgroundColor = "inherit";
              if (isHoliday(new Date(row.date))) backgroundColor = "#ffe5e5";
              else if (weekday === 0) backgroundColor = "#ffe5e5";
              else if (weekday === 6) backgroundColor = "#e5f1ff";

              return (
                <React.Fragment key={index}>
                  <tr>
                    <td style={{ backgroundColor, ...tableCellStyle }}>
                      {formatDateWithWeekday(row.date)}
                    </td>
                    <td style={{ backgroundColor, ...tableCellStyle }}>
                      {row.startTime || "--:--"}
                    </td>
                    <td style={{ backgroundColor, ...tableCellStyle }}>
                      {row.endTime || "--:--"}
                    </td>
                    <td style={{ backgroundColor, ...tableCellStyle }}>
                      <select
                        className="form-select text-center"
                        style={compactSelectStyle}
                        value={row.overtime}
                        onChange={(e) =>
                          handleChange(index, "overtime", e.target.value)
                        }
                      >
                        {[...Array(21)].map((_, i) => {
                          const value = (i * 0.5).toFixed(1);
                          return (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td style={{ backgroundColor, ...tableCellStyle }}>
                      <select
                        className="form-select text-center"
                        style={compactSelectStyle}
                        value={row.paidLeave || "0.0"} // ← ここ修正
                        onChange={(e) =>
                          handleChange(index, "paidLeave", e.target.value)
                        }
                      >
                        {["", "0.5", "1.0"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan="5"
                      style={{ backgroundColor, ...tableCellStyle }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        style={{ ...freeInputStyle, width: "100%" }}
                        placeholder="備考を入力"
                        value={row.note}
                        onChange={(e) =>
                          handleChange(index, "note", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <h5>【合計欄】</h5>
        <table className="table table-bordered text-center">
          <tbody>
            <tr>
              <th style={tableCellStyle}>残業合計</th>
              <td style={tableCellStyle}>{overtimeSum.toFixed(1)}</td>
            </tr>
            <tr>
              <th style={tableCellStyle}>有給合計</th>
              <td style={tableCellStyle}>{paidLeaveSum.toFixed(1)}</td>
            </tr>
            <tr>
              <th style={tableCellStyle}>休日出勤（回／時）</th>
              <td style={tableCellStyle}>
                <div className="row gx-1">
                  <div className="col">
                    <select
                      className="form-select"
                      value={summary.holidayWorkCount}
                      onChange={(e) =>
                        handleSummaryChange("holidayWorkCount", e.target.value)
                      }
                    >
                      {[...Array(11)].map((_, i) => {
                        const value = (i * 0.5).toFixed(1);
                        return (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder="h"
                      value={summary.holidayWorkHours}
                      onChange={(e) =>
                        handleSummaryChange("holidayWorkHours", e.target.value)
                      }
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th style={tableCellStyle}>遅刻（回／時）</th>
              <td style={tableCellStyle}>
                <div className="row gx-1">
                  <div className="col">
                    <select
                      className="form-select"
                      value={summary.lateCount}
                      onChange={(e) =>
                        handleSummaryChange("lateCount", e.target.value)
                      }
                    >
                      {[...Array(11)].map((_, i) => {
                        const value = (i * 0.5).toFixed(1);
                        return (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder="h"
                      value={summary.lateHours}
                      onChange={(e) =>
                        handleSummaryChange("lateHours", e.target.value)
                      }
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th style={tableCellStyle}>早退（回／時）</th>
              <td style={tableCellStyle}>
                <div className="row gx-1">
                  <div className="col">
                    <select
                      className="form-select"
                      value={summary.earlyLeaveCount}
                      onChange={(e) =>
                        handleSummaryChange("earlyLeaveCount", e.target.value)
                      }
                    >
                      {[...Array(11)].map((_, i) => {
                        const value = (i * 0.5).toFixed(1);
                        return (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col">
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      placeholder="h"
                      value={summary.earlyLeaveHours}
                      onChange={(e) =>
                        handleSummaryChange("earlyLeaveHours", e.target.value)
                      }
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th style={tableCellStyle}>備考</th>
              <td style={tableCellStyle}>
                <input
                  className="form-control"
                  style={{ ...freeInputStyle, width: "100%" }}
                  value={summary.summaryNote}
                  onChange={(e) =>
                    handleSummaryChange("summaryNote", e.target.value)
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-primary w-50" onClick={handleSubmit}>
          管理者に申請する
        </button>
      </div>
    </div>
  );
};

export default TimeReportPage;
