
import React, { useEffect, useRef, useState } from 'react';
import { ModelVersion } from '../../types';
import {
  Download,
  Layers,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface UvPanelProps {
  version: ModelVersion;
  selectedMeshName?: string | null;
  onHoverIsland?: (meshName: string | null) => void;
}

export const UvPanel: React.FC<UvPanelProps> = ({
  version,
  selectedMeshName,
  onHoverIsland
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [uvChannel, setUvChannel] = useState<'UV0' | 'UV1'>('UV0');
  const [backgroundMode, setBackgroundMode] =
    useState<'checker' | 'texture' | 'dark'>('checker');
  const [wireColor] = useState<string>('#38bdf8');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredIsland, setHoveredIsland] = useState<string | null>(null);

  // Estimate only: actual mesh UV coordinates are not connected yet.
  const texResolution = version.stats.max_texture_res || 2048;

  const boundSizeM = Math.max(
    version.stats.bounds.x,
    version.stats.bounds.y,
    version.stats.bounds.z
  ) || 1;

  const approximateTexelDensity = Math.round(
    texResolution / boundSizeM
  );

  // Render the illustrative UV layout.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;

    ctx.clearRect(0, 0, size, size);

    // Background.
    if (backgroundMode === 'checker') {
      const tileSize = size / 16;

      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle =
            (x + y) % 2 === 0 ? '#1e293b' : '#0f172a';

          ctx.fillRect(
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }
      }
    } else if (backgroundMode === 'dark') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, size, size);
    } else {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        size,
        size
      );

      gradient.addColorStop(0, '#1e1b4b');
      gradient.addColorStop(1, '#0f172a');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }

    // Zoom around the center.
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(-size / 2, -size / 2);

    // UV 0-1 boundary.
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5 / zoomLevel;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // Draw an illustrative UV island.
    const drawIsland = (
      name: string,
      x: number,
      y: number,
      w: number,
      h: number,
      points: [number, number][]
    ) => {
      const isSelected = Boolean(
        selectedMeshName &&
        (
          selectedMeshName.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(selectedMeshName.toLowerCase())
        )
      );

      const isHovered = hoveredIsland === name;

      ctx.beginPath();

      ctx.moveTo(
        x + points[0][0] * w,
        y + points[0][1] * h
      );

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(
          x + points[i][0] * w,
          y + points[i][1] * h
        );
      }

      ctx.closePath();

      if (isSelected || isHovered) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2.5 / zoomLevel;
      } else {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.fill();
        ctx.strokeStyle = wireColor;
        ctx.lineWidth = 1.2 / zoomLevel;
      }

      ctx.stroke();

      // Illustrative interior triangulation lines.
      ctx.strokeStyle = isSelected || isHovered
        ? 'rgba(129, 140, 248, 0.6)'
        : 'rgba(56, 189, 248, 0.3)';

      ctx.lineWidth = 0.8 / zoomLevel;

      for (let i = 0; i < points.length - 1; i += 2) {
        ctx.beginPath();

        ctx.moveTo(
          x + points[i][0] * w,
          y + points[i][1] * h
        );

        ctx.lineTo(
          x + w * 0.5,
          y + h * 0.5
        );

        ctx.stroke();
      }

      // Island label.
      ctx.fillStyle =
        isSelected || isHovered ? '#ffffff' : '#94a3b8';

      ctx.font = `${10 / zoomLevel}px monospace`;

      ctx.fillText(
        name,
        x + 6 / zoomLevel,
        y + 16 / zoomLevel
      );
    };

    if (uvChannel === 'UV0') {
      // Main diffuse / PBR UV layout.
      drawIsland(
        'Chassis',
        size * 0.08,
        size * 0.08,
        size * 0.5,
        size * 0.42,
        [
          [0.05, 0.05],
          [0.95, 0.05],
          [0.95, 0.95],
          [0.05, 0.95]
        ]
      );

      drawIsland(
        'HV_Terminals',
        size * 0.64,
        size * 0.08,
        size * 0.28,
        size * 0.42,
        [
          [0.5, 0.05],
          [0.95, 0.5],
          [0.5, 0.95],
          [0.05, 0.5]
        ]
      );

      drawIsland(
        'Battery_Cells',
        size * 0.08,
        size * 0.56,
        size * 0.84,
        size * 0.36,
        [
          [0.05, 0.1],
          [0.95, 0.1],
          [0.9, 0.9],
          [0.1, 0.9]
        ]
      );
    } else {
      // Illustrative UV1 lightmap layout.
      drawIsland(
        'Lightmap_Chassis',
        size * 0.06,
        size * 0.06,
        size * 0.42,
        size * 0.42,
        [
          [0.05, 0.05],
          [0.95, 0.05],
          [0.95, 0.95],
          [0.05, 0.95]
        ]
      );

      drawIsland(
        'Lightmap_Terminals',
        size * 0.52,
        size * 0.06,
        size * 0.42,
        size * 0.42,
        [
          [0.05, 0.05],
          [0.95, 0.05],
          [0.95, 0.95],
          [0.05, 0.95]
        ]
      );

      drawIsland(
        'Lightmap_Cells',
        size * 0.06,
        size * 0.52,
        size * 0.88,
        size * 0.42,
        [
          [0.05, 0.05],
          [0.95, 0.05],
          [0.95, 0.95],
          [0.05, 0.95]
        ]
      );
    }

    ctx.restore();
  }, [
    uvChannel,
    backgroundMode,
    wireColor,
    selectedMeshName,
    hoveredIsland,
    version.id,
    zoomLevel
  ]);

  // Export canvas as PNG.
  const handleExportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${version.drive_folder_id}_${uvChannel}_layout.png`;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  // Illustrative hover mapping; not real mesh hit-testing.
  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    let island: string | null = null;

    if (uvChannel === 'UV0') {
      if (x >= 0.08 && x <= 0.58 && y >= 0.08 && y <= 0.50) {
        island = 'Chassis';
      } else if (
        x >= 0.64 && x <= 0.92 &&
        y >= 0.08 && y <= 0.50
      ) {
        island = 'HV_Terminals';
      } else if (
        x >= 0.08 && x <= 0.92 &&
        y >= 0.56 && y <= 0.92
      ) {
        island = 'Battery_Cells';
      }
    } else {
      if (
        x >= 0.06 && x <= 0.48 &&
        y >= 0.06 && y <= 0.48
      ) {
        island = 'Lightmap_Chassis';
      } else if (
        x >= 0.52 && x <= 0.94 &&
        y >= 0.06 && y <= 0.48
      ) {
        island = 'Lightmap_Terminals';
      } else if (
        x >= 0.06 && x <= 0.94 &&
        y >= 0.52 && y <= 0.94
      ) {
        island = 'Lightmap_Cells';
      }
    }

    setHoveredIsland(island);
    onHoverIsland?.(island);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredIsland(null);
    onHoverIsland?.(null);
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-500" />
            2D UV Layout Preview
          </span>

          {/* <button
            type="button"
            onClick={handleExportPng}
            className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition-colors"
            title="Export UV layout as PNG"
          >
            <Download className="w-3 h-3" />
            Export PNG
          </button> */}
        </div>

        {/* UV channel tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setUvChannel('UV0');
              setHoveredIsland(null);
              onHoverIsland?.(null);
            }}
            className={`py-1 rounded-lg text-xs font-semibold transition-all ${
              uvChannel === 'UV0'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            UV0 (Diffuse / PBR)
          </button>

          <button
            type="button"
            onClick={() => {
              setUvChannel('UV1');
              setHoveredIsland(null);
              onHoverIsland?.(null);
            }}
            className={`py-1 rounded-lg text-xs font-semibold transition-all ${
              uvChannel === 'UV1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            UV1 (Lightmap UVs)
          </button>
        </div>
      </div>

      {/* UV canvas */}
      <div className="p-3 flex flex-col items-center">
        <div className="relative w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          <canvas
            ref={canvasRef}
            width={512}
            height={512}
            className="w-full h-full block cursor-crosshair"
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />

          {/* Zoom controls */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() =>
                setZoomLevel((zoom) =>
                  Math.max(0.5, Number((zoom - 0.25).toFixed(2)))
                )
              }
              disabled={zoomLevel <= 0.5}
              className="rounded p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-10 text-center text-[10px] font-mono text-slate-600">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              type="button"
              onClick={() =>
                setZoomLevel((zoom) =>
                  Math.min(2, Number((zoom + 0.25).toFixed(2)))
                )
              }
              disabled={zoomLevel >= 2}
              className="rounded p-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="rounded p-1 text-slate-700 hover:bg-slate-100"
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* Background options */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 px-2 py-1 rounded-lg bg-white/85 backdrop-blur-md border border-slate-200 text-[10px]">
            <span className="text-slate-600">Backdrop:</span>

            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => setBackgroundMode('checker')}
                className={`px-1.5 py-0.5 rounded ${
                  backgroundMode === 'checker'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Checker
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode('texture')}
                className={`px-1.5 py-0.5 rounded ${
                  backgroundMode === 'texture'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Diffuse
              </button>

              <button
                type="button"
                onClick={() => setBackgroundMode('dark')}
                className={`px-1.5 py-0.5 rounded ${
                  backgroundMode === 'dark'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Selection status */}
        <div className="mt-2 w-full p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />

          <span className="break-words">
            {selectedMeshName ? (
              <>
                Selected mesh:{' '}
                <strong className="text-indigo-600 font-mono">
                  {selectedMeshName}
                </strong>
              </>
            ) : hoveredIsland ? (
              <>
                Preview island:{' '}
                <strong className="text-indigo-600 font-mono">
                  {hoveredIsland}
                </strong>
              </>
            ) : (
              'Illustrative preview — actual mesh UV coordinates are not connected yet'
            )}
          </span>
        </div>
      </div>

      {/* UV diagnostics */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
          UV Diagnostics
        </span>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-600 flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Overlapping UVs
            </span>

            <span className="text-amber-600 font-semibold">
              Not analyzed
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-600 flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              0–1 Bounds
            </span>

            <span className="text-amber-600 font-semibold">
              Not analyzed
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 text-[11px]">
                Estimated scale:
              </span>

              <span className="text-slate-800 font-bold">
                {approximateTexelDensity} px/m*
              </span>
            </div>

            <div className="text-[9px] text-slate-500 font-sans leading-tight">
              Approximation from version stats only; not measured from
              mesh UVs. This is not a verified texel-density result.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
