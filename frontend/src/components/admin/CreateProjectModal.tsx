import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { X, FolderGit2, FolderSync } from 'lucide-react';

export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectOpen, setIsCreateProjectOpen, selectedCompany, companies, refreshData, showToast, setSelectedProject, setSelectedCompany } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState(selectedCompany?.id || companies[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCompanyId(selectedCompany?.id || companies[0]?.id || '');
  }, [selectedCompany, companies, isCreateProjectOpen]);

  if (!isCreateProjectOpen) return null;

  const targetComp = companies.find(c => c.id === companyId);
  const slug = name.trim().replace(/\s+/g, '_');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Project name is required.', 'error'); return; }
    if (!companyId) { showToast('Create or select a real company before creating a project.', 'error'); return; }

    setIsSubmitting(true);
    try {
      const created = await api.createProject(companyId, name.trim(), description.trim());
      const company = companies.find(item => item.id === companyId) || null;
      if (company) setSelectedCompany(company);
      setSelectedProject(created);
      setIsCreateProjectOpen(false);
      setName('');
      setDescription('');
      showToast(`Project created: ${created.name}`, 'success');
      await refreshData(companyId, created.id).catch((error) => console.error('Project created, but refresh failed:', error));
      setSelectedProject(created);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create project', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Create New Project</h3>
          </div>
          <button
            onClick={() => setIsCreateProjectOpen(false)}
            className="text-slate-600 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Company
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Project Name (Title_Case_With_Underscores)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. EV Assembly VR or CPR Simulator"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Project Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VR simulator purpose, target headset, and scope..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] font-mono text-slate-600 flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              Drive: <span className="text-emerald-300">VR Assets/{targetComp?.slug || 'Company'}/{slug || 'Project_Slug'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(false)}
              className="px-4 py-2 text-xs text-slate-600 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !companyId}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Project (FR-A1)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
