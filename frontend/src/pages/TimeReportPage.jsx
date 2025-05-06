import React, { useEffect, useState } from "react";
import axios from "axios";
import { isHoliday } from "@holiday-jp/holiday_jp";

const TimeReportPage = ({
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

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/attendance-records"
      );
      const sqlRecords = res.data;

      const updatedData = attendanceData.map((row) => {
        const rowDateStr = new Date(row.date).toISOString().split("T")[0];
        const match = sqlRecords.find(
          (r) => r.attendance_date.split("T")[0] === rowDateStr
        );

        return match
          ? {
              ...row,
              id: match.id,
              startTime: match.start_time || "",
              endTime: match.end_time || "",
              overtime: match.overtime_hours?.toString() || "0.0",
              paidLeave: match.paid_leave_days?.toString() || "",
              note: match.note || "",
            }
          : row;
      });

      setAttendanceData(updatedData);
    } catch (err) {
      console.error("❌ 勤怠データ取得エラー", err);
    }
  };

  const fetchSummary = async (reportMonth) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/self-reports?month=${reportMonth}&user_id=1`
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
        holidayWorkCount: record.holiday_work_count?.toString() || "0.0",
        holidayWorkHours: record.holiday_work_hours?.toString() || "0.0",
        lateCount: record.late_count?.toString() || "0.0",
        lateHours: record.late_hours?.toString() || "0.0",
        earlyLeaveCount: record.early_leave_count?.toString() || "0.0",
        earlyLeaveHours: record.early_leave_hours?.toString() || "0.0",
        summaryNote: record.note || "",
      });
    } catch (err) {
      console.error("❌ サマリー取得エラー", err);
    }
  };

  useEffect(() => {
    const reportMonth = getCurrentReportMonth();
    fetchAttendance();
    fetchSummary(reportMonth);
  }, []);

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

      const attendancePayload = attendanceData.map((row) => ({
        id: row.id,
        startTime: row.startTime || "",
        endTime: row.endTime || "",
        overtime: parseFloat(row.overtime) || 0,
        paidLeave: parseFloat(row.paidLeave) || 0,
        note: row.note || "",
      }));
      await axios.put(
        "http://localhost:5000/api/attendance-records/update-all",
        attendancePayload
      );

      const summaryPayload = {
        user_id: 1,
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

      await fetchAttendance();
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

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">5月給与 勤怠（4/26〜5/25）</h2>

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
                        value={row.paidLeave}
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
