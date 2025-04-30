const express = require("express");
const router = express.Router();
const AttendanceRecordStore = require("../stores/attendanceRecordStore");
const AttendanceStore = require("../stores/attendanceStore");

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

// POST: 勤怠レコード追加（明細登録）
router.post("/record", async (req, res) => {
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

// PUT: 勤怠レコード更新（明細のみ）
router.put("/:id", async (req, res) => {
  try {
    const record = {
      id: parseInt(req.params.id, 10),
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      overtime_hours: req.body.overtime_hours,
      paid_leave_days: req.body.paid_leave_days,
      note: req.body.note,
    };
    await AttendanceRecordStore.update(record);
    res.send("✅ 勤怠情報（明細）更新完了");
  } catch (err) {
    console.error("❌ 勤怠情報（明細）更新失敗:", err);
    res.status(500).send("サーバーエラー");
  }
});

// POST: 出勤登録（打刻）
router.post("/punch-in", async (req, res) => {
  try {
    const { user_id, attendance_date, start_time } = req.body;
    await AttendanceStore.punchIn({
      userId: user_id,
      attendanceDate: attendance_date,
      startTime: start_time,
    });
    res.send("✅ 出勤記録しました");
  } catch (err) {
    console.error("❌ 出勤登録エラー:", err);
    res.status(500).send("出勤登録に失敗しました");
  }
});

// PUT: 退勤登録（打刻）
router.put("/punch-out", async (req, res) => {
  try {
    const { user_id, attendance_date, end_time } = req.body;
    await AttendanceStore.punchOut({
      userId: user_id,
      attendanceDate: attendance_date,
      endTime: end_time,
    });
    res.send("✅ 退勤記録しました");
  } catch (err) {
    console.error("❌ 退勤登録エラー:", err);
    res.status(500).send("退勤登録に失敗しました");
  }
});

module.exports = router;
