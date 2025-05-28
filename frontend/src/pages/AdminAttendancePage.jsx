import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import TimeReportView from "./TimeReportView";
import { isHoliday } from "@holiday-jp/holiday_jp";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const AdminAttendancePage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const userRes = await axios.get(`${API_BASE}/api/users`);
        const userList = Array.isArray(userRes.data) ? userRes.data : [];
        setUsers(userList);
        setSelectedUserId(userList[0]?.id || null);
      } catch (err) {
        console.warn("⚠️ 初期データ取得失敗", err);
        setUsers([]);
        setSelectedUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedUserId) return;

      try {
        const settingRes = await axios.get(
          `${API_BASE}/api/settings/closing-period`
        );
        const start = settingRes.data.closing_start_date;
        const end = settingRes.data.closing_end_date;

        if (!start || !end) {
          console.warn("⚠️ 締め期間が未設定です");
          return;
        }

        setStartDateStr(start);
        setEndDateStr(end);

        const startDate = new Date(`${start}T00:00:00+09:00`);
        const endDate = new Date(`${end}T00:00:00+09:00`);

        const dateList = [];
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          dateList.push(new Date(d));
        }

        const [attendRes, sumRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/attendance-records?user_id=${selectedUserId}`
          ),
          axios.get(
            `${API_BASE}/api/self-reports?month=${start.slice(
              0,
              7
            )}&user_id=${selectedUserId}`
          ),
        ]);

        const records = Array.isArray(attendRes.data) ? attendRes.data : [];
        const attendance = dateList.map((date) => {
          const strDate = date.toISOString().split("T")[0];
          const match = records.find(
            (r) => r.attendance_date.split("T")[0] === strDate
          );
          const day = date.getDay();
          let bgColor = "";
          if (isHoliday(date) || day === 0) bgColor = "#ffe5e5";
          else if (day === 6) bgColor = "#e5f1ff";

          return match
            ? {
                ...match,
                date,
                startTime: match.start_time || "",
                endTime: match.end_time || "",
                overtime: match.overtime_hours?.toFixed(1) || "0.0",
                paidLeave: match.paid_leave_days?.toFixed(1) || "",
                note: match.note || "",
                backgroundColor: bgColor,
              }
            : {
                date,
                startTime: "",
                endTime: "",
                overtime: "0.0",
                paidLeave: "",
                note: "",
                backgroundColor: bgColor,
              };
        });

        setAttendanceData(attendance);

        const rec = sumRes.data || {};
        setSummary({
          holidayWorkCount: rec.holiday_work_count?.toFixed(1) || "0.0",
          holidayWorkHours: rec.holiday_work_hours?.toFixed(1) || "0.0",
          lateCount: rec.late_count?.toFixed(1) || "0.0",
          lateHours: rec.late_hours?.toFixed(1) || "0.0",
          earlyLeaveCount: rec.early_leave_count?.toFixed(1) || "0.0",
          earlyLeaveHours: rec.early_leave_hours?.toFixed(1) || "0.0",
          summaryNote: rec.note || "",
        });
      } catch (err) {
        console.error("❌ 勤怠/サマリーデータ取得エラー", err);
        setAttendanceData([]);
        setSummary({});
        setStartDateStr("");
        setEndDateStr("");
      }
    };

    loadData();
  }, [selectedUserId]);

  const overtimeSum = useMemo(
    () =>
      attendanceData.reduce((sum, r) => sum + (parseFloat(r.overtime) || 0), 0),
    [attendanceData]
  );

  const paidLeaveSum = useMemo(
    () =>
      attendanceData.reduce(
        (sum, r) => sum + (parseFloat(r.paidLeave) || 0),
        0
      ),
    [attendanceData]
  );

  const handleRowChange = useCallback((index, newRow) => {
    setAttendanceData((prev) => {
      const updated = [...prev];
      updated[index] = newRow;
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await axios.put(
        `${API_BASE}/api/attendance-records/update-all`,
        attendanceData.map((r) => ({
          ...r,
          user_id: selectedUserId,
        }))
      );

      const now = new Date();
      const reportMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;

      await axios.post(`${API_BASE}/api/self-reports`, {
        user_id: selectedUserId,
        report_month: reportMonth,
        total_overtime_hours: overtimeSum,
        total_paid_leave_days: paidLeaveSum,
        holiday_work_count: summary.holidayWorkCount,
        holiday_work_hours: summary.holidayWorkHours,
        late_count: summary.lateCount,
        late_hours: summary.lateHours,
        early_leave_count: summary.earlyLeaveCount,
        early_leave_hours: summary.earlyLeaveHours,
        note: summary.summaryNote,
      });

      alert("✅ 勤怠情報を保存しました");
    } catch (err) {
      console.error("❌ 勤怠保存エラー:", err);
      alert("❌ 保存に失敗しました");
    }
  }, [attendanceData, summary, selectedUserId, overtimeSum, paidLeaveSum]);

  return (
    <div className="container mt-4">
      <h3 className="mb-3">
        管理者：勤怠編集（{startDateStr} ～ {endDateStr}）
      </h3>

      <div className="mb-4">
        <label className="form-label">
          現在の締め期間（※編集は <a href="/admin/settings">設定画面</a> で）
        </label>
        <div className="p-2 border rounded bg-light">
          {startDateStr && endDateStr ? (
            <span className="fw-bold">
              {startDateStr} ～ {endDateStr}
            </span>
          ) : (
            <span className="text-muted">未設定</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label">ユーザー選択</label>
        <div className="btn-group">
          {users.map((u) => (
            <button
              key={u.id}
              className={`btn btn-${
                u.id === selectedUserId ? "primary" : "outline-primary"
              }`}
              onClick={() => setSelectedUserId(u.id)}
            >
              {u.name}
            </button>
          ))}
        </div>
      </div>

      {selectedUserId && (
        <TimeReportView
          attendanceData={attendanceData}
          summary={summary}
          editable={true}
          onChange={handleRowChange}
          onSummaryChange={(k, v) => setSummary((s) => ({ ...s, [k]: v }))}
          onSubmit={handleSubmit}
          overtimeSum={overtimeSum}
          paidLeaveSum={paidLeaveSum}
          title="勤務表（管理者用）"
        />
      )}
    </div>
  );
};

export default AdminAttendancePage;
