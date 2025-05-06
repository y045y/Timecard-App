import React, { useState } from "react";
import TimecardPage from "./pages/TimecardPage";
import TimeReportView from "./pages/TimeReportView";

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
    <div className="container mt-5">
      <TimecardPage
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
      />
      <hr />
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
    </div>
  );
}

export default App;
