import React, { useMemo } from "react";

import { format } from "date-fns";
import { isHoliday } from "@holiday-jp/holiday_jp";

const DailyRow = React.memo(({ row, index, handleChange, firstRowRef }) => {
  const weekday = new Date(row.date).getDay();
  let backgroundColor = "inherit";
  if (isHoliday(new Date(row.date))) backgroundColor = "#ffe5e5";
  else if (weekday === 0) backgroundColor = "#ffe5e5";
  else if (weekday === 6) backgroundColor = "#e5f1ff";

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

  return (
    <>
      <tr ref={index === 0 ? firstRowRef : null}>
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
          {row.startTime || "--:--"}
        </td>
        <td
          style={{
            backgroundColor,
            ...tableCellStyle,
            fontFamily: "Courier New",
          }}
        >
          {row.endTime || "--:--"}
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
          />
        </td>
      </tr>
    </>
  );
});

export default DailyRow;
