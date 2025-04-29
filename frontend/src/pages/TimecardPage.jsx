import React, { useState, useEffect } from "react";

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

  const handleStart = () => {
    if (status === "未出勤") {
      setStartTime(new Date());
      setStatus("出勤中");
    }
  };

  const handleEnd = () => {
    if (status === "出勤中") {
      setEndTime(new Date());
      setStatus("退勤済み");
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
      <h5 className="text-center mb-3">{currentTime.toLocaleString()}</h5>

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
