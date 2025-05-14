import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import TimecardPage from "./pages/TimecardPage";
import TimeReportPage from "./pages/TimeReportPage";
import HomePage from "./pages/HomePage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";

function App() {
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <div className="container mt-4">
        {/* ナビゲーションバー */}
        <nav className="d-flex justify-content-center gap-3 mb-4">
          <Link to="/" className="btn btn-outline-primary">
            ホーム
          </Link>
          {isAdmin && (
            <Link to="/admin/attendance" className="btn btn-outline-danger">
              勤怠管理（管理者）
            </Link>
          )}
        </nav>

        {/* ルーティング */}
        <Routes>
          <Route
            path="/"
            element={<HomePage setUserId={setUserId} setIsAdmin={setIsAdmin} />}
          />
          <Route path="/timecard" element={<TimecardPage userId={userId} />} />
          <Route path="/report" element={<TimeReportPage userId={userId} />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
