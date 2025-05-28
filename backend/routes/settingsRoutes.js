const express = require("express");
const router = express.Router();
const SettingsStore = require("../stores/settingsStore");

// 締め期間（開始日と終了日）を取得
router.get("/closing-period", async (req, res) => {
  try {
    const start = await SettingsStore.get("closing_start_date");
    const end = await SettingsStore.get("closing_end_date");
    res.json({
      closing_start_date: start || null,
      closing_end_date: end || null,
    });
  } catch (err) {
    console.error("❌ 締め期間取得エラー:", err);
    res.status(500).send("Server error");
  }
});

// 締め期間（開始日と終了日）を保存
router.post("/closing-period", async (req, res) => {
  try {
    const { closing_start_date, closing_end_date } = req.body;

    if (
      !closing_start_date ||
      !closing_end_date ||
      closing_start_date.length !== 10 ||
      closing_end_date.length !== 10
    ) {
      return res.status(400).send("開始日・終了日が不正です");
    }

    await SettingsStore.set("closing_start_date", closing_start_date);
    await SettingsStore.set("closing_end_date", closing_end_date);

    res.send("✅ 締め期間を保存しました");
  } catch (err) {
    console.error("❌ 締め期間保存エラー:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
