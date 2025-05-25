import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
// import { isHoliday } from "@holiday-jp/holiday_jp";
import { getJSTDateString } from "../utils/timeFormatter";
import DailyRow from "../components/DailyRow"; // パスは適宜修正

const API_BASE = import.meta.env.VITE_API_BASE || "";

function getDateRangeForMonth(baseMonth, startDay = 26) {
  const [year, month] = baseMonth.split("-").map(Number);
  const end = new Date(year, month, 25);
  const start = new Date(year, month - 1, startDay);
  return { start, end };
}

const TimeReportPage = () => {
  const [searchParams] = useSearchParams();
  const userId = parseInt(searchParams.get("user_id"), 10);
  const [userName, setUserName] = useState("");

  const [attendanceData, setAttendanceData] = useState([]);
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
  const firstRowRef = useRef(null); // ← 最初の行への参照

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
        `${API_BASE}/api/attendance-records?user_id=${userId}`
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
        `${API_BASE}/api/self-reports?month=${reportMonth}&user_id=${userId}`
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

        const [userRes, settingRes, attendanceRes, summaryRes] =
          await Promise.all([
            axios.get(`${API_BASE}/api/users`),
            axios.get(`${API_BASE}/api/settings/closing-day`),
            axios.get(`${API_BASE}/api/attendance-records?user_id=${userId}`),
            axios.get(
              `${API_BASE}/api/self-reports?month=${reportMonth}&user_id=${userId}`
            ),
          ]);

        const foundUser = userRes.data.find((u) => u.id === userId);
        setUserName(foundUser?.name || `ユーザーID: ${userId}`);

        const startDay = parseInt(settingRes.data.closing_start_day, 10);
        setClosingStartDay(startDay);
        const { start, end } = getDateRangeForMonth(reportMonth, startDay);

        // 勤怠データ整形
        const updatedData = (function () {
          const rangeDates = [];
          let current = new Date(start);
          while (current <= end) {
            rangeDates.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }

          return rangeDates.map((date) => {
            const rowDateStr = getJSTDateString(date);
            const match = attendanceRes.data.find(
              (r) => getJSTDateString(r.attendance_date) === rowDateStr
            );
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
        })();
        setAttendanceData(updatedData);

        const s = summaryRes.data;
        setSummary(
          !s || Object.keys(s).length === 0
            ? {
                holidayWorkCount: "0.0",
                holidayWorkHours: "0.0",
                lateCount: "0.0",
                lateHours: "0.0",
                earlyLeaveCount: "0.0",
                earlyLeaveHours: "0.0",
                summaryNote: "",
              }
            : {
                holidayWorkCount: Number(s.holiday_work_count || 0).toFixed(1),
                holidayWorkHours: Number(s.holiday_work_hours || 0).toFixed(1),
                lateCount: Number(s.late_count || 0).toFixed(1),
                lateHours: Number(s.late_hours || 0).toFixed(1),
                earlyLeaveCount: Number(s.early_leave_count || 0).toFixed(1),
                earlyLeaveHours: Number(s.early_leave_hours || 0).toFixed(1),
                summaryNote: s.note || "",
              }
        );

        // スクロール（初期フォーカス）
        setTimeout(() => {
          firstRowRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 300);
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
        `${API_BASE}/api/attendance-records/update-all`,
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

      await axios.post(`${API_BASE}/api/self-reports`, summaryPayload);

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

  const freeInputStyle = useMemo(
    () => ({
      backgroundColor: "#fff9c4",
      border: "2px solid #007bff",
      fontSize: "12px",
      fontWeight: "bold",
      height: "24px",
      padding: "2px 4px",
    }),
    []
  );

  const tableCellStyle = useMemo(
    () => ({
      padding: "2px 4px",
      verticalAlign: "middle",
    }),
    []
  );

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
      <h5 className="text-center text-secondary mb-4">ユーザー: {userName}</h5>

      <h2
        className="text-center mb-4"
        style={{ fontWeight: "bold", borderBottom: "2px solid #007bff" }}
      >
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
            {attendanceData.map((row, index) => (
              <DailyRow
                key={index}
                row={row}
                index={index}
                handleChange={handleChange}
                firstRowRef={firstRowRef}
              />
            ))}

            {/* ✅ ここに余白行を追加 */}
            <tr>
              <td colSpan="5" style={{ height: "48px", border: "none" }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3">
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
                    <select
                      className="form-select"
                      value={summary.holidayWorkHours}
                      onChange={(e) =>
                        handleSummaryChange("holidayWorkHours", e.target.value)
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
                    <select
                      className="form-select"
                      value={summary.lateHours}
                      onChange={(e) =>
                        handleSummaryChange("lateHours", e.target.value)
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
                    <select
                      className="form-select"
                      value={summary.earlyLeaveHours}
                      onChange={(e) =>
                        handleSummaryChange("earlyLeaveHours", e.target.value)
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
      {/* ✅ 固定ボタンと重ならないための余白をここに追加 */}
      <div style={{ height: "80px" }}></div>

      {/* ⬇ 更新ボタンを画面下に固定 */}
      <div
        className="position-fixed bottom-0 start-0 end-0 bg-white border-top text-center p-3"
        style={{ zIndex: 999 }}
      >
        <button className="btn btn-primary w-75" onClick={handleSubmit}>
          【更新】
        </button>
      </div>
    </div>
  );
};

export default TimeReportPage;
