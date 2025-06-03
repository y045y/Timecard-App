require("dotenv").config(); // 必要に応じて

const express = require("express");
const cors = require("cors");
const path = require("path");
const { poolPromise } = require("./config/db");

const attendanceRoutes = require("./routes/attendanceRecords");
const selfReportRoutes = require("./routes/selfReports");
const userRoutes = require("./routes/users");
const timeReportRoutes = require("./routes/timeReports");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const healthRoutes = require("./routes/health");
const PORT = process.env.PORT || 5000;

// ✅ ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ APIルート（/api/...）
app.use("/api/attendance-records", attendanceRoutes);
app.use("/api/self-reports", selfReportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/time-reports", timeReportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", healthRoutes);

// ✅ 静的ファイル（React dist を backend 内に含める構成）
const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");

console.log("📦 distPath:", distPath);
console.log("📄 indexPath:", indexPath);

app.use(express.static(distPath));

// ✅ SPAルーティング：API 以外は index.html
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(indexPath);
});

// ✅ サーバー起動
app.listen(PORT, () => {
  console.log(`✅ DB_SERVER: ${process.env.DB_HOST || "localhost"}`);
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
