# เชื่อม Google Sheet (ไม่บังคับ)
1. สร้าง Google Sheet ใหม่ → Extensions → Apps Script
2. วางโค้ดจาก `google-apps-script/Code.gs` แทนของเดิม
3. แก้ค่า `TOKEN` ในบรรทัดบนสุดเป็นรหัสผ่านของคุณเอง (ตั้งยาวๆ เดายาก)
4. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → Deploy → อนุญาตสิทธิ์
5. คัดลอก Web app URL
6. ในแอป: ตั้งค่า → เชื่อมต่อ Google Sheet → วาง URL และ TOKEN → ทดสอบและเชื่อมต่อ

ระบบสร้างแท็บของแต่ละข้อมูลให้เอง รูปหลักฐานเก็บใน Google Drive โฟลเดอร์ "CoreDash Village - Photos"
หากแก้โค้ด Code.gs ภายหลัง ต้อง Deploy → Manage deployments → New version
