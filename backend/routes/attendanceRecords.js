const express = require("express");
const router = express.Router();
const AttendanceRecordStore = require("../stores/attendanceRecordStore");
const AttendanceStore = require("../stores/attendanceStore");

// HH:mm → Date("1970-01-01T08:30:00")
const parseTimeToDateObject = (timeStr) => {
  if (typeof timeStr !== "string") {
    console.error("⚠️ 無効な timeStr:", timeStr);
    throw new Error("timeStr must be a string like '08:30'");
  }

  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);

  if (isNaN(hour) || isNaN(minute)) {
    console.error("⚠️ 数値変換エラー:", h, m);
    throw new Error("Invalid hour or minute");
  }

  return new Date(Date.UTC(1970, 0, 1, hour, minute));
};

// ===== 1. 打刻系ルート =====

// POST: 出勤登録（打刻）
router.post("/punch-in", async (req, res) => {
  try {
    const { user_id, attendance_date, start_time } = req.body;

    console.log("📥 出勤打刻リクエスト:", req.body);

    await AttendanceStore.punchIn({
      userId: user_id,
      attendanceDate: attendance_date,
      startTime: parseTimeToDateObject(start_time), // "08:30" → Date
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

    console.log("📥 退勤打刻リクエスト:", req.body);

    await AttendanceStore.punchOut({
      userId: user_id,
      attendanceDate: attendance_date,
      endTime: parseTimeToDateObject(end_time), // "18:00" → Date
    });

    res.send("✅ 退勤記録しました");
  } catch (err) {
    console.error("❌ 退勤登録エラー:", err);
    res.status(500).send("退勤登録に失敗しました");
  }
});

// ===== 2. 通常の勤怠管理API =====

// GET: 全件取得
router.get("/", async (req, res) => {
  try {
    const records = await AttendanceRecordStore.getAll();
    res.json(records);
  } catch (err) {
    console.error("❌ 勤怠データ取得失敗:", err);
    res.status(500).send("Server error");
  }
});

// POST: 勤怠レコード追加（明細登録）
router.post("/record", async (req, res) => {
  try {
    await AttendanceRecordStore.insert(req.body);
    res.status(201).send("Attendance record created");
  } catch (err) {
    console.error("❌ 勤怠レコード登録失敗:", err);
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
    console.error("❌ 勤怠レコード削除失敗:", err);
    res.status(500).send("Server error");
  }
});

// PUT: 勤怠レコード更新（明細）
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
