import { AuditLogEntry } from '../types';

const AUDIT_LOG_STORAGE_KEY = 'auto_fleet_audit_logs_v1';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load audit logs:', e);
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  try {
    const currentLogs = getAuditLogs();
    // Keep last 1000 logs to preserve performance
    const updated = [newEntry, ...currentLogs].slice(0, 1000);
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit log:', e);
  }

  return newEntry;
}

export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear audit logs:', e);
  }
}
