import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Box,
  Upload,
  ShieldCheck,
  Layers,
  Search,
  DownloadCloud,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    can,
    selectedCompany,
    selectedProject,
    selectedModel,
    activeTab,
    setActiveTab,
    setIsUploadModalOpen,
    searchQuery,
    setSearchQuery,
    selectedModelIds,
    triggerBulkDownload,
    clearSelectedModels,
    handleLogout
  } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('browse')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                VR Asset Hub
              </div>
             <div className="text-xs text-slate-900 font-semibold font-sans flex items-center gap-1">
  VR Assets / {(selectedCompany as any)?.slug || '...'}
  {selectedProject ? ` / ${(selectedProject as any).slug}` : ''}
</div>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-100 mx-2 hidden md:block" />

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50/60 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'browse'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              Browse Assets
            </button>
            <button
              onClick={() => setActiveTab('viewer')}
              disabled={!selectedModel}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeTab === 'viewer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : !selectedModel
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3D Inspector
              {selectedModel && (
                <span className="text-[10px] px-1 rounded bg-indigo-500/30 text-indigo-200">
                  {selectedModel.name}
                </span>
              )}
            </button>
            {currentRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Admin & Storage
              </button>
            )}
          </nav>
        </div>

        {/* Center: Search Bar */}
        {activeTab === 'browse' && (
          <div className="relative flex-1 max-w-md hidden lg:block">
            <Search className="w-4 h-4 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across model name, tags & version notes..."
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Right: Actions & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Bulk Download Indicator */}
          {selectedModelIds.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-950/60 border border-indigo-700/50 px-2.5 py-1 rounded-xl">
              <span className="text-xs font-semibold text-indigo-300">
                {selectedModelIds.length} selected
              </span>
              <button
                onClick={triggerBulkDownload}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-all shadow-md shadow-indigo-600/30"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                Export ZIP
              </button>
              <button
                onClick={clearSelectedModels}
                className="text-xs text-slate-600 hover:text-slate-800 px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload Button */}
          {can('upload_asset') && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Asset</span>
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
            className="w-9 h-9 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
