
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { AuditLog, DownloadLog } from '../../types';
import {
  ShieldCheck,
  FileText,
  DownloadCloud,
  Search,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'audit' | 'downloads'>('audit');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const results = await Promise.allSettled([
        api.getAuditLogs(),
        api.getDownloadLogs(),
      ]);

      const failures: string[] = [];

      if (results[0].status === 'fulfilled') {
        setAuditLogs(results[0].value);
      } else {
        failures.push(
          `Audit log: ${
            results[0].reason instanceof Error
              ? results[0].reason.message
              : 'Failed to load'
          }`
        );
      }

      if (results[1].status === 'fulfilled') {
        setDownloadLogs(results[1].value);
      } else {
        failures.push(
          `Downloads: ${
            results[1].reason instanceof Error
              ? results[1].reason.message
              : 'Failed to load'
          }`
        );
      }
if (failures.length) {
        setLoadError(failures.join(' • '));
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load admin data.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const filteredAudit = auditLogs.filter((log) => {
    const query = auditSearch.toLowerCase();

    return [
      log.target_name ?? '',
      log.details ?? '',
      log.user_name ?? '',
      log.action ?? '',
      log.target_type ?? '',
      log.target_id ?? '',
    ].some((value) => String(value).toLowerCase().includes(query));
  });

  const formatDate = (value: string | number | Date) => {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? 'Invalid date'
      : date.toLocaleString();
  };

  const formatBytesToMB = (bytes: number) =>
    (bytes / 1024 / 1024).toFixed(1);

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-slate-50 p-4 sm:p-6 space-y-6">
      {/* Admin header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600 mb-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>IT & Studio Owner Administration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Studio Infrastructure & Audit
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl">
            Review audit logs and track project asset downloads.
          </p>
        </div>

        {/* Admin tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
<button
            type="button"
            onClick={() => setActiveAdminTab('audit')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeAdminTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <FileText className="w-5 h-5" />
            Audit Log
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('downloads')}
            className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
              activeAdminTab === 'downloads'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-5 h-5" />
            Downloads
          </button>

          <button
            type="button"
            onClick={() => void loadAdminData()}
            disabled={loading}
            className="px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-white hover:text-indigo-700 disabled:opacity-50 transition-colors"
            title="Refresh audit and download data"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Loading errors */}
      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />

          <div>
            <p className="font-semibold">
              Some admin data could not be loaded.
            </p>
            <p className="mt-1 break-words">{loadError}</p>
          </div>
        </div>
      )}

      {/* Audit Log tab */}
      {activeAdminTab === 'audit' && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Audit Log
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Review recorded user and asset activity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search user, action or asset..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              <span className="text-sm text-slate-600 whitespace-nowrap">
                {filteredAudit.length} entries
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600 whitespace-nowrap">
                    Timestamp
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    User
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Action
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Target
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!loading && filteredAudit.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      {auditLogs.length === 0
                        ? 'No audit entries returned by the API.'
                        : 'No audit entries match your search.'}
                    </td>
                  </tr>
                )}

                {filteredAudit.map((log) => {
                  let badge =
                    'bg-slate-100 text-slate-700 border-slate-200';

                  if (log.action === 'upload') {
                    badge =
                      'bg-emerald-50 text-emerald-700 border-emerald-200';
                  } else if (log.action === 'status_change') {
                    badge =
                      'bg-indigo-50 text-indigo-700 border-indigo-200';
                  } else if (
                    log.action === 'download' ||
                    log.action === 'bulk_download'
                  ) {
                    badge = 'bg-cyan-50 text-cyan-700 border-cyan-200';
                  } else if (log.action === 'delete') {
                    badge = 'bg-rose-50 text-rose-700 border-rose-200';
                  }

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>

                      <td className="py-4 px-4 text-sm text-slate-800 font-medium whitespace-nowrap">
                        {log.user_name}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-bold uppercase ${badge}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-sm text-slate-700 font-semibold">
                        {log.target_name ||
                          `${log.target_type || 'Record'} ${
                            log.target_id || ''
                          }`.trim()}
                      </td>

                      <td className="py-4 px-4 text-sm text-slate-600 max-w-md">
                        <span className="block truncate">
                          {log.details || 'No details supplied by the API'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Downloads tab */}
      {activeAdminTab === 'downloads' && (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Engine Export & Download History
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Review recorded downloads of FBX files and asset packages.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600 whitespace-nowrap">
                    Date & Time
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    User
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Model & Version
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Archive Filename
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Export Kind
                  </th>
                  <th className="py-4 px-4 text-sm font-bold text-slate-600">
                    Size
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!loading && downloadLogs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No download records returned by the API. Verify the
                      download history endpoint.
                    </td>
                  </tr>
                )}

                {downloadLogs.map((dl) => (
                  <tr
                    key={dl.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(dl.timestamp)}
                    </td>

                    <td className="py-4 px-4 text-sm text-slate-800 font-medium whitespace-nowrap">
                      {dl.user_name}
                    </td>

                    <td className="py-4 px-4 text-sm text-indigo-700 font-semibold whitespace-nowrap">
                      {dl.model_name
                        ? `${dl.model_name}${
                            dl.version_no ? ` (${dl.version_no})` : ''
                          }`
                        : '—'}
                    </td>

                    <td className="py-4 px-4 text-sm text-slate-700 max-w-xs">
                      <span className="block truncate">{dl.filename}</span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex px-2.5 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase">
                        {dl.kind || 'unknown'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatBytesToMB(Number(dl.size_bytes ?? 0))} MB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
