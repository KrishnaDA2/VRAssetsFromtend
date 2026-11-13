import React, { useEffect, useState } from 'react';

import { useApp } from '../../context/AppContext';

import { 

  X, 

  UploadCloud, 

  AlertTriangle, 

  Loader2, 

  FileCode,

  Image as ImageIcon,

  Layers,

  Sparkles

} from 'lucide-react';

import { ModelCategory, TargetPlatform } from '../../types';

import { api } from '../../api/client';

export const UploadModal: React.FC = () => {

  const {

    isUploadModalOpen,

    setIsUploadModalOpen,

    companies,

    selectedCompany,

    setSelectedCompany,

    projects,

    selectedProject,

    setSelectedProject,

    selectedVersion,

    models,

    setSelectedModel,

    setSelectedVersion,

    setActiveTab,

    refreshData,

    showToast,

    currentUser

  } = useApp();

  const [targetCompanyId, setTargetCompanyId] = useState(selectedCompany?.id || companies[0]?.id || '');

  const [targetProjectId, setTargetProjectId] = useState(selectedProject?.id || projects[0]?.id || '');

  // AppContext data can arrive asynchronously; keep selection IDs in sync.

  useEffect(() => {

    if (companies.length && !companies.some(c => c.id === targetCompanyId)) {

      setTargetCompanyId(selectedCompany?.id || companies[0].id);

    }

    if (!companies.length && targetCompanyId) setTargetCompanyId('');

  }, [companies, selectedCompany, targetCompanyId]);

  useEffect(() => {

    if (projects.length && !projects.some(p => p.id === targetProjectId)) {

      const selectedId = selectedProject?.id;

      setTargetProjectId(

        selectedId && projects.some(p => p.id === selectedId) ? selectedId : projects[0].id

      );

    }

    if (!projects.length && targetProjectId) setTargetProjectId('');

  }, [projects, selectedProject, targetProjectId]);

  // Model selection mode: existing model (new version) or create new model

  const [modelMode, setModelMode] = useState<'existing' | 'new'>('new');

  const [targetModelId, setTargetModelId] = useState('');

  // New model inputs

  const [newModelName, setNewModelName] = useState('');

  const [category, setCategory] = useState<ModelCategory>('prop');

  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>('Quest');

  const [tagsInput, setTagsInput] = useState('');

  // Version notes (FR-U6: required for v002+)

  const [versionNotes, setVersionNotes] = useState('');

  // Files

  const [files, setFiles] = useState<{ file: File; name: string; size: number; isFbx: boolean }[]>([]);

  const [isDragging, setIsDragging] = useState(false);

  // Upload status & progress (FR-U4)

  const [isUploading, setIsUploading] = useState(false);

  const [progressPercent, setProgressPercent] = useState(0);

  const [currentStepText, setCurrentStepText] = useState('');

  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isUploadModalOpen) return null;

  // Selected existing model object

  const existingModel = models.find(m => m.id === targetModelId);

  const nextVersionNo = existingModel ? `v${String((existingModel.versions?.length || 0) + 1).padStart(3, '0')}` : 'v001';

  const isV002Plus = modelMode === 'existing' && (existingModel?.versions?.length || 0) >= 1;

  // Auto-format model name to Title_Case_With_Underscores

  const formatTitleCaseUnderscore = (val: string) => {

    return val

      .replace(/[^a-zA-Z0-9\s_]/g, '')

      .split(/[\s_]+/)

      .filter(Boolean)

      .map(word => word.charAt(0).toUpperCase() + word.slice(1))

      .join('_');

  };

  const handleNameChange = (val: string) => {

    setNewModelName(val);

  };

  const formattedName = formatTitleCaseUnderscore(newModelName);

  // File drag & drop (FR-U1)

  const handleDrop = (e: React.DragEvent) => {

    e.preventDefault();

    setIsDragging(false);

    if (e.dataTransfer.files) {

      addFiles(Array.from(e.dataTransfer.files));

    }

  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files) {

      addFiles(Array.from(e.target.files));

    }

  };

  const addFiles = (newFileList: File[]) => {

    const validExtensions = ['.fbx', '.png', '.jpg', '.jpeg', '.tga', '.tif', '.tiff', '.bmp', '.webp', '.zip'];

    const added = newFileList

      .filter(f => validExtensions.some(ext => f.name.toLowerCase().endsWith(ext)))

      .map(f => ({

        file: f,

        name: f.name,

        size: f.size,

        isFbx: f.name.toLowerCase().endsWith('.fbx') || f.name.toLowerCase().endsWith('.zip')

      }));

    if (added.length === 0) {

      showToast('Please upload .fbx, .png, .jpg, .tga, .tif, or .zip files', 'warning');

      return;

    }

    setFiles(prev => [...prev, ...added]);

    // If new model and no name given, infer from first FBX

    if (!newModelName) {

      const fbx = added.find(f => f.isFbx);

      if (fbx) {

        const rawName = fbx.name.replace(/\.[^/.]+$/, '').replace(/_v\d+$/i, '');

        setNewModelName(formatTitleCaseUnderscore(rawName));

      }

    }

  };

  const removeFile = (index: number) => {

    setFiles(prev => prev.filter((_, i) => i !== index));

  };

  // Warnings check (FR-U5)

  const fbxFiles = files.filter(f => f.isFbx);

  const textureFiles = files.filter(f => !f.isFbx);

  const hasEmbeddedWarning = fbxFiles.length > 0 && textureFiles.length === 0;

  // Active target company and project

  const compObj = companies.find(c => c.id === targetCompanyId);

  const projObj = projects.find(p => p.id === targetProjectId);

  const resolvedModelName = modelMode === 'existing' ? existingModel?.name || 'Model' : (formattedName || 'New_Model');

  // Start upload

  const handleStartUpload = async () => {

    if (!targetCompanyId) {
      const message = 'Select a company before uploading an asset.';
      setUploadError(message);
      showToast(message, 'error');
      return;
    }

    const selectedProjectForCompany = projects.find(
      project => project.id === targetProjectId && project.company_id === targetCompanyId
    );

    if (!targetProjectId || !selectedProjectForCompany) {
      const message = 'Select a project that belongs to the selected company before uploading an asset.';
      setUploadError(message);
      showToast(message, 'error');
      return;
    }

    if (files.length === 0) {

      showToast('Select an FBX for a new version, or select an existing model and texture images to add textures later.', 'error');

      return;

    }

    const hasModelFile = files.some(f => /\.(fbx|zip)$/i.test(f.name));

    const textureOnly = files.every(f => /\.(png|jpe?g|tga|tif|tiff|bmp|webp)$/i.test(f.name));

    if (modelMode === 'existing' && textureOnly && !hasModelFile) {

      const versionId = existingModel?.latest_version?.id || existingModel?.latest_version_id;

      if (!targetModelId || !versionId) {

        showToast('Select an existing model with an uploaded version before adding textures.', 'error');

        return;

      }

      setIsUploading(true);

      setProgressPercent(10);

      setCurrentStepText('Adding texture files to the selected version...');

      setUploadError(null);

      try {

        await api.uploadTextures(versionId, files.map(f => f.file), (pct: number, step: string) => {

          setProgressPercent(pct);

          setCurrentStepText(step);

        });

        const savedTextureFiles = await api.getVersionFiles(versionId);
        if (selectedVersion?.id === versionId) {
          setSelectedVersion({ ...selectedVersion, files: savedTextureFiles });
        }

        showToast('Texture files uploaded to Google Drive and added to preview successfully.', 'success');

        await refreshData();

        setFiles([]);

        setIsUploadModalOpen(false);

      } catch (err: any) {

        setUploadError(err?.message || 'Texture upload failed.');
        showToast(err?.message || 'Texture upload failed.', 'error');

      } finally {

        setIsUploading(false);

      }

      return;

    }

    if (!files.some(f => /\.fbx$/i.test(f.name))) {

      showToast('An FBX file is required for a new version. To add textures later, select an existing model and texture images only.', 'error');

      return;

    }

    if (modelMode === 'new' && !targetProjectId.trim()) {

      const message = 'Select a project before creating a new model.';

      setUploadError(message);

      showToast(message, 'error');

      return;

    }

    if (modelMode === 'new' && !formattedName) {

      showToast('Please enter a valid model name in Title_Case_With_Underscores', 'error');

      return;

    }

    if (modelMode === 'existing' && !targetModelId) {

      showToast('Please select an existing model to upload a new version to', 'error');

      return;

    }

    if (isV002Plus && !versionNotes.trim()) {

      showToast('FR-U6: Version notes ("what changed") are strictly required for v002+ uploads', 'error');

      return;

    }

    // A backend upload must use the real authenticated user's GUID, not a mock ID.

    const uploaderId = currentUser?.id;

    const isValidUploaderGuid =

      typeof uploaderId === 'string' &&

      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uploaderId);

    if (api.token && !isValidUploaderGuid) {

      const message = 'Your login session has no valid user GUID. Please sign out and sign in again.';

      setUploadError(message);

      showToast(message, 'error');

      return;

    }

    setIsUploading(true);

    setProgressPercent(5);

    setCurrentStepText('Uploading files to Google Drive...');

    setUploadError(null);

    try {

      let modelIdToUse = targetModelId;

      // Create model if new

      if (modelMode === 'new') {

        const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

        const createdModel = await api.createModel(targetProjectId, {

          name: formattedName,

          category,

          tags: parsedTags.length > 0 ? parsedTags : ['vr-ready', category],

          target_platform: targetPlatform

        });

        modelIdToUse = createdModel.id;

      }

      // Trigger multi-step processing upload

      const uploadedVersion = await api.uploadVersion(modelIdToUse, {
        notes: versionNotes,
        uploaderId: currentUser.id,
        uploaderName: currentUser.name,
        files: files.map(f => ({ name: f.name, size: f.size, type: f.file.type, fileBlob: f.file })),
        onProgress: (pct: number, step: string) => {
          setProgressPercent(pct);
          setCurrentStepText(step);
        }
      });

      // The API client returns only after Google Drive upload and SQL metadata
      // verification. Select the new version so its files are ready in preview.
      const refreshedModels = await api.getModels(targetProjectId).catch(() => []);
      const refreshedModel = refreshedModels.find(model => model.id === modelIdToUse);
      if (refreshedModel) setSelectedModel(refreshedModel);
      setSelectedVersion(uploadedVersion);
      setActiveTab('viewer');

      showToast(
        `Upload successful! ${resolvedModelName} ${nextVersionNo} is saved in Google Drive and ready for Admin/Developer preview.`,
        'success'
      );

      try {
        await refreshData();
      } catch (refreshError) {
        console.warn('Upload succeeded, but dashboard refresh failed:', refreshError);
      }
      setIsUploadModalOpen(false);

    } catch (err: any) {

      console.error(err);

      setUploadError(err.message || 'Upload failed.');
      showToast(err.message || 'Upload failed.', 'error');

    } finally {

      setIsUploading(false);

    }

  };

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">

      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}

        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">

          <div className="flex items-center gap-2.5">

            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">

              <UploadCloud className="w-5 h-5" />

            </div>

            <div>

              <h2 className="text-base font-bold text-white flex items-center gap-2">

                Upload 3D VR Asset

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">

                  FR-U1 to U6

                </span>

              </h2>

              <p className="text-xs text-slate-400">

                Upload an FBX model; textures are optional and can be added later

              </p>

            </div>

          </div>

          <button

            onClick={() => !isUploading && setIsUploadModalOpen(false)}

            disabled={isUploading}

            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"

          >

            <X className="w-5 h-5" />

          </button>

        </div>

        {/* Modal Scroll Body */}

        <div className="p-6 space-y-5 overflow-y-auto flex-1">

          {/* Target Company & Project (FR-U2) */}

          <div className="grid grid-cols-2 gap-4">

            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-1.5">

                Target Company

              </label>

              <select

                value={targetCompanyId}

                onChange={(e) => {
                  const companyId = e.target.value;
                  setTargetCompanyId(companyId);
                  setTargetProjectId('');
                  setTargetModelId('');
                  setSelectedProject(null);
                  const company = companies.find(c => c.id === companyId) ?? null;
                  setSelectedCompany(company);
                }}

                disabled={isUploading}

                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"

              >

                <option value="">-- Select Company --</option>

                {companies.map(c => (

                  <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>

                ))}

              </select>

            </div>

            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-1.5">

                Target Project

              </label>

              <select

                value={targetProjectId}

                onChange={(e) => {
                  const projectId = e.target.value;
                  setTargetProjectId(projectId);
                  setTargetModelId('');
                  const project = projects.find(p => p.id === projectId) ?? null;
                  setSelectedProject(project);
                }}

                disabled={isUploading}

                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"

              >

                <option value="">-- Select Project --</option>

                {projects.map(p => (

                  <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>

                ))}

              </select>

            </div>

          </div>

          {/* Model Mode: New Model vs Existing Model Version (FR-U2) */}

          <div className="space-y-3">

            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">

              <button

                type="button"

                onClick={() => setModelMode('new')}

                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${

                  modelMode === 'new'

                    ? 'bg-indigo-600 text-white shadow-sm'

                    : 'text-slate-400 hover:text-slate-200'

                }`}

              >

                + Create New Model

              </button>

              <button

                type="button"

                onClick={() => setModelMode('existing')}

                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${

                  modelMode === 'existing'

                    ? 'bg-indigo-600 text-white shadow-sm'

                    : 'text-slate-400 hover:text-slate-200'

                }`}

              >

                Publish New Version (v002+)

              </button>

            </div>

            {modelMode === 'new' ? (

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">

                <div className="md:col-span-2">

                  <div className="flex items-center justify-between mb-1">

                    <label className="text-xs font-semibold text-slate-300">

                      Model Name (Title_Case_With_Underscores)

                    </label>

                    <span className="text-[10px] text-indigo-400 font-mono">

                      Output: {formattedName || 'Battery_Pack'}

                    </span>

                  </div>

                  <input

                    type="text"

                    value={newModelName}

                    onChange={(e) => handleNameChange(e.target.value)}

                    placeholder="e.g. Battery Pack or Soldering Iron"

                    disabled={isUploading}

                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"

                  />

                </div>

                <div>

                  <label className="text-xs font-semibold text-slate-300 block mb-1">

                    Asset Category

                  </label>

                  <select

                    value={category}

                    onChange={(e) => setCategory(e.target.value as ModelCategory)}

                    disabled={isUploading}

                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"

                  >

                    <option value="prop">Prop</option>

                    <option value="environment">Environment</option>

                    <option value="character">Character</option>

                    <option value="vehicle">Vehicle</option>

                    <option value="UI">UI / Haptic</option>

                  </select>

                </div>

                <div>

                  <label className="text-xs font-semibold text-slate-300 block mb-1">

                    Target Platform Budget

                  </label>

                  <select

                    value={targetPlatform}

                    onChange={(e) => setTargetPlatform(e.target.value as TargetPlatform)}

                    disabled={isUploading}

                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"

                  >

                    <option value="Quest">Meta Quest (Max 100k tris, 2048px textures)</option>

                    <option value="PC VR">PC VR / High Fidelity</option>

                  </select>

                </div>

                <div className="md:col-span-2">

                  <label className="text-xs font-semibold text-slate-300 block mb-1">

                    Search Tags (comma separated)

                  </label>

                  <input

                    type="text"

                    value={tagsInput}

                    onChange={(e) => setTagsInput(e.target.value)}

                    placeholder="e.g. battery, industrial, high-voltage"

                    disabled={isUploading}

                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"

                  />

                </div>

              </div>

            ) : (

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">

                <div>

                  <label className="text-xs font-semibold text-slate-300 block mb-1">

                    Choose Existing Model to Version

                  </label>

                  <select

                    value={targetModelId}

                    onChange={(e) => setTargetModelId(e.target.value)}

                    disabled={isUploading}

                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"

                  >

                    <option value="">-- Select Model --</option>

                    {models.map(m => (

                      <option key={m.id} value={m.id}>

                        {m.name} (Current: {m.latest_version?.version_no || 'v001'})

                      </option>

                    ))}

                  </select>

                </div>

                {existingModel && (

                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">

                    <Sparkles className="w-3.5 h-3.5" />

                    New version will be published as: <span className="font-mono font-bold">{nextVersionNo}</span>

                  </div>

                )}

              </div>

            )}

          </div>

          {/* Version notes (FR-U6: required for v002+) */}

          <div>

            <div className="flex items-center justify-between mb-1">

              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">

                Version Notes ("What Changed")

                {isV002Plus && (

                  <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider">

                    \* Required for {nextVersionNo}

                  </span>

                )}

              </label>

            </div>

            <textarea

              value={versionNotes}

              onChange={(e) => setVersionNotes(e.target.value)}

              placeholder={isV002Plus ? "Mandatory for v002+: e.g. Reduced tris to 48k for Quest, baked 2K normal maps, split UVs." : "Optional notes on changes, scale, or texture setups..."}

              disabled={isUploading}

              rows={2}

              className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${

                isV002Plus && !versionNotes.trim()

                  ? 'border-amber-500/50 focus:border-amber-500'

                  : 'border-slate-800 focus:border-indigo-500'

              }`}

            />

          </div>

          {/* Drag & Drop File Zone (FR-U1) */}

          <div

            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}

            onDragLeave={() => setIsDragging(false)}

            onDrop={handleDrop}

            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${

              isDragging

                ? 'border-indigo-500 bg-indigo-500/10'

                : 'border-slate-800 hover:border-slate-700 bg-slate-950/30'

            }`}

          >

            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">

              <UploadCloud className="w-6 h-6" />

            </div>

            <h4 className="text-xs font-bold text-slate-200">

              Drag & Drop an .fbx model and optional texture files

            </h4>

            <p className="text-[11px] text-slate-500 mt-1">

              Supports <span className="text-slate-300 font-mono">.fbx, .png, .jpg, .tga, .tif</span> or a single <span className="text-slate-300 font-mono">.zip</span> (up to 2 GB total)

            </p>

            <label className="mt-3 inline-block px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-sm">

              Browse Files

              <input

                type="file"

                multiple

                accept=".fbx,.png,.jpg,.jpeg,.tga,.tif,.tiff,.zip"

                onChange={handleFileInput}

                className="hidden"

              />

            </label>

          </div>

          {/* Warnings (FR-U5) */}

          {hasEmbeddedWarning && (

            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">

              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />

              <div>

                <span className="font-semibold block">Missing Texture Files (FR-U5):</span>

                <span>No texture images attached. If the FBX contains embedded textures, the backend will auto-extract them into <code className="font-mono text-amber-100">textures/</code>. Missing maps will render with a neutral grey material.</span>

              </div>

            </div>

          )}

          {/* Uploaded Files List */}

          {files.length > 0 && (

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">

              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">

                Selected Files ({files.length})

              </span>

              {files.map((file, idx) => (

                <div

                  key={idx}

                  className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800/80 rounded-xl text-xs"

                >

                  <div className="flex items-center gap-2 truncate">

                    {file.isFbx ? (

                      <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />

                    ) : (

                      <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />

                    )}

                    <span className="truncate font-mono text-slate-200">{file.name}</span>

                    <span className="text-[10px] text-slate-500 font-mono">

                      ({(file.size / 1024 / 1024).toFixed(2)} MB)

                    </span>

                  </div>

                  {!isUploading && (

                    <button

                      onClick={() => removeFile(idx)}

                      className="text-slate-500 hover:text-rose-400 p-1"

                    >

                      <X className="w-3.5 h-3.5" />

                    </button>

                  )}

                </div>

              ))}

            </div>

          )}

          {/* Live Progress Bar (FR-U4) */}

          {isUploading && (

            <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-2.5 animate-in fade-in">

              <div className="flex items-center justify-between text-xs">

                <span className="font-medium text-slate-300 flex items-center gap-2">

                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />

                  {currentStepText}

                </span>

                <span className="font-mono font-bold text-indigo-400">{progressPercent}%</span>

              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">

                <div

                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"

                  style={{ width: `${progressPercent}%` }}

                />

              </div>

              <div className="text-[10px] text-slate-500 font-mono">

                Google Drive upload • Textures can be attached later

              </div>

            </div>

          )}

          {uploadError && (

            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center justify-between">

              <span>{uploadError}</span>

              <button

                onClick={handleStartUpload}

                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-semibold"

              >

                Retry

              </button>

            </div>

          )}

        </div>

        {/* Footer Actions */}

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">

          <button

            type="button"

            onClick={() => setIsUploadModalOpen(false)}

            disabled={isUploading}

            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"

          >

            Cancel

          </button>

          <button

            type="button"

            onClick={handleStartUpload}

            disabled={isUploading || files.length === 0}

            className={`px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 shadow-lg transition-all ${

              isUploading || files.length === 0

                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'

                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50 hover:scale-[1.02]'

            }`}

          >

            {isUploading ? (

              <>

                <Loader2 className="w-4 h-4 animate-spin" />

                <span>Processing Asset...</span>

              </>

            ) : (

              <>

                <UploadCloud className="w-4 h-4" />

                <span>Upload to Google Drive</span>

              </>

            )}

          </button>

        </div>

      </div>

    </div>

  );

};
