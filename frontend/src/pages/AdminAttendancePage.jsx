import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import TimeReportView from "./TimeReportView";
import { isHoliday } from "@holiday-jp/holiday_jp";

// 環境変数でAPIのベースURLを切り替え（例: .env.production に設定）
const API_BASE = import.meta.env.VITE_API_BASE || "";

const AdminAttendancePage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [closingDay, setClosingDay] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [userRes, settingRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users`),
          axios.get(`${API_BASE}/api/settings/closing-day`),
        ]);

        const userList = Array.isArray(userRes.data) ? userRes.data : [];
        setUsers(userList);
        setSelectedUserId(userList[0]?.id || null);

        const closingStart = parseInt(settingRes.data.closing_start_day, 10);
        setClosingDay(isNaN(closingStart) ? 26 : closingStart);
      } catch (err) {
        console.warn("⚠️ 初期データ取得失敗", err);
        setUsers([]);
        setSelectedUserId(null);
        setClosingDay(26);
      }
    })();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!selectedUserId || !closingDay) return;

      const today = new Date();
      let year = today.getFullYear();
      let month = today.getMonth();
      if (today.getDate() < closingDay) {
        month -= 1;
        if (month < 0) {
          month = 11;
          year -= 1;
        }
      }

      // 正：今日が締め日以前なら前月の「締め日翌日」から
      const start =
        today.getDate() < closingDay
          ? new Date(year, month - 1, closingDay + 1)
          : new Date(year, month, closingDay + 1);
      const end =
        today.getDate() < closingDay
          ? new Date(year, month, closingDay)
          : new Date(year, month + 1, closingDay);

      const dateList = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dateList.push(new Date(d));
      }

      try {
        const [attendRes, sumRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/attendance-records?user_id=${selectedUserId}`
          ),
          axios.get(
            `${API_BASE}/api/self-reports?month=${year}-${String(
              month + 1
            ).padStart(2, "0")}&user_id=${selectedUserId}`
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
      }
    };

    loadData();
  }, [selectedUserId, closingDay]);

  const handleSaveSetting = useCallback(async () => {
    if (closingDay < 1 || closingDay > 31) return alert("1〜31日で設定してね");
    try {
      await axios.post(`${API_BASE}/api/settings/closing-day`, {
        closing_start_day: closingDay,
      });
      setMessage("✅ 締め日を保存しました");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("❌ 締め日保存エラー:", err);
      alert("❌ 保存に失敗しました");
    }
  }, [closingDay]);

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
      <h3 className="mb-3">管理者：勤怠入力と締め日設定</h3>

      <div className="mb-4">
        <label className="form-label">締め開始日（毎月）</label>
        <div className="d-flex">
          <input
            type="number"
            className="form-control me-2"
            value={closingDay ?? ""}
            onChange={(e) => setClosingDay(parseInt(e.target.value, 10))}
            min={1}
            max={31}
          />
          <button
            className="btn btn-outline-primary"
            onClick={handleSaveSetting}
          >
            保存
          </button>
        </div>
        {message && <div className="alert alert-info mt-2">{message}</div>}
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
