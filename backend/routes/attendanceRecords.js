// routes/attendanceRecords.js

const express = require("express");
const router = express.Router();
const AttendanceRecordStore = require("../stores/attendanceRecordStore");

// GET: 全件取得
router.get("/", async (req, res) => {
  try {
    const records = await AttendanceRecordStore.getAll();
    res.json(records);
  } catch (err) {
    console.error("❌ Failed to fetch attendance records:", err);
    res.status(500).send("Server error");
  }
});

// POST: 勤怠レコード追加
router.post("/", async (req, res) => {
  try {
    await AttendanceRecordStore.insert(req.body);
    res.status(201).send("Attendance record created");
  } catch (err) {
    console.error("❌ Failed to insert attendance record:", err);
    res.status(500).send("Server error");
  }
});

// DELETE: 勤怠レコード削除
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await AttendanceRecordStore.delete(id);
    res.send("Attendance record deleted");
  } catch (err) {
    console.error("❌ Failed to delete attendance record:", err);
    res.status(500).send("Server error");
  }
});

// PUT: 勤怠レコード更新
router.put("/:id", async (req, res) => {
  try {
    const record = {
      id: parseInt(req.params.id, 10),
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      overtime_hours: req.body.overtime_hours,
      paid_leave_days: req.body.paid_leave_days,
      holiday_work_count: req.body.holiday_work_count,
      holiday_work_hours: req.body.holiday_work_hours, // ★ ← これが抜けてた
      late_count: req.body.late_count,
      late_hours: req.body.late_hours, // ★ ← これも抜けてた
      early_leave_count: req.body.early_leave_count,
      early_leave_hours: req.body.early_leave_hours, // ★ ← これも抜けてた
      note: req.body.note,
    };
    await AttendanceRecordStore.update(record);
    res.send("✅ 勤怠情報 更新完了");
  } catch (err) {
    console.error("❌ 勤怠情報 更新失敗:", err);
    res.status(500).send("サーバーエラー");
  }
});

module.exports = router;
