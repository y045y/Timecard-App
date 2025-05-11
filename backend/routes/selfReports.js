const express = require("express");
const router = express.Router();
const SelfReportStore = require("../stores/selfReportStore");

// GET: 自己申告データ 全件取得
// GET: 全件 or クエリ指定で1件返す
router.get("/", async (req, res) => {
  try {
    const { user_id, month } = req.query;

    // クエリが指定されている場合は 1件検索
    if (user_id && month) {
      const record = await SelfReportStore.findByUserAndMonth(
        parseInt(user_id),
        month
      );
      return res.json(record || {});
    }

    // 指定がなければ全件返す
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
    const { user_id, report_month } = req.body;

    const existing = await SelfReportStore.findByUserAndMonth(
      user_id,
      report_month
    );

    if (existing) {
      req.body.id = existing.id; // IDを設定して更新モードに
      await SelfReportStore.update(req.body);
      return res.send("✅ Self-report updated");
    } else {
      await SelfReportStore.insert(req.body);
      return res.send("✅ Self-report inserted");
    }
  } catch (err) {
    console.error("❌ self-report error:", err);
    res.status(500).send("Server error");
  }
});

// PUT: 自己申告データ更新
router.put("/:id", async (req, res) => {
  try {
    const report = {
      id: parseInt(req.params.id, 10),
      holiday_work_count: parseFloat(req.body.holiday_work_count) || 0,
      holiday_work_hours: parseFloat(req.body.holiday_work_hours) || 0,
      late_count: parseFloat(req.body.late_count) || 0,
      late_hours: parseFloat(req.body.late_hours) || 0,
      early_leave_count: parseFloat(req.body.early_leave_count) || 0,
      early_leave_hours: parseFloat(req.body.early_leave_hours) || 0,
      total_overtime_hours: parseFloat(req.body.total_overtime_hours) || 0,
      total_paid_leave_days: parseFloat(req.body.total_paid_leave_days) || 0,
      note: req.body.note || "",
    };

    await SelfReportStore.update(report);
    res.status(200).send("✅ Self report updated");
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
