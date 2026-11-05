/**
 * ระบบกลางของแอปสำรวจเครื่องกำเนิดไฟฟ้า (Google Apps Script)
 * - เก็บข้อมูลแต่ละเครื่องใน Google Sheet แผ่น "generators" (1 แถว = 1 เครื่อง)
 * - เก็บรูปถ่ายในโฟลเดอร์ Google Drive "GenSurvey Photos"
 *
 * วิธีติดตั้ง: ดูขั้นตอนในข้อความแชท หรือ README ของ repo
 * TEAM_CODE: รหัสทีมสำหรับกันคนนอกแก้ข้อมูล (เว้นว่าง = ไม่ต้องใช้รหัส)
 */
const TEAM_CODE = '';
const SHEET_NAME = 'generators';
const FOLDER_NAME = 'GenSurvey Photos';
const COLS = ['id', 'updatedAt', 'data',
  'site', 'building', 'room', 'code', 'brand', 'model', 'kva', 'year', 'serial',
  'ats_brand', 'ats_model', 'ats_rating', 'ats_serial', 'systems',
  'air_brand', 'air_model', 'air_qty', 'oil_brand', 'oil_model', 'oil_qty',
  'fuel_brand', 'fuel_model', 'fuel_qty', 'day_l', 'storage_l',
  'surveyor', 'survey_date', 'note', 'photo_count'];

function doGet(e) { return handle_(e && e.parameter ? e.parameter : {}); }
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {}
  return handle_(body);
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function handle_(p) {
  try {
    if (TEAM_CODE && String(p.code || '') !== TEAM_CODE) return out_({ ok: false, error: 'bad_code' });
    switch (p.action) {
      case 'ping': return out_({ ok: true, needCode: !!TEAM_CODE });
      case 'list': return out_({ ok: true, records: list_() });
      case 'save': return out_(save_(p.record, p.base, !!p.force, !!p.keepTime));
      case 'delete': del_(p.id); return out_({ ok: true });
      case 'upload': return out_({ ok: true, id: upload_(p) });
      case 'photo':
        return out_({ ok: true, data: Utilities.base64Encode(DriveApp.getFileById(p.id).getBlob().getBytes()) });
      case 'deletePhoto':
        try { DriveApp.getFileById(p.id).setTrashed(true); } catch (err) {}
        return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}
function list_() {
  var sh = sheet_();
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var vals = sh.getRange(2, 1, n, 3).getValues();
  var out = [];
  for (var i = 0; i < vals.length; i++) {
    if (!vals[i][0]) continue;
    try { out.push(JSON.parse(vals[i][2])); } catch (err) {}
  }
  return out;
}
function findRow_(sh, id) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return -1;
  var ids = sh.getRange(2, 1, n, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return -1;
}
function save_(r, base, force, keepTime) {
  if (!r || !r.id) return { ok: false, error: 'no_record' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    var row = findRow_(sh, r.id);
    if (row > 0 && !force && base !== undefined && base !== null) {
      var cur = String(sh.getRange(row, 2).getValue() || '');
      if (cur && String(base) && cur > String(base)) {
        var current = null;
        try { current = JSON.parse(sh.getRange(row, 3).getValue()); } catch (err) {}
        return { ok: false, error: 'conflict', current: current };
      }
    }
    if (!(keepTime && r.updatedAt)) r.updatedAt = new Date().toISOString();
    var line = COLS.map(function (c) {
      if (c === 'data') return JSON.stringify(r);
      if (c === 'photo_count') return (r.photos || []).length;
      var v = r[c];
      return v === undefined || v === null ? '' : v;
    });
    if (row > 0) sh.getRange(row, 1, 1, COLS.length).setValues([line]);
    else sh.appendRow(line);
    return { ok: true, record: r };
  } finally {
    lock.releaseLock();
  }
}
function del_(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_();
    var row = findRow_(sh, id);
    if (row > 0) sh.deleteRow(row);
  } finally {
    lock.releaseLock();
  }
}
function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function upload_(p) {
  var bytes = Utilities.base64Decode(p.data);
  var blob = Utilities.newBlob(bytes, p.mime || 'image/jpeg', p.name || ('photo_' + Date.now() + '.jpg'));
  var file = folder_().createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
  return file.getId();
}
