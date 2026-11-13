import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Role,
  User,
  Company,
  Project,
  ModelItem,
  ModelVersion,
  ModelStatus,
  Comment
} from '../types';
import { api, ConnectionState } from '../api/client';
import { INITIAL_USERS } from '../api/mockData';

export type PermissionAction =
  | 'create_company'
  | 'create_project'
  | 'add_members'
  | 'upload_asset'
  | 'delete_version'
  | 'change_status'
  | 'preview'
  | 'assign_textures_session'
  | 'save_texture_preset'
  | 'download'
  | 'comment';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  currentUser: User;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  can: (action: PermissionAction, context?: { isOwnVersion?: boolean; isApproved?: boolean }) => boolean;

  // Auth & Connection
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  connectionStatus: ConnectionState;
  handleLoginSuccess: (user?: any) => Promise<void>;
  handleLogout: () => void;

  // Navigation & Hierarchy
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;

  // Models & Versions
  models: ModelItem[];
  selectedModel: ModelItem | null;
  setSelectedModel: (model: ModelItem | null) => void;
  selectedVersion: ModelVersion | null;
  setSelectedVersion: (version: ModelVersion | null) => void;
  compareVersions: [ModelVersion | null, ModelVersion | null];
  setCompareVersions: (versions: [ModelVersion | null, ModelVersion | null]) => void;

  // Modals & Navigation
  activeTab: 'browse' | 'viewer' | 'compare' | 'admin';
  setActiveTab: (tab: 'browse' | 'viewer' | 'compare' | 'admin') => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isCreateCompanyOpen: boolean;
  setIsCreateCompanyOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  sortBy: 'updated' | 'name' | 'polycount_asc' | 'polycount_desc';
  setSortBy: (sort: 'updated' | 'name' | 'polycount_asc' | 'polycount_desc') => void;

  // Bulk selection
  selectedModelIds: string[];
  toggleSelectModel: (id: string) => void;
  clearSelectedModels: () => void;
  selectAllModels: () => void;

  // Actions
  refreshData: (companyId?: string, preferredProjectId?: string) => Promise<void>;
  updateVersionStatus: (versionId: string, status: ModelStatus, note?: string) => Promise<void>;
  triggerBulkDownload: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [currentRole, setCurrentRoleState] = useState<Role>('developer');

  // A real authenticated account's role must only come from the backend.
  // Role switching is retained only for unauthenticated demo mode.
  const setCurrentRole = useCallback((role: Role) => {
    if (api.token) return;
    setCurrentRoleState(role);
  }, []);

  // Do not show the application until an existing token has been verified.
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>(api.connectionStatus);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ModelVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<[ModelVersion | null, ModelVersion | null]>([null, null]);

  const [activeTab, setActiveTab] = useState<'browse' | 'viewer' | 'compare' | 'admin'>('browse');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'polycount_asc' | 'polycount_desc'>('updated');

  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast notifications
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // UI permissions mirror the backend's Admin / Developer / DArtist policy.
  // Backend authorization remains the source of truth.
  const can = (action: PermissionAction, context?: { isOwnVersion?: boolean; isApproved?: boolean }): boolean => {
    switch (action) {
      case 'create_company':
      case 'add_members':
      case 'change_status':
        return currentRole === 'admin';
      case 'create_project':
        return currentRole === 'admin' || currentRole === 'artist';
      case 'upload_asset':
      case 'save_texture_preset':
        return currentRole === 'admin' || currentRole === 'artist';
      case 'delete_version':
        return currentRole === 'admin';
      case 'preview':
      case 'comment':
        return currentRole === 'admin' || currentRole === 'developer' || currentRole === 'artist';
      case 'download':
        // Admin, Developer and 3D Artist can download asset files.
        return currentRole === 'admin' ||
          currentRole === 'developer' ||
          currentRole === 'artist';
      case 'assign_textures_session':
        return currentRole === 'admin' || currentRole === 'artist';
      default:
        return false;
    }
  };

  // Sync role → mock user
  useEffect(() => {
    // Never replace a real backend user with a mock user while authenticated.
    if (api.token) return;
    const matched = INITIAL_USERS.find(u => {
      if (currentRole === 'admin') return u.global_role === 'admin';
      if (currentRole === 'artist') return u.id === 'usr_art_1';
      if (currentRole === 'developer') return u.id === 'usr_dev_1';
      return false;
    });
    if (matched) setCurrentUser(matched);
  }, [currentRole]);

  // Restore the authenticated identity from the backend after every page load.
  // Never infer the role from localStorage, mock users, or a previous React state.
  const applyAuthenticatedUser = (user: any): boolean => {
    const roleText = String(
      user?.role ?? user?.Role ?? user?.globalRole ?? user?.GlobalRole ?? user?.global_role ?? ''
    ).trim().toLowerCase().replace(/[ _-]/g, '');

    let normalizedRole: Role;
    if (roleText === 'admin') normalizedRole = 'admin';
    else if (roleText === 'developer') normalizedRole = 'developer';
    else if (roleText === '3dartist' || roleText === 'artist') normalizedRole = 'artist';
    else return false;

    const userId = String(user?.id ?? user?.Id ?? '');
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(userId)) return false;

    const backendUser = {
      ...INITIAL_USERS[0],
      ...user,
      id: userId,
      name: user?.name ?? user?.Name ?? user?.username ?? user?.Username ?? 'Authenticated user',
      username: user?.username ?? user?.Username ?? '',
      email: user?.email ?? user?.Email ?? '',
      global_role: normalizedRole,
      permissions: user?.permissions ?? user?.Permissions ?? []
    } as User;

    setCurrentUser(backendUser);
    setCurrentRoleState(normalizedRole);
    return true;
  };

  useEffect(() => {
    let cancelled = false;

    api.onAuthRequired = () => {
      api.setToken(null);
      setConnectionStatus('unauthorized');
      setIsLoginModalOpen(true);
    };

    const restoreSession = async () => {
      if (!api.token) {
        setConnectionStatus('unauthorized');
        setIsLoginModalOpen(true);
        return;
      }

      try {
        const user = await api.getCurrentUser();
        if (cancelled) return;

        if (!applyAuthenticatedUser(user)) {
          throw new Error('The authenticated user or role returned by the API is invalid.');
        }

        setConnectionStatus('connected');
        setIsLoginModalOpen(false);

        const companyList = await api.getCompanies();
        if (cancelled) return;
        setCompanies(companyList);
        const preferredId = selectedCompany?.id;
        setSelectedCompany(
          companyList.find(company => company.id === preferredId) ?? companyList[0] ?? null
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Session restoration failed:', error);
        api.setToken(null);
        setConnectionStatus('unauthorized');
        setIsLoginModalOpen(true);
        setCurrentUser(INITIAL_USERS[0]);
        setCurrentRoleState('developer');
        setCompanies([]);
        setSelectedCompany(null);
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
      api.onAuthRequired = undefined;
    };
    // Run once on app mount: token restoration is deliberately not tied to UI state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LoginModal calls this after api.login has saved the JWT. The backend /me
  // endpoint is authoritative for the user's current role and permissions.
  const handleLoginSuccess = useCallback(async (_loginUser?: any) => {
    try {
      if (!api.token) throw new Error('Login token was not saved. Please sign in again.');

      const user = await api.getCurrentUser();
      if (!applyAuthenticatedUser(user)) {
        throw new Error('The authenticated user or role returned by the API is invalid.');
      }

      setConnectionStatus('connected');
      const companyList = await api.getCompanies();
      setCompanies(companyList);
      setSelectedCompany(companyList[0] ?? null);
      setIsLoginModalOpen(false);
      showToast('Signed in successfully.', 'success');
    } catch (error) {
      console.error('Login initialization failed:', error);
      api.setToken(null);
      setConnectionStatus('unauthorized');
      setIsLoginModalOpen(true);
      setCurrentUser(INITIAL_USERS[0]);
      setCurrentRoleState('developer');
      showToast(error instanceof Error ? error.message : 'Unable to initialize login session.', 'error');
    }
  }, []);

  // Logout
  const handleLogout = useCallback(() => {
    api.setToken(null);
    api.connectionStatus = 'unauthorized';
    setConnectionStatus('unauthorized');
    setIsLoginModalOpen(true);
    setCurrentUser(INITIAL_USERS[0]);
    setCurrentRoleState('developer');
    setCompanies([]);
    setSelectedCompany(null);
    setProjects([]);
    setSelectedProject(null);
    setModels([]);
    setSelectedModel(null);
    setSelectedVersion(null);
    showToast('Signed out', 'info');
  }, []);

  // Fetch projects for the currently selected company. Clear stale projects immediately
  // so an upload cannot accidentally target a project from the previous company.
  useEffect(() => {
    let cancelled = false;
    setProjects([]);
    setSelectedProject(null);
    setModels([]);

    if (!selectedCompany) return () => { cancelled = true; };

    const fetchProjects = async () => {
      try {
        const projectList = await api.getProjects(selectedCompany.id);
        if (cancelled) return;
        setProjects(projectList);
        const preferred = projectList.find(project => project.id === selectedProject?.id);
        const nextProject = preferred || projectList[0] || null;
        setSelectedProject(nextProject);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load projects from API:', error);
        setProjects([]);
        setSelectedProject(null);
      }
    };

    void fetchProjects();
    return () => { cancelled = true; };
  }, [selectedCompany?.id]);

  // Fetch models when project/filters change
  const refreshModels = async () => {
    if (!selectedProject) {
      setModels([]);
      return;
    }
    let modelList: ModelItem[];
    try {
      modelList = await api.getModels((selectedProject as any).id, {
        q: searchQuery,
        status: statusFilter,
        tag: tagFilter,
        category: categoryFilter
      });
    } catch (error) {
      console.error('Failed to load models from API:', error);
      setModels([]);
      return;
    }

    modelList.sort((a, b) => {
      const polyA = a.latest_version?.stats.triangles || 0;
      const polyB = b.latest_version?.stats.triangles || 0;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'polycount_asc') return polyA - polyB;
      if (sortBy === 'polycount_desc') return polyB - polyA;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    setModels(modelList);

    if (selectedModel) {
      const updated = modelList.find(m => m.id === selectedModel.id);
      if (updated) {
        setSelectedModel(updated);
        if (selectedVersion) {
          const upVer = updated.versions?.find(v => v.id === selectedVersion.id);
          if (upVer) setSelectedVersion(upVer);
        }
      }
    }
  };

  useEffect(() => {
    refreshModels();
  }, [selectedProject, searchQuery, statusFilter, categoryFilter, tagFilter, sortBy]);

  // Refresh the persisted company -> project -> model hierarchy from the backend.
  const refreshAllData = async (preferredCompanyId?: string, preferredProjectId?: string) => {
    const companyList = await api.getCompanies();
    setCompanies(companyList);
    const company = companyList.find(c => c.id === (preferredCompanyId || selectedCompany?.id)) || companyList[0] || null;
    setSelectedCompany(company);
    if (!company) {
      setProjects([]); setSelectedProject(null); setModels([]);
      return;
    }
    const projectList = await api.getProjects(company.id);
    setProjects(projectList);
    const project = projectList.find(p => p.id === (preferredProjectId || selectedProject?.id)) || projectList[0] || null;
    setSelectedProject(project);
    if (!project) { setModels([]); return; }
    const modelList = await api.getModels(project.id, {
      q: searchQuery, status: statusFilter, tag: tagFilter, category: categoryFilter
    });
    setModels(modelList);
  };

  // Bulk selection
  const toggleSelectModel = (id: string) => {
    setSelectedModelIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const clearSelectedModels = () => setSelectedModelIds([]);
  const selectAllModels = () => setSelectedModelIds(models.map(m => m.id));

  const triggerBulkDownload = async () => {
    if (selectedModelIds.length === 0) return;
    const targetModels = models.filter(m => selectedModelIds.includes(m.id));
    showToast(`Packaging ${targetModels.length} models into one ZIP archive...`, 'info');

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const model of targetModels) {
        const version = model.latest_approved_version || model.latest_version;
        if (!version) continue;
        const folder = zip.folder(`${model.name}_${version.version_no}`);
        for (const file of version.files ?? []) {
          const blob = await api.downloadVersionFile(version.id, file.id, file.filename);
          folder?.file(file.filename, blob);
        }
      }
      if (Object.keys(zip.files).length === 0) throw new Error('Selected models have no downloadable files.');

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VR_Assets_Bulk_${(selectedCompany as any)?.slug || 'Export'}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      api.logDownload(
        currentUser,
        `Bulk (${targetModels.length} models)`,
        'batch',
        `Bulk_${targetModels.length}_models.zip`,
        'bulk',
        blob.size
      );

      showToast(`Successfully exported ${targetModels.length} models as ZIP! Download logged.`, 'success');
      clearSelectedModels();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : 'Failed to create bulk ZIP package.', 'error');
    }
  };

  const updateVersionStatus = async (versionId: string, status: ModelStatus, note?: string) => {
    if (!can('change_status')) {
      showToast('You do not have permission to change asset status', 'error');
      return;
    }
    try {
      const res = await api.updateVersionStatus(versionId, status, note);
      if (res.success) {
        showToast(`Version status updated to "${status}"`, 'success');
        if (status === 'Needs fix') {
          showToast(`Artist notification sent: "Needs fix - ${note || 'Revisions requested'}"`, 'warning');
        }
        await refreshModels();
      }
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        can,
        isLoginModalOpen,
        setIsLoginModalOpen,
        connectionStatus,
        handleLoginSuccess,
        handleLogout,
        companies,
        selectedCompany,
        setSelectedCompany,
        projects,
        selectedProject,
        setSelectedProject,
        models,
        selectedModel,
        setSelectedModel,
        selectedVersion,
        setSelectedVersion,
        compareVersions,
        setCompareVersions,
        activeTab,
        setActiveTab,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isCreateCompanyOpen,
        setIsCreateCompanyOpen,
        isCreateProjectOpen,
        setIsCreateProjectOpen,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        tagFilter,
        setTagFilter,
        sortBy,
        setSortBy,
        selectedModelIds,
        toggleSelectModel,
        clearSelectedModels,
        selectAllModels,
        refreshData: refreshAllData,
        updateVersionStatus,
        triggerBulkDownload,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
