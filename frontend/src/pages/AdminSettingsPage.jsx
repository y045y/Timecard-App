import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminSettingsPage = () => {
  const [closingDay, setClosingDay] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchClosingDay = async () => {
      try {
        const res = await axios.get("/api/settings/closing-day");
        setClosingDay(res.data.closing_start_day);
      } catch (err) {
        console.error("❌ 締め日取得エラー", err);
        setMessage("締め日の取得に失敗しました");
      }
    };
    fetchClosingDay();
  }, []);

  const handleSave = async () => {
    if (closingDay < 1 || closingDay > 31) {
      alert("1〜31の範囲で指定してください");
      return;
    }
    setIsSaving(true);
    setMessage("");
    try {
      await axios.post("http://localhost:5000/api/settings/closing-day", {
        closing_start_day: closingDay,
      });
      setMessage("✅ 締め日を保存しました");

      // ✅ 保存完了後に画面を即リロード
      window.location.reload();
    } catch (err) {
      console.error("❌ 保存エラー", err);
      setMessage("❌ 保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 500 }}>
      <h3 className="mb-4">締め開始日の設定</h3>
      <label className="form-label">
        締め開始日（例：26 → 26日〜翌月25日）
      </label>
      <input
        type="number"
        className="form-control mb-3"
        value={closingDay ?? ""} // ← nullのときだけ空文字を使う
        min={1}
        max={31}
        onChange={(e) => setClosingDay(parseInt(e.target.value, 10) || 0)}
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
