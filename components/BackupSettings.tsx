"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { restInsert, restSelect, restUpsert, refreshAuthSession, supabaseConfigured } from "@/lib/supabase-rest";

const RESTORABLE_TABLES = ["applications", "events", "team_members", "communities", "youtube_shorts", "announcements"] as const;
const TABLES = [...RESTORABLE_TABLES, "audit_logs"] as const;
type BackupTable = typeof TABLES[number];
type BackupPayload = { version: 1; exported_at: string; source: string; tables: Record<string, unknown[]> };

const LABELS: Record<BackupTable, string> = {
  applications: "Applications",
  events: "Events",
  team_members: "Team Members",
  communities: "Communities",
  youtube_shorts: "YouTube Shorts",
  announcements: "Announcements",
  audit_logs: "Audit History",
};

function session() {
  try { const raw = localStorage.getItem("iilm-admin-session"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const u16 = (view: DataView, at: number, value: number) => view.setUint16(at, value, true);
  const u32 = (view: DataView, at: number, value: number) => view.setUint32(at, value >>> 0, true);
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0);
    u16(lv, 10, 0); u16(lv, 12, 0); u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length);
    u16(lv, 26, name.length); u16(lv, 28, 0); local.set(name, 30);
    localParts.push(local, data);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0);
    u16(cv, 12, 0); u16(cv, 14, 0); u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length);
    u16(cv, 28, name.length); u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u16(cv, 36, 0); u32(cv, 38, 0); u32(cv, 42, offset);
    central.set(name, 46); centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22); const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  const parts = [...localParts, ...centralParts, end];
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const archive = new Uint8Array(totalLength);
  let cursor = 0;
  for (const part of parts) { archive.set(part, cursor); cursor += part.length; }
  return new Blob([archive.buffer as ArrayBuffer], { type: "application/zip" });
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(rows: unknown[]) {
  if (!rows.length) return "";
  const objects = rows.filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object") as Record<string, unknown>[];
  const columns = Array.from(new Set(objects.flatMap(row => Object.keys(row))));
  return [columns.join(","), ...objects.map(row => columns.map(c => csvEscape(row[c])).join(","))].join("\r\n");
}

function excelHtml(backup: BackupPayload) {
  const sheet = TABLES.map(table => {
    const rows = backup.tables[table] || [];
    const objects = rows.filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === "object") as Record<string, unknown>[];
    const columns = Array.from(new Set(objects.flatMap(row => Object.keys(row))));
    const head = columns.map(c => `<th>${escapeHtml(c)}</th>`).join("");
    const body = objects.map(row => `<tr>${columns.map(c => `<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`).join("");
    return `<h2>${escapeHtml(LABELS[table])}</h2><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><br/>`;
  }).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>IILM × BNV Innovation Lab Backup</title></head><body><h1>IILM × BNV Innovation Lab — Backup</h1><p>Exported ${escapeHtml(backup.exported_at)}</p>${sheet}</body></html>`;
}

function escapeHtml(value: unknown) {
  const text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return text.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

export default function BackupSettings({ role, onNotify }: { role: string; onNotify: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState("");
  const [lastExport, setLastExport] = useState<{ name: string; at: string } | null>(null);
  const [lastImport, setLastImport] = useState<{ name: string; at: string } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const canRestore = role === "admin";

  const getAuthenticatedSession = async () => {
    if (!supabaseConfigured) throw new Error("Supabase is not configured. Check the public Supabase URL and anon key in your environment, then restart the app.");
    const saved = session();
    if (!saved) throw new Error("Your admin session is missing. Sign out and sign in again before backing up.");
    if (saved.access_token) return saved;
    if (saved.refresh_token) {
      const refreshed = await refreshAuthSession(saved.refresh_token);
      const updated = { ...saved, access_token: refreshed.access_token, refresh_token: refreshed.refresh_token };
      localStorage.setItem("iilm-admin-session", JSON.stringify(updated));
      return updated;
    }
    throw new Error("Your admin session has expired. Sign in again, then retry the backup.");
  };

  const actor = () => {
    const saved = session();
    const identity = saved?.identity || {};
    return { id: identity.id || null, name: identity.name || identity.email || "Admin" };
  };

  const recordBackupActivity = async (accessToken: string, action: "export" | "import", filename: string, details?: string) => {
    const current = actor();
    try {
      await restInsert("backup_activity", accessToken, {
        action, filename, details: details || null,
        actor_id: current.id, actor_name: current.name,
        occurred_at: new Date().toISOString(),
      });
    } catch (error) {
      // Tracking should be visible when configured, but should not corrupt or cancel a valid backup/restore.
      console.error("Could not record backup activity", error);
    }
  };

  const loadBackupActivity = async () => {
    try {
      const s = await getAuthenticatedSession();
      setHistoryLoading(true);
      const rows = await restSelect("backup_activity", s.access_token, "select=action,filename,actor_name,occurred_at&order=occurred_at.desc&limit=50");
      if (!Array.isArray(rows)) return;
      const exported = rows.find((r: any) => r.action === "export");
      const imported = rows.find((r: any) => r.action === "import");
      setLastExport(exported ? { name: exported.actor_name || "Admin", at: exported.occurred_at } : null);
      setLastImport(imported ? { name: imported.actor_name || "Admin", at: imported.occurred_at } : null);
    } catch (error) {
      console.warn("Backup activity history is unavailable", error);
    } finally { setHistoryLoading(false); }
  };

  const buildBackup = async () => {
    const s = await getAuthenticatedSession();
    const results = await Promise.all(TABLES.map(async table => [table, await restSelect(table, s.access_token, table === "audit_logs" ? "select=*&order=changed_at.desc" : "select=*&order=created_at.desc")] as const));
    return { version: 1 as const, exported_at: new Date().toISOString(), source: "IILM × BNV Innovation Lab Admin Studio", tables: Object.fromEntries(results) } as BackupPayload;
  };

  const exportCompleteZip = async () => {
    setBusy(true);
    try {
      const backup = await buildBackup();
      const date = new Date().toISOString().slice(0, 10);
      const files = [
        { name: "backup.json", content: JSON.stringify(backup, null, 2) },
        { name: "backup-excel.xls", content: excelHtml(backup) },
        { name: "README.txt", content: `IILM × BNV Innovation Lab complete content backup\nExported: ${backup.exported_at}\n\nContents:\n- backup.json: canonical backup file used by the Restore function\n- backup-excel.xls: Excel-compatible workbook containing a section for each data table\n- csv/: one CSV file per data table\n\nIncluded data tables: ${TABLES.join(", ")}\n\nThis archive includes records accessible to the signed-in admin. It does not contain Supabase Auth passwords, secret keys, or image/video binaries stored in Cloudinary. Media URLs and metadata stored in the database are included. To restore, extract backup.json and select it in Settings > Backup & Import.` },
        ...TABLES.map(table => ({ name: `csv/${table}.csv`, content: rowsToCsv(backup.tables[table] || []) })),
      ];
      const filename = `iilm-bnv-complete-backup-${date}.zip`;
      downloadBlob(filename, zipStore(files));
      setLastBackup(new Date().toLocaleString());
      const s = await getAuthenticatedSession();
      await recordBackupActivity(s.access_token, "export", filename);
      await loadBackupActivity();
      onNotify("Complete ZIP backup downloaded (JSON, Excel-compatible file, and CSVs)");
    } catch (e) { onNotify(e instanceof Error ? e.message : "Backup failed"); }
    finally { setBusy(false); }
  };

  const importJson = async () => {
    if (!canRestore) return onNotify("Only an admin can restore a backup");
    if (!importFile) return onNotify("Choose a JSON backup first");
    setImporting(true);
    try {
      const text = await importFile.text();
      const parsed = JSON.parse(text) as BackupPayload;
      if (parsed?.version !== 1 || !parsed?.tables || typeof parsed.tables !== "object") throw new Error("This is not a valid Innovation Lab backup file.");
      const s = await getAuthenticatedSession();
      const allowed = new Set<string>(RESTORABLE_TABLES);
      const tables = Object.entries(parsed.tables).filter(([table, rows]) => allowed.has(table as BackupTable) && Array.isArray(rows));
      if (!tables.length) throw new Error("The backup contains no supported data tables.");
      let restored = 0;
      for (const [table, rows] of tables) {
        const cleanRows = (rows as Record<string, unknown>[]).filter(row => row && typeof row === "object" && row.id).map(row => {
          const copy = { ...row };
          delete copy.created_by; delete copy.created_by_name;
          delete copy.updated_by; delete copy.updated_by_name;
          delete copy.reviewed_by; delete copy.reviewed_by_name; delete copy.reviewed_at;
          return copy;
        });
        if (!cleanRows.length) continue;
        await restUpsert(table, s.access_token, cleanRows);
        restored += cleanRows.length;
      }
      await recordBackupActivity(s.access_token, "import", importFile.name, `Restored ${restored} records`);
      await loadBackupActivity();
      onNotify(`Backup restored: ${restored} records merged`);
      setImportFile(null);
    } catch (e) { onNotify(e instanceof Error ? e.message : "Import failed"); }
    finally { setImporting(false); }
  };


  useEffect(() => { void loadBackupActivity(); }, []);

  const formatHistoryDate = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return <div className="settings-stack">
    <PageIntroLite title="Backup & Import" description="Protect your Innovation Lab data with downloadable backups. Restore JSON backups later without touching passwords or media files." />
    <section className="admin-card backup-card">
      <div className="backup-heading"><div><span>BACKUP</span><h3>Download your data</h3><p>Exports use the authenticated Supabase session. Images/videos stay in Cloudinary and login passwords are never exported.</p></div><div className="backup-status">{lastExport ? <><span className="backup-activity-pill">Last export</span><br/><b>{lastExport.name}</b><br/><small>{formatHistoryDate(lastExport.at)}</small></> : lastBackup ? <>Last export<br/><b>{lastBackup}</b></> : <>No export recorded<br/><b>{historyLoading ? "Checking…" : "Ready"}</b></>}</div></div>
      <div className="backup-actions"><button className="admin-primary" disabled={busy} onClick={exportCompleteZip}>{busy ? "Preparing complete backup…" : "↓ Download complete ZIP backup"}</button></div>
      <small className="backup-footnote">Includes all supported content tables and audit history in JSON, an Excel-compatible file, and separate CSV files. No table selection is required.</small>
    </section>

    <section className="admin-card backup-card restore-card">
      <div className="backup-heading"><div><span>RESTORE</span><h3>Import a JSON backup</h3><p>Imports are <b>merge/upsert</b> operations by record ID. Existing records are updated; missing records are added. Nothing is deleted.</p></div><div className="backup-status">{lastImport ? <><span className="backup-activity-pill">Last import</span><br/><b>{lastImport.name}</b><br/><small>{formatHistoryDate(lastImport.at)}</small></> : <>No import recorded<br/><b>{historyLoading ? "Checking…" : "Ready"}</b></>}<br/><span className="backup-warning">⚠ Restore only backups you trust.</span></div></div>
      {!canRestore && <div className="backup-warning">Your role is read-only for restore. Ask an authorized admin to perform the import.</div>}
      <label className="backup-file"><input type="file" accept="application/json,.json" disabled={!canRestore || importing} onChange={(e: ChangeEvent<HTMLInputElement>) => setImportFile(e.target.files?.[0] || null)} /><span>{importFile ? importFile.name : "Choose a JSON backup…"}</span></label>
      <button className="admin-primary" disabled={!canRestore || importing || !importFile} onClick={importJson}>{importing ? "Restoring…" : "Restore backup ↥"}</button>
      <small className="backup-footnote">To restore a ZIP backup, extract it and select its backup.json file here. This restores database records only; Supabase Auth passwords and Cloudinary media files are not included.</small>
    </section>

    <section className="admin-card backup-info"><span>SAFETY NOTE</span><h3>Keep at least two copies.</h3><p>Download a JSON backup before major content changes and keep one copy outside the project. A backup is a recovery tool, not a replacement for Supabase's own database backups.</p></section>
  </div>;
}

function PageIntroLite({ title, description }: { title: string; description: string }) {
  return <div className="admin-page-intro"><div><span>DATA SAFETY</span><h2>{title}</h2><p>{description}</p></div></div>;
}
