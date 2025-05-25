const express = require("express");
const router = express.Router();
const TimeReportStore = require("../stores/timeReportStore");

// ===========================
// GET: 全員分の勤怠＋合計データ
// ===========================
// ✅ ※注意：このルートを先に定義すること！そうしないと path-to-regexp が誤作動してクラッシュします。
router.get("/", async (req, res) => {
  try {
    const { start, end } = req.query;
    const { attendanceRecords, summaryRecords } = await TimeReportStore.getAll(
      start,
      end
    );

    res.json({ attendanceRecords, summaryRecords });
  } catch (err) {
    console.error("❌ Failed to fetch all time reports:", err);
    res.status(500).send("Server error");
  }
});

// ================================
// GET: 個人単位の勤怠＋自己申告データ
// ================================
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;
    const reports = await TimeReportStore.getByUser(userId, start, end);
    res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch user's time reports:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
