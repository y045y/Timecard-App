/**
 * "08:30" や "8:5:0" → Date("1970-01-01T08:30:00.000Z")
 * SQL Server の TIME 型に渡してもズレない UTC Date オブジェクトに変換
 */
export function toSQLTimeDate(timeStr) {
  if (timeStr instanceof Date) return timeStr;

  if (typeof timeStr !== "string") {
    console.error("⚠️ timeStr が無効:", timeStr);
    throw new Error(
      "時間は 'HH:mm' または 'HH:mm:ss' の文字列で渡してください"
    );
  }

  const parts = timeStr.trim().split(":");
  const [h, m, s = "0"] = parts;

  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  const second = parseInt(s, 10);

  if ([hour, minute, second].some((n) => isNaN(n))) {
    console.error("⚠️ 時間フォーマット不正:", { h, m, s });
    throw new Error(`時間フォーマットが不正です: ${timeStr}`);
  }

  // ✅ SQL Server の TIME 型と一致する UTC の Date オブジェクトを返す
  return new Date(Date.UTC(1970, 0, 1, hour, minute, second));
}

/**
 * Date または ISO文字列 から YYYY-MM-DD を返す（JSTローカル）
 */
export const getJSTDateString = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date); // ISO文字列も対応
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Date または ISO文字列から HH:mm を返す
 * SQL Server からの "1970-01-01T15:47:00.000Z" に対応
 */
export const getJSTTimeString = (input) => {
  let date;
  let isUTC = false;

  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    isUTC = input.endsWith("Z");
    date = new Date(input);
  } else {
    throw new Error("引数は Date または ISO文字列である必要があります");
  }

  const h = String(isUTC ? date.getUTCHours() : date.getHours()).padStart(
    2,
    "0"
  );
  const m = String(isUTC ? date.getUTCMinutes() : date.getMinutes()).padStart(
    2,
    "0"
  );

  return `${h}:${m}`;
};
