import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ✅ APIベースURL（環境に応じて切り替え）
const API_BASE = import.meta.env.VITE_API_BASE || "";

const HomePage = ({ setUserId, setIsAdmin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => {
        console.error("❌ ユーザー取得失敗", err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUserClick = (user) => {
    if (setUserId) setUserId(user.id);
    if (setIsAdmin) setIsAdmin(user.is_admin);
    navigate(`/timecard?user_id=${user.id}`);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <p className="text-muted">ユーザーを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card shadow-sm mt-5 mx-auto p-4"
      style={{
        maxWidth: 400,
        backgroundColor: "#f0f8ff",
        fontFamily: "Courier New, monospace",
        border: "2px solid #007bff",
      }}
    >
      <h2
        className="text-center mb-3 fw-bold text-dark"
        style={{ fontSize: 20 }}
      >
        Timecard
      </h2>
      <h6 className="text-center text-muted mb-4" style={{ fontSize: 14 }}>
        出勤する人を選んでください：
      </h6>

      <div className="d-grid gap-3">
        {users.length === 0 ? (
          <p className="text-center text-danger">ユーザーが見つかりません</p>
        ) : (
          users.map((user) => (
            <button
              key={user.id}
              className="btn btn-primary btn-lg fw-bold"
              style={{
                fontFamily: "Courier New, monospace",
                borderRadius: 6,
                padding: "10px 0",
                fontSize: 16,
              }}
              onClick={() => handleUserClick(user)}
            >
              {user.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default HomePage;
