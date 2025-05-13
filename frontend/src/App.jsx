import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TimecardPage from "./pages/TimecardPage";
import TimeReportPage from "./pages/TimeReportPage";
import HomePage from "./pages/HomePage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";

function App() {
  return (
    <Router>
      <div className="container mt-4">
        {/* ナビゲーションバー */}
        <nav className="d-flex justify-content-center gap-3 mb-4">
          <Link to="/" className="btn btn-outline-primary">
            ホーム
          </Link>
          <Link to="/timecard?user_id=2" className="btn btn-outline-secondary">
            勤怠入力
          </Link>
          <Link to="/admin/attendance" className="btn btn-outline-danger">
            勤怠管理（管理者）
          </Link>
        </nav>

        {/* ルーティング */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/timecard" element={<TimecardPage />} />
          <Route path="/report" element={<TimeReportPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
