
export type Role = 'admin' | 'artist' | 'developer';

export type ModelStatus =
  | 'Draft'
  | 'In review'
  | 'Approved'
  | 'Needs fix'
  | 'Archived';

export type ProcessingStatus =
  | 'Pending'
  | 'Processing'
  | 'Ready'
  | 'Failed';

export type ModelCategory =
  | 'prop'
  | 'environment'
  | 'character'
  | 'vehicle'
  | 'UI';

export type TargetPlatform = 'Quest' | 'PC VR';

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  google_id?: string;
  global_role:
    | 'Admin'
    | 'Developer'
    | '3DArtist'
    | '3D Artist'
    | 'admin'
    | 'developer'
    | 'artist'
    | 'user';
  avatar_url?: string;
  active: boolean;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: Role;
  user?: User;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  drive_folder_id?: string;
  storage_bytes?: number;
  created_at: string;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  drive_folder_id?: string;
  description: string;
  status: 'active' | 'archived';
  storage_bytes?: number;
  models_count?: number;
}

export interface ModelStats {
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
  draw_calls: number;
  bounds: {
    x: number;
    y: number;
    z: number;
  };
  texture_count: number;
  max_texture_res: number;
  file_size_bytes: number;
  scale_warning?: string;
  unit_detected?: string;
}

export type FileKind =
  | 'fbx'
  | 'texture'
  | 'thumbnail'
  | 'uv_image'
  | 'materials_json';

export interface FileRecord {
  id: string;
  version_id: string;
  kind: FileKind;
  drive_file_id?: string | null;
  filename: string;
  size_bytes: number;
  checksum?: string;
  download_url?: string;
  texture_type?: SlotType;
  resolution?: string;
}

export type SlotType =
  | 'base_color'
  | 'normal'
  | 'metallic'
  | 'roughness'
  | 'ao'
  | 'emissive'
  | 'opacity';

export type ColorSpace = 'sRGB' | 'linear';
export type NormalConvention = 'OpenGL' | 'DirectX';

export interface MaterialMapping {
  material_name: string;
  slot: SlotType;
  file_id: string;
  filename: string;
  color_space: ColorSpace;
  flip_y: boolean;
  tiling: {
    x: number;
    y: number;
  };
  offset: {
    x: number;
    y: number;
  };
}

export interface Comment {
  id: string;
  version_id: string;
  user_id: string;
  user_name: string;
  user_role: Role;
  body: string;
  pin_position: {
    x: number;
    y: number;
    z: number;
  } | null;
  resolved: boolean;
  created_at: string;
}

export interface ModelVersion {
  id: string;
  model_id: string;
  version_no: string;
  drive_folder_id?: string;
  notes: string;
  status: ModelStatus;
  uploaded_by: string;
  uploaded_by_name?: string;
  created_at: string;
  processing_status: ProcessingStatus;
  error_message?: string;
  stats: ModelStats;
  files: FileRecord[];
  material_mappings: MaterialMapping[];
  missing_textures?: string[];
}

export interface ModelItem {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  drive_folder_id?: string;
  category: ModelCategory;
  tags: string[];
  target_platform: TargetPlatform;
  latest_version_id: string;
  latest_approved_version_id?: string;
  latest_version?: ModelVersion;
  latest_approved_version?: ModelVersion;
  versions?: ModelVersion[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action:
    | 'upload'
    | 'delete'
    | 'status_change'
    | 'download'
    | 'bulk_download'
    | 'material_save'
    | 'create_project'
    | 'create_company';
  target_type:
    | 'model'
    | 'version'
    | 'project'
    | 'company'
    | 'file';
  target_id: string;
  target_name: string;
  details: string;
  timestamp: string;
}

export interface DownloadLog {
  id: string;
  user_id: string;
  user_name: string;
  file_id: string;
  filename: string;
  model_name: string;
  version_no: string;
  kind: 'fbx' | 'package' | 'bulk';
  size_bytes: number;
  timestamp: string;
}

export interface StorageUsage {
  company_id: string;
  company_name: string;
  total_bytes: number;
  quota_bytes: number;
  project_breakdowns: {
    project_id: string;
    project_name: string;
    bytes: number;
    fbx_bytes: number;
    texture_bytes: number;
    preview_bytes: number;
    model_count: number;
  }[];
}

export type ViewMode =
  | 'lit'
  | 'unlit'
  | 'wireframe'
  | 'wire_on_shaded'
  | 'normals'
  | 'uv_checker'
  | 'single_normal'
  | 'single_roughness'
  | 'single_metallic'
  | 'single_ao'
  | 'single_emissive';

export type LightingPreset =
  | 'studio'
  | 'outdoor'
  | 'warehouse'
  | 'neutral';

export type ToneMappingMode =
  | 'ACES'
  | 'AgX'
  | 'Cineon'
  | 'Linear';
