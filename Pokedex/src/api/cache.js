
const pendingRequests = new Map();

export async function onceADay(key, loader) {
  const today = new Date().toDateString();

  try {
    const saved = JSON.parse(
      localStorage.getItem(key) || "null"
    );

    if (
      saved?.date === today &&
      Array.isArray(saved.data)
    ) {
      return saved.data;
    }
  } catch {
    // ถ้าอ่าน cache ไม่ได้ ให้โหลดจาก API
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
      // ถ้าบันทึกไม่ได้ ก็ยังแสดงข้อมูลได้
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
    // กรณี localStorage ไม่พร้อมใช้งาน
  }
}
