import React from 'react';
import { useApp } from '../../context/AppContext';
import { ModelCard } from './ModelCard';
import { 
  ArrowUpDown, 
  Layers, 
  Upload, 
  CheckSquare, 
  Square, 
  RefreshCw,
  FolderOpen
} from 'lucide-react';

export const ModelGrid: React.FC = () => {
  const {
    models,
    selectedCompany,
    selectedProject,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    selectedModelIds,
    selectAllModels,
    clearSelectedModels,
    setIsUploadModalOpen,
    can,
    refreshData
  } = useApp();

  const allSelected = models.length > 0 && selectedModelIds.length === models.length;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 space-y-6">
      {/* Top Banner / Project Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 border border-slate-200 p-5 rounded-2xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{selectedCompany?.name || 'Company'}</span>
            <span>/</span>
            <span className="text-slate-700">{selectedProject?.name || 'Select a project'}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {selectedProject?.name || 'All VR Models'}
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {selectedProject?.description || 'Browse, inspect UVs, manage versions, and download production-ready VR assets.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshData()}
            className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-white transition-colors"
            title="Refresh assets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {can('upload_asset') && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar (FR-B2) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/40 border border-slate-200/80 p-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-select all toggle */}
          {models.length > 0 && (
            <button
              onClick={allSelected ? clearSelectedModels : selectAllModels}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100/60 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

        </div>

        {/* Sort Options (FR-B2) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="updated">Sort: Recently Updated</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="polycount_asc">Sort: Polycount (Low to High)</option>
              <option value="polycount_desc">Sort: Polycount (High to Low)</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {models.length} {models.length === 1 ? 'model' : 'models'}
          </span>
        </div>
      </div>

      {/* Grid of Model Cards (FR-B1) */}
      {models.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {models.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/30 border border-slate-200/80 rounded-2xl space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100/60 flex items-center justify-center">
            <Layers className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No VR Models Found</h3>
          <p className="text-xs text-slate-600 max-w-sm">
            {searchQuery
              ? 'No assets matched your search. Try another query.'
              : 'This project does not have any models uploaded yet. 3D Artists and Managers can upload an FBX.'}
          </p>
          {can('upload_asset') && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload First FBX Asset
            </button>
          )}
        </div>
      )}
    </div>
  );
};
