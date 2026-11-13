import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { 
  ViewMode, 
  LightingPreset, 
  ToneMappingMode, 
  ModelVersion,
} from '../../types';
import { 
  Eye, 
  EyeOff, 
  Sun, 
  Grid, 
  Box as BoxIcon, 
  Maximize2, 
  RotateCcw, 
  Compass, 
  AlertTriangle, 
  Sliders, 
  MessageSquarePlus,
  Palette,
  Layers
} from 'lucide-react';

interface ThreeViewerProps {
  version: ModelVersion;
  onMeshSelect?: (meshName: string | null) => void;
  selectedMeshName?: string | null;
  onPinComment?: (coords: { x: number; y: number; z: number }) => void;
  isPinningComment?: boolean;
  pinPositions?: { id: string; x: number; y: number; z: number; num: number; resolved: boolean }[];
  highlightFaceMeshName?: string | null;
  onUvDataChange?: (data: { uv0: number[][][]; uv1: number[][][] }) => void;
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({
  version,
  onMeshSelect,
  selectedMeshName,
  onPinComment,
  isPinningComment = false,
  pinPositions = [],
  highlightFaceMeshName,
  onUvDataChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [transformSpace, setTransformSpace] = useState<'world' | 'local'>('world');
  const [pivotMode, setPivotMode] = useState<'origin' | 'center'>('origin');
  const [transformRevision, setTransformRevision] = useState(0);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const bboxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const pinMarkersRef = useRef<THREE.Group | null>(null);
  const originalMaterialsRef = useRef<Map<string, THREE.Material>>(new Map());
  const initialTransformsRef = useRef<Map<string, { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>>(new Map());
  const objectUrlsRef = useRef<string[]>([]);
  const loadRequestRef = useRef(0);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  // Interactive Viewer Settings
  const [viewMode, setViewMode] = useState<ViewMode>('lit');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [toneMapping, setToneMapping] = useState<ToneMappingMode>('ACES');
  const [exposure, setExposure] = useState<number>(1.0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [showOutliner, setShowOutliner] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Mesh Hierarchy State
  const [meshList, setMeshList] = useState<{ id: string; name: string; visible: boolean; triCount: number }[]>([]);

  // Quest Budget check (VW-5)
  const isTrisBudgetExceeded = (version.stats.triangles || 0) > 100000;
  const isTextureBudgetExceeded = (version.stats.max_texture_res || 0) > 2048;

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 100);
    camera.position.set(2.2, 1.6, 2.4);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.25;
    controls.dampingFactor = 0.05;
    controls.maxDistance = Infinity;
    controls.minDistance = 0.01;
    controlsRef.current = controls;

    // Unity-style transform gizmo. The model's imported units/transforms are preserved.
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('translate');
    transformControls.setSpace('world');
    transformControls.size = 0.85;
    transformControls.addEventListener('dragging-changed', (event: any) => {
      controls.enabled = !event.value;
    });
    transformControls.addEventListener('objectChange', () => {
      bboxHelperRef.current?.update();
      setTransformRevision(value => value + 1);
    });
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    // 5. Ground Grid (VW-3: 1 unit = 1m)
    const grid = new THREE.GridHelper(10, 20, 0x6366f1, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // 6. Lighting Setup (VW-2)
    updateLighting(scene, 'studio');

    // 7. Pin Markers Group
    const pinGroup = new THREE.Group();
    scene.add(pinGroup);
    pinMarkersRef.current = pinGroup;

    // 8. Load / Build 3D Model Geometry
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // The version effect below loads the uploaded FBX after the scene is initialized.

    // 9. Bounding box helper (VW-3)
    const bbox = new THREE.BoxHelper(modelGroup, 0x38bdf8);
    scene.add(bbox);
    bboxHelperRef.current = bbox;

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(containerRef.current.clientHeight, 1);
      if (w <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard Shortcuts: 'F' to focus on selection
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        focusCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
      controls.dispose();
      transformControlsRef.current?.dispose();
      transformControlsRef.current = null;
      disposeObjectUrls();
      renderer.dispose();
    };
  }, []);

  // Load the real uploaded FBX and optional texture files when the selected version changes.
  useEffect(() => {
    if (!modelGroupRef.current) return;
    void loadUploadedModel(modelGroupRef.current, version);
  }, [version.id]);

  const disposeObjectUrls = () => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  };

  const disposeModelGroup = (group: THREE.Group) => {
    group.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(material => {
          // Textures are disposed separately through the material maps.
          Object.values(material).forEach(value => {
            if (value instanceof THREE.Texture) value.dispose();
          });
          material.dispose();
        });
      }
    });
    while (group.children.length) group.remove(group.children[0]);
    originalMaterialsRef.current.clear();
    initialTransformsRef.current.clear();
  };

  const frameObject = (object: THREE.Object3D, padding = 1.25) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.01);
    const fovRadians = THREE.MathUtils.degToRad(camera.fov);
    const distance = (radius / Math.sin(fovRadians / 2)) * padding;
    const direction = new THREE.Vector3(1, 0.62, 1).normalize();

    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.near = Math.max(distance / 10000, radius / 10000, 0.001);
    camera.far = Math.max(distance * 100, radius * 100, 1000);
    camera.updateProjectionMatrix();
    controls.minDistance = Math.max(radius / 1000, 0.001);
    controls.maxDistance = Math.max(distance * 20, radius * 100, 100);
    controls.update();

    if (gridHelperRef.current) {
      gridHelperRef.current.position.y = bounds.min.y;
      const gridScale = Math.max(radius / 5, 0.01);
      gridHelperRef.current.scale.setScalar(gridScale);
    }
    bboxHelperRef.current?.update();
  };

  const loadUploadedModel = async (group: THREE.Group, ver: ModelVersion) => {
    const requestId = ++loadRequestRef.current;
    setModelLoading(true);
    setModelLoadError(null);
    disposeModelGroup(group);
    disposeObjectUrls();
    setMeshList([]);

    const apiBase = String((import.meta as any).env?.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
    const token = localStorage.getItem('vr_asset_dashboard_auth_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const getJson = async (url: string) => {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`API ${response.status}: ${detail || response.statusText}`);
      }
      return response.json();
    };

    try {
      const rawFiles = await getJson(`${apiBase}/versions/${encodeURIComponent(ver.id)}/files`);
      const files = Array.isArray(rawFiles) ? rawFiles : (rawFiles.data ?? rawFiles.items ?? rawFiles.$values ?? []);
      if (!Array.isArray(files)) throw new Error('Files API returned an unexpected response.');

      const getName = (f: any) => String(f.filename ?? f.fileName ?? f.Filename ?? f.FileName ?? '');
      const getId = (f: any) => String(f.id ?? f.Id ?? '');
      const fbxRecord = files.find((f: any) => getName(f).toLowerCase().endsWith('.fbx'));
      if (!fbxRecord) throw new Error('No FBX file is registered for this version. Upload an FBX file first.');

      const downloadBlob = async (fileId: string): Promise<Blob> => {
        const response = await fetch(
          `${apiBase}/versions/${encodeURIComponent(ver.id)}/files/${encodeURIComponent(fileId)}/download`,
          { headers }
        );
        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          throw new Error(`File download failed (${response.status}): ${detail || response.statusText}`);
        }
        return response.blob();
      };

      // Fetch texture files using the authenticated API, then map their original names
      // to object URLs so FBX material texture references can resolve locally.
      const textureRecords = files.filter((f: any) => {
        const name = getName(f).toLowerCase();
        return /\.(png|jpe?g|tga|tif|tiff|bmp|webp)$/i.test(name);
      });
      const textureUrls = new Map<string, string>();
      await Promise.all(textureRecords.map(async (record: any) => {
        const id = getId(record);
        if (!id) return;
        const blob = await downloadBlob(id);
        const objectUrl = URL.createObjectURL(blob);
        objectUrlsRef.current.push(objectUrl);
        textureUrls.set(getName(record).toLowerCase(), objectUrl);
        textureUrls.set(getName(record).split(/[\\/]/).pop()!.toLowerCase(), objectUrl);
      }));

      const fbxId = getId(fbxRecord);
      if (!fbxId) throw new Error('FBX file record has no ID.');
      const fbxBlob = await downloadBlob(fbxId);
      const fbxUrl = URL.createObjectURL(fbxBlob);
      objectUrlsRef.current.push(fbxUrl);

      const manager = new THREE.LoadingManager();
      manager.setURLModifier((requestedUrl) => {
        const cleanUrl = decodeURIComponent(requestedUrl.split('?')[0]);
        const basename = cleanUrl.split(/[\\/]/).pop()?.toLowerCase() || '';
        return textureUrls.get(basename) || textureUrls.get(cleanUrl.toLowerCase()) || requestedUrl;
      });

      const loader = new FBXLoader(manager);
      const loadedObject = await loader.loadAsync(fbxUrl);
      if (requestId !== loadRequestRef.current) {
        disposeModelGroup(loadedObject as unknown as THREE.Group);
        return;
      }

      loadedObject.name = getName(fbxRecord) || 'UploadedFBX';
      initialTransformsRef.current.clear();
      loadedObject.traverse(obj => {
        initialTransformsRef.current.set(obj.uuid, {
          position: obj.position.clone(),
          rotation: obj.rotation.clone(),
          scale: obj.scale.clone(),
        });
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (!obj.name) obj.name = `Mesh_${obj.uuid.slice(0, 8)}`;
          originalMaterialsRef.current.set(obj.uuid, obj.material as THREE.Material);
        }
      });
      group.add(loadedObject);

      // Preserve imported FBX transforms and dimensions (Unity-style: 1 Unity unit is conventionally 1 metre).
      // Do not auto-normalize or recenter the asset: that would silently change its transform/scale.
      // Frame the full model using its bounding sphere and camera FOV; handles tiny and huge FBX assets.
      frameObject(loadedObject, 1.2);

      const meshEntries: { id: string; name: string; visible: boolean; triCount: number }[] = [];
      loadedObject.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          const triangles = obj.geometry.index
            ? obj.geometry.index.count / 3
            : (obj.geometry.attributes.position?.count || 0) / 3;
          meshEntries.push({ id: obj.uuid, name: obj.name || 'Mesh', visible: obj.visible, triCount: Math.floor(triangles) });
        }
      });
      setMeshList(meshEntries);
      if (bboxHelperRef.current) bboxHelperRef.current.update();
    } catch (error) {
      if (requestId === loadRequestRef.current) {
        console.error('[ThreeViewer] FBX load failed:', error);
        setModelLoadError(error instanceof Error ? error.message : 'Unable to load the uploaded FBX model.');
      }
    } finally {
      if (requestId === loadRequestRef.current) setModelLoading(false);
    }
  };

  // Lighting Presets helper (VW-2)
  const updateLighting = (scene: THREE.Scene, preset: LightingPreset) => {
    // Remove existing lights
    const toRemove: THREE.Object3D[] = [];
    scene.traverse(obj => {
      if (obj instanceof THREE.Light) toRemove.push(obj);
    });
    toRemove.forEach(l => scene.remove(l));

    if (preset === 'studio') {
      const hemi = new THREE.HemisphereLight(0xffffff, 0x223344, 0.9);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(4, 5, 4);
      keyLight.castShadow = true;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x8899bb, 0.6);
      fillLight.position.set(-4, 3, -3);
      scene.add(fillLight);
    } else if (preset === 'outdoor') {
      const hemi = new THREE.HemisphereLight(0xddeeff, 0x443322, 1.2);
      scene.add(hemi);

      const sun = new THREE.DirectionalLight(0xfffaed, 2.0);
      sun.position.set(6, 8, 2);
      scene.add(sun);
    } else if (preset === 'warehouse') {
      const hemi = new THREE.HemisphereLight(0xffeedd, 0x222222, 0.7);
      scene.add(hemi);

      const light1 = new THREE.PointLight(0xffaa55, 1.8, 15);
      light1.position.set(2, 4, 2);
      scene.add(light1);

      const light2 = new THREE.PointLight(0x55aaff, 1.2, 15);
      light2.position.set(-2, 3, -2);
      scene.add(light2);
    } else {
      // Neutral
      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
      scene.add(hemi);

      const key = new THREE.DirectionalLight(0xffffff, 1.0);
      key.position.set(0, 5, 5);
      scene.add(key);
    }
  };

  useEffect(() => {
    if (sceneRef.current) {
      updateLighting(sceneRef.current, lightingPreset);
    }
  }, [lightingPreset]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  // Tone Mapping & Exposure Updates (VW-2)
  useEffect(() => {
    if (!rendererRef.current) return;
    if (toneMapping === 'ACES') rendererRef.current.toneMapping = THREE.ACESFilmicToneMapping;
    else if (toneMapping === 'AgX') rendererRef.current.toneMapping = THREE.AgXToneMapping;
    else if (toneMapping === 'Cineon') rendererRef.current.toneMapping = THREE.CineonToneMapping;
    else rendererRef.current.toneMapping = THREE.LinearToneMapping;

    rendererRef.current.toneMappingExposure = exposure;
  }, [toneMapping, exposure]);

  // Grid & BBox Visibility
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (bboxHelperRef.current) bboxHelperRef.current.visible = showBoundingBox;
  }, [showBoundingBox]);

  // Uploaded FBX geometry is loaded by loadUploadedModel().

  // View Mode Shaders (VW-View modes table)
  useEffect(() => {
    if (!modelGroupRef.current) return;

    modelGroupRef.current.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        const origMat = originalMaterialsRef.current.get(obj.uuid);

        if (viewMode === 'lit') {
          if (origMat) obj.material = origMat;
        } else if (viewMode === 'unlit') {
          // Unlit albedo only
          obj.material = new THREE.MeshBasicMaterial({
            color: (origMat as any)?.color || 0xffffff,
            map: (origMat as any)?.map || null,
          });
        } else if (viewMode === 'wireframe') {
          obj.material = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
          });
        } else if (viewMode === 'wire_on_shaded') {
          // Topology check
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x334155,
            wireframe: true,
            roughness: 0.5
          });
        } else if (viewMode === 'normals') {
          // Vertex normals visualization
          obj.material = new THREE.MeshNormalMaterial();
        } else if (viewMode === 'uv_checker') {
          // High contrast UV checkerboard
          const canvas = document.createElement('canvas');
          canvas.width = 128;
          canvas.height = 128;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 128, 128);
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillRect(64, 64, 64, 64);
          const tex = new THREE.CanvasTexture(canvas);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(8, 8);
          obj.material = new THREE.MeshBasicMaterial({ map: tex });
        } else if (viewMode === 'single_normal') {
          // Solo Normal channel
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x8080ff,
            roughness: 1.0,
            metalness: 0
          });
        } else if (viewMode === 'single_roughness') {
          // Solo Roughness channel
          obj.material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
        } else if (viewMode === 'single_metallic') {
          // Solo Metallic channel
          obj.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        }
      }
    });
  }, [viewMode]);

  // Attach the transform gizmo to the currently selected mesh.
  useEffect(() => {
    const root = modelGroupRef.current;
    const gizmo = transformControlsRef.current;
    if (!root || !gizmo) return;

    let selected: THREE.Object3D | null = null;
    if (selectedMeshName) {
      root.traverse(obj => {
        if (!selected && obj instanceof THREE.Mesh && obj.name === selectedMeshName) selected = obj;
      });
    }
    selectedObjectRef.current = selected;
    if (selected && !isPinningComment) gizmo.attach(selected);
    else gizmo.detach();
    setTransformRevision(value => value + 1);
  }, [selectedMeshName, meshList, isPinningComment]);

  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group || !onUvDataChange) return;
    let target: THREE.Mesh | null = null;
    group.traverse(obj => {
      if (!target && obj instanceof THREE.Mesh && obj.name === selectedMeshName) target = obj;
    });
    if (!target) {
      onUvDataChange({ uv0: [], uv1: [] });
      return;
    }

    const extractTriangles = (mesh: THREE.Mesh, attributeName: 'uv' | 'uv1' | 'uv2') => {
      const geometry = mesh.geometry;
      const uv = geometry.getAttribute(attributeName) as THREE.BufferAttribute | undefined;
      if (!uv || uv.itemSize < 2) return [] as number[][][];
      const index = geometry.index;
      const count = index ? index.count : uv.count;
      const triangles: number[][][] = [];
      for (let i = 0; i + 2 < count; i += 3) {
        const a = index ? index.getX(i) : i;
        const b = index ? index.getX(i + 1) : i + 1;
        const c = index ? index.getX(i + 2) : i + 2;
        triangles.push([
          [uv.getX(a), uv.getY(a)],
          [uv.getX(b), uv.getY(b)],
          [uv.getX(c), uv.getY(c)]
        ]);
      }
      return triangles;
    };

    const mesh = target as THREE.Mesh;
    const uv0 = extractTriangles(mesh, 'uv');
    const uv1 = extractTriangles(mesh, 'uv1');
     const uv1Resolved = uv1.length ? uv1 : extractTriangles(mesh, 'uv2');
    onUvDataChange({ uv0, uv1: uv1Resolved });
  }, [selectedMeshName, meshList, version.id, onUvDataChange]);

  useEffect(() => {
    const gizmo = transformControlsRef.current;
    if (!gizmo) return;
    gizmo.setMode(transformMode);
    gizmo.setSpace(transformSpace);
  }, [transformMode, transformSpace]);

  const selectedTransformObject = selectedObjectRef.current;
  const selectedBoundsCenter = (() => {
    if (!selectedTransformObject) return null;
    selectedTransformObject.updateWorldMatrix(true, false);
    return new THREE.Box3().setFromObject(selectedTransformObject).getCenter(new THREE.Vector3());
  })();

  const updateSelectedTransform = (axis: 'position' | 'rotation' | 'scale', index: 0 | 1 | 2, value: number) => {
    const obj = selectedObjectRef.current;
    if (!obj || !Number.isFinite(value)) return;
    if (axis === 'position') {
      if (index === 0) obj.position.x = value;
      else if (index === 1) obj.position.y = value;
      else obj.position.z = value;
    }
    if (axis === 'rotation') {
      const radians = THREE.MathUtils.degToRad(value);
      if (index === 0) obj.rotation.x = radians;
      else if (index === 1) obj.rotation.y = radians;
      else obj.rotation.z = radians;
    }
    if (axis === 'scale') {
      if (index === 0) obj.scale.x = value;
      else if (index === 1) obj.scale.y = value;
      else obj.scale.z = value;
    }
    obj.updateMatrixWorld(true);
    bboxHelperRef.current?.update();
    setTransformRevision(revision => revision + 1);
  };

  // Update 3D Pin Markers (FR-V3)
  useEffect(() => {
    if (!pinMarkersRef.current) return;
    const group = pinMarkersRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    pinPositions.forEach(pin => {
      const markerGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const markerMat = new THREE.MeshStandardMaterial({
        color: pin.resolved ? 0x10b981 : 0xf43f5e,
        emissive: pin.resolved ? 0x059669 : 0xe11d48,
        emissiveIntensity: 0.6
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.set(pin.x, pin.y, pin.z);

      // Add a small stem to the pin
      const stemGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.06);
      const stemMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = -0.03;
      marker.add(stem);

      group.add(marker);
    });
  }, [pinPositions]);

  // Canvas Click Handler: Mesh Selection & 3D Comment Pinning (FR-V3, UV-3)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !modelGroupRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersects = raycaster.intersectObjects(modelGroupRef.current.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      if (isPinningComment && onPinComment) {
        // Pin comment on exact 3D point (FR-V3)
        onPinComment({
          x: parseFloat(hit.point.x.toFixed(3)),
          y: parseFloat(hit.point.y.toFixed(3)),
          z: parseFloat(hit.point.z.toFixed(3))
        });
      } else if (onMeshSelect) {
        // Select mesh in 3D -> sync with 2D UV display (UV-3)
        onMeshSelect(hit.object.name || null);
      }
    } else {
      if (onMeshSelect) onMeshSelect(null);
    }
  };

  // Camera presets (VW-1)
  const setOrthoView = (view: 'front' | 'side' | 'top') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const group = modelGroupRef.current;
    const bounds = group ? new THREE.Box3().setFromObject(group) : new THREE.Box3();
    const center = bounds.isEmpty() ? new THREE.Vector3() : bounds.getCenter(new THREE.Vector3());
    const sphere = bounds.isEmpty() ? new THREE.Sphere(center, 1) : bounds.getBoundingSphere(new THREE.Sphere());
    const distance = Math.max(sphere.radius * 2.6, 0.1);
    if (view === 'front') {
      cameraRef.current.position.set(center.x, center.y, center.z + distance);
      cameraRef.current.up.set(0, 1, 0);
    } else if (view === 'side') {
      cameraRef.current.position.set(center.x + distance, center.y, center.z);
      cameraRef.current.up.set(0, 1, 0);
    } else {
      cameraRef.current.position.set(center.x, center.y + distance, center.z + 0.001);
      cameraRef.current.up.set(0, 0, -1);
    }
    controlsRef.current.target.copy(center);
    cameraRef.current.lookAt(center);
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current.update();
  };

  const focusCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const selected = selectedObjectRef.current;
    if (selected) frameObject(selected, 1.35);
    else if (modelGroupRef.current) frameObject(modelGroupRef.current, 1.2);
  };

  const resetViewer = () => {
    // Restore imported object transforms without deleting comments or material assignments.
    modelGroupRef.current?.traverse(obj => {
      const initial = initialTransformsRef.current.get(obj.uuid);
      if (!initial) return;
      obj.position.copy(initial.position);
      obj.rotation.copy(initial.rotation);
      obj.scale.copy(initial.scale);
      obj.updateMatrix();
      obj.updateMatrixWorld(true);
    });

    const group = modelGroupRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (group && camera && controls) {
      group.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(group);
      if (!bounds.isEmpty()) {
        frameObject(group, 1.2);
      }
    }
    setViewMode('lit');
    setLightingPreset('studio');
    setToneMapping('ACES');
    setExposure(1);
    setShowGrid(true);
    setShowBoundingBox(true);
    setAutoRotate(false);
    setTransformMode('translate');
    setTransformSpace('world');
    setPivotMode('origin');
    setTransformRevision(value => value + 1);
  };

  const toggleMeshVisibility = (meshId: string) => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse(obj => {
      if (obj.uuid === meshId) {
        obj.visible = !obj.visible;
      }
    });
    setMeshList(prev =>
      prev.map(m => m.id === meshId ? { ...m, visible: !m.visible } : m)
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex overflow-hidden select-none bg-slate-100">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className={`w-full h-full block ${isPinningComment ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {(modelLoading || modelLoadError) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/90 p-6">
          <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-800 shadow-2xl">
            {modelLoading ? (
              <div className="flex items-center gap-3"><span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" /> Loading uploaded FBX and textures…</div>
            ) : (
              <div><div className="mb-2 font-semibold text-rose-300">Could not load 3D model</div><p className="text-slate-700">{modelLoadError}</p><p className="mt-2 text-xs text-slate-500">Check that this version has an FBX record and that the API download endpoints accept your current login token.</p></div>
            )}
          </div>
        </div>
      )}

      {/* Floating Toolbar: View Modes & Camera Controls (VW-1, VW-2) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl">
        {/* Shading View Modes Dropdown */}
        <div className="flex items-center gap-1 bg-white/95 px-2 py-1 rounded-xl border border-slate-200 text-xs font-medium">
          <Palette className="w-3.5 h-3.5 text-indigo-400" />
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="lit">Lit (PBR Final)</option>
            <option value="unlit">Unlit (Base Colour)</option>
            <option value="wireframe">Wireframe</option>
            <option value="wire_on_shaded">Wire-on-Shaded</option>
            <option value="normals">Vertex Normals</option>
            <option value="uv_checker">UV Checker Pattern</option>
            <option value="single_normal">Solo: Normal Map</option>
            <option value="single_roughness">Solo: Roughness</option>
            <option value="single_metallic">Solo: Metallic</option>
          </select>
        </div>

        {/* HDRI Lighting Presets */}
        <div className="flex items-center gap-1 bg-white/95 px-2 py-1 rounded-xl border border-slate-200 text-xs font-medium">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={lightingPreset}
            onChange={(e) => setLightingPreset(e.target.value as LightingPreset)}
            className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="studio">HDRI: Studio</option>
            <option value="outdoor">HDRI: Outdoor</option>
            <option value="warehouse">HDRI: Warehouse</option>
            <option value="neutral">HDRI: Neutral</option>
          </select>
        </div>

        {/* Ortho Camera Presets (VW-1) */}
        <div className="flex items-center bg-white/95 p-0.5 rounded-xl border border-slate-200 text-[11px] font-mono">
          <button
            onClick={() => setOrthoView('front')}
            className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          >
            Front
          </button>
          <button
            onClick={() => setOrthoView('side')}
            className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          >
            Side
          </button>
          <button
            onClick={() => setOrthoView('top')}
            className="px-2 py-1 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
          >
            Top
          </button>
        </div>

        {/* Reset / Focus (F) */}
        <button
          type="button"
          onClick={focusCamera}
          title="Focus selected view (Press F)"
          aria-label="Focus view"
          className="p-1.5 rounded-xl bg-white/95 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={resetViewer}
          title="Reset camera, imported transforms and viewer settings"
          aria-label="Reset 3D viewer"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 text-white text-[11px] font-semibold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          onClick={() => setAutoRotate(value => !value)}
          title={autoRotate ? "Stop 360-degree auto rotation" : "Start 360-degree auto rotation"}
          className={`p-1.5 rounded-xl border transition-colors ${
            autoRotate ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white/95 border-slate-200 text-slate-700 hover:text-slate-950'
          }`}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>

        {/* Toggle Grid */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Ground Grid (1m scale)"
          className={`p-1.5 rounded-xl border transition-colors ${
            showGrid ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white/95 border-slate-200 text-slate-500'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Toggle Bounding Box */}
        <button
          onClick={() => setShowBoundingBox(!showBoundingBox)}
          title="Toggle Metric Bounding Box"
          className={`p-1.5 rounded-xl border transition-colors ${
            showBoundingBox ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-white/95 border-slate-200 text-slate-500'
          }`}
        >
          <BoxIcon className="w-3.5 h-3.5" />
        </button>

        {/* Unity-style transform tools */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 text-[11px]">
          {(['translate', 'rotate', 'scale'] as const).map(mode => (
            <button key={mode} onClick={() => setTransformMode(mode)}
              className={`rounded-lg px-2 py-1 capitalize ${transformMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              title={`${mode} selected mesh`}>{mode === 'translate' ? 'Move' : mode === 'rotate' ? 'Rotate' : 'Scale'}</button>
          ))}
          <select value={transformSpace} onChange={e => setTransformSpace(e.target.value as 'world' | 'local')}
            className="max-w-20 rounded bg-white px-1 py-1 text-slate-800" title="Transform coordinate space">
            <option value="world">Global</option><option value="local">Local</option>
          </select>
        </div>
      </div>

      {/* Pin Mode Indicator Banner (FR-V3) */}
      {isPinningComment && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-rose-500/90 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur-md animate-bounce">
          <MessageSquarePlus className="w-4 h-4" />
          Click anywhere on the 3D surface to place a pinned comment marker
        </div>
      )}

      {/* Real-time Game Engine Stats Panel (VW-5) */}
      {showStats && (
        <div className="absolute bottom-4 left-4 z-20 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl text-xs space-y-2 max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Engine Specs
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
              Unity / Unreal Look
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Triangles:</span>
              <span className={isTrisBudgetExceeded ? 'text-amber-400 font-bold' : 'text-slate-800'}>
                {version.stats.triangles.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vertices:</span>
              <span className="text-slate-800">{version.stats.vertices.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Meshes:</span>
              <span className="text-slate-800">{version.stats.meshes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Materials:</span>
              <span className="text-slate-800">{version.stats.materials}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Draw Calls:</span>
              <span className="text-slate-800">{version.stats.draw_calls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">File Size:</span>
              <span className="text-slate-800">
                {(version.stats.file_size_bytes / 1024 / 1024).toFixed(1)} MB
              </span>
            </div>
            <div className="col-span-2 flex justify-between pt-1 border-t border-slate-200/80">
              <span className="text-slate-500">Bounds (m):</span>
              <span className="text-slate-800">
                {version.stats.bounds.x} × {version.stats.bounds.y} × {version.stats.bounds.z}m
              </span>
            </div>
          </div>

          {/* Quest Budget Alerts (VW-5) */}
          {(isTrisBudgetExceeded || isTextureBudgetExceeded) && (
            <div className="pt-1.5 border-t border-slate-200 text-[10px] space-y-1">
              {isTrisBudgetExceeded && (
                <div className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>&gt;100k tris budget limit for Meta Quest 3 standalone</span>
                </div>
              )}
              {isTextureBudgetExceeded && (
                <div className="flex items-center gap-1.5 text-amber-400 font-medium bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Texture &gt; 2048px ({version.stats.max_texture_res}px)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Outliner: Mesh Hierarchy & Visibility Toggles (VW-4) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
        <button
          onClick={() => setShowOutliner(!showOutliner)}
          className="p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 hover:text-slate-950 transition-colors mb-2 shadow-lg"
          title="Scene Outliner (Mesh Hierarchy)"
        >
          <Layers className="w-4 h-4" />
        </button>

        {showOutliner && (
          <div className="w-64 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <BoxIcon className="w-3.5 h-3.5 text-indigo-400" />
                Scene Outliner (VW-4)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{meshList.length} nodes</span>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {meshList.map(m => (
                <div
                  key={m.id}
                  onClick={() => onMeshSelect?.(m.name)}
                  className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    selectedMeshName === m.name
                      ? 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMeshVisibility(m.id);
                      }}
                      className="text-slate-500 hover:text-slate-950 p-0.5"
                    >
                      {m.visible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                    <span className="truncate font-mono">{m.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(m.triCount / 1000).toFixed(1)}k
                  </span>
                </div>
              ))}
            </div>

            {/* Transform Inspector: Unity-style position, rotation and scale */}
            <div data-transform-revision={transformRevision} className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Transform (Unity)</span>
                <select value={pivotMode} onChange={e => setPivotMode(e.target.value as 'origin' | 'center')}
                  className="rounded border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-800" title="Pivot display mode">
                  <option value="origin">Pivot: Origin</option><option value="center">Show Bounds Center</option>
                </select>
              </div>
              {!selectedTransformObject ? (
                <p className="text-[10px] text-slate-500">Select a mesh to edit its transform.</p>
              ) : (
                <>
                  {(['position', 'rotation', 'scale'] as const).map(axis => {
                    const vector = selectedTransformObject[axis];
                    const values = axis === 'rotation'
                      ? [THREE.MathUtils.radToDeg(vector.x), THREE.MathUtils.radToDeg(vector.y), THREE.MathUtils.radToDeg(vector.z)]
                      : [vector.x, vector.y, vector.z];
                    return (
                      <div key={axis} className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500">{axis}</div>
                        <div className="grid grid-cols-3 gap-1">
                          {values.map((value, index) => (
                            <label key={index} className="flex min-w-0 items-center gap-1 rounded bg-white/95 px-1.5 py-1 text-[9px] text-slate-500">
                              {(['X', 'Y', 'Z'] as const)[index]}
                              <input type="number" step={axis === 'rotation' ? 1 : 0.01} value={Number(value.toFixed(3))}
                                onChange={e => updateSelectedTransform(axis, index as 0 | 1 | 2, Number(e.target.value))}
                                className="w-full min-w-0 bg-transparent text-right font-mono text-[10px] text-slate-900 outline-none" />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-[9px] text-slate-500">
                    Units: metres by convention • Rotation: degrees • Space: {transformSpace}.
                    {pivotMode === 'center' && selectedBoundsCenter ? ` Bounds center: ${selectedBoundsCenter.x.toFixed(2)}, ${selectedBoundsCenter.y.toFixed(2)}, ${selectedBoundsCenter.z.toFixed(2)}.` : ' Pivot: object origin.'}
                  </div>
                </>
              )}
            </div>

            {/* Tone Mapping & Exposure Controls Slider (VW-2) */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-500" /> Exposure
                </span>
                <span className="font-mono text-indigo-400">{exposure.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={exposure}
                onChange={(e) => setExposure(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-100 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Up-Axis Indicator & Ground Unit (VW-3: 1 unit = 1m) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 p-2 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 text-[10px] font-mono text-slate-500">
        <Compass className="w-3.5 h-3.5 text-indigo-400" />
        <span>1 Grid Unit = 1.0 Meter • Y-Up</span>
      </div>
    </div>
  );
};
