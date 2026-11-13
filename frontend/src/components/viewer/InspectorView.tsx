

import React, { useEffect, useState } from 'react';

import { useApp } from '../../context/AppContext';

import { api } from '../../api/client';

import { ThreeViewer } from './ThreeViewer';

import { UvPanel } from './UvPanel';

import { TextureAssigner } from './TextureAssigner';

import { CommentsPanel } from './CommentsPanel';

import type { Comment } from '../../types';

import {

  ArrowLeft,

  ExternalLink,

  Download,

  Layers,

  Palette,

  MessageSquare,

  SplitSquareVertical,

  CheckCircle2,

  Clock,

  AlertCircle,

  Box,

  X,

} from 'lucide-react';

type InspectorTool = 'uv' | 'textures' | 'comments';

export const InspectorView: React.FC = () => {

  const {

    currentRole,

    selectedModel,

    selectedVersion,

    setSelectedVersion,

    setActiveTab,

    selectedCompany,

    selectedProject,

    setCompareVersions,

    showToast,

  } = useApp();

  const [activeSideTool, setActiveSideTool] =

    useState<InspectorTool>('uv');

  const [selectedMeshName, setSelectedMeshName] =

    useState<string | null>(null);

  const [isPinningComment, setIsPinningComment] = useState(false);

  const [pendingPinCoords, setPendingPinCoords] = useState<{

    x: number;

    y: number;

    z: number;

  } | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);

  // Load the full version list when the model response does not include it.

  // Approval status must never hide versions from Developer preview.

  const [availableVersions, setAvailableVersions] = useState<any[]>(

    selectedModel?.versions ?? []

  );

  useEffect(() => {

    let cancelled = false;

    const loadVersions = async () => {

      if (!selectedModel?.id) {

        setAvailableVersions([]);

        return;

      }

      const embeddedVersions = selectedModel.versions ?? [];

      setAvailableVersions(embeddedVersions);

      if (embeddedVersions.length > 0) return;

      try {

        const fetchedVersions = await api.getModelVersions(selectedModel.id);

        if (!cancelled) {

          setAvailableVersions(Array.isArray(fetchedVersions) ? fetchedVersions : []);

        }

      } catch (error) {

        console.error('Failed to load model versions:', error);

        if (!cancelled) {

          showToast(

            error instanceof Error ? error.message : 'Could not load model versions.',

            'error'

          );

        }

      }

    };

    void loadVersions();

    return () => {

      cancelled = true;

    };

  }, [selectedModel?.id]);

  // Reset mesh selection when the inspected asset/version changes.

  useEffect(() => {

    if (currentRole === 'developer') setActiveSideTool('uv');

    setSelectedMeshName(null);

    setIsPinningComment(false);

    setPendingPinCoords(null);

    setActiveSideTool('uv');

  }, [selectedModel?.id, selectedVersion?.id, currentRole]);

  if (!selectedModel || !selectedVersion) {

    return (

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-slate-50 p-8 text-center">

        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-300 bg-white">

          <Layers className="h-8 w-8 text-indigo-400" />

        </div>

        <h2 className="text-lg font-semibold text-slate-900">

          No Asset Selected

        </h2>

        <p className="mt-2 max-w-sm text-sm text-slate-600">

          Select a model from Browse Assets to inspect its 3D geometry,

          materials, UV layout and review comments.

        </p>

        <button

          type="button"

          onClick={() => setActiveTab('browse')}

          className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-indigo-500"

        >

          <span className="flex items-center gap-2">

            <ArrowLeft className="h-4 w-4" />

            Browse Assets

          </span>

        </button>

      </div>

    );

  }

  // Approval is only a workflow status. Show every uploaded version to every role.

  const allVersions = availableVersions.length > 0

    ? availableVersions

    : (selectedModel.versions ?? []);

  const versions = selectedVersion && !allVersions.some(v => v.id === selectedVersion.id)

    ? [...allVersions, selectedVersion]

    : allVersions;

  const files = selectedVersion.files || [];

  const materialMappings = selectedVersion.material_mappings || [];

  const handleOpenDrive = async () => {
    if (currentRole !== 'admin') {
      showToast('Only Admin can manage Google Drive folders.', 'error');
      return;
    }

    try {
      const { folderUrl } = await api.getVersionDriveFolder(selectedVersion.id);

      if (!folderUrl) {
        throw new Error('The API did not return a Google Drive folder URL.');
      }

      window.open(folderUrl, '_blank', 'noopener,noreferrer');
      showToast(
        `Opened Drive folder for ${selectedModel.name} ${selectedVersion.version_no}.`,
        'success'
      );
    } catch (error) {
      console.error('Could not open Google Drive folder:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Could not open Google Drive. Check the backend OAuth connection and folder endpoint.',
        'error'
      );
    }
  };

  // Load current file metadata, then download the real stored binaries into a ZIP.
  const handleDownloadPackage = async () => {
    try {
      const apiBase = String(
        (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1'
      ).replace(/\/+$/, '');

      const token =
        api.token ||
        localStorage.getItem('vr_asset_dashboard_auth_token');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const filesResponse = await fetch(
        `${apiBase}/versions/${encodeURIComponent(selectedVersion.id)}/files`,
        { method: 'GET', headers }
      );

      if (!filesResponse.ok) {
        const details = await filesResponse.text().catch(() => '');
        throw new Error(
          `Could not load version files (${filesResponse.status}): ${details}`
        );
      }

      const payload = await filesResponse.json();
      const latestFiles = Array.isArray(payload)
        ? payload
        : payload?.data ??
          payload?.items ??
          payload?.$values ??
          payload?.results ??
          [];

      if (!Array.isArray(latestFiles)) {
        throw new Error('The files API returned an unsupported response format.');
      }

      const downloadableFiles = latestFiles.filter((file: any) =>
        Boolean(file.id ?? file.Id ?? file.file_id ?? file.fileId)
      );

      if (downloadableFiles.length === 0) {
        throw new Error('No downloadable files found for this version.');
      }

      showToast(
        `Preparing ${downloadableFiles.length} file(s) for download...`,
        'info'
      );

      const zipModule = await import('jszip');
      const JSZip = zipModule.default;
      const zip = new JSZip();
      const usedNames = new Set<string>();

      const safeFilename = (input: string, fallback: string) => {
        const cleaned = input
          .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
          .replace(/^\.+$/, '')
          .trim();

        return cleaned || fallback;
      };

      let downloadedCount = 0;
      const failures: string[] = [];

      for (let index = 0; index < downloadableFiles.length; index += 1) {
        const file = downloadableFiles[index];
        const fileId = String(
          file.id ?? file.Id ?? file.file_id ?? file.fileId ?? ''
        ).trim();

        if (!fileId) continue;

        const originalName = String(
          file.filename ??
          file.fileName ??
          file.Filename ??
          file.FileName ??
          `asset-${index + 1}`
        );

        let filename = safeFilename(originalName, `asset-${index + 1}`);
        const dotIndex = filename.lastIndexOf('.');
        const stem = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
        const extension = dotIndex > 0 ? filename.slice(dotIndex) : '';
        let duplicateIndex = 2;

        while (usedNames.has(filename.toLowerCase())) {
          filename = `${stem}_${duplicateIndex}${extension}`;
          duplicateIndex += 1;
        }

        usedNames.add(filename.toLowerCase());

        try {
          const response = await fetch(
            `${apiBase}/versions/${encodeURIComponent(selectedVersion.id)}/files/${encodeURIComponent(fileId)}/download`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/octet-stream, application/json',
              },
            }
          );

          if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(
              `HTTP ${response.status}${details ? `: ${details}` : ''}`
            );
          }

          const blob = await response.blob();
          if (blob.size === 0) {
            throw new Error('The server returned an empty file.');
          }

          zip.file(filename, blob);
          downloadedCount += 1;
        } catch (error) {
          const reason = error instanceof Error
            ? error.message
            : 'Unknown download error';

          failures.push(`${originalName}: ${reason}`);
          console.error(
            `[InspectorView] Download failed for ${originalName}:`,
            error
          );
        }
      }

      if (downloadedCount === 0) {
        throw new Error(
          failures.length
            ? `No files could be downloaded. ${failures.join(' | ')}`
            : 'No valid file records were found.'
        );
      }

      const archiveBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const downloadUrl = URL.createObjectURL(archiveBlob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = safeFilename(
        `${selectedModel.name}_${selectedVersion.version_no}_Files.zip`,
        'VRAsset_Files.zip'
      );
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);

      if (failures.length > 0) {
        console.warn('[InspectorView] Some files failed to download:', failures);
        showToast(
          `Downloaded ${downloadedCount} file(s). ${failures.length} file(s) failed; check the browser console.`,
          'warning'
        );
      } else {
        showToast(
          `Successfully downloaded ${downloadedCount} file(s) as ZIP.`,
          'success'
        );
      }
    } catch (error) {
      console.error('Asset download failed:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Could not download asset files. Check the version-files API and authentication.',
        'error'
      );
    }
  };

  const handleStartCompare = () => {

    if (versions.length < 2) {

      showToast('At least two versions are required to compare.', 'info');

      return;

    }

    setCompareVersions([versions[0], versions[1]]);

    setActiveTab('compare');

  };

  const handleMeshSelect = (meshName: string | null) => {

    setSelectedMeshName(meshName);

    if (meshName) {

      setActiveSideTool('uv');

    }

  };

  const pinMarkers = comments

    .filter((comment) => comment.pin_position)

    .map((comment, index) => ({

      id: comment.id,

      x: comment.pin_position!.x,

      y: comment.pin_position!.y,

      z: comment.pin_position!.z,

      num: index + 1,

      resolved: comment.resolved,

    }));

  const toolButtonClass = (tool: InspectorTool) =>

    `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${

      activeSideTool === tool

        ? 'bg-indigo-600 text-slate-900 shadow'

        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

    }`;

  return (

    <div className="flex h-[calc(100vh-57px)] min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 text-slate-800">

      {/* Inspector header */}

      <header className="z-30 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">

        <div className="flex min-w-0 items-center gap-3">

          <button

            type="button"

            onClick={() => setActiveTab('browse')}

            title="Back to Browse Assets"

            className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"

          >

            <ArrowLeft className="h-4 w-4" />

          </button>

          <div className="min-w-0">

            <h1

              className="max-w-56 truncate text-sm font-bold text-slate-900 sm:max-w-80"

              title={selectedModel.name}

            >

              {selectedModel.name}

            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-2">

              <span className="text-[10px] text-slate-500">

                {selectedCompany?.name || 'Company'}

                {' / '}

                {selectedProject?.name || 'Project'}

              </span>

              <span className="text-[10px] text-slate-600">•</span>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-600">

                Version

                <select

                  value={selectedVersion.id}

                  onChange={(event) => {

                    const nextVersion = versions.find(

                      (version) => version.id === event.target.value

                    );

                    if (nextVersion) {

                      setSelectedVersion(nextVersion);

                    }

                  }}

                  className="max-w-36 rounded-md border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500"

                >

                  {versions.map((version) => (

                    <option key={version.id} value={version.id}>

                      {version.version_no}

                    </option>

                  ))}

                </select>

              </label>

              {selectedVersion.status === 'Approved' ? (

                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">

                  <CheckCircle2 className="h-3 w-3" />

                  Approved

                </span>

              ) : selectedVersion.status === 'Needs fix' ? (

                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">

                  <AlertCircle className="h-3 w-3" />

                  Needs Fix

                </span>

              ) : (

                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">

                  <Clock className="h-3 w-3" />

                  {selectedVersion.status}

                </span>

              )}

            </div>

          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2">

          {currentRole !== 'developer' && versions.length > 1 && (

            <button

              type="button"

              onClick={handleStartCompare}

              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"

            >

              <SplitSquareVertical className="h-3.5 w-3.5 text-indigo-400" />

              <span className="hidden sm:inline">Compare</span>

            </button>

          )}

          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={handleOpenDrive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
              title="Open Google Drive version folder"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Drive</span>
            </button>
          )}

          {(currentRole === 'admin' ||
            currentRole === 'developer' ||
            currentRole === 'artist') && (
            <button
              type="button"
              onClick={handleDownloadPackage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
              title="Download all files in this version as ZIP"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download ZIP</span>
            </button>
          )}
        </div>

      </header>

      {/* Inspector tools */}

      <nav className="z-20 flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 sm:px-4">

        <button

          type="button"

          onClick={() => setActiveSideTool('uv')}

          className={toolButtonClass('uv')}

        >

          <Layers className="h-4 w-4" />

          UV Layout

        </button>

        {currentRole !== 'developer' && <button

          type="button"

          onClick={() => setActiveSideTool('textures')}

          className={toolButtonClass('textures')}

        >

          <Palette className="h-4 w-4" />

          Materials & Textures

        </button>}

        <button

          type="button"

          onClick={() => setActiveSideTool('comments')}

          className={toolButtonClass('comments')}

        >

          <MessageSquare className="h-4 w-4" />

          Review & Pins

          {comments.length > 0 && (

            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-900">

              {comments.length}

            </span>

          )}

        </button>

        <div className="ml-auto hidden items-center gap-2 text-[10px] text-slate-500 md:flex">

          <Box className="h-3.5 w-3.5" />

          3D Asset Inspector

        </div>

      </nav>

      {/* Main 3D inspector area */}

      <main className="flex min-h-0 flex-1 overflow-hidden">

        {/* 3D viewport */}

        <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-slate-50">

          <ThreeViewer

            key={`${selectedModel.id}-${selectedVersion.id}`}

            version={selectedVersion}

            selectedMeshName={selectedMeshName}

            onMeshSelect={handleMeshSelect}

            isPinningComment={isPinningComment}

            onPinComment={(coords) => {

              setPendingPinCoords(coords);

              setActiveSideTool('comments');

              setIsPinningComment(false);

              showToast(

                `Captured 3D surface point: (${coords.x}, ${coords.y}, ${coords.z})`,

                'info'

              );

            }}

            pinPositions={pinMarkers}

          />

          {selectedMeshName && (

            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-xl border border-indigo-200 bg-white/95 px-3 py-2 shadow-xl">

              <Box className="h-4 w-4 shrink-0 text-indigo-400" />

              <span className="text-[11px] text-slate-600">

                Selected mesh:

              </span>

              <span

                className="max-w-48 truncate text-xs font-semibold text-slate-900"

                title={selectedMeshName}

              >

                {selectedMeshName}

              </span>

              <button

                type="button"

                onClick={() => setSelectedMeshName(null)}

                title="Clear selected mesh"

                className="ml-1 rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"

              >

                <X className="h-3.5 w-3.5" />

              </button>

            </div>

          )}

        </section>

        {/* Right inspector panel */}

        <aside className="flex w-[320px] max-w-[46vw] shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white sm:w-[360px]">

          <div className="flex min-h-12 shrink-0 items-center justify-between border-b border-slate-200 px-3">

            <div className="flex min-w-0 items-center gap-2">

              {activeSideTool === 'uv' && (

                <Layers className="h-4 w-4 shrink-0 text-indigo-400" />

              )}

              {activeSideTool === 'textures' && (

                <Palette className="h-4 w-4 shrink-0 text-indigo-400" />

              )}

              {activeSideTool === 'comments' && (

                <MessageSquare className="h-4 w-4 shrink-0 text-indigo-400" />

              )}

              <h2 className="truncate text-xs font-semibold text-slate-900">

                {activeSideTool === 'uv'

                  ? 'UV Inspector'

                  : activeSideTool === 'textures'

                    ? 'Material Inspector'

                    : '3D Review'}

              </h2>

            </div>

            {activeSideTool === 'uv' && (

              <span className="text-[10px] text-slate-500">

                UV0 / UV1

              </span>

            )}

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">

            {activeSideTool === 'uv' && (

              <div className="min-h-full">

                {!selectedMeshName && (

                  <div className="border-b border-slate-200 bg-indigo-50 px-3 py-2.5">

                    <p className="text-[11px] leading-5 text-slate-600">

                      Click a mesh in the 3D viewport or choose one in Scene

                      Outliner to inspect its UV layout.

                    </p>

                  </div>

                )}

                {selectedMeshName && (

                  <div className="border-b border-slate-200 bg-indigo-50 px-3 py-2.5">

                    <p className="text-[10px] text-slate-600">

                      Selected mesh

                    </p>

                    <p

                      className="mt-1 truncate text-xs font-semibold text-indigo-700"

                      title={selectedMeshName}

                    >

                      {selectedMeshName}

                    </p>

                  </div>

                )}

                <UvPanel

                  version={selectedVersion}

                  selectedMeshName={selectedMeshName}

                />

              </div>

            )}

            {activeSideTool === 'textures' && currentRole !== 'developer' && (

              <TextureAssigner version={selectedVersion} />

            )}

            {activeSideTool === 'comments' && (

              <CommentsPanel

                version={selectedVersion}

                isPinningComment={isPinningComment}

                setIsPinningComment={setIsPinningComment}

                pendingPinCoords={pendingPinCoords}

                setPendingPinCoords={setPendingPinCoords}

                comments={comments}

                setComments={setComments}

              />

            )}

          </div>

        </aside>

      </main>

    </div>

  );

};
