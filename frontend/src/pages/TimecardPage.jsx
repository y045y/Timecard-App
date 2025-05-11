import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import TimeReportPage from "./TimeReportPage";
import { getJSTDateString, getJSTTimeString } from "../utils/timeFormatter";

const generateDates = () => {
  const start = new Date("2025-04-26");
  const end = new Date("2025-05-25");
  const days = [];
  while (start <= end) {
    days.push({
      date: new Date(start),
      startTime: "",
      endTime: "",
      overtime: "0.0",
      paidLeave: "",
      note: "",
    });
    start.setDate(start.getDate() + 1);
  }
  return days;
};

const TimecardPage = () => {
  const [searchParams] = useSearchParams();
  const userId = parseInt(searchParams.get("user_id"), 10);

  const [attendanceData, setAttendanceData] = useState(generateDates());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [status, setStatus] = useState("未出勤");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => {
        const user = res.data.find((u) => u.id === userId);
        setUserName(user?.name || `ユーザーID: ${userId}`);
      })
      .catch((err) => {
        console.error("❌ ユーザー名取得失敗:", err);
        setUserName(`ユーザーID: ${userId}`);
      });
  }, [userId]);

  if (!userId || isNaN(userId)) {
    return <div className="alert alert-danger">❌ user_idが無効です</div>;
  }

  const handleStart = async () => {
    if (status !== "未出勤") return;

    const now = new Date();
    setStartTime(now);
    setStatus("出勤中");

    const dateStr = getJSTDateString(now);
    const timeStr = getJSTTimeString(now);

    const newData = attendanceData.map((row) => {
      const rowDateStr = getJSTDateString(new Date(row.date));
      return rowDateStr === dateStr ? { ...row, startTime: timeStr } : row;
    });
    setAttendanceData(newData);

    try {
      await axios.post(
        "http://localhost:5000/api/attendance-records/punch-in",
        {
          user_id: userId,
          attendance_date: dateStr,
          start_time: timeStr,
        }
      );
      console.log("✅ 出勤打刻成功:", { dateStr, timeStr });
    } catch (err) {
      console.error("❌ 出勤登録失敗:", err);
      alert("出勤打刻に失敗しました");
    }
  };

  const handleEnd = async () => {
    if (status !== "出勤中") return;

    const now = new Date();
    setEndTime(now);
    setStatus("退勤済み");

    const dateStr = getJSTDateString(now);
    const timeStr = getJSTTimeString(now);

    const newData = attendanceData.map((row) => {
      const rowDateStr = getJSTDateString(new Date(row.date));
      return rowDateStr === dateStr ? { ...row, endTime: timeStr } : row;
    });
    setAttendanceData(newData);

    try {
      await axios.put(
        "http://localhost:5000/api/attendance-records/punch-out",
        {
          user_id: userId,
          attendance_date: dateStr,
          end_time: timeStr,
        }
      );
      console.log("✅ 退勤打刻成功:", { dateStr, timeStr });
    } catch (err) {
      console.error("❌ 退勤登録失敗:", err);
      alert("退勤打刻に失敗しました");
    }
  };

  const formatTime = (time) => {
    if (!time) return "--:--:--";
    const h = String(time.getHours()).padStart(2, "0");
    const m = String(time.getMinutes()).padStart(2, "0");
    const s = String(time.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <>
      <div
        className="card p-4 shadow-sm mb-5"
        style={{ maxWidth: "400px", margin: "auto" }}
      >
        <h5 className="text-center mb-3">
          {currentTime.toLocaleString("ja-JP")}
        </h5>
        <h6 className="text-center mb-4">{userName}</h6>

        <div className="mb-3">
          <p>出勤：{formatTime(startTime)}</p>
          <p>退勤：{formatTime(endTime)}</p>
        </div>

        {status === "未出勤" && (
          <button className="btn btn-primary w-100 mb-2" onClick={handleStart}>
            出勤する
          </button>
        )}

        {status === "出勤中" && (
          <button className="btn btn-danger w-100 mb-2" onClick={handleEnd}>
            退勤する
          </button>
        )}

        {status === "退勤済み" && (
          <div className="alert alert-success text-center" role="alert">
            お疲れさまでした！
          </div>
        )}
      </div>

      <TimeReportPage
        userId={userId}
        attendanceData={attendanceData}
        setAttendanceData={setAttendanceData}
      />
    </>
  );
};

export default TimecardPage;
