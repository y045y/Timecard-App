// backend/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();
const AttendanceRecordStore = require("../stores/attendanceRecordStore");
const AttendanceStore = require("../stores/attendanceStore");

// ===== 1. 打刻系ルート =====

router.post("/punch-in", async (req, res) => {
  try {
    const { user_id, attendance_date, start_time } = req.body;
    console.log("📅 punch-in req.body:", req.body);

    await AttendanceStore.punchIn({
      userId: user_id,
      attendanceDate: attendance_date,
      startTime: start_time, // 文字列で渡す
    });

    res.send("✅ 出勤記録しました");
  } catch (err) {
    console.error("❌ 出勤登録エラー:", err);
    res.status(500).send("出勤登録に失敗しました");
  }
});

router.put("/punch-out", async (req, res) => {
  try {
    const { user_id, attendance_date, end_time } = req.body;
    console.log("📅 退勤 req.body:", req.body);

    await AttendanceStore.punchOut({
      userId: user_id,
      attendanceDate: attendance_date,
      endTime: end_time, // 文字列で渡す
    });

    res.send("✅ 退勤記録しました");
  } catch (err) {
    console.error("❌ 退勤登録エラー:", err);
    res.status(500).send("退勤登録に失敗しました");
  }
});
router.put("/update-all", async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).send("Invalid request format");
    }

    await AttendanceStore.bulkUpdate(updates);
    res.send("✅ All records updated via bulk SP");
  } catch (err) {
    console.error("❌ Bulk update error:", err);
    res.status(500).send("Server error");
  }
});

// ===== 2. 通常の勤怠管理API =====

router.get("/", async (req, res) => {
  try {
    const { user_id } = req.query;

    if (user_id) {
      const records = await AttendanceRecordStore.getByUserId(
        parseInt(user_id)
      );
      res.json(records);
    } else {
      const records = await AttendanceRecordStore.getAll();
      res.json(records);
    }
  } catch (err) {
    console.error("❌ 勤怠データ取得失敗:", err);
    res.status(500).send("Server error");
  }
});

router.post("/record", async (req, res) => {
  try {
    await AttendanceRecordStore.insert(req.body);
    res.status(201).send("Attendance record created");
  } catch (err) {
    console.error("❌ 勤怠レコード登録失敗:", err);
    res.status(500).send("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await AttendanceRecordStore.delete(id);
    res.send("Attendance record deleted");
  } catch (err) {
    console.error("❌ 勤怠レコード削除失敗:", err);
    res.status(500).send("Server error");
  }
});

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

module.exports = router;
