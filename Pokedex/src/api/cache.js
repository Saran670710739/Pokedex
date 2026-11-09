
const pendingRequests = new Map();

export async function onceADay(key, loader) {
  const today = new Date().toDateString();

  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");

    if (
      saved &&
      saved.date === today &&
      Object.prototype.hasOwnProperty.call(saved, "data")
    ) {
      return saved.data;
    }
  } catch {
    // localStorage อาจใช้งานไม่ได้ หรือข้อมูลเสีย
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const request = (async () => {
    const data = await loader();

    try {
      localStorage.setItem(
        key,
        JSON.stringify({ date: today, data })
      );
    } catch {
      // ยังใช้ข้อมูลจาก API ได้ แม้บันทึก cache ไม่สำเร็จ
    }

    return data;
  })();

  pendingRequests.set(key, request);

  try {
    return await request;
  } finally {
    pendingRequests.delete(key);
  }
}

export function forget(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // การลบ cache ไม่ควรทำให้แอปพัง
  }
}
