import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { AuditLogEntry, AppSettings, Language } from '../types';
import { getAuditLogs, clearAuditLogs } from '../utils/auditLogger';
import { exportToExcel } from '../utils/excelExport';

interface AuditLogModuleProps {
  settings: AppSettings;
  lang: Language;
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ settings, lang }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const refreshLogs = () => {
    setLogs(getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleClearLogs = () => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من مسح جميع سجلات العمليات والأمان؟' : 'Are you sure you want to clear all audit logs?')) {
      clearAuditLogs();
      refreshLogs();
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.entityName && log.entityName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesModule = selectedModule === 'all' || log.module === selectedModule;
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, searchTerm, selectedModule, selectedAction]);

  const handleExportExcel = () => {
    const data = filteredLogs.map((item) => ({
      timestamp: item.timestamp,
      user: `${item.userName} (${item.userRole})`,
      action: item.action,
      module: item.module,
      entity: item.entityName || item.entityId || '---',
      description: item.description,
    }));

    exportToExcel({
      fileName: `Audit_Logs_${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Audit Trail',
      title: lang === 'ar' ? 'سجل الرقابة والتدقيق الأمني للعمليات' : 'System Audit Trail & Activity Log',
      subtitle: `${settings.organizationName || settings.appName} - ${new Date().toLocaleDateString()}`,
      columns: [
        { header: lang === 'ar' ? 'الوقت والتاريخ' : 'Timestamp', key: 'timestamp' },
        { header: lang === 'ar' ? 'المستخدم' : 'User', key: 'user' },
        { header: lang === 'ar' ? 'نوع الإجراء' : 'Action Type', key: 'action' },
        { header: lang === 'ar' ? 'الوحدة / القسم' : 'Module', key: 'module' },
        { header: lang === 'ar' ? 'العنصر المتأثر' : 'Entity', key: 'entity' },
        { header: lang === 'ar' ? 'التفاصيل' : 'Details', key: 'description' },
      ],
      data,
    });
  };

  const actionBadges: Record<string, { color: string; labelAr: string; labelEn: string }> = {
    CREATE: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', labelAr: 'إضافة جديد', labelEn: 'CREATE' },
    UPDATE: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300', labelAr: 'تعديل', labelEn: 'UPDATE' },
    DELETE: { color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', labelAr: 'حذف', labelEn: 'DELETE' },
    PAYMENT: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300', labelAr: 'حركة مالية', labelEn: 'PAYMENT' },
    PRINT: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', labelAr: 'طباعة', labelEn: 'PRINT' },
    EXPORT: { color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300', labelAr: 'تصدير بيانات', labelEn: 'EXPORT' },
    LOGIN: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', labelAr: 'تسجيل دخول', labelEn: 'LOGIN' },
    LOGOUT: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', labelAr: 'تسجيل خروج', labelEn: 'LOGOUT' },
    STATUS_CHANGE: { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300', labelAr: 'تغيير حالة', labelEn: 'STATUS' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                {lang === 'ar' ? 'سجل التدقيق الأمني ورقابة العمليات (Audit Trail)' : 'Security Audit Trail & Activity Log'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'توثيق دقيق لكل عملية إضافة، تعديل، حذف، طباعة، ودخول مستخدم مع التاريخ والموظف المسؤول'
                  : 'Complete immutable tracking of system actions, edits, deletions, prints, and logins'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshLogs}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition"
            title={lang === 'ar' ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير إكسل' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'مسح السجل' : 'Clear Logs'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث في السجل بالموظف، البيان، رقم العقد...' : 'Search logs by user, details, entity...'}
            className="w-full pl-3 pr-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="all">{lang === 'ar' ? 'جميع الأقسام' : 'All Modules'}</option>
            <option value="contracts">عقود الإيجار (Contracts)</option>
            <option value="cars">السيارات والأسطول (Cars)</option>
            <option value="customers">العملاء (Customers)</option>
            <option value="bookings">الحجوزات (Bookings)</option>
            <option value="finance">المالية والحسابات (Finance)</option>
            <option value="treasury">إدارة الخزينة والعهد (Treasury)</option>
            <option value="maintenance">الصيانة (Maintenance)</option>
            <option value="deliveries">التوصيل (Deliveries)</option>
            <option value="employees">الموظفين والسائقين (Staff)</option>
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="all">{lang === 'ar' ? 'جميع أنواع الإجراءات' : 'All Actions'}</option>
            <option value="CREATE">إضافة جديد (CREATE)</option>
            <option value="UPDATE">تعديل بيانات (UPDATE)</option>
            <option value="DELETE">حذف (DELETE)</option>
            <option value="PAYMENT">مدفوعات (PAYMENT)</option>
            <option value="PRINT">طباعة (PRINT)</option>
            <option value="LOGIN">تسجيل دخول (LOGIN)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="p-3.5">الوقت والتاريخ</th>
                <th className="p-3.5">المستخدم المسؤول</th>
                <th className="p-3.5">نوع الإجراء</th>
                <th className="p-3.5">القسم / الوحدة</th>
                <th className="p-3.5">العنصر المتأثر</th>
                <th className="p-3.5">تفاصيل العملية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => {
                const actionInfo = actionBadges[log.action] || actionBadges.UPDATE;
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                          {log.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{log.userName}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${actionInfo.color}`}>
                        {lang === 'ar' ? actionInfo.labelAr : actionInfo.labelEn}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {log.module}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      {log.entityName || log.entityId || '---'}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {lang === 'ar' ? 'لا توجد سجلات مطابقة للشروط' : 'No audit records match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
