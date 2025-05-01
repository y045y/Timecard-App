import React, { useState, useEffect } from "react";
import axios from "axios";

const TimecardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [status, setStatus] = useState("未出勤");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // JST補正（Date → "yyyy-mm-dd"）
  const getJSTDateString = (date) => {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return jst.toISOString().split("T")[0];
  };

  // JST補正（Date → "HH:mm"）
  const getJSTTimeString = (date) => {
    const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const h = String(jst.getHours()).padStart(2, "0");
    const m = String(jst.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleStart = async () => {
    if (status === "未出勤") {
      const now = new Date();
      setStartTime(now);
      setStatus("出勤中");

      const dateStr = getJSTDateString(now);
      const timeStr = getJSTTimeString(now);

      try {
        await axios.post(
          "http://localhost:5000/api/attendance-records/punch-in",
          {
            user_id: 1,
            attendance_date: dateStr,
            start_time: timeStr,
          }
        );
      } catch (err) {
        console.error("❌ 出勤登録失敗:", err);
        alert("出勤打刻に失敗しました");
      }
    }
  };

  const handleEnd = async () => {
    if (status === "出勤中") {
      const now = new Date();
      setEndTime(now);
      setStatus("退勤済み");

      const dateStr = getJSTDateString(now);
      const timeStr = getJSTTimeString(now);

      try {
        await axios.put(
          "http://localhost:5000/api/attendance-records/punch-out",
          {
            user_id: 1,
            attendance_date: dateStr,
            end_time: timeStr,
          }
        );
      } catch (err) {
        console.error("❌ 退勤登録失敗:", err);
        alert("退勤打刻に失敗しました");
      }
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
    <div
      className="card p-4 shadow-sm mb-5"
      style={{ maxWidth: "400px", margin: "auto" }}
    >
      <h5 className="text-center mb-3">
        {currentTime.toLocaleString("ja-JP")}
      </h5>
      <h6 className="text-center mb-4">佐脇 良尚 さん</h6>

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
  );
};

export default TimecardPage;
