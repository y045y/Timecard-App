const express = require("express");
const router = express.Router();
const SettingsStore = require("../stores/settingsStore");

// 締め開始日を取得
router.get("/closing-day", async (req, res) => {
  try {
    const value = await SettingsStore.get("closing_start_day");
    const intValue = parseInt(value, 10);
    res.json({ closing_start_day: isNaN(intValue) ? 26 : intValue });
  } catch (err) {
    console.error("❌ 締め日取得エラー:", err);
    res.status(500).send("Server error");
  }
});

// 締め開始日を更新
router.post("/closing-day", async (req, res) => {
  try {
    const { closing_start_day } = req.body;
    const day = parseInt(closing_start_day, 10);

    if (!day || day < 1 || day > 31) {
      return res.status(400).send("Invalid closing_start_day");
    }

    await SettingsStore.set("closing_start_day", day.toString());
    res.send("✅ 締め開始日を更新しました");
  } catch (err) {
    console.error("❌ 締め日更新エラー:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
