import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("❌ ユーザー取得失敗", err));
  }, []);

  return (
    <div className="container mt-5 text-center">
      <h2 className="mb-4">勤怠管理システム</h2>
      <h5 className="mb-3">出勤する人を選んでください：</h5>
      <div className="d-grid gap-3 col-6 mx-auto">
        {users.map((user) => (
          <button
            key={user.id}
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/timecard?user_id=${user.id}`)}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
