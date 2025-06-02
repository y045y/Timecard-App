import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
// import { isHoliday } from "@holiday-jp/holiday_jp";
import { getJSTDateString } from "../utils/timeFormatter";
import DailyRow from "../components/DailyRow"; // パスは適宜修正

const API_BASE = import.meta.env.VITE_API_BASE || "";

function getDateRangeForMonth(
  now = new Date(),
  startDay = 26,
  closingDay = 25
) {
  const current = new Date(now);
  const year = current.getFullYear();
  const month = current.getMonth();

  const start =
    current.getDate() > closingDay
      ? new Date(year, month, startDay)
      : new Date(year, month - 1, startDay);

  const end =
    current.getDate() > closingDay
      ? new Date(year, month + 1, closingDay)
      : new Date(year, month, closingDay);

  return { start, end };
}

const TimeReportPage = () => {
  const [searchParams] = useSearchParams();
  const userId = parseInt(searchParams.get("user_id"), 10);
  const [userName, setUserName] = useState("");

  // 🔽 勤怠データ（各日ごとの詳細）
  const [attendanceData, setAttendanceData] = useState([]);

  // 🔽 月間サマリー（自己申告欄）
  const [summary, setSummary] = useState({
    holidayWorkCount: "0.0",
    holidayWorkHours: "0.0",
    lateCount: "0.0",
    lateHours: "0.0",
    earlyLeaveCount: "0.0",
    earlyLeaveHours: "0.0",
    summaryNote: "",
  });

  // 🔽 締め日・送信状態
  const [closingStartDay, _setClosingStartDay] = useState(26);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔽 現在時刻（表示用）
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🔽 スクロール用参照
  const firstRowRef = useRef(null); // ← 最初の行（旧仕様）
  const todayRef = useRef(null); // ← 今日の行にスクロールする用

  // 🔽 今日の日付（YYYY-MM-DD 文字列）
  const todayDateStr = getJSTDateString(new Date());

  // ⏱️ 現在時刻の更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentReportMonth = () => {
    const now = new Date();
    const closingDay = 25;
    const year = now.getFullYear();
    const month = now.getMonth();

    // 26日〜月末 → 今月、1日〜25日 → 前月をベースとする
    const target =
      now.getDate() > closingDay
        ? new Date(year, month)
        : new Date(year, month - 1);
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
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

        const [userRes, periodRes, attendanceRes, summaryRes] =
          await Promise.all([
            axios.get(`${API_BASE}/api/users`),
            axios.get(`${API_BASE}/api/settings/closing-period`),
            axios.get(`${API_BASE}/api/attendance-records?user_id=${userId}`),
            axios.get(
              `${API_BASE}/api/self-reports?month=${reportMonth}&user_id=${userId}`
            ),
          ]);

        const startStr = periodRes.data.closing_start_date;
        const endStr = periodRes.data.closing_end_date;

        if (!startStr || !endStr) {
          console.error("❌ 締め期間が未設定です");
          alert("❌ 締め期間が設定されていません。管理者に連絡してください。");
          setLoading(false);
          return;
        }

        const start = new Date(`${startStr}T00:00:00+09:00`);
        const end = new Date(`${endStr}T00:00:00+09:00`);
        console.log("📅 今日:", todayDateStr);
        console.log(
          "📅 勤怠データ日付:",
          attendanceData.map((d) => getJSTDateString(d.date))
        );

        const foundUser = userRes.data.find((u) => u.id === userId);
        setUserName(foundUser?.name || `ユーザーID: ${userId}`);

        const today = getJSTDateString(new Date()); // ← ✅ 追加！

        console.log("📅 reportMonth:", reportMonth);
        console.log("📅 範囲:", start, "→", end);
        console.log("📅 today:", today);
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

      // const { start, end } = getDateRangeForMonth(reportMonth, closingStartDay);
      const { start, end } = getDateRangeForMonth(
        new Date(),
        closingStartDay,
        closingStartDay - 1
      );

      await fetchAttendance(start, end);
      await fetchSummary(reportMonth);
    } catch (err) {
      console.error("❌ 申請エラー:", err);
      alert("❌ 申請に失敗しました");
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="container" style={{ marginTop: "8px" }}>
      {/* ユーザー名 */}
      <h5
        className="text-center text-secondary mb-1"
        style={{ fontSize: "14px" }}
      >
        ユーザー: {userName}
      </h5>

      {/* 現在日時 */}
      <div
        className="text-center mb-1 text-muted"
        style={{ fontFamily: "Courier New", fontSize: "13px" }}
      >
        {currentTime.toLocaleString("ja-JP")}
      </div>

      {/* タイトル */}
      <h2
        className="text-center"
        style={{
          fontWeight: "bold",
          borderBottom: "2px solid #007bff",
          marginTop: "4px",
          marginBottom: "12px",
          fontSize: "16px",
        }}
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
            {attendanceData.map((row, index) => {
              const rowDateStr = getJSTDateString(row.date);
              const isToday = rowDateStr === todayDateStr;

              return (
                <DailyRow
                  key={index}
                  row={row}
                  index={index}
                  handleChange={handleChange}
                  firstRowRef={firstRowRef}
                  highlight={isToday} // ✅ 今日だけハイライト
                  refProp={isToday ? todayRef : null}
                />
              );
            })}

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
        <button
          className="btn btn-primary"
          style={{ width: "60%", minWidth: "160px" }}
          onClick={handleSubmit}
        >
          【更新】
        </button>
      </div>
      {/* ⬇ ここにスクロールボタンを追加 */}
      <div
        style={{
          position: "fixed",
          right: "16px",
          bottom: "80px", // 更新ボタンとかぶらないように少し上
          zIndex: 1050,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <button
          className="btn btn-outline-primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ⬆
        </button>
        <button
          className="btn btn-outline-success"
          onClick={() =>
            todayRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }
        >
          🎯
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() =>
            window.scrollTo({
              top: document.body.scrollHeight,
              behavior: "smooth",
            })
          }
        >
          ⬇
        </button>
      </div>
    </div>
  );
};

export default TimeReportPage;
