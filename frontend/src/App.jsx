import React from "react";
import TimecardPage from "./pages/TimecardPage";
import TimeReportPage from "./pages/TimeReportPage";
import AdminAttendancePage from "./pages/AdminAttendancePage";

function App() {
  return (
    <div className="container mt-5">
      <TimecardPage />
      <hr />
      <TimeReportPage />
      <hr />
      <AdminAttendancePage />
    </div>
  );
}

export default App;
