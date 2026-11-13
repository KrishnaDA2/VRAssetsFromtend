import {

  Company,

  Project,

  ModelItem,

  ModelVersion,

  Comment,

  AuditLog,

  DownloadLog,

  StorageUsage,

  MaterialMapping,

  ModelStatus,

  User,

  Role,

  ModelCategory,

  TargetPlatform,

  ModelStats,

  FileRecord

} from '../types';

import {

  INITIAL_COMPANIES,

  INITIAL_PROJECTS,

  INITIAL_MODELS,

  INITIAL_USERS,

  INITIAL_AUDIT_LOGS,

  INITIAL_DOWNLOAD_LOGS,

  INITIAL_STORAGE_USAGE

} from './mockData';



// Set VITE_API_BASE_URL in .env.development.local / .env.production.

// Development fallback matches the backend URL shown in the user's browser error log.

const configuredApiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;

const BASE_URL = (configuredApiBaseUrl?.trim() || 'https://localhost:44371/api/v1')

  .replace(/\/+$/, '');



const STORAGE_PREFIX = 'vr_asset_dashboard_';

const KEY_COMPANIES = `${STORAGE_PREFIX}companies`;

const KEY_PROJECTS = `${STORAGE_PREFIX}projects`;

const KEY_MODELS = `${STORAGE_PREFIX}models`;

const KEY_USERS = `${STORAGE_PREFIX}users`;

const KEY_AUDIT = `${STORAGE_PREFIX}audit`;

const KEY_DOWNLOADS = `${STORAGE_PREFIX}downloads`;

const KEY_COMMENTS = `${STORAGE_PREFIX}comments`;

const KEY_TOKEN = `${STORAGE_PREFIX}auth_token`;



// Normalization Helpers (PascalCase from ASP.NET C# <-> camelCase)

function normalizeCompany(c: any): Company {

  return {

    id: String(c.id ?? c.Id ?? `comp_${Date.now()}`),

    name: c.name ?? c.Name ?? 'Unnamed Company',

    slug: c.slug ?? c.Slug ?? (c.name ?? c.Name ?? '').replace(/\s+/g, '_'),

    drive_folder_id: c.drive_folder_id ?? c.driveFolderId ?? c.DriveFolderId ?? '',

    storage_bytes: Number(c.storage_bytes ?? c.storageBytes ?? c.StorageBytes ?? 0),

    created_at: c.created_at ?? c.createdAt ?? c.CreatedAt ?? new Date().toISOString()

  };

}



function normalizeProject(p: any): Project {

  return {

    id: String(p.id ?? p.Id ?? `proj_${Date.now()}`),

    company_id: String(p.company_id ?? p.companyId ?? p.CompanyId ?? ''),

    name: p.name ?? p.Name ?? 'Unnamed Project',

    slug: p.slug ?? p.Slug ?? (p.name ?? p.Name ?? '').replace(/\s+/g, '_'),

    drive_folder_id: p.drive_folder_id ?? p.driveFolderId ?? p.DriveFolderId ?? '',

    description: p.description ?? p.Description ?? '',

    status: (p.status ?? p.Status ?? 'active').toLowerCase() === 'archived' ? 'archived' : 'active',

    storage_bytes: Number(p.storage_bytes ?? p.storageBytes ?? p.StorageBytes ?? 0),

    models_count: Number(p.models_count ?? p.modelsCount ?? p.ModelsCount ?? 0)

  };

}



function normalizeStats(s: any): ModelStats {

  if (!s) {

    return {

      triangles: 38500,

      vertices: 21400,

      meshes: 2,

      materials: 1,

      draw_calls: 2,

      bounds: { x: 1.2, y: 0.8, z: 0.5 },

      texture_count: 2,

      max_texture_res: 2048,

      file_size_bytes: 18500000,

      unit_detected: 'm'

    };

  }

  return {

    triangles: Number(s.triangles ?? s.Triangles ?? 0),

    vertices: Number(s.vertices ?? s.Vertices ?? 0),

    meshes: Number(s.meshes ?? s.Meshes ?? 1),

    materials: Number(s.materials ?? s.Materials ?? 1),

    draw_calls: Number(s.draw_calls ?? s.drawCalls ?? s.DrawCalls ?? 1),

    bounds: {

      x: Number(s.bounds?.x ?? s.Bounds?.X ?? s.bounds_x ?? 1.0),

      y: Number(s.bounds?.y ?? s.Bounds?.Y ?? s.bounds_y ?? 1.0),

      z: Number(s.bounds?.z ?? s.Bounds?.Z ?? s.bounds_z ?? 1.0)

    },

    texture_count: Number(s.texture_count ?? s.textureCount ?? s.TextureCount ?? 0),

    max_texture_res: Number(s.max_texture_res ?? s.maxTextureRes ?? s.MaxTextureRes ?? 2048),

    file_size_bytes: Number(s.file_size_bytes ?? s.fileSizeBytes ?? s.FileSizeBytes ?? 15000000),

    scale_warning: s.scale_warning ?? s.scaleWarning ?? s.ScaleWarning,

    unit_detected: s.unit_detected ?? s.unitDetected ?? s.UnitDetected ?? 'm'

  };

}



function normalizeFile(f: any): FileRecord {

  return {

    id: String(f.id ?? f.Id ?? `f_${Date.now()}`),

    version_id: String(f.version_id ?? f.versionId ?? f.VersionId ?? ''),

    kind: (f.kind ?? f.Kind ?? 'fbx').toLowerCase(),

    drive_file_id: f.drive_file_id ?? f.driveFileId ?? f.DriveFileId ?? '',

    filename: f.filename ?? f.fileName ?? f.Filename ?? f.FileName ?? 'asset.fbx',

    size_bytes: Number(f.size_bytes ?? f.sizeBytes ?? f.SizeBytes ?? 0),

    checksum: f.checksum ?? f.Checksum,

    download_url: f.download_url ?? f.downloadUrl ?? f.DownloadUrl,

    texture_type: f.texture_type ?? f.textureType ?? f.TextureType,

    resolution: f.resolution ?? f.Resolution

  };

}



function normalizeMapping(m: any): MaterialMapping {

  return {

    material_name: m.material_name ?? m.materialName ?? m.MaterialName ?? 'M_Default',

    slot: (m.slot ?? m.Slot ?? 'base_color').toLowerCase(),

    file_id: String(m.file_id ?? m.fileId ?? m.FileId ?? ''),

    filename: m.filename ?? m.fileName ?? m.Filename ?? m.FileName ?? '',

    color_space: (m.color_space ?? m.colorSpace ?? m.ColorSpace ?? 'linear') as any,

    flip_y: Boolean(m.flip_y ?? m.flipY ?? m.FlipY ?? false),

    tiling: {

      x: Number(m.tiling?.x ?? m.Tiling?.X ?? 1),

      y: Number(m.tiling?.y ?? m.Tiling?.Y ?? 1)

    },

    offset: {

      x: Number(m.offset?.x ?? m.Offset?.X ?? 0),

      y: Number(m.offset?.y ?? m.Offset?.Y ?? 0)

    }

  };

}



function normalizeVersion(v: any): ModelVersion {

  return {

    id: String(v.id ?? v.Id ?? `ver_${Date.now()}`),

    model_id: String(v.model_id ?? v.modelId ?? v.ModelId ?? ''),

    version_no: v.version_no ?? v.versionNo ?? v.VersionNo ?? 'v001',

    drive_folder_id: v.drive_folder_id ?? v.driveFolderId ?? v.DriveFolderId ?? '',

    notes: v.notes ?? v.Notes ?? '',

    status: (v.status ?? v.Status ?? 'In review') as ModelStatus,

    uploaded_by: String(v.uploaded_by ?? v.uploadedBy ?? v.UploadedBy ?? ''),

    uploaded_by_name: v.uploaded_by_name ?? v.uploadedByName ?? v.UploadedByName ?? 'Artist',

    created_at: v.created_at ?? v.createdAt ?? v.CreatedAt ?? new Date().toISOString(),

    processing_status: (v.processing_status ?? v.processingStatus ?? v.ProcessingStatus ?? 'Ready') as any,

    error_message: v.error_message ?? v.errorMessage ?? v.ErrorMessage,

    stats: normalizeStats(v.stats ?? v.Stats),

    files: Array.isArray(v.files ?? v.Files) ? (v.files ?? v.Files).map(normalizeFile) : [],

    material_mappings: Array.isArray(v.material_mappings ?? v.materialMappings ?? v.MaterialMappings)

      ? (v.material_mappings ?? v.materialMappings ?? v.MaterialMappings).map(normalizeMapping)

      : [],

    missing_textures: v.missing_textures ?? v.missingTextures ?? v.MissingTextures ?? []

  };

}



function normalizeModel(m: any): ModelItem {

  const versionsList = Array.isArray(m.versions ?? m.Versions)

    ? (m.versions ?? m.Versions).map(normalizeVersion)

    : [];



  const latestVerId = String(m.latest_version_id ?? m.latestVersionId ?? m.LatestVersionId ?? (versionsList[versionsList.length - 1]?.id || ''));

  const latestApprovedVerId = m.latest_approved_version_id ?? m.latestApprovedVersionId ?? m.LatestApprovedVersionId;



  const latest = versionsList.find((v: ModelVersion) => v.id === latestVerId) || versionsList[versionsList.length - 1];

  const approved = versionsList.find((v: ModelVersion) => v.id === latestApprovedVerId);



  return {

    id: String(m.id ?? m.Id ?? ''),

    project_id: String(m.project_id ?? m.projectId ?? m.ProjectId ?? ''),

    name: m.name ?? m.Name ?? 'Unnamed_Model',

    slug: m.slug ?? m.Slug ?? (m.name ?? m.Name ?? '').replace(/\s+/g, '_'),

    drive_folder_id: m.drive_folder_id ?? m.driveFolderId ?? m.DriveFolderId ?? '',

    category: (m.category ?? m.Category ?? 'prop').toLowerCase() as ModelCategory,

    tags: (() => {

      const rawTags = m.tags ?? m.Tags ?? m.tagsJson ?? m.TagsJson;

      if (Array.isArray(rawTags)) return rawTags.map(String);

      if (typeof rawTags === 'string') { try { const parsed = JSON.parse(rawTags); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; } }

      return [];

    })(),

    target_platform: (m.target_platform ?? m.targetPlatform ?? m.TargetPlatform ?? 'Quest') as TargetPlatform,

    latest_version_id: latestVerId,

    latest_approved_version_id: latestApprovedVerId ? String(latestApprovedVerId) : undefined,

    latest_version: latest,

    latest_approved_version: approved,

    versions: versionsList,

    created_at: m.created_at ?? m.createdAt ?? m.CreatedAt ?? new Date().toISOString(),

    updated_at: m.updated_at ?? m.updatedAt ?? m.UpdatedAt ?? new Date().toISOString()

  };

}



export type ConnectionState = 'connected' | 'unauthorized' | 'offline';



async function readApiError(response: Response): Promise<string> {

  const body = await response.text().catch(() => '');

  if (!body) return `HTTP ${response.status} ${response.statusText}`;

  try {

    const parsed = JSON.parse(body);

    // ASP.NET Core ValidationProblemDetails usually returns an `errors` object.

    if (parsed.errors && typeof parsed.errors === 'object') {

      const validationMessages = Object.entries(parsed.errors)

        .flatMap(([field, messages]) => {

          const values = Array.isArray(messages) ? messages : [messages];

          return values.map(message => `${field}: ${String(message)}`);

        });

      if (validationMessages.length) return validationMessages.join(' | ');

    }

    return parsed.message || parsed.title || parsed.detail || body;

  } catch {

    return body;

  }

}



class ApiService {

  public connectionStatus: ConnectionState = 'offline';

  public token: string | null = null;

  public onAuthRequired?: () => void;



  constructor() {

    this.token = localStorage.getItem(KEY_TOKEN);

    this.initMockStore();

    this.checkConnection();

  }



  public setToken(token: string | null) {

    this.token = token;

    if (token) {

      localStorage.setItem(KEY_TOKEN, token);

    } else {

      localStorage.removeItem(KEY_TOKEN);

    }

  }



  public getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {

    const headers: Record<string, string> = {

      'Accept': 'application/json',

      ...customHeaders

    };

    if (this.token) {

      headers['Authorization'] = `Bearer ${this.token}`;

    }

    return headers;

  }



  // Restore the real authenticated account from the API after a browser refresh.

  public async getCurrentUser(): Promise<any> {

    if (!this.token) {

      throw new Error('Authentication token not found.');

    }



    const response = await fetch(`${BASE_URL}/auth/me`, {

      method: 'GET',

      headers: this.getHeaders()

    });



    if (response.status === 401) {

      this.setToken(null);

      this.connectionStatus = 'unauthorized';

      throw new Error('Session expired. Please sign in again.');

    }



    if (!response.ok) {

      throw new Error(`Unable to restore user session (${response.status}): ${await readApiError(response)}`);

    }



    const payload = await response.json();

    const user = payload?.data ?? payload?.Data ?? payload?.user ?? payload?.User ?? payload;

    if (!user || typeof user !== 'object') {

      throw new Error('The current-user endpoint returned an invalid response.');

    }



    this.connectionStatus = 'connected';

    return user;

  }



  public async checkConnection(): Promise<ConnectionState> {

    try {

      const res = await fetch(`${BASE_URL}/companies`, {

        method: 'GET',

        headers: this.getHeaders()

      });



      if (res.status === 200) {

        this.connectionStatus = 'connected';

        console.log(`%c[VR Hub API] Connected & Authenticated with backend at ${BASE_URL}`, 'color: #10b981; font-weight: bold;');

      } else if (res.status === 401) {

        this.connectionStatus = 'unauthorized';

        console.warn(`[VR Hub API] Backend reachable at ${BASE_URL}, but requires authentication (401 Unauthorized).`);

      } else {

        this.connectionStatus = 'connected';

      }

    } catch (err) {

      this.connectionStatus = 'offline';

      console.warn(`[VR Hub API] Cannot connect to ${BASE_URL}:`, err);

    }

    return this.connectionStatus;

  }



  // --- Auth Login (POST /api/v1/auth/login) ---

  async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> {

    const normalizedEmail = email.trim();



    if (!normalizedEmail || !password) {

      return { success: false, message: 'Email and password are required.' };

    }



    try {

      const res = await fetch(`${BASE_URL}/auth/login`, {

        method: 'POST',

        headers: {

          'Content-Type': 'application/json',

          Accept: 'application/json'

        },

        // Keep both names for compatibility with LoginRequest DTOs that use

        // either Email or Username. ASP.NET Core normally ignores unknown fields.

        body: JSON.stringify({ email: normalizedEmail, username: normalizedEmail, password })

      });



      const responseText = await res.text();

      let data: any = {};

      try {

        data = responseText ? JSON.parse(responseText) : {};

      } catch {

        return {

          success: false,

          message: `Login API returned an invalid response (HTTP ${res.status}).`

        };

      }



      if (!res.ok) {

        const message = data.errors && typeof data.errors === 'object'

          ? Object.entries(data.errors)

              .flatMap(([field, messages]) =>

                (Array.isArray(messages) ? messages : [messages])

                  .map(value => `${field}: ${String(value)}`)

              )

              .join(' | ')

          : data.message ?? data.Message ?? data.detail ?? data.title ?? `Login failed (HTTP ${res.status}).`;



        console.error('[VR Hub API] Login failed:', res.status, message);

        return { success: false, message };

      }



      const root = data?.data ?? data;

      const receivedToken =

        root?.token ?? root?.Token ??

        root?.accessToken ?? root?.AccessToken ??

        root?.access_token ?? root?.jwt ?? root?.Jwt;



      if (typeof receivedToken !== 'string' || !receivedToken.trim()) {

        this.setToken(null);

        return {

          success: false,

          message: 'Login succeeded but the response did not contain a JWT access token.'

        };

      }



      const rawUser = root?.user ?? root?.User ?? data?.user ?? data?.User ?? root;

      const userId =

        rawUser?.id ?? rawUser?.Id ?? rawUser?.userId ?? rawUser?.UserId ??

        rawUser?.user_id ?? rawUser?.UserID ?? rawUser?.sub ?? rawUser?.Subject;



      const normalizedUser = {

        ...(rawUser && typeof rawUser === 'object' ? rawUser : {}),

        id: userId == null ? '' : String(userId),

        username: rawUser?.username ?? rawUser?.Username ?? normalizedEmail,

        name:

          rawUser?.name ?? rawUser?.Name ?? rawUser?.fullName ?? rawUser?.FullName ??

          rawUser?.displayName ?? rawUser?.DisplayName ?? normalizedEmail,

        email: rawUser?.email ?? rawUser?.Email ?? normalizedEmail,

        role:

          rawUser?.role ?? rawUser?.Role ?? rawUser?.globalRole ??

          rawUser?.GlobalRole ?? rawUser?.global_role ?? ''

      };



      this.setToken(receivedToken.trim());

      this.connectionStatus = 'connected';

      return { success: true, user: normalizedUser };

    } catch (error: unknown) {

      this.connectionStatus = 'offline';

      return {

        success: false,

        message: error instanceof Error ? error.message : 'Cannot reach backend login endpoint.'

      };

    }

  }



  private initMockStore() {

    if (!localStorage.getItem(KEY_COMPANIES)) {

      localStorage.setItem(KEY_COMPANIES, JSON.stringify(INITIAL_COMPANIES));

    }

    if (!localStorage.getItem(KEY_PROJECTS)) {

      localStorage.setItem(KEY_PROJECTS, JSON.stringify(INITIAL_PROJECTS));

    }

    if (!localStorage.getItem(KEY_MODELS)) {

      localStorage.setItem(KEY_MODELS, JSON.stringify(INITIAL_MODELS));

    }

    if (!localStorage.getItem(KEY_USERS)) {

      localStorage.setItem(KEY_USERS, JSON.stringify(INITIAL_USERS));

    }

    if (!localStorage.getItem(KEY_AUDIT)) {

      localStorage.setItem(KEY_AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));

    }

    if (!localStorage.getItem(KEY_DOWNLOADS)) {

      localStorage.setItem(KEY_DOWNLOADS, JSON.stringify(INITIAL_DOWNLOADS_LOGS_INITIAL));

    }

    if (!localStorage.getItem(KEY_COMMENTS)) {

      localStorage.setItem(KEY_COMMENTS, JSON.stringify(INITIAL_COMMENTS));

    }

  }



  // --- Companies ---

  async getCompanies(): Promise<Company[]> {

    const res = await fetch(`${BASE_URL}/companies`, { headers: this.getHeaders() });

    if (res.status === 401) {

      this.connectionStatus = 'unauthorized';

      this.onAuthRequired?.();

      throw new Error('Companies request unauthorized (401). Please sign in again.');

    }

    if (!res.ok) throw new Error(`Load companies failed (${res.status}): ${await readApiError(res)}`);

    const raw = await res.json();

    const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? raw.$values ?? []);

    if (!Array.isArray(list)) throw new Error('Companies API returned an unexpected response format.');

    this.connectionStatus = 'connected';

    return list.map(normalizeCompany);

  }



  async createCompany(name: string): Promise<Company> {

    const trimmedName = name.trim();

    if (!trimmedName) throw new Error('Company name is required.');

    const slug = trimmedName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

    const res = await fetch(`${BASE_URL}/companies`, {

      method: 'POST',

      headers: this.getHeaders({ 'Content-Type': 'application/json' }),

      body: JSON.stringify({ name: trimmedName, slug })

    });

    if (res.status === 401) {

      this.connectionStatus = 'unauthorized';

      this.onAuthRequired?.();

      throw new Error('Create company unauthorized (401). Please sign in again.');

    }

    if (!res.ok) throw new Error(`Create company failed (${res.status}): ${await readApiError(res)}`);

    const text = await res.text();

    const data = text ? JSON.parse(text) : { name: trimmedName, slug };

    if (!data.id && !data.Id) {

      // A successful status without an ID cannot safely be selected as a persisted company.

      const refreshed = await this.getCompanies();

      const match = refreshed.find(c => c.slug === slug || c.name === trimmedName);

      if (match) return match;

      throw new Error('Company API returned success but no company ID. Check the POST /companies response.');

    }

    return normalizeCompany(data);

  }



  // --- Projects ---

  async getProjects(companyId: string): Promise<Project[]> {

    if (!companyId?.trim()) return [];

    const res = await fetch(`${BASE_URL}/companies/${encodeURIComponent(companyId)}/projects`, { headers: this.getHeaders() });

    if (res.status === 401) {

      this.connectionStatus = 'unauthorized'; this.onAuthRequired?.();

      throw new Error('Projects request unauthorized (401). Please sign in again.');

    }

    if (!res.ok) throw new Error(`Load projects failed (${res.status}): ${await readApiError(res)}`);

    const raw = await res.json();

    const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? raw.$values ?? []);

    if (!Array.isArray(list)) throw new Error('Projects API returned an unexpected response format.');

    this.connectionStatus = 'connected';

    return list.map(normalizeProject);

  }



  async createProject(companyId: string, name: string, description: string): Promise<Project> {

    if (!companyId?.trim()) throw new Error('Company ID missing. Select a real company first.');

    const trimmedName = name.trim();

    if (!trimmedName) throw new Error('Project name is required.');

    const slug = trimmedName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');

    const res = await fetch(`${BASE_URL}/companies/${encodeURIComponent(companyId)}/projects`, {

      method: 'POST',

      headers: this.getHeaders({ 'Content-Type': 'application/json' }),

      body: JSON.stringify({ name: trimmedName, slug, description: description.trim(), companyId })

    });

    if (res.status === 401) {

      this.connectionStatus = 'unauthorized'; this.onAuthRequired?.();

      throw new Error('Create project unauthorized (401). Please sign in again.');

    }

    if (!res.ok) throw new Error(`Create project failed (${res.status}): ${await readApiError(res)}`);

    const text = await res.text();

    const data = text ? JSON.parse(text) : null;

    if (!data || !(data.id ?? data.Id)) {

      const refreshed = await this.getProjects(companyId);

      const match = refreshed.find(p => p.slug === slug || p.name === trimmedName);

      if (match) return match;

      throw new Error('Project API returned success but no project ID. Check the POST projects response.');

    }

    return normalizeProject({ ...data, companyId: data.companyId ?? data.CompanyId ?? companyId });

  }



  async addProjectMember(projectId: string, userId: string, role: Role) {

    try {

      await fetch(`${BASE_URL}/projects/${projectId}/members`, {

        method: 'POST',

        headers: this.getHeaders({ 'Content-Type': 'application/json' }),

        body: JSON.stringify({ user_id: userId, role })

      });

    } catch (e) {

      console.warn('Backend add member failed:', e);

    }

    return { success: true, projectId, userId, role };

  }



  // --- Models ---

  async getModels(projectId: string, params?: { q?: string; status?: string; tag?: string; category?: string }): Promise<ModelItem[]> {

    if (!projectId?.trim()) return [];

    const query = new URLSearchParams();

    if (params?.q) query.append('q', params.q);

    if (params?.status && params.status !== 'all') query.append('status', params.status);

    if (params?.tag && params.tag !== 'all') query.append('tag', params.tag);

    if (params?.category && params.category !== 'all') query.append('category', params.category);

    const res = await fetch(`${BASE_URL}/projects/${encodeURIComponent(projectId)}/models${query.size ? `?${query.toString()}` : ''}`, { headers: this.getHeaders() });

    if (res.status === 401) {

      this.connectionStatus = 'unauthorized'; this.onAuthRequired?.();

      throw new Error('Models request unauthorized (401). Please sign in again.');

    }

    if (!res.ok) throw new Error(`Load models failed (${res.status}): ${await readApiError(res)}`);

    const raw = await res.json();

    const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? raw.$values ?? []);

    if (!Array.isArray(list)) throw new Error('Models API returned an unexpected response format.');

    this.connectionStatus = 'connected';

    return list.map(normalizeModel);

  }



  // Fetch all versions belonging to a model.

  // Backend route expected: GET /api/v1/models/{modelId}/versions

  async getModelVersions(modelId: string): Promise<ModelVersion[]> {

    if (!modelId?.trim()) {

      throw new Error('Model ID is required to load versions.');

    }



    const endpoint = `${BASE_URL}/models/${encodeURIComponent(modelId)}/versions`;

    const res = await fetch(endpoint, { headers: this.getHeaders() });



    if (res.status === 401) {

      this.connectionStatus = 'unauthorized';

      this.onAuthRequired?.();

      throw new Error('Model versions request unauthorized (401). Please sign in again.');

    }



    if (!res.ok) {

      throw new Error(`Load model versions failed (${res.status}): ${await readApiError(res)}`);

    }



    const raw = await res.json();

    const list = Array.isArray(raw)

      ? raw

      : (raw.data ?? raw.items ?? raw.$values ?? []);



    if (!Array.isArray(list)) {

      throw new Error('Versions API returned an unexpected response format.');

    }



    this.connectionStatus = 'connected';

    const versions = list.map(normalizeVersion);

    return Promise.all(versions.map(async version => ({

      ...version,

      files: version.id ? await this.getVersionFiles(version.id) : (version.files ?? [])

    })));

  }



  async createModel(projectId: string, data: {
    name: string;
    category: ModelCategory;
    tags: string[];
    target_platform: TargetPlatform;
  }): Promise<ModelItem> {
    if (!projectId?.trim()) {
      throw new Error('Project ID missing. Select a project before creating a model.');
    }

    const name = data.name?.trim();
    if (!name) throw new Error('Model name is required.');

    const slug = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);

    if (!slug) {
      throw new Error('Model name must contain at least one letter or number.');
    }

    const endpoint = `${BASE_URL}/projects/${encodeURIComponent(projectId)}/models`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        name,
        slug,
        category: data.category,
        tagsJson: JSON.stringify(data.tags ?? [])
      })
    });

    if (response.status === 401) {
      this.connectionStatus = 'unauthorized';
      this.onAuthRequired?.();
      throw new Error('Creating model unauthorized (401). Please sign in again.');
    }

    if (!response.ok) {
      throw new Error(
        `Create model failed (${response.status}) at ${endpoint}: ${await readApiError(response)}`
      );
    }

    const responsePayload = await response.json();
    const modelPayload =
      responsePayload?.data ??
      responsePayload?.Data ??
      responsePayload?.model ??
      responsePayload?.Model ??
      responsePayload;

    if (!modelPayload || typeof modelPayload !== 'object') {
      throw new Error('Create model API returned an invalid response.');
    }

    const model = normalizeModel({
      ...modelPayload,
      projectId:
        modelPayload.projectId ??
        modelPayload.ProjectId ??
        projectId
    });

    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(model.id)) {
      throw new Error(
        `Model was created, but the API did not return a valid GUID. Received: "${model.id || 'empty'}".`
      );
    }

    this.connectionStatus = 'connected';
    return model;
  }

  // --- Versions & Upload ---

  // Files are uploaded to the Drive-backed AssetFilesController endpoint.

  async uploadVersion(modelId: string, payload: {
    notes: string;
    files: { name: string; size: number; type: string; fileBlob?: File }[];
    uploaderId: string;
    uploaderName: string;
    stats?: Partial<ModelVersion['stats']>;
    onProgress?: (percent: number, stepText: string) => void;
  }): Promise<ModelVersion> {
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!guidRegex.test(modelId ?? '')) {
      throw new Error(`Invalid Model ID "${modelId || ''}". A database GUID is required.`);
    }

    const uploadFiles = (payload.files ?? []).filter(
      item => item.fileBlob instanceof File
    );

    if (!uploadFiles.length) {
      throw new Error('Select at least one file.');
    }

    if (!uploadFiles.some(item => item.fileBlob!.name.toLowerCase().endsWith('.fbx'))) {
      throw new Error('At least one FBX file is required.');
    }

    const maxTotalBytes = 500 * 1024 * 1024;
    const totalBytes = uploadFiles.reduce(
      (total, item) => total + item.fileBlob!.size,
      0
    );

    if (totalBytes > maxTotalBytes) {
      throw new Error('Total upload size cannot exceed 500 MB.');
    }

    for (const item of uploadFiles) {
      if (item.fileBlob!.size <= 0) {
        throw new Error(`${item.name} is empty and cannot be uploaded.`);
      }
    }

    // This route creates the version and saves all file records in one backend operation.
    // POST /api/v1/models/{modelId}/versions/upload
    const endpoint =
      `${BASE_URL}/models/${encodeURIComponent(modelId)}/versions/upload`;

    const form = new FormData();
    form.append('Notes', payload.notes ?? '');

    for (const item of uploadFiles) {
      form.append('Files', item.fileBlob!, item.fileBlob!.name);
    }

    payload.onProgress?.(5, 'Creating version and uploading files to Google Drive...');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(), // Do not set Content-Type for FormData.
      body: form
    });

    if (response.status === 401) {
      this.connectionStatus = 'unauthorized';
      this.onAuthRequired?.();
      throw new Error('Upload unauthorized (401). Please sign in again.');
    }

    if (response.status === 403) {
      throw new Error(
        'You do not have permission to upload versions. Admin or 3DArtist role is required.'
      );
    }

    if (!response.ok) {
      throw new Error(
        `Version upload failed (${response.status}) at ${endpoint}: ${await readApiError(response)}`
      );
    }

    const responsePayload = await response.json();
    const versionPayload =
      responsePayload?.data ??
      responsePayload?.Data ??
      responsePayload?.version ??
      responsePayload?.Version ??
      responsePayload;

    if (!versionPayload || typeof versionPayload !== 'object') {
      throw new Error('Upload API returned an invalid version response.');
    }

    const versionId = String(
      versionPayload.id ??
      versionPayload.Id ??
      versionPayload.versionId ??
      versionPayload.VersionId ??
      ''
    );

    if (!guidRegex.test(versionId)) {
      throw new Error(
        `Upload succeeded but the API did not return a valid Version GUID. Received: "${versionId}".`
      );
    }

    const returnedFiles =
      versionPayload.files ??
      versionPayload.Files ??
      [];

    if (!Array.isArray(returnedFiles)) {
      throw new Error('Upload API returned an invalid files collection.');
    }

    const normalizedFiles = returnedFiles.map(normalizeFile);
    const missingFiles = uploadFiles.filter(item =>
      !normalizedFiles.some(saved =>
        saved.filename.toLowerCase() === item.fileBlob!.name.toLowerCase() &&
        saved.size_bytes === item.fileBlob!.size &&
        Boolean(saved.drive_file_id)
      )
    );

    if (missingFiles.length) {
      throw new Error(
        `Upload response did not confirm these saved files: ${missingFiles.map(item => item.name).join(', ')}.`
      );
    }

    payload.onProgress?.(100, 'Upload successful. Files are saved in Google Drive.');

    this.connectionStatus = 'connected';

    return normalizeVersion({
      ...versionPayload,
      id: versionId,
      modelId,
      files: normalizedFiles
    });
  }

  async uploadTextures(versionId: string, files: File[], onProgress?: (percent: number, stepText: string) => void): Promise<void> {

    if (!versionId?.trim()) throw new Error('Version ID is required.');

    if (!files.length) throw new Error('Select at least one texture.');



    for (let index = 0; index < files.length; index++) {

      const file = files[index];

      const form = new FormData();

      form.append('file', file, file.name);

      form.append('kind', 'Texture');

      const response = await fetch(`${BASE_URL}/versions/${encodeURIComponent(versionId)}/files/upload`, {

        method: 'POST',

        headers: this.getHeaders(),

        body: form

      });

      if (!response.ok) {

        throw new Error(`Google Drive texture upload failed for ${file.name} (${response.status}): ${await readApiError(response)}`);

      }

      onProgress?.(Math.round(((index + 1) / files.length) * 90), `Uploading ${file.name} to Google Drive...`);

    }



    const savedFiles = await this.getVersionFiles(versionId);

    const missing = files.filter(file => !savedFiles.some(saved =>

      saved.filename.toLowerCase() === file.name.toLowerCase() &&

      saved.size_bytes === file.size && Boolean(saved.drive_file_id)

    ));

    if (missing.length) throw new Error(`Texture upload could not be verified for: ${missing.map(file => file.name).join(', ')}.`);

    onProgress?.(100, 'Textures saved in Google Drive and available in preview.');

  }



  async getVersionFiles(versionId: string): Promise<FileRecord[]> {

    if (!versionId?.trim()) return [];

    const response = await fetch(`${BASE_URL}/versions/${encodeURIComponent(versionId)}/files`, {

      headers: this.getHeaders()

    });

    if (response.status === 401) {

      this.connectionStatus = 'unauthorized'; this.onAuthRequired?.();

      throw new Error('File list request unauthorized (401). Please sign in again.');

    }

    if (!response.ok) throw new Error(`Load version files failed (${response.status}): ${await readApiError(response)}`);

    const raw = await response.json();

    const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? raw.$values ?? []);

    if (!Array.isArray(list)) throw new Error('Version files API returned an unexpected response format.');

    return list.map(normalizeFile);

  }



  async downloadVersionFile(versionId: string, fileId: string, filename: string): Promise<Blob> {

    const response = await fetch(`${BASE_URL}/versions/${encodeURIComponent(versionId)}/files/${encodeURIComponent(fileId)}/download`, {

      headers: this.getHeaders()

    });

    if (response.status === 401) { this.onAuthRequired?.(); throw new Error('Session expired. Please sign in again.'); }

    if (!response.ok) throw new Error(`Download failed (${response.status}): ${await readApiError(response)}`);

    return response.blob();

  }



  async downloadDriveFile(fileId: string): Promise<Blob> {

    if (!fileId?.trim()) {

      throw new Error('Google Drive file ID is missing.');

    }



    const endpoint = `${BASE_URL}/google-drive/files/${encodeURIComponent(fileId)}/download`;

    const response = await fetch(endpoint, {

      method: 'GET',

      headers: {

        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})

      }

    });



    if (response.status === 401) {

      this.connectionStatus = 'unauthorized';

      this.onAuthRequired?.();

      throw new Error('Download unauthorized (401). Please sign in again.');

    }



    if (!response.ok) {

      let detail = '';

      try {

        const payload = await response.json();

        detail = payload.message ?? payload.title ?? JSON.stringify(payload);

      } catch {

        detail = await response.text().catch(() => '');

      }

      throw new Error(`File download failed (${response.status})${detail ? `: ${detail}` : ''}`);

    }



    return await response.blob();

  }



  // --- Google Drive ---

  async getVersionDriveFolder(versionId: string): Promise<{ folderId: string; folderUrl: string }> {

    if (!versionId?.trim()) throw new Error('Version ID is required to open its Google Drive folder.');



    const endpoint = `${BASE_URL}/google-drive/versions/${encodeURIComponent(versionId)}/folder`;

    const response = await fetch(endpoint, { headers: this.getHeaders() });



    if (response.status === 401) {

      this.connectionStatus = 'unauthorized';

      this.onAuthRequired?.();

      throw new Error('Google Drive folder request unauthorized (401). Please sign in again.');

    }

    if (!response.ok) {

      throw new Error(`Get Google Drive folder failed (${response.status}): ${await readApiError(response)}`);

    }



    const data = await response.json();

    const folderId = String(data.folderId ?? data.FolderId ?? data.driveFolderId ?? data.DriveFolderId ?? '');

    const folderUrl = String(

      data.folderUrl ??

      data.FolderUrl ??

      data.driveFolderUrl ??

      data.DriveFolderUrl ??

      (folderId ? `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}` : '')

    );



    if (!folderId || !folderUrl) {

      throw new Error('Backend did not return a Google Drive folder for this version.');

    }

    return { folderId, folderUrl };

  }



  async openVersionDriveFolder(versionId: string): Promise<void> {

    const { folderUrl } = await this.getVersionDriveFolder(versionId);

    window.open(folderUrl, '_blank', 'noopener,noreferrer');

  }



  // --- Version details & status ---

  async getVersion(versionId: string): Promise<ModelVersion | null> {

    try {

      const res = await fetch(`${BASE_URL}/versions/${versionId}`, {

        headers: this.getHeaders()

      });

      if (res.ok) {

        const data = await res.json();

        return normalizeVersion(data);

      }

    } catch {}



    const models = this.getMock<ModelItem[]>(KEY_MODELS);

    for (const m of models) {

      const v = m.versions?.find(ver => ver.id === versionId);

      if (v) return normalizeVersion(v);

    }

    return null;

  }



  async updateVersionStatus(versionId: string, status: ModelStatus, note?: string): Promise<{ success: boolean; version: ModelVersion }> {

    try {

      const res = await fetch(`${BASE_URL}/versions/${versionId}/status`, {

        method: 'PATCH',

        headers: this.getHeaders({ 'Content-Type': 'application/json' }),

        body: JSON.stringify({ status, note })

      });

      if (res.ok) {

        const data = await res.json();

        return { success: true, version: normalizeVersion(data) };

      }

    } catch {}



    const models = this.getMock<ModelItem[]>(KEY_MODELS);

    let targetVersion: ModelVersion | null = null;

    let targetModel: ModelItem | null = null;



    for (const m of models) {

      const v = m.versions?.find(ver => ver.id === versionId);

      if (v) {

        v.status = status;

        targetVersion = v;

        targetModel = m;

        if (status === 'Approved') {

          m.latest_approved_version_id = v.id;

        }

        break;

      }

    }



    if (!targetVersion || !targetModel) throw new Error('Version not found');



    this.saveMock(KEY_MODELS, models);

    this.addAuditLog('status_change', 'version', versionId, `${targetModel.name} ${targetVersion.version_no}`, `Status changed to ${status}${note ? ` (${note})` : ''}`);



    return { success: true, version: targetVersion };

  }



  async saveMaterialMappings(versionId: string, mappings: MaterialMapping[]): Promise<{ success: boolean }> {

    try {

      const res = await fetch(`${BASE_URL}/versions/${versionId}/materials`, {

        method: 'PUT',

        headers: this.getHeaders({ 'Content-Type': 'application/json' }),

        body: JSON.stringify({ mappings })

      });

      if (res.ok) return { success: true };

    } catch {}



    const models = this.getMock<ModelItem[]>(KEY_MODELS);

    for (const m of models) {

      const v = m.versions?.find(ver => ver.id === versionId);

      if (v) {

        v.material_mappings = mappings;

        this.saveMock(KEY_MODELS, models);

        this.addAuditLog('material_save', 'version', versionId, `${m.name} ${v.version_no}`, `Updated preview/materials.json with ${mappings.length} slot mappings`);

        return { success: true };

      }

    }

    return { success: false };

  }



  // --- Comments ---

  async getComments(versionId: string): Promise<Comment[]> {

    try {

      const res = await fetch(`${BASE_URL}/versions/${versionId}/comments`, {

        headers: this.getHeaders()

      });

      if (res.ok) {

        const raw = await res.json();

        const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);

        return list.map((c: any) => ({

          id: String(c.id ?? c.Id),

          version_id: String(c.version_id ?? c.versionId ?? c.VersionId),

          user_id: String(c.user_id ?? c.userId ?? c.UserId),

          user_name: c.user_name ?? c.userName ?? c.UserName ?? 'User',

          user_role: (c.user_role ?? c.userRole ?? c.UserRole ?? 'developer') as Role,

          body: c.body ?? c.Body ?? '',

          pin_position: c.pin_position ?? c.pinPosition ?? c.PinPosition ?? null,

          resolved: Boolean(c.resolved ?? c.Resolved ?? false),

          created_at: c.created_at ?? c.createdAt ?? c.CreatedAt ?? new Date().toISOString()

        }));

      }

    } catch {}



    const comments = this.getMock<Comment[]>(KEY_COMMENTS);

    return comments.filter(c => c.version_id === versionId);

  }



  async addComment(versionId: string, body: string, user: User, pinPosition?: { x: number; y: number; z: number } | null): Promise<Comment> {

    try {

      const res = await fetch(`${BASE_URL}/versions/${versionId}/comments`, {

        method: 'POST',

        headers: this.getHeaders({ 'Content-Type': 'application/json' }),

        body: JSON.stringify({

          body,

          user_id: user.id,

          pin_position: pinPosition || null

        })

      });

      if (res.ok) {

        const data = await res.json();

        return {

          id: String(data.id ?? data.Id),

          version_id: versionId,

          user_id: user.id,

          user_name: user.name,

          user_role: String(user.global_role).toLowerCase() === 'admin' ? 'admin' : (String(user.global_role).toLowerCase().includes('artist') ? 'artist' : 'developer'),

          body: data.body ?? data.Body ?? body,

          pin_position: data.pin_position ?? data.pinPosition ?? pinPosition ?? null,

          resolved: false,

          created_at: new Date().toISOString()

        };

      }

    } catch {}



    const comments = this.getMock<Comment[]>(KEY_COMMENTS);

    const newComment: Comment = {

      id: `comm_${Date.now()}`,

      version_id: versionId,

      user_id: user.id,

      user_name: user.name,

      user_role: String(user.global_role).toLowerCase() === 'admin' ? 'admin' : (String(user.global_role).toLowerCase().includes('artist') ? 'artist' : 'developer'),

      body,

      pin_position: pinPosition || null,

      resolved: false,

      created_at: new Date().toISOString()

    };

    comments.push(newComment);

    this.saveMock(KEY_COMMENTS, comments);

    return newComment;

  }



  async resolveComment(commentId: string): Promise<boolean> {

    const comments = this.getMock<Comment[]>(KEY_COMMENTS);

    const c = comments.find(item => item.id === commentId);

    if (c) {

      c.resolved = !c.resolved;

      this.saveMock(KEY_COMMENTS, comments);

      return true;

    }

    return false;

  }



  // --- Downloads & Audit ---

  logDownload(user: User, modelName: string, versionNo: string, filename: string, kind: 'fbx' | 'package' | 'bulk', sizeBytes: number) {

    const downloads = this.getMock<DownloadLog[]>(KEY_DOWNLOADS);

    const dl: DownloadLog = {

      id: `dl_${Date.now()}`,

      user_id: user.id,

      user_name: user.name,

      file_id: `f_${Date.now()}`,

      filename,

      model_name: modelName,

      version_no: versionNo,

      kind,

      size_bytes: sizeBytes,

      timestamp: new Date().toISOString()

    };

    downloads.unshift(dl);

    this.saveMock(KEY_DOWNLOADS, downloads);

    this.addAuditLog('download', 'file', dl.id, filename, `User ${user.name} downloaded ${kind.toUpperCase()} (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`);

  }



  async getAuditLogs(): Promise<AuditLog[]> {

    try {

const res = await fetch(`${BASE_URL}/audit-logs`, {

          headers: this.getHeaders()

      });

      if (res.ok) {

        const raw = await res.json();

        const list = Array.isArray(raw) ? raw : (raw.data ?? raw.items ?? []);

        return list.map((a: any) => ({

          id: String(a.id ?? a.Id),

          user_id: String(a.user_id ?? a.userId ?? a.UserId),

          user_name: a.user_name ?? a.userName ?? a.UserName ?? 'User',

          action: (a.action ?? a.Action ?? 'download').toLowerCase() as any,

          target_type: (a.target_type ?? a.targetType ?? a.TargetType ?? 'model').toLowerCase() as any,

          target_id: String(a.target_id ?? a.targetId ?? a.TargetId ?? ''),

          target_name: a.target_name ?? a.targetName ?? a.TargetName ?? '',

          details: a.details ?? a.Details ?? '',

          timestamp: a.timestamp ?? a.Timestamp ?? new Date().toISOString()

        }));

      }

    } catch {}



    return this.getMock<AuditLog[]>(KEY_AUDIT);

  }



  async getDownloadLogs(): Promise<DownloadLog[]> {

    return this.getMock<DownloadLog[]>(KEY_DOWNLOADS);

  }



  async getStorageUsage(): Promise<StorageUsage[]> {

    try {

      const res = await fetch(`${BASE_URL}/admin/storage`, {

        headers: this.getHeaders()

      });

      if (res.ok) {

        const raw = await res.json();

        return Array.isArray(raw) ? raw : [raw];

      }

    } catch {}



    return INITIAL_STORAGE_USAGE;

  }



  private addAuditLog(

    action: AuditLog['action'],

    target_type: AuditLog['target_type'],

    target_id: string,

    target_name: string,

    details: string

  ) {

    const logs = this.getMock<AuditLog[]>(KEY_AUDIT);

    const user = INITIAL_USERS[0];

    logs.unshift({

      id: `aud_${Date.now()}`,

      user_id: user.id,

      user_name: user.name,

      action,

      target_type,

      target_id,

      target_name,

      details,

      timestamp: new Date().toISOString()

    });

    this.saveMock(KEY_AUDIT, logs);

  }



  private getMock<T>(key: string): T {

    try {

      const data = localStorage.getItem(key);

      return data ? JSON.parse(data) as T : [] as unknown as T;

    } catch {

      return [] as unknown as T;

    }

  }



  private saveMock<T>(key: string, data: T) {

    localStorage.setItem(key, JSON.stringify(data));

  }

}



const INITIAL_DOWNLOADS_LOGS_INITIAL: DownloadLog[] = INITIAL_DOWNLOAD_LOGS;

const INITIAL_COMMENTS: Comment[] = [

  {

    id: 'comm_1',

    version_id: 'ver_bat_v001',

    user_id: 'usr_mgr_1',

    user_name: 'Alex Vance',

    user_role: 'developer',

    body: 'The terminal pins have UV overlapping and normal inversion. Please fix topology and reduce tris below 50k for Quest budget.',

    pin_position: { x: 0.12, y: 0.28, z: 0.05 },

    resolved: true,

    created_at: '2026-04-10T14:20:00Z'

  },

  {

    id: 'comm_2',

    version_id: 'ver_bat_v002',

    user_id: 'usr_dev_1',

    user_name: 'Elena Rostova',

    user_role: 'developer',

    body: 'Looks fantastic in Unity VR test! Normal map looks great with OpenGL convention.',

    pin_position: null,

    resolved: false,

    created_at: '2026-04-12T17:40:00Z'

  }

];



export const api = new ApiService();
