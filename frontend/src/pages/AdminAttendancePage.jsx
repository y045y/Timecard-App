import React, { useEffect, useState } from "react";
import axios from "axios";
import { isHoliday } from "@holiday-jp/holiday_jp";

const AdminAttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summaryRecords, setSummaryRecords] = useState([]);
  const [baseMonth, setBaseMonth] = useState("2025-04");

  const getDateRange = (baseMonth) => {
    const [year, month] = baseMonth.split("-").map(Number);
    const start = new Date(year, month - 1, 26);
    const end = new Date(year, month, 25);
    const format = (d) => {
      d.setHours(d.getHours() + 9);
      return d.toISOString().split("T")[0];
    };
    return { start: format(start), end: format(end) };
  };

  const moveMonth = (offset) => {
    const [year, month] = baseMonth.split("-").map(Number);
    const date =
      offset === 0 ? new Date() : new Date(year, month - 1 + offset, 1);
    setBaseMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { start, end } = getDateRange(baseMonth);
        const res = await axios.get(
          `http://localhost:5000/api/time-reports?start=${start}&end=${end}`
        );
        setAttendanceRecords(
          Array.isArray(res.data.attendanceRecords)
            ? res.data.attendanceRecords
            : [res.data.attendanceRecords]
        );
        setSummaryRecords(
          Array.isArray(res.data.summaryRecords)
            ? res.data.summaryRecords
            : [res.data.summaryRecords]
        );
      } catch (err) {
        console.error("❌ 勤態データ取得失敗:", err);
      }
    };
    fetchData();
  }, [baseMonth]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 9);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}/${date.getDate()} (${
      weekdays[date.getDay()]
    })`;
  };

  const userNames = [
    ...new Set(attendanceRecords.map((r) => r.user_name).filter(Boolean)),
  ];

  const handleInputChange = (id, field, value) => {
    setAttendanceRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              [field]: ["overtime_hours", "paid_leave_days"].includes(field)
                ? parseFloat(value) || 0
                : value,
            }
          : rec
      )
    );
  };

  const handleSummaryChange = (id, field, value) => {
    setSummaryRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              [field]: [
                "total_overtime_hours",
                "total_paid_leave_days",
                "total_holiday_work_count",
                "total_holiday_work_hours",
                "total_late_count",
                "total_late_hours",
                "total_early_leave_count",
                "total_early_leave_hours",
              ].includes(field)
                ? parseFloat(value) || 0
                : value,
            }
          : rec
      )
    );
  };

  const saveAttendance = async (record) => {
    try {
      const payload = {
        ...record,
        start_time: record.start_time || null,
        end_time: record.end_time || null,
        overtime_hours: parseFloat(record.overtime_hours) || 0,
        paid_leave_days: parseFloat(record.paid_leave_days) || 0,
      };
      await axios.put(
        `http://localhost:5000/api/attendance-records/${record.id}`,
        payload
      );
      alert("✅ 出勤情報 保存しました");
    } catch (err) {
      console.error("❌ 出勤情報 保存失敗:", err);
      alert("❌ 出勤保存失敗");
    }
  };

  const saveSummary = async (summary) => {
    try {
      const payload = {
        total_overtime_hours: parseFloat(summary.total_overtime_hours) || 0,
        total_paid_leave_days: parseFloat(summary.total_paid_leave_days) || 0,
        holiday_work_count: parseFloat(summary.total_holiday_work_count) || 0,
        holiday_work_hours: parseFloat(summary.total_holiday_work_hours) || 0,
        late_count: parseFloat(summary.total_late_count) || 0,
        late_hours: parseFloat(summary.total_late_hours) || 0,
        early_leave_count: parseFloat(summary.total_early_leave_count) || 0,
        early_leave_hours: parseFloat(summary.total_early_leave_hours) || 0,
        note: summary.note || "",
      };
      await axios.put(
        `http://localhost:5000/api/self-reports/${summary.id}`,
        payload
      );
      alert("✅ 合計情報 保存しました");
    } catch (err) {
      console.error("❌ 合計情報 保存失敗:", err);
      alert("❌ 合計保存失敗");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">勤怠管理者画面（{baseMonth}）</h2>
      <div className="text-center mb-4">
        <button
          className="btn btn-outline-primary mx-1"
          onClick={() => moveMonth(-1)}
        >
          前月
        </button>
        <button className="btn btn-primary mx-1" onClick={() => moveMonth(0)}>
          当月
        </button>
        <button
          className="btn btn-outline-success mx-1"
          onClick={() => moveMonth(1)}
        >
          次月
        </button>
      </div>

      {userNames.map((user) => (
        <div key={`user-${user}`} className="mb-5">
          <h4 className="mb-3">{user}</h4>
          {/* 明細テーブル */}
          <div className="table-responsive mb-3">
            <table className="table table-bordered text-center">
              <thead className="table-light">
                <tr>
                  <th>日付</th>
                  <th>出勤</th>
                  <th>退勤</th>
                  <th>残業(h)</th>
                  <th>有給(日)</th>
                  <th>備考</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords
                  .filter((r) => r.user_name === user)
                  .map((rec) => (
                    <tr key={`attendance-${rec.id ?? rec.attendance_date}`}>
                      <td>{formatDate(rec.attendance_date)}</td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={rec.start_time ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              rec.id,
                              "start_time",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          value={rec.end_time ?? ""}
                          onChange={(e) =>
                            handleInputChange(
                              rec.id,
                              "end_time",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={
                            isNaN(rec.overtime_hours) ||
                            rec.overtime_hours === null
                              ? 0
                              : rec.overtime_hours
                          }
                          onChange={(e) =>
                            handleInputChange(
                              rec.id,
                              "overtime_hours",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          value={
                            isNaN(rec.paid_leave_days) ||
                            rec.paid_leave_days === null
                              ? "0"
                              : rec.paid_leave_days
                          }
                          onChange={(e) =>
                            handleInputChange(
                              rec.id,
                              "paid_leave_days",
                              e.target.value
                            )
                          }
                        >
                          <option value="0">0</option>
                          <option value="0.5">0.5</option>
                          <option value="1">1</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={rec.note ?? ""}
                          onChange={(e) =>
                            handleInputChange(rec.id, "note", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => saveAttendance(rec)}
                        >
                          保存
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 合計テーブル */}
          <div className="table-responsive">
            <h5>【合計】</h5>
            <table className="table table-bordered text-center">
              <thead className="table-light">
                <tr>
                  <th>残業合計(h)</th>
                  <th>有給合計(日)</th>
                  <th>休日出勤(回/時間)</th>
                  <th>遅刻(回/時間)</th>
                  <th>早退(回/時間)</th>
                  <th>備考</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {summaryRecords
                  .filter((sum) => sum.user_name === user)
                  .map((sum) => (
                    <tr key={`summary-${sum.id ?? sum.report_month}`}>
                      {/* 残業合計 */}
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={
                            isNaN(sum.total_overtime_hours)
                              ? 0
                              : sum.total_overtime_hours
                          }
                          onChange={(e) =>
                            handleSummaryChange(
                              sum.id,
                              "total_overtime_hours",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* 有給合計 */}
                      <td>
                        <input
                          type="number"
                          step="0.5"
                          className="form-control"
                          value={
                            isNaN(sum.total_paid_leave_days)
                              ? 0
                              : sum.total_paid_leave_days
                          }
                          onChange={(e) =>
                            handleSummaryChange(
                              sum.id,
                              "total_paid_leave_days",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      {/* 休日出勤（回・時間） */}
                      <td>
                        <div className="row gx-1">
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="回"
                              value={sum.total_holiday_work_count ?? "0"}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_holiday_work_count",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="h"
                              value={sum.total_holiday_work_hours ?? 0}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_holiday_work_hours",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </td>

                      {/* 遅刻（回・時間） */}
                      <td>
                        <div className="row gx-1">
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="回"
                              value={sum.total_late_count ?? "0"}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_late_count",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="h"
                              value={sum.total_late_hours ?? 0}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_late_hours",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </td>

                      {/* 早退（回・時間） */}
                      <td>
                        <div className="row gx-1">
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="回"
                              value={sum.total_early_leave_count ?? "0"}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_early_leave_count",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="col">
                            <input
                              type="number"
                              step="0.1"
                              className="form-control"
                              placeholder="h"
                              value={sum.total_early_leave_hours ?? 0}
                              onChange={(e) =>
                                handleSummaryChange(
                                  sum.id,
                                  "total_early_leave_hours",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </td>

                      {/* 備考 */}
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          value={sum.note ?? ""}
                          onChange={(e) =>
                            handleSummaryChange(sum.id, "note", e.target.value)
                          }
                        />
                      </td>

                      {/* 操作ボタン */}
                      <td>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => saveSummary(sum)}
                        >
                          保存
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminAttendancePage;
