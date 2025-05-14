import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const HomePage = ({ setUserId, setIsAdmin }) => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("❌ ユーザー取得失敗", err));
  }, []);

  const handleUserClick = (user) => {
    if (setUserId) setUserId(user.id);
    if (setIsAdmin) setIsAdmin(user.is_admin);
    navigate(`/timecard?user_id=${user.id}`);
  };

  return (
    <div
      className="card shadow-sm mt-5"
      style={{
        maxWidth: 400,
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f0f8ff",
        fontFamily: "Courier New, monospace",
        border: "2px solid #007bff",
      }}
    >
      <h2
        className="text-center mb-3"
        style={{ fontSize: "20px", fontWeight: "bold", color: "#000" }}
      >
        勤怠管理システム
      </h2>
      <h6 className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>
        出勤する人を選んでください：
      </h6>
      <div className="d-grid gap-3">
        {users.map((user) => (
          <button
            key={user.id}
            className="btn btn-primary btn-lg"
            style={{
              fontFamily: "Courier New, monospace",
              borderRadius: "6px",
              padding: "10px 0",
              fontWeight: "bold",
              fontSize: "16px",
            }}
            onClick={() => handleUserClick(user)}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
