
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  FolderGit2,
  Plus,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Layers3,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    projects,
    selectedProject,
    setSelectedProject,
    can,
    setIsCreateCompanyOpen,
    setIsCreateProjectOpen,
    activeTab,
    setActiveTab,
  } = useApp();

  const [expandedCompanies, setExpandedCompanies] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (
    companyId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    setExpandedCompanies((previous) => ({
      ...previous,
      [companyId]: !(previous[companyId] ?? true),
    }));
  };

  const handleCompanySelect = (company: (typeof companies)[number]) => {
    setSelectedCompany(company);

    if (activeTab !== 'browse') {
      setActiveTab('browse');
    }
  };

  const handleProjectSelect = (project: (typeof projects)[number]) => {
    setSelectedProject(project);

    if (activeTab !== 'browse') {
      setActiveTab('browse');
    }
  };

  const visibleProjects = selectedCompany ? projects : [];

  return (
    <aside className="flex h-full min-h-0 w-72 min-w-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-800">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Workspace
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Companies & Projects
              </p>
            </div>
          </div>

          {can('create_company') && (
            <button
              type="button"
              onClick={() => setIsCreateCompanyOpen(true)}
              title="Create company"
              aria-label="Create company"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable tree */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Companies
          </span>

          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
            {companies.length}
          </span>
        </div>

        <div className="space-y-2">
          {companies.map((company) => {
            const isSelected = selectedCompany?.id === company.id;
            const isExpanded =
              expandedCompanies[company.id] ?? true;

            return (
              <section key={company.id} className="min-w-0">
                {/* Company row */}
                <div
                  className={`group flex min-w-0 items-center gap-1.5 rounded-xl border p-2 transition-colors ${
                    isSelected
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(event) => toggleExpand(company.id, event)}
                    aria-label={
                      isExpanded
                        ? `Collapse ${company.name}`
                        : `Expand ${company.name}`
                    }
                    aria-expanded={isExpanded}
                    className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCompanySelect(company)}
                    aria-pressed={isSelected}
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md py-1 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <FolderOpen
                      className={`h-5 w-5 shrink-0 ${
                        isSelected
                          ? 'text-indigo-600'
                          : 'text-slate-500'
                      }`}
                    />

                    <span className="min-w-0 flex-1">
                      <span
                        className={`block break-words text-sm font-semibold leading-5 ${
                          isSelected
                            ? 'text-indigo-900'
                            : 'text-slate-800'
                        }`}
                      >
                        {company.name}
                      </span>

                      <span className="mt-0.5 block break-all text-xs leading-4 text-slate-500">
                        {company.slug}
                      </span>
                    </span>
                  </button>
                </div>

                {/* Projects under selected company */}
                {isExpanded && isSelected && (
                  <div className="ml-4 mt-2 border-l-2 border-slate-200 py-1 pl-3">
                    <div className="mb-2 flex items-center justify-between px-2">
                      <span className="text-xs font-medium text-slate-500">
                        Projects
                      </span>

                      <span className="text-xs tabular-nums text-slate-400">
                        {visibleProjects.length}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {visibleProjects.map((project) => {
                        const isProjectSelected =
                          selectedProject?.id === project.id;

                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => handleProjectSelect(project)}
                            aria-pressed={isProjectSelected}
                            className={`flex w-full min-w-0 items-start gap-2 rounded-lg border px-2.5 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isProjectSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                                : 'border-transparent bg-slate-50 text-slate-700 hover:border-indigo-100 hover:bg-indigo-50'
                            }`}
                          >
                            <FolderGit2
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                isProjectSelected
                                  ? 'text-white'
                                  : 'text-slate-500'
                              }`}
                            />

                            <span className="min-w-0 flex-1 break-words text-sm font-medium leading-5">
                              {project.name}
                            </span>

                            <span
                              className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                                isProjectSelected
                                  ? 'bg-indigo-700 text-white'
                                  : 'border border-slate-200 bg-white text-slate-600'
                              }`}
                              title="Model count"
                            >
                              {project.models_count ?? 0}
                            </span>
                          </button>
                        );
                      })}

                      {visibleProjects.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center">
                          <Layers3 className="mx-auto mb-1.5 h-5 w-5 text-slate-400" />
                          <p className="text-xs font-medium text-slate-600">
                            No projects yet
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Create a project to get started.
                          </p>
                        </div>
                      )}

                      {can('create_project') && (
                        <button
                          type="button"
                          onClick={() => setIsCreateProjectOpen(true)}
                          className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-indigo-200 px-2.5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          <span>Add project</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {/* Empty state */}
          {companies.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>

              <p className="text-sm font-semibold text-slate-700">
                No companies available
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Companies will appear here when available.
              </p>

              {can('create_company') && (
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Plus className="h-4 w-4" />
                  Create company
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-slate-200 px-4 py-3">
        <p className="text-xs text-slate-400">
          VR Asset Management
        </p>
      </div>
    </aside>
  );
};
