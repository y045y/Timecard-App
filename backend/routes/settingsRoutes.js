const express = require("express");
const router = express.Router();
const SettingsStore = require("../stores/settingsStore");

// 締め開始日を取得
router.get("/closing-day", async (req, res) => {
  try {
    const value = await SettingsStore.get("closing_start_day");
    res.json({ closing_start_day: parseInt(value, 10) || 26 });
  } catch (err) {
    console.error("❌ 締め日取得エラー:", err);
    res.status(500).send("Server error");
  }
});

// 締め開始日を更新
router.post("/closing-day", async (req, res) => {
  try {
    const { closing_start_day } = req.body;
    if (!closing_start_day || closing_start_day < 1 || closing_start_day > 31) {
      return res.status(400).send("Invalid closing_start_day");
    }
    await SettingsStore.set("closing_start_day", closing_start_day.toString());
    res.send("✅ 締め開始日を更新しました");
  } catch (err) {
    console.error("❌ 締め日更新エラー:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
