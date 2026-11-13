import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { X, Building2, FolderSync } from 'lucide-react';

export const CreateCompanyModal: React.FC = () => {
  const { isCreateCompanyOpen, setIsCreateCompanyOpen, refreshData, showToast, setSelectedCompany } = useApp();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateCompanyOpen) return null;

  const slug = name.trim().replace(/\s+/g, '_');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await api.createCompany(name.trim());
      setSelectedCompany(created);
      setIsCreateCompanyOpen(false);
      setName('');
      showToast(`Company created: ${created.name}`, 'success');
      void refreshData().catch((error) => console.error('Company created, but refresh failed:', error));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create company', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Create New Company</h3>
          </div>
          <button
            onClick={() => setIsCreateCompanyOpen(false)}
            className="text-slate-600 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Company / Client Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client X or Horizon Aerospace"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-600 flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              Drive: <span className="text-emerald-300">VR Assets/{slug || 'Company_Slug'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateCompanyOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Company (FR-A1)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
