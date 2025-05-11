import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TimecardPage from "./pages/TimecardPage";
import TimeReportView from "./pages/TimeReportView";
import HomePage from "./pages/HomePage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";

function App() {
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

  const [attendanceData, setAttendanceData] = useState(
    generateDateList().map((date) => ({
      date,
      startTime: "",
      endTime: "",
      overtime: "",
      paidLeave: "",
      note: "",
    }))
  );

  const [summary, setSummary] = useState({
    holidayWorkCount: "0.0",
    holidayWorkHours: "0.0",
    lateCount: "0.0",
    lateHours: "0.0",
    earlyLeaveCount: "0.0",
    earlyLeaveHours: "0.0",
    summaryNote: "",
  });

  const handleRowChange = (index, newRow) => {
    const updated = [...attendanceData];
    updated[index] = newRow;
    setAttendanceData(updated);
  };

  const handleSummaryChange = (field, value) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  const overtimeSum = attendanceData.reduce((total, row) => {
    const val = parseFloat(row.overtime);
    return total + (isNaN(val) ? 0 : val);
  }, 0);

  const paidLeaveSum = attendanceData.reduce((total, row) => {
    const val = parseFloat(row.paidLeave);
    return total + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <Router>
      <div className="container mt-5">
        <nav className="mb-4">
          <Link to="/" className="btn btn-outline-primary me-2">
            ホーム
          </Link>
          <Link to="/timecard" className="btn btn-outline-primary me-2">
            打刻
          </Link>
          <Link to="/report" className="btn btn-outline-primary me-2">
            勤務表
          </Link>
          <Link to="/admin/settings" className="btn btn-outline-danger me-2">
            管理者設定
          </Link>
          <Link to="/admin/attendance" className="btn btn-outline-danger">
            勤怠管理（管理者）
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timecard" element={<TimecardPage />} />
          <Route
            path="/report"
            element={
              <TimeReportView
                attendanceData={attendanceData}
                summary={summary}
                editable={true}
                onChange={handleRowChange}
                onSummaryChange={handleSummaryChange}
                overtimeSum={overtimeSum}
                paidLeaveSum={paidLeaveSum}
                title="勤務表（管理者用）"
                onSubmit={() => alert("保存処理はここで実行")}
              />
            }
          />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
