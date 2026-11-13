import { Company, Project, ModelItem, User, AuditLog, DownloadLog, StorageUsage } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Sarah Connor',
    email: 'sarah.connor@studiovr.io',
    google_id: 'goog_10928374',
    global_role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'usr_mgr_1',
    name: 'Alex Vance',
    email: 'alex.v@studiovr.io',
    google_id: 'goog_58392019',
    global_role: 'user',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'usr_art_1',
    name: 'Kenji Sato',
    email: 'kenji.3d@studiovr.io',
    google_id: 'goog_84729103',
    global_role: 'user',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    active: true,
  },
  {
    id: 'usr_dev_1',
    name: 'Elena Rostova',
    email: 'elena.unity@studiovr.io',
    google_id: 'goog_47392014',
    global_role: 'user',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    active: true,
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_client_x',
    name: 'Client X Robotics',
    slug: 'Client_X',
    drive_folder_id: 'drv_fld_cx_001',
    storage_bytes: 4280000000, // 4.28 GB
    created_at: '2026-01-15T08:30:00Z',
  },
  {
    id: 'comp_apex_med',
    name: 'Apex Medical Sim',
    slug: 'Apex_Med',
    drive_folder_id: 'drv_fld_apex_002',
    storage_bytes: 2890000000, // 2.89 GB
    created_at: '2026-02-01T11:00:00Z',
  },
  {
    id: 'comp_horizon_vr',
    name: 'Horizon Aerospace',
    slug: 'Horizon_Aero',
    drive_folder_id: 'drv_fld_ha_003',
    storage_bytes: 8450000000, // 8.45 GB
    created_at: '2026-03-10T14:20:00Z',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_ev_assembly',
    company_id: 'comp_client_x',
    name: 'EV Assembly VR',
    slug: 'EV_Assembly_VR',
    drive_folder_id: 'drv_fld_ev_01',
    description: 'Immersive industrial assembly training simulator for high-voltage battery modules and chassis.',
    status: 'active',
    storage_bytes: 2750000000,
    models_count: 3
  },
  {
    id: 'proj_cpr_sim',
    company_id: 'comp_client_x',
    name: 'CPR Simulator',
    slug: 'CPR_Simulator',
    drive_folder_id: 'drv_fld_cpr_02',
    description: 'Haptic feedback emergency response training in virtual reality.',
    status: 'active',
    storage_bytes: 1530000000,
    models_count: 2
  },
  {
    id: 'proj_surgical_suite',
    company_id: 'comp_apex_med',
    name: 'Surgical Suite OR',
    slug: 'Surgical_Suite',
    drive_folder_id: 'drv_fld_surg_03',
    description: 'Operating theatre environments with interactive instruments.',
    status: 'active',
    storage_bytes: 2890000000,
    models_count: 2
  }
];

export const INITIAL_MODELS: ModelItem[] = [
  {
    id: 'mdl_battery_pack',
    project_id: 'proj_ev_assembly',
    name: 'Battery_Pack',
    slug: 'Battery_Pack',
    drive_folder_id: 'drv_fld_bat_01',
    category: 'prop',
    tags: ['battery', 'high-voltage', 'industrial', 'EV'],
    target_platform: 'Quest',
    latest_version_id: 'ver_bat_v002',
    latest_approved_version_id: 'ver_bat_v002',
    created_at: '2026-04-10T10:00:00Z',
    updated_at: '2026-04-12T16:30:00Z',
    versions: [
      {
        id: 'ver_bat_v001',
        model_id: 'mdl_battery_pack',
        version_no: 'v001',
        drive_folder_id: 'drv_v001_bat',
        notes: 'Initial blockout mesh from CAD scan without UV split.',
        status: 'Needs fix',
        uploaded_by: 'usr_art_1',
        uploaded_by_name: 'Kenji Sato',
        created_at: '2026-04-10T10:00:00Z',
        processing_status: 'Ready',
        stats: {
          triangles: 98400,
          vertices: 54200,
          meshes: 4,
          materials: 2,
          draw_calls: 4,
          bounds: { x: 1.45, y: 0.62, z: 0.88 },
          texture_count: 2,
          max_texture_res: 4096,
          file_size_bytes: 46200000,
          unit_detected: 'cm',
          scale_warning: 'Converted from cm to m during ingestion.'
        },
        files: [
          {
            id: 'f_bat_v1_fbx',
            version_id: 'ver_bat_v001',
            kind: 'fbx',
            drive_file_id: 'drv_file_bat_v1_fbx',
            filename: 'Battery_Pack_v001.fbx',
            size_bytes: 38200000
          },
          {
            id: 'f_bat_v1_bc',
            version_id: 'ver_bat_v001',
            kind: 'texture',
            drive_file_id: 'drv_file_bat_v1_bc',
            filename: 'Battery_Pack_BaseColor.png',
            size_bytes: 8000000,
            texture_type: 'base_color',
            resolution: '4096 x 4096'
          }
        ],
        material_mappings: [
          {
            material_name: 'M_Battery_Chassis',
            slot: 'base_color',
            file_id: 'f_bat_v1_bc',
            filename: 'Battery_Pack_BaseColor.png',
            color_space: 'sRGB',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          }
        ],
        missing_textures: ['Battery_Normal.png']
      },
      {
        id: 'ver_bat_v002',
        model_id: 'mdl_battery_pack',
        version_no: 'v002',
        drive_folder_id: 'drv_v002_bat',
        notes: 'Optimized topology for Meta Quest 3, baked 2K PBR textures and fixed UV overlapping on top connector terminal.',
        status: 'Approved',
        uploaded_by: 'usr_art_1',
        uploaded_by_name: 'Kenji Sato',
        created_at: '2026-04-12T16:30:00Z',
        processing_status: 'Ready',
        stats: {
          triangles: 48250,
          vertices: 26800,
          meshes: 3,
          materials: 1,
          draw_calls: 3,
          bounds: { x: 1.42, y: 0.60, z: 0.85 },
          texture_count: 3,
          max_texture_res: 2048,
          file_size_bytes: 28400000,
          unit_detected: 'm'
        },
        files: [
          {
            id: 'f_bat_v2_fbx',
            version_id: 'ver_bat_v002',
            kind: 'fbx',
            drive_file_id: 'drv_file_bat_v2_fbx',
            filename: 'Battery_Pack_v002.fbx',
            size_bytes: 18400000
          },
          {
            id: 'f_bat_v2_bc',
            version_id: 'ver_bat_v002',
            kind: 'texture',
            drive_file_id: 'drv_file_bat_v2_bc',
            filename: 'Battery_Pack_BaseColor.png',
            size_bytes: 4200000,
            texture_type: 'base_color',
            resolution: '2048 x 2048'
          },
          {
            id: 'f_bat_v2_norm',
            version_id: 'ver_bat_v002',
            kind: 'texture',
            drive_file_id: 'drv_file_bat_v2_norm',
            filename: 'Battery_Pack_Normal.png',
            size_bytes: 3800000,
            texture_type: 'normal',
            resolution: '2048 x 2048'
          },
          {
            id: 'f_bat_v2_orm',
            version_id: 'ver_bat_v002',
            kind: 'texture',
            drive_file_id: 'drv_file_bat_v2_orm',
            filename: 'Battery_Pack_ORM.png',
            size_bytes: 2000000,
            texture_type: 'roughness',
            resolution: '2048 x 2048'
          }
        ],
        material_mappings: [
          {
            material_name: 'M_Battery_Enclosure',
            slot: 'base_color',
            file_id: 'f_bat_v2_bc',
            filename: 'Battery_Pack_BaseColor.png',
            color_space: 'sRGB',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          },
          {
            material_name: 'M_Battery_Enclosure',
            slot: 'normal',
            file_id: 'f_bat_v2_norm',
            filename: 'Battery_Pack_Normal.png',
            color_space: 'linear',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          },
          {
            material_name: 'M_Battery_Enclosure',
            slot: 'roughness',
            file_id: 'f_bat_v2_orm',
            filename: 'Battery_Pack_ORM.png',
            color_space: 'linear',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          }
        ]
      }
    ]
  },
  {
    id: 'mdl_soldering_iron',
    project_id: 'proj_ev_assembly',
    name: 'Soldering_Iron',
    slug: 'Soldering_Iron',
    drive_folder_id: 'drv_fld_sol_02',
    category: 'prop',
    tags: ['tool', 'soldering', 'handheld', 'interactive'],
    target_platform: 'Quest',
    latest_version_id: 'ver_sol_v001',
    latest_approved_version_id: 'ver_sol_v001',
    created_at: '2026-04-14T09:15:00Z',
    updated_at: '2026-04-14T11:20:00Z',
    versions: [
      {
        id: 'ver_sol_v001',
        model_id: 'mdl_soldering_iron',
        version_no: 'v001',
        drive_folder_id: 'drv_v001_sol',
        notes: 'Initial production asset with glowing tip shader setup.',
        status: 'Approved',
        uploaded_by: 'usr_art_1',
        uploaded_by_name: 'Kenji Sato',
        created_at: '2026-04-14T09:15:00Z',
        processing_status: 'Ready',
        stats: {
          triangles: 14200,
          vertices: 8600,
          meshes: 2,
          materials: 2,
          draw_calls: 2,
          bounds: { x: 0.28, y: 0.06, z: 0.06 },
          texture_count: 4,
          max_texture_res: 1024,
          file_size_bytes: 8700000,
          unit_detected: 'm'
        },
        files: [
          {
            id: 'f_sol_v1_fbx',
            version_id: 'ver_sol_v001',
            kind: 'fbx',
            drive_file_id: 'drv_file_sol_v1_fbx',
            filename: 'Soldering_Iron_v001.fbx',
            size_bytes: 4200000
          },
          {
            id: 'f_sol_v1_bc',
            version_id: 'ver_sol_v001',
            kind: 'texture',
            drive_file_id: 'drv_file_sol_v1_bc',
            filename: 'Soldering_Iron_BaseColor.png',
            size_bytes: 1500000,
            texture_type: 'base_color',
            resolution: '1024 x 1024'
          },
          {
            id: 'f_sol_v1_em',
            version_id: 'ver_sol_v001',
            kind: 'texture',
            drive_file_id: 'drv_file_sol_v1_em',
            filename: 'Soldering_Iron_Emissive.png',
            size_bytes: 800000,
            texture_type: 'emissive',
            resolution: '1024 x 1024'
          }
        ],
        material_mappings: [
          {
            material_name: 'M_Iron_Body',
            slot: 'base_color',
            file_id: 'f_sol_v1_bc',
            filename: 'Soldering_Iron_BaseColor.png',
            color_space: 'sRGB',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          },
          {
            material_name: 'M_Iron_Tip',
            slot: 'emissive',
            file_id: 'f_sol_v1_em',
            filename: 'Soldering_Iron_Emissive.png',
            color_space: 'sRGB',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          }
        ]
      }
    ]
  },
  {
    id: 'mdl_drone_recon',
    project_id: 'proj_ev_assembly',
    name: 'Drone_Recon_X',
    slug: 'Drone_Recon_X',
    drive_folder_id: 'drv_fld_dro_03',
    category: 'vehicle',
    tags: ['drone', 'autonomous', 'surveillance', 'quadcopter'],
    target_platform: 'Quest',
    latest_version_id: 'ver_dro_v001',
    latest_approved_version_id: undefined,
    created_at: '2026-04-18T13:40:00Z',
    updated_at: '2026-04-18T13:40:00Z',
    versions: [
      {
        id: 'ver_dro_v001',
        model_id: 'mdl_drone_recon',
        version_no: 'v001',
        drive_folder_id: 'drv_v001_dro',
        notes: 'High-detail concept import with 4K textures. Tris currently exceed VR target budget.',
        status: 'In review',
        uploaded_by: 'usr_art_1',
        uploaded_by_name: 'Kenji Sato',
        created_at: '2026-04-18T13:40:00Z',
        processing_status: 'Ready',
        stats: {
          triangles: 142500, // triggers Quest warning (> 100k)
          vertices: 88200,
          meshes: 6,
          materials: 3,
          draw_calls: 6,
          bounds: { x: 0.95, y: 0.35, z: 0.95 },
          texture_count: 5,
          max_texture_res: 4096, // triggers Quest warning (> 2048)
          file_size_bytes: 52100000,
          unit_detected: 'm'
        },
        files: [
          {
            id: 'f_dro_v1_fbx',
            version_id: 'ver_dro_v001',
            kind: 'fbx',
            drive_file_id: 'drv_file_dro_v1_fbx',
            filename: 'Drone_Recon_X_v001.fbx',
            size_bytes: 32000000
          },
          {
            id: 'f_dro_v1_bc',
            version_id: 'ver_dro_v001',
            kind: 'texture',
            drive_file_id: 'drv_file_dro_v1_bc',
            filename: 'Drone_Recon_BaseColor.png',
            size_bytes: 12000000,
            texture_type: 'base_color',
            resolution: '4096 x 4096'
          }
        ],
        material_mappings: [
          {
            material_name: 'M_Drone_Frame',
            slot: 'base_color',
            file_id: 'f_dro_v1_bc',
            filename: 'Drone_Recon_BaseColor.png',
            color_space: 'sRGB',
            flip_y: false,
            tiling: { x: 1, y: 1 },
            offset: { x: 0, y: 0 }
          }
        ]
      }
    ]
  },
  {
    id: 'mdl_defibrillator',
    project_id: 'proj_cpr_sim',
    name: 'AED_Defibrillator',
    slug: 'AED_Defibrillator',
    drive_folder_id: 'drv_fld_aed_04',
    category: 'prop',
    tags: ['medical', 'emergency', 'defibrillator', 'CPR'],
    target_platform: 'Quest',
    latest_version_id: 'ver_aed_v001',
    latest_approved_version_id: 'ver_aed_v001',
    created_at: '2026-04-05T08:00:00Z',
    updated_at: '2026-04-06T14:10:00Z',
    versions: [
      {
        id: 'ver_aed_v001',
        model_id: 'mdl_defibrillator',
        version_no: 'v001',
        drive_folder_id: 'drv_v001_aed',
        notes: 'Low-poly game model with illuminated screen and audio speaker grill.',
        status: 'Approved',
        uploaded_by: 'usr_art_1',
        uploaded_by_name: 'Kenji Sato',
        created_at: '2026-04-05T08:00:00Z',
        processing_status: 'Ready',
        stats: {
          triangles: 22400,
          vertices: 13100,
          meshes: 3,
          materials: 2,
          draw_calls: 3,
          bounds: { x: 0.32, y: 0.28, z: 0.12 },
          texture_count: 3,
          max_texture_res: 2048,
          file_size_bytes: 14500000,
          unit_detected: 'm'
        },
        files: [
          {
            id: 'f_aed_v1_fbx',
            version_id: 'ver_aed_v001',
            kind: 'fbx',
            drive_file_id: 'drv_file_aed_v1_fbx',
            filename: 'AED_Defibrillator_v001.fbx',
            size_bytes: 8500000
          }
        ],
        material_mappings: []
      }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_1',
    user_id: 'usr_art_1',
    user_name: 'Kenji Sato',
    action: 'upload',
    target_type: 'version',
    target_id: 'ver_bat_v002',
    target_name: 'Battery_Pack v002',
    details: 'Uploaded Battery_Pack_v002.fbx (18.4MB) with 3 textures to EV_Assembly_VR/Battery_Pack/v002/',
    timestamp: '2026-04-12T16:30:00Z'
  },
  {
    id: 'aud_2',
    user_id: 'usr_mgr_1',
    user_name: 'Alex Vance',
    action: 'status_change',
    target_type: 'version',
    target_id: 'ver_bat_v002',
    target_name: 'Battery_Pack v002',
    details: 'Status updated from "In review" to "Approved" (Quest budget passed)',
    timestamp: '2026-04-12T17:15:00Z'
  },
  {
    id: 'aud_3',
    user_id: 'usr_dev_1',
    user_name: 'Elena Rostova',
    action: 'download',
    target_type: 'file',
    target_id: 'f_bat_v2_fbx',
    target_name: 'Battery_Pack_v002 Full Package ZIP',
    details: 'Downloaded full engine package (FBX + 3 textures + materials.json, 28.4MB)',
    timestamp: '2026-04-13T09:42:00Z'
  },
  {
    id: 'aud_4',
    user_id: 'usr_art_1',
    user_name: 'Kenji Sato',
    action: 'material_save',
    target_type: 'version',
    target_id: 'ver_bat_v002',
    target_name: 'Battery_Pack v002',
    details: 'Saved material preset mappings to preview/materials.json',
    timestamp: '2026-04-12T16:45:00Z'
  },
  {
    id: 'aud_5',
    user_id: 'usr_art_1',
    user_name: 'Kenji Sato',
    action: 'upload',
    target_type: 'version',
    target_id: 'ver_dro_v001',
    target_name: 'Drone_Recon_X v001',
    details: 'Uploaded Drone_Recon_X_v001.fbx (32MB) into EV_Assembly_VR/Drone_Recon_X/v001/',
    timestamp: '2026-04-18T13:40:00Z'
  }
];

export const INITIAL_DOWNLOAD_LOGS: DownloadLog[] = [
  {
    id: 'dl_1',
    user_id: 'usr_dev_1',
    user_name: 'Elena Rostova',
    file_id: 'f_bat_v2_fbx',
    filename: 'Battery_Pack_v002_Package.zip',
    model_name: 'Battery_Pack',
    version_no: 'v002',
    kind: 'package',
    size_bytes: 28400000,
    timestamp: '2026-04-13T09:42:00Z'
  },
  {
    id: 'dl_2',
    user_id: 'usr_art_1',
    user_name: 'Kenji Sato',
    file_id: 'f_sol_v1_fbx',
    filename: 'Soldering_Iron_v001.fbx',
    model_name: 'Soldering_Iron',
    version_no: 'v001',
    kind: 'fbx',
    size_bytes: 4200000,
    timestamp: '2026-04-15T11:05:00Z'
  }
];

export const INITIAL_STORAGE_USAGE: StorageUsage[] = [
  {
    company_id: 'comp_client_x',
    company_name: 'Client X Robotics',
    total_bytes: 4280000000,
    quota_bytes: 50000000000, // 50 GB
    project_breakdowns: [
      {
        project_id: 'proj_ev_assembly',
        project_name: 'EV Assembly VR',
        bytes: 2750000000,
        fbx_bytes: 1450000000,
        texture_bytes: 1120000000,
        preview_bytes: 180000000,
        model_count: 3
      },
      {
        project_id: 'proj_cpr_sim',
        project_name: 'CPR Simulator',
        bytes: 1530000000,
        fbx_bytes: 920000000,
        texture_bytes: 530000000,
        preview_bytes: 80000000,
        model_count: 2
      }
    ]
  },
  {
    company_id: 'comp_apex_med',
    company_name: 'Apex Medical Sim',
    total_bytes: 2890000000,
    quota_bytes: 50000000000,
    project_breakdowns: [
      {
        project_id: 'proj_surgical_suite',
        project_name: 'Surgical Suite OR',
        bytes: 2890000000,
        fbx_bytes: 1600000000,
        texture_bytes: 1140000000,
        preview_bytes: 150000000,
        model_count: 2
      }
    ]
  }
];
