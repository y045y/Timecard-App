import React, { useState } from "react";
import { isHoliday } from "@holiday-jp/holiday_jp";

const TimeReportPage = () => {
  const startDate = new Date("2025-04-26");
  const endDate = new Date("2025-05-25");

  const generateDateList = () => {
    const dates = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dateList = generateDateList();

  const [attendanceData, setAttendanceData] = useState(
    dateList.map((date) => ({
      date,
      startTime: "",
      endTime: "",
      overtime: "",
      paidLeave: "",
      note: "",
    }))
  );

  const [summary, setSummary] = useState({
    holidayWorkCount: "",
    holidayWorkHours: "",
    lateCount: "",
    lateHours: "",
    earlyLeaveCount: "",
    earlyLeaveHours: "",
    summaryNote: "",
  });

  const handleChange = (index, field, value) => {
    const newData = [...attendanceData];
    newData[index][field] = value;
    setAttendanceData(newData);
  };

  const handleSummaryChange = (field, value) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("提出された勤怠データ:", attendanceData);
    console.log("提出された合計欄データ:", {
      ...summary,
      totalOvertimeHours: overtimeSum,
      totalPaidLeaveDays: paidLeaveSum,
    });
    alert("申請しました！（仮）");
  };

  const overtimeSum = attendanceData.reduce((total, row) => {
    const value = parseFloat(row.overtime);
    return total + (isNaN(value) ? 0 : value);
  }, 0);

  const paidLeaveSum = attendanceData.reduce((total, row) => {
    const value = parseFloat(row.paidLeave);
    return total + (isNaN(value) ? 0 : value);
  }, 0);

  const formatDateWithWeekday = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day} (${weekday})`;
  };
  // const compactInputStyle = {
  //   fontWeight: "bold",
  //   width: "55px",
  //   margin: "0 auto", // ← ここを修正
  //   height: "28px",
  //   fontSize: "12px",
  //   padding: "2px 6px",
  // };

  const compactSelectStyle = {
    fontWeight: "bold",
    width: "55px",
    margin: "0 auto", // ← ここも
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
              const weekday = row.date.getDay();
              let backgroundColor = "inherit";
              if (isHoliday(row.date)) backgroundColor = "#ffe5e5";
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
