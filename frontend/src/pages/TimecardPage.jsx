import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getJSTDateString, getJSTTimeString } from "../utils/timeFormatter";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const TimecardPage = () => {
  const [searchParams] = useSearchParams();
  const userId = parseInt(searchParams.get("user_id"), 10);
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [status, setStatus] = useState("未出勤");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, attendanceRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users`),
          axios.get(`${API_BASE}/api/attendance-records?user_id=${userId}`),
        ]);

        const user = usersRes.data.find((u) => u.id === userId);
        setUserName(user?.name || `ユーザーID: ${userId}`);

        const todayStr = getJSTDateString(new Date());
        const todayRecord = attendanceRes.data.find((r) =>
          r.attendance_date?.startsWith(todayStr)
        );

        if (todayRecord?.start_time && todayRecord?.end_time) {
          setStatus("退勤済み");
          setStartTime(
            new Date(`1970-01-01T${todayRecord.start_time}:00+09:00`)
          );
          setEndTime(new Date(`1970-01-01T${todayRecord.end_time}:00+09:00`));
        } else if (todayRecord?.start_time) {
          setStatus("出勤中");
          setStartTime(
            new Date(`1970-01-01T${todayRecord.start_time}:00+09:00`)
          );
        }
      } catch (err) {
        console.error("❌ データ取得失敗:", err);
        setUserName(`ユーザーID: ${userId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleStart = useCallback(async () => {
    if (status !== "未出勤") return;
    const now = new Date();
    const dateStr = getJSTDateString(now);
    const timeStr = getJSTTimeString(now);

    try {
      await axios.post(`${API_BASE}/api/attendance-records/punch-in`, {
        user_id: userId,
        attendance_date: dateStr,
        start_time: timeStr,
      });
      setStartTime(now);
      setStatus("出勤中");
    } catch (err) {
      console.error("❌ 出勤打刻失敗:", err);
      alert("出勤打刻に失敗しました");
    }
  }, [status, userId]);

  const handleEnd = useCallback(async () => {
    if (status !== "出勤中") return;
    const now = new Date();
    const dateStr = getJSTDateString(now);
    const timeStr = getJSTTimeString(now);

    try {
      await axios.put(`${API_BASE}/api/attendance-records/punch-out`, {
        user_id: userId,
        attendance_date: dateStr,
        end_time: timeStr,
      });
      setEndTime(now);
      setStatus("退勤済み");
    } catch (err) {
      console.error("❌ 退勤打刻失敗:", err);
      alert("退勤打刻に失敗しました");
    }
  }, [status, userId]);

  const formatTime = (time) => {
    if (!time) return "--:--:--";
    const h = String(time.getHours()).padStart(2, "0");
    const m = String(time.getMinutes()).padStart(2, "0");
    const s = String(time.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  if (!userId || isNaN(userId)) {
    return (
      <div className="alert alert-danger mt-5 text-center">
        ❌ user_idが無効です
      </div>
    );
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="card shadow-sm mb-4"
        style={{
          maxWidth: 360,
          margin: "0 auto",
          padding: 16,
          backgroundColor: "#f0f8ff",
          fontFamily: "Courier New",
          border: "2px solid #007bff",
        }}
      >
        <h5 className="text-center fw-bold mb-2" style={{ fontSize: "16px" }}>
          {currentTime.toLocaleString("ja-JP")}
        </h5>
        <h6 className="text-center text-dark mb-3" style={{ fontSize: "14px" }}>
          {userName}
        </h6>

        <table
          className="table table-bordered text-center mb-3"
          style={{ fontSize: "16px" }}
        >
          <thead className="table-light">
            <tr>
              <th style={{ width: "50%" }}>出勤</th>
              <th style={{ width: "50%" }}>退勤</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatTime(startTime)}</td>
              <td>{formatTime(endTime)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-3 d-grid gap-2">
          {status === "未出勤" && (
            <button className="btn btn-primary" onClick={handleStart}>
              出勤する
            </button>
          )}
          {status === "出勤中" && (
            <button className="btn btn-danger" onClick={handleEnd}>
              退勤する
            </button>
          )}
          {status === "退勤済み" && (
            <div
              className="text-center mb-0"
              style={{
                backgroundColor: "#e9ecef",
                color: "#6c757d",
                padding: "10px",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              お疲れさまでした！
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/report?user_id=${userId}`)}
        >
          勤怠入力画面へ
        </button>
      </div>
    </>
  );
};

export default TimecardPage;
