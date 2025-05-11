// server.js

const express = require("express");
const cors = require("cors");
const { poolPromise } = require("./config/db"); // ★ここに追加
const attendanceRoutes = require("./routes/attendanceRecords");
const selfReportRoutes = require("./routes/selfReports");
const userRoutes = require("./routes/users");
const timeReportRoutes = require("./routes/timeReports");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const PORT = 5000;
app.use(cors());

// ミドルウェア
app.use(express.json()); // JSONを扱えるようにする
app.use(express.urlencoded({ extended: true })); // URLエンコードされたデータを扱う

// テスト用ルート
app.get("/", (req, res) => {
  res.send("Hello World from Express!");
});

app.use("/api/attendance-records", attendanceRoutes);

// ★自己申告ルート追加
app.use("/api/self-reports", selfReportRoutes);

app.use("/api/users", userRoutes);

app.use("/api/time-reports", timeReportRoutes);

app.use("/api/settings", settingsRoutes);

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
