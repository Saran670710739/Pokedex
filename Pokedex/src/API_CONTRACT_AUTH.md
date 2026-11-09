# PokémonHub — Draft Go Auth API Contract (ยังไม่ใช่ API ที่มีจริง)

นี่คือ **ข้อตกลงเสนอให้เพื่อนที่ทำ Go Backend** เพื่อให้ React เชื่อมได้ง่าย
ทุก URL ต่อท้าย `REACT_APP_BACKEND_URL` เช่น `https://api.example.com/api`
> อย่าเพิ่งใส่ค่า URL ตัวอย่างใน `.env` จนกว่า Go Server พร้อมใช้งาน

**รูปแบบ Auth ที่ Frontend ชุดนี้สมมติ:** HttpOnly session cookie, `credentials: "include"`.
ถ้าเพื่อนเลือก JWT/Bearer Token ต้องแก้ `src/api/backend.js` และ `AuthContext.jsx`
ก่อนใช้งานจริง ไม่ควรเก็บ token/password ลง localStorage โดยไม่ตกลงแนวทางความปลอดภัย

| Method | Path | Request | Expected response |
|---|---|---|---|
| GET | `/auth/me` | cookie | `{"user":{"id":1,"name":"...","email":"...","role":"member"}}` or 401 |
| POST | `/auth/register` | `{"name":"...","email":"...","password":"..."}` | 201 / success JSON |
| POST | `/auth/login` | `{"email":"...","password":"..."}` | 200 + Set-Cookie; frontend calls `/auth/me` next |
| POST | `/auth/logout` | cookie | 200/204; cookie cleared |
| PATCH | `/users/me` | `{"name":"...","email":"..."}` | updated `{user:{id,name,email,role}}` |
| PATCH | `/users/me/password` | `{"currentPassword":"...","newPassword":"..."}` | 200/204 |
| GET | `/admin/summary` | admin cookie | `{"totalUsers":42,"activeUsers":37,"totalAdmins":2}` |
| GET | `/admin/users` | admin cookie | `{"users":[{"id":1,"name":"...","email":"...","role":"member","status":"active"}]}` |

## Status
- 200/201/204 สำเร็จ
- 400 Validation error
- 401 Not authenticated
- 403 Not authorized / non-admin
- 409 Email already exists
- 500 Internal server error

Error JSON ตัวอย่าง: `{"message":"อีเมลหรือรหัสผ่านไม่ถูกต้อง"}`

## CORS / Cookies
- Go ต้องกำหนด allow-origin เป็น Vercel domain จริง ไม่ใช้ `*` หากเปิด credentials
- `Access-Control-Allow-Credentials: true` + OPTIONS preflight
- Cross-site cookie ควรตั้ง `HttpOnly; Secure; SameSite=None` ตามบริบท deployment
- เพิ่มการป้องกัน CSRF ที่ฝั่ง Go สำหรับการเปลี่ยนข้อมูลผ่าน cookie session
- Backend ต้องตรวจ session / role ด้วย middleware จริงทุก protected endpoint
- React ProtectedRoute ใช้สำหรับ UI เท่านั้น ไม่ใช่ระบบอนุญาตที่ปลอดภัยเพียงพอ

## Remarks
- API paths, JSON และวิธี Auth **ยังไม่ได้ยืนยันกับเพื่อน**
- ปรับเมื่อทีมตกลงกัน โดยแก้ไฟล์เดียว `src/api/backend.js` เป็นหลัก
- ข้อมูล Pokémon ยังคงใช้ PokéAPI โดยตรง; ไม่มีเหตุผลต้องย้ายเข้าฐานข้อมูล Go
- Wishlist ตอนนี้ใช้ localStorage; ย้ายหลัง Go ทำ API จริง
