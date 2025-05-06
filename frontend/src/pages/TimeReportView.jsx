import React from "react";
import { isHoliday } from "@holiday-jp/holiday_jp";

const TimeReportView = ({
  attendanceData = [],
  summary = {},
  editable = false,
  onChange = () => {},
  onSummaryChange = () => {},
  onSubmit = null,
  title = "勤務表",
  overtimeSum = 0,
  paidLeaveSum = 0,
}) => {
  const formatDateWithWeekday = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}/${date.getDate()} (${
      weekdays[date.getDay()]
    })`;
  };

  const handleChange = (index, field, value) => {
    if (!editable) return;
    const newRow = { ...attendanceData[index], [field]: value };
    onChange(index, newRow);
  };

  const handleSummaryChange = (field, value) => {
    if (!editable) return;
    onSummaryChange(field, value);
  };

  const tableCellStyle = {
    padding: "4px 8px",
  };

  const freeInputStyle = {
    backgroundColor: "#fff9c4",
    border: "2px solid #007bff",
    fontSize: "12px",
    fontWeight: "bold",
    height: "28px",
    padding: "2px 6px",
  };

  const compactSelectStyle = {
    fontWeight: "bold",
    width: "55px",
    margin: "0 auto",
    height: "28px",
    fontSize: "12px",
    padding: "2px 6px",
  };

  return (
    <div className="table-responsive">
      <h3 className="text-center my-3">{title}</h3>
      <table className="table table-bordered text-center align-middle">
        <thead className="table-light">
          <tr>
            <th style={{ width: "80px" }}>日付</th>
            <th>出勤</th>
            <th>退勤</th>
            <th>残業</th>
            <th>有給</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.map((row, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: isHoliday(new Date(row.date))
                  ? "#ffe5e5"
                  : undefined,
              }}
            >
              <td>{formatDateWithWeekday(row.date)}</td>
              <td>
                {editable ? (
                  <input
                    type="time"
                    className="form-control"
                    value={row.startTime || ""}
                    onChange={(e) =>
                      handleChange(index, "startTime", e.target.value)
                    }
                  />
                ) : (
                  row.startTime || "--:--"
                )}
              </td>
              <td>
                {editable ? (
                  <input
                    type="time"
                    className="form-control"
                    value={row.endTime || ""}
                    onChange={(e) =>
                      handleChange(index, "endTime", e.target.value)
                    }
                  />
                ) : (
                  row.endTime || "--:--"
                )}
              </td>
              <td>
                {editable ? (
                  <select
                    className="form-select text-center"
                    style={compactSelectStyle}
                    value={row.overtime || "0.0"}
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
                ) : (
                  row.overtime ?? "0.0"
                )}
              </td>
              <td>
                {editable ? (
                  <select
                    className="form-select text-center"
                    style={compactSelectStyle}
                    value={row.paidLeave || ""}
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
                ) : (
                  row.paidLeave ?? "0.0"
                )}
              </td>
              <td>
                {editable ? (
                  <input
                    type="text"
                    className="form-control"
                    value={row.note || ""}
                    onChange={(e) =>
                      handleChange(index, "note", e.target.value)
                    }
                  />
                ) : (
                  row.note || ""
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 合計欄 */}
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

      {onSubmit && (
        <div className="text-center mt-3">
          <button className="btn btn-primary" onClick={onSubmit}>
            登録／更新する
          </button>
        </div>
      )}
    </div>
  );
};

export default TimeReportView;
