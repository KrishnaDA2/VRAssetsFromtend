import React, { useState } from 'react';
import { ModelVersion, MaterialMapping, SlotType, ColorSpace, NormalConvention } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { 
  Palette, 
  Save, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  Layers, 
  Check, 
  FolderPlus,
  RefreshCw,
  HelpCircle,
  FileImage,
  SlidersHorizontal
} from 'lucide-react';

interface TextureAssignerProps {
  version: ModelVersion;
  onMaterialsUpdated?: (mappings: MaterialMapping[]) => void;
}

export const TextureAssigner: React.FC<TextureAssignerProps> = ({
  version,
  onMaterialsUpdated
}) => {
  const { can, currentRole, showToast } = useApp();

  const [mappings, setMappings] = useState<MaterialMapping[]>(version.material_mappings || []);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('M_Battery_Enclosure');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedTexture, setDraggedTexture] = useState<string | null>(null);

  // Available texture files in this version
  const availableTextures = version.files.filter(f => f.kind === 'texture');

  // Slots according to TX-1
  const slotDefinitions: { slot: SlotType; label: string; defaultColorSpace: ColorSpace; desc: string }[] = [
    { slot: 'base_color', label: 'Base Colour (Albedo)', defaultColorSpace: 'sRGB', desc: '_BaseColor, _Albedo, _Diffuse' },
    { slot: 'normal', label: 'Normal Map', defaultColorSpace: 'linear', desc: '_Normal, _N (OpenGL / DirectX)' },
    { slot: 'roughness', label: 'Roughness Map', defaultColorSpace: 'linear', desc: '_Roughness, _R, or _ORM' },
    { slot: 'metallic', label: 'Metallic Map', defaultColorSpace: 'linear', desc: '_Metallic, _M, or _ORM' },
    { slot: 'ao', label: 'Ambient Occlusion', defaultColorSpace: 'linear', desc: '_AO' },
    { slot: 'emissive', label: 'Emissive Map', defaultColorSpace: 'sRGB', desc: '_Emissive (sRGB glowing colors)' },
    { slot: 'opacity', label: 'Opacity / Alpha', defaultColorSpace: 'linear', desc: '_Opacity, _Alpha cutout' },
  ];

  // Auto-assign textures by filename suffix (TX-2)
  const handleAutoAssign = () => {
    const updated = [...mappings];

    availableTextures.forEach(tex => {
      const lower = tex.filename.toLowerCase();
      let matchedSlot: SlotType | null = null;
      let colorSpace: ColorSpace = 'linear';

      if (lower.includes('basecolor') || lower.includes('albedo') || lower.includes('diffuse')) {
        matchedSlot = 'base_color';
        colorSpace = 'sRGB';
      } else if (lower.includes('normal') || lower.includes('_n')) {
        matchedSlot = 'normal';
      } else if (lower.includes('roughness') || lower.includes('_r')) {
        matchedSlot = 'roughness';
      } else if (lower.includes('metallic') || lower.includes('_m')) {
        matchedSlot = 'metallic';
      } else if (lower.includes('orm')) {
        matchedSlot = 'roughness'; // Packed ORM
      } else if (lower.includes('ao')) {
        matchedSlot = 'ao';
      } else if (lower.includes('emissive')) {
        matchedSlot = 'emissive';
        colorSpace = 'sRGB';
      }

      if (matchedSlot) {
        const existingIdx = updated.findIndex(m => m.material_name === selectedMaterial && m.slot === matchedSlot);
        const newMapping: MaterialMapping = {
          material_name: selectedMaterial,
          slot: matchedSlot,
          file_id: tex.id,
          filename: tex.filename,
          color_space: colorSpace,
          flip_y: false,
          tiling: { x: 1, y: 1 },
          offset: { x: 0, y: 0 }
        };

        if (existingIdx >= 0) {
          updated[existingIdx] = newMapping;
        } else {
          updated.push(newMapping);
        }
      }
    });

    setMappings(updated);
    onMaterialsUpdated?.(updated);
    showToast(`TX-2: Auto-matched ${availableTextures.length} textures by suffix rules!`, 'success');
  };

  // Drag and drop assignment (TX-3)
  const handleDropOnSlot = (slot: SlotType) => {
    if (!draggedTexture) return;
    const texObj = availableTextures.find(t => t.filename === draggedTexture);
    if (!texObj) return;

    const color_space: ColorSpace = (slot === 'base_color' || slot === 'emissive') ? 'sRGB' : 'linear';
    const updated = mappings.filter(m => !(m.material_name === selectedMaterial && m.slot === slot));
    
    updated.push({
      material_name: selectedMaterial,
      slot,
      file_id: texObj.id,
      filename: texObj.filename,
      color_space,
      flip_y: false,
      tiling: { x: 1, y: 1 },
      offset: { x: 0, y: 0 }
    });

    setMappings(updated);
    onMaterialsUpdated?.(updated);
    showToast(`Assigned ${texObj.filename} to ${slot}`, 'info');
    setDraggedTexture(null);
  };

  // Per-slot options update (TX-4)
  const updateSlotOption = (slot: SlotType, changes: Partial<MaterialMapping>) => {
    const updated = mappings.map(m => {
      if (m.material_name === selectedMaterial && m.slot === slot) {
        return { ...m, ...changes };
      }
      return m;
    });
    setMappings(updated);
    onMaterialsUpdated?.(updated);
  };

  // Save preset to preview/materials.json (TX-5)
  const handleSavePreset = async () => {
    if (!can('save_texture_preset')) {
      showToast('Developers have session-only changes. Only Artists and Managers can save presets.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.saveMaterialMappings(version.id, mappings);
      if (res.success) {
        showToast('TX-5: Successfully saved material assignments to preview/materials.json!', 'success');
      }
    } catch {
      showToast('Failed to save material preset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            PBR Material Assigner (TX-1 to 6)
          </span>
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-semibold transition-colors"
            title="Auto-assign textures by suffix (TX-2)"
          >
            <Sparkles className="w-3 h-3" />
            Auto-Match
          </button>
        </div>

        {/* Developer Session Badge Warning (TX-5) */}
        {currentRole === 'developer' ? (
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300">
            <strong>Developer Mode:</strong> Material adjustments are temporary for this session only.
          </div>
        ) : (
          <button
            onClick={handleSavePreset}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save as Material Preset (TX-5)'}</span>
          </button>
        )}
      </div>

      {/* Missing Textures Alert (TX-6) */}
      {version.missing_textures && version.missing_textures.length > 0 && (
        <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-[11px] text-amber-200 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Missing Texture Warning (TX-6)</span>
          </div>
          <p className="text-[10px] text-amber-300 leading-tight">
            The FBX requested texture maps that were not found in this version folder. Neutral grey shader is active.
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {version.missing_textures.map((mt, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/40 font-mono text-[9px]">
                Missing: {mt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Texture Files (TX-3: Drag source) */}
      <div className="p-3 border-b border-slate-200 space-y-1.5">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
          Version Textures (Drag onto slots)
        </span>
        <div className="space-y-1">
          {availableTextures.map(tex => (
            <div
              key={tex.id}
              draggable
              onDragStart={() => setDraggedTexture(tex.filename)}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-500/50 cursor-grab active:cursor-grabbing text-xs transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <FileImage className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-mono text-slate-800 truncate">{tex.filename}</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono shrink-0">
                {tex.resolution || '2K'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Material Slot List (TX-1) */}
      <div className="p-3 space-y-3 flex-1">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
          PBR Texture Slots (TX-1)
        </span>

        <div className="space-y-2">
          {slotDefinitions.map(def => {
            const currentMapping = mappings.find(m => m.material_name === selectedMaterial && m.slot === def.slot);

            return (
              <div
                key={def.slot}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnSlot(def.slot)}
                className={`p-2.5 rounded-xl border transition-all ${
                  currentMapping
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-50/40 border-dashed border-slate-200/80 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">
                    {def.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">
                    {def.defaultColorSpace.toUpperCase()}
                  </span>
                </div>

                {currentMapping ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-1.5 bg-white rounded-lg text-xs font-mono text-indigo-300 border border-slate-200">
                      <span className="truncate">{currentMapping.filename}</span>
                      <button
                        onClick={() => {
                          const updated = mappings.filter(m => !(m.material_name === selectedMaterial && m.slot === def.slot));
                          setMappings(updated);
                          onMaterialsUpdated?.(updated);
                        }}
                        className="text-slate-500 hover:text-rose-400 text-xs px-1"
                        title="Remove texture"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Per-Slot Options (TX-4) */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                      {/* Color Space toggle */}
                      <div>
                        <span className="text-slate-500 block mb-0.5">Color Space:</span>
                        <select
                          value={currentMapping.color_space}
                          onChange={(e) => updateSlotOption(def.slot, { color_space: e.target.value as ColorSpace })}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700"
                        >
                          <option value="sRGB">sRGB</option>
                          <option value="linear">Linear</option>
                        </select>
                      </div>

                      {/* Normal Map Flip Y (TX-4: OpenGL vs DirectX) */}
                      {def.slot === 'normal' && (
                        <div>
                          <span className="text-slate-500 block mb-0.5">Normal Y:</span>
                          <button
                            onClick={() => updateSlotOption(def.slot, { flip_y: !currentMapping.flip_y })}
                            className={`w-full py-0.5 rounded text-[10px] font-mono transition-colors ${
                              currentMapping.flip_y
                                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {currentMapping.flip_y ? 'DirectX (-Y)' : 'OpenGL (+Y)'}
                          </button>
                        </div>
                      )}

                      {/* Tiling X/Y */}
                      <div className="col-span-2 flex items-center justify-between text-slate-600 pt-1">
                        <span>UV Tiling:</span>
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.5"
                            value={currentMapping.tiling?.x || 1}
                            onChange={(e) => updateSlotOption(def.slot, {
                              tiling: { x: parseFloat(e.target.value), y: currentMapping.tiling?.y || 1 }
                            })}
                            className="w-12 bg-white border border-slate-200 rounded px-1 text-center"
                          />
                          <span>×</span>
                          <input
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.5"
                            value={currentMapping.tiling?.y || 1}
                            onChange={(e) => updateSlotOption(def.slot, {
                              tiling: { x: currentMapping.tiling?.x || 1, y: parseFloat(e.target.value) }
                            })}
                            className="w-12 bg-white border border-slate-200 rounded px-1 text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 text-center text-[10px] text-slate-500">
                    Drop {def.desc} here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
