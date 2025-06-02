import React, { useMemo } from "react";

import { format } from "date-fns";
import { isHoliday } from "@holiday-jp/holiday_jp";

const DailyRow = React.memo(
  ({ row, index, handleChange, firstRowRef, refProp, rowRef, highlight }) => {
    const date = new Date(row.date);
    const weekday = date.getDay();

    // ✅ 土日祝をベースに色分け（default: inherit）
    let baseColor = "inherit";
    if (isHoliday(date) || weekday === 0) {
      baseColor = "#ffe5e5"; // 祝日または日曜 → 薄赤
    } else if (weekday === 6) {
      baseColor = "#e5f1ff"; // 土曜 → 薄青
    }

    // ✅ 今日の行は薄黄色で上書き
    const backgroundColor = highlight ? "#fff9c4" : baseColor;

    const formatDateWithWeekday = (date) => {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
      const weekday = weekdays[d.getDay()];
      return `${month}/${day} (${weekday})`;
    };

    console.log(format(new Date(), "yyyy-MM-dd"));

    const tableCellStyle = useMemo(
      () => ({
        padding: "2px 4px",
        verticalAlign: "middle",
      }),
      []
    );

    const compactSelectStyle = useMemo(
      () => ({
        fontWeight: "bold",
        width: "70px",
        height: "28px",
        fontSize: "12px",
        padding: "2px 4px",
        margin: "0 auto",
      }),
      []
    );

    const freeInputStyle = useMemo(
      () => ({
        backgroundColor: "#fff9c4",
        border: "2px solid #007bff",
        fontSize: "12px",
        fontWeight: "bold",
        height: "24px",
        padding: "2px 4px",
      }),
      []
    );
    const formatTime = (value) => {
      if (!value) return "--:--";

      // ISO文字列ならDate変換 → JST補正
      if (typeof value === "string") {
        if (value.includes("T")) {
          const date = new Date(value);
          const h = String(date.getHours()).padStart(2, "0");
          const m = String(date.getMinutes()).padStart(2, "0");
          return `${h}:${m}`;
        }
        return value.slice(0, 5); // "08:30" や "08:30:00"
      }

      // それ以外（Date型など）
      if (value instanceof Date) {
        const h = String(value.getHours()).padStart(2, "0");
        const m = String(value.getMinutes()).padStart(2, "0");
        return `${h}:${m}`;
      }

      return "--:--";
    };

    return (
      <>
        <tr
          ref={rowRef || (index === 0 ? firstRowRef : null)}
          style={{ backgroundColor }}
        >
          <td style={{ backgroundColor, ...tableCellStyle }}>
            {formatDateWithWeekday(row.date)}
          </td>
          <td
            style={{
              backgroundColor,
              ...tableCellStyle,
              fontFamily: "Courier New",
            }}
          >
            {formatTime(row.startTime)}
          </td>
          <td
            style={{
              backgroundColor,
              ...tableCellStyle,
              fontFamily: "Courier New",
            }}
          >
            {formatTime(row.endTime)}
          </td>
          <td style={{ backgroundColor, ...tableCellStyle }}>
            <select
              className="form-select text-center"
              style={compactSelectStyle}
              value={row.overtime}
              onChange={(e) => handleChange(index, "overtime", e.target.value)}
            >
              {[...Array(21)].map((_, i) => {
                const value = (i * 0.5).toFixed(1);
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                );
              })}
            </select>
          </td>
          <td style={{ backgroundColor, ...tableCellStyle }}>
            <select
              className="form-select text-center"
              style={compactSelectStyle}
              value={row.paidLeave || "0.0"}
              onChange={(e) => handleChange(index, "paidLeave", e.target.value)}
            >
              {["", "0.5", "1.0"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </td>
        </tr>
        <tr>
          <td colSpan="5" style={{ backgroundColor, ...tableCellStyle }}>
            <input
              type="text"
              className="form-control"
              style={{ ...freeInputStyle, width: "100%" }}
              placeholder="備考を入力"
              value={row.note}
              onChange={(e) => handleChange(index, "note", e.target.value)}
              ref={refProp} // ← ✅ ここを追加！
            />
          </td>
        </tr>
      </>
    );
  }
);

export default DailyRow;
