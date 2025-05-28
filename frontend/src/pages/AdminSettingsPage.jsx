import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const AdminSettingsPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClosingPeriod = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/settings/closing-period`);
        setStartDate(res.data.closing_start_date ?? "");
        setEndDate(res.data.closing_end_date ?? "");
      } catch (err) {
        console.error("❌ 締め期間取得エラー", err);
        setMessage("締め期間の取得に失敗しました");
      }
    };
    fetchClosingPeriod();
  }, []);

  const handleSave = async () => {
    if (!startDate || !endDate) {
      alert("開始日と終了日を入力してください");
      return;
    }
    if (startDate >= endDate) {
      alert("終了日は開始日より後にしてください");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      await axios.post(`${API_BASE}/api/settings/closing-period`, {
        closing_start_date: startDate,
        closing_end_date: endDate,
      });
      setMessage("✅ 締め期間を保存しました");
    } catch (err) {
      console.error("❌ 保存エラー", err);
      setMessage("❌ 保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h3 className="mb-4">締め期間の設定</h3>

      <label className="form-label">締め開始日（YYYY-MM-DD）</label>
      <input
        type="date"
        className="form-control mb-3"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <label className="form-label">締め終了日（YYYY-MM-DD）</label>
      <input
        type="date"
        className="form-control mb-4"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
      />

      <button
        className="btn btn-primary w-100"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "保存中..." : "保存する"}
      </button>

      {message && <div className="alert alert-info mt-3">{message}</div>}
    </div>
  );
};

export default AdminSettingsPage;
