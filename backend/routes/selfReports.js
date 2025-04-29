// routes/selfReports.js

const express = require("express");
const router = express.Router();
const SelfReportStore = require("../stores/selfReportStore");

// GET: 自己申告データ 全件取得
router.get("/", async (req, res) => {
  try {
    const reports = await SelfReportStore.getAll();
    res.json(reports);
  } catch (err) {
    console.error("❌ Failed to fetch self-reports:", err);
    res.status(500).send("Server error");
  }
});

// POST: 自己申告データ追加
router.post("/", async (req, res) => {
  try {
    await SelfReportStore.insert(req.body);
    res.status(201).send("Self report created");
  } catch (err) {
    console.error("❌ Failed to insert self report:", err);
    res.status(500).send("Server error");
  }
});

// PUT: 自己申告データ更新
router.put("/:id", async (req, res) => {
  try {
    const report = {
      id: parseInt(req.params.id, 10),
      overtime_hours: req.body.overtime_hours,
      paid_leave_days: req.body.paid_leave_days,
      holiday_work_count: req.body.holiday_work_count,
      holiday_work_hours: req.body.holiday_work_hours, // ★ 追加
      late_count: req.body.late_count,
      late_hours: req.body.late_hours, // ★ 追加
      early_leave_count: req.body.early_leave_count,
      early_leave_hours: req.body.early_leave_hours, // ★ 追加
      note: req.body.note,
    };
    await SelfReportStore.update(report);
    res.send("✅ Self report updated");
  } catch (err) {
    console.error("❌ Failed to update self report:", err);
    res.status(500).send("Server error");
  }
});

// DELETE: 自己申告データ削除
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await SelfReportStore.delete(id);
    res.send("✅ Self report deleted");
  } catch (err) {
    console.error("❌ Failed to delete self report:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
