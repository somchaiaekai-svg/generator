# แอปสำรวจเครื่องกำเนิดไฟฟ้า

ทุ่งมหาเมฆ · สุวรรณภูมิ · ดอนเมือง

เปิดใช้งาน: https://somchaiaekai-svg.github.io/generator/

## ระบบกลาง (Google Sheets + Google Drive)

ข้อมูลทุกเครื่องเก็บใน Google Sheet และรูปเก็บในโฟลเดอร์ Google Drive "GenSurvey Photos" ทุกคนที่เปิดลิงก์เห็นข้อมูลชุดเดียวกัน

ติดตั้ง (ครั้งเดียว):
1. สร้าง Google Sheet ใหม่ ตั้งชื่อ เช่น "สำรวจเครื่องกำเนิดไฟฟ้า"
2. เมนู ส่วนขยาย (Extensions) › Apps Script ลบโค้ดเดิม แล้ววางโค้ดจากไฟล์ `Code.gs`
3. แก้บรรทัด `const TEAM_CODE = '';` ใส่รหัสทีม เช่น `'gen2569'` (เว้นว่าง = ไม่ใช้รหัส)
4. กด บันทึก › ทำให้ใช้งานได้ (Deploy) › การทำให้ใช้งานได้รายการใหม่ (New deployment)
   - ประเภท: เว็บแอป (Web app)
   - เรียกใช้ในฐานะ (Execute as): ฉัน (Me)
   - ผู้ที่มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)
5. กดอนุญาตสิทธิ์ (Authorize) แล้วคัดลอก URL ของเว็บแอป (ลงท้าย `/exec`)
6. ใส่ URL นั้นในบรรทัด `const API_URL="";` ของ `index.html`

แก้ `Code.gs` ภายหลัง ให้ Deploy › Manage deployments › แก้ไข › เวอร์ชันใหม่ (URL เดิม)
