import React, { useMemo, useState } from 'react';
import { ModelItem, ModelCategory, TargetPlatform } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import {
  Box,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileArchive,
  CheckSquare,
  Square,
  Pencil,
  X,
  Save,
  Loader2
} from 'lucide-react';

interface ModelCardProps {
  model: ModelItem;
}

const CATEGORY_OPTIONS: ModelCategory[] = [
  'character', 'environment', 'prop', 'vehicle', 'architecture'
] as ModelCategory[];

const PLATFORM_OPTIONS: TargetPlatform[] = [
  'Quest', 'PCVR', 'Mobile', 'Web'
] as TargetPlatform[];

function normalizeRole(role: unknown): string {
  return String(role ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const {
    currentRole,
    setSelectedModel,
    setSelectedVersion,
    setActiveTab,
    selectedModelIds,
    toggleSelectModel,
    showToast
  } = useApp();

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(model.name ?? '');
  const [category, setCategory] = useState(String(model.category ?? 'prop'));
  const [tagsText, setTagsText] = useState((model.tags ?? []).join(', '));
  const [targetPlatform, setTargetPlatform] = useState(String(model.target_platform ?? 'Quest'));

  const role = normalizeRole(currentRole);
  const canEditModel = role === 'admin' || role === '3dartist' || role === 'artist';
  const isSelectedForBulk = selectedModelIds.includes(model.id);
  const versionToDisplay = model.latest_version || model.versions?.[0] || model.latest_approved_version;
  const stats = versionToDisplay?.stats;
  const isOverQuestBudget = (stats?.triangles || 0) > 100000;

  const parsedTags = useMemo(
    () => tagsText.split(',').map(tag => tag.trim()).filter(Boolean),
    [tagsText]
  );

  const openEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    setName(model.name ?? '');
    setCategory(String(model.category ?? 'prop'));
    setTagsText((model.tags ?? []).join(', '));
    setTargetPlatform(String(model.target_platform ?? 'Quest'));
    setEditOpen(true);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canEditModel) {
      showToast('You do not have permission to edit model details.', 'error');
      return;
    }

    const projectId = model.project_id;
    if (!projectId || !model.id) {
      showToast('Project ID or Model ID is missing. Reload the model list.', 'error');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateModel(projectId, model.id, {
        name: name.trim(),
        category: category as ModelCategory,
        tags: parsedTags,
        target_platform: targetPlatform as TargetPlatform
      });

      setSelectedModel(updated);
      setEditOpen(false);
      showToast('Model details updated successfully.', 'success');

      // Reload the list so the card reflects the persisted backend values.
      window.location.reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Model update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenViewer = async () => {
    setSelectedModel(model);
    setSelectedVersion(null);
    setActiveTab('viewer');

    try {
      const versions = await api.getModelVersions(model.id);
      const version =
        versions.find(v => v.id === model.latest_version_id) ??
        versions[0] ??
        model.latest_version ??
        model.latest_approved_version ??
        null;

      if (version) {
        setSelectedVersion(version);
      } else {
        showToast('This model has no versions yet. Upload a version before opening the 3D viewer.', 'warning');
      }
    } catch (error) {
      console.error('Failed to load model versions:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load model versions.', 'error');
    }
  };

  const handleDownloadFbx = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!versionToDisplay) return;
    const fbxFile = (versionToDisplay.files ?? []).find(
      file => file.kind?.toLowerCase() === 'fbx' || file.filename?.toLowerCase().endsWith('.fbx')
    );
    if (!fbxFile) {
      showToast('FBX file record is not available for this version.', 'warning');
      return;
    }

    try {
      const blob = await api.downloadVersionFile(versionToDisplay.id, fbxFile.id, fbxFile.filename);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fbxFile.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${fbxFile.filename}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Download failed.', 'error');
    }
  };

  const handleDownloadPackage = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!versionToDisplay) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const files = versionToDisplay.files ?? [];
      if (!files.length) throw new Error('No stored files are available for this version.');

      for (const file of files) {
        const blob = await api.downloadVersionFile(versionToDisplay.id, file.id, file.filename);
        zip.file(file.filename, blob);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${model.name}_${versionToDisplay.version_no}_Package.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast(`Downloaded package for ${model.name}`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Package download failed.', 'error');
    }
  };

  const handleOpenInDrive = (event: React.MouseEvent) => {
    event.stopPropagation();
    const folderId = versionToDisplay?.drive_folder_id || model.drive_folder_id;
    if (!folderId) {
      showToast('No Google Drive folder is linked to this model/version yet.', 'info');
      return;
    }
    window.open(
      `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'Needs fix':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30"><AlertCircle className="w-3 h-3" /> Needs Fix</span>;
      case 'In review':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30"><Clock className="w-3 h-3" /> In Review</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/15 text-slate-700 border border-slate-500/30">Draft</span>;
    }
  };

  return (
    <>
      <div
        onClick={handleOpenViewer}
        className={`group relative bg-white/90 border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/40 flex flex-col ${
          isSelectedForBulk ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="relative h-44 bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-200/80">
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />

          <button
            type="button"
            onClick={event => { event.stopPropagation(); toggleSelectModel(model.id); }}
            className="absolute top-2.5 left-2.5 z-10 p-1 rounded-lg bg-white/80 backdrop-blur-md border border-slate-200/60 text-slate-600"
            title="Select for bulk download"
          >
            {isSelectedForBulk ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
          </button>

          <div className="absolute top-2.5 right-2.5 z-10">{getStatusBadge(versionToDisplay?.status)}</div>

          <div className="relative flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-900/40 to-slate-800 border border-slate-200 flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Box className="w-8 h-8 text-indigo-400" />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {versionToDisplay?.version_no || 'v001'} • {(versionToDisplay?.files ?? []).filter(file => file.kind?.toLowerCase() === 'texture').length} Textures
            </span>
          </div>

          {isOverQuestBudget && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 rounded-lg text-[10px] text-amber-200 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>&gt;100k tris ({((stats?.triangles || 0) / 1000).toFixed(0)}k) — Exceeds Quest target</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{model.name}</h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{model.category}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {(model.tags ?? []).slice(0, 3).map((tag, index) => (
                <span key={`${tag}-${index}`} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">#{tag}</span>
              ))}
              {(model.tags ?? []).length > 3 && <span className="text-[10px] text-slate-500">+{model.tags.length - 3}</span>}
            </div>

            {versionToDisplay?.notes && (
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200 mb-2">
                <span className="font-semibold text-slate-700">Notes: </span>{versionToDisplay.notes}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 py-1 border-t border-slate-200">
              <div>
                <span className="text-slate-500 text-[10px] block">Triangles:</span>
                <span className={`font-mono font-medium ${isOverQuestBudget ? 'text-amber-600 font-bold' : 'text-slate-800'}`}>
                  {stats ? stats.triangles.toLocaleString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Bounding Box:</span>
                <span className="font-mono text-slate-800">{stats ? `${stats.bounds.x} × ${stats.bounds.y}m` : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
            {canEditModel && (
              <button
                type="button"
                onClick={openEdit}
                title="Edit model details"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-[11px] font-semibold text-indigo-700"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenInDrive}
              title="Open Google Drive folder"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700"
            >
              <ExternalLink className="w-3 h-3" /> Drive
            </button>

            <div className="flex items-center gap-1">
              <button type="button" onClick={handleDownloadFbx} title="Download FBX" className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-800 flex items-center gap-1">
                <Download className="w-3 h-3" /> FBX
              </button>
              <button type="button" onClick={handleDownloadPackage} title="Download full package" className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-[11px] font-medium text-indigo-700 flex items-center gap-1">
                <FileArchive className="w-3 h-3" /> Package
              </button>
            </div>
          </div>
        </div>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
          onClick={event => { event.stopPropagation(); if (!saving) setEditOpen(false); }}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={event => event.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Model Details</h2>
                <p className="text-xs text-slate-500 mt-1">Update metadata. Existing versions and files will remain unchanged.</p>
              </div>
              <button type="button" disabled={saving} onClick={() => setEditOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Model Name</span>
              <input required maxLength={200} value={name} onChange={event => setName(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select value={category} onChange={event => setCategory(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
                {CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                {!CATEGORY_OPTIONS.includes(category as ModelCategory) && <option value={category}>{category}</option>}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Tags</span>
              <input value={tagsText} onChange={event => setTagsText(event.target.value)} placeholder="furniture, interior, quest" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
              <span className="text-[11px] text-slate-500">Comma-separated tags.</span>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Target Platform</span>
              <select value={targetPlatform} onChange={event => setTargetPlatform(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900">
                {PLATFORM_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                {!PLATFORM_OPTIONS.includes(targetPlatform as TargetPlatform) && <option value={targetPlatform}>{targetPlatform}</option>}
              </select>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={saving} onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
