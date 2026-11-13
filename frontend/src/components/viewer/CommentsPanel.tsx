import React, { useState, useEffect } from 'react';
import { ModelVersion, Comment, ModelStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { 
  MessageSquare, 
  Send, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  User as UserIcon,
  X
} from 'lucide-react';

interface CommentsPanelProps {
  version: ModelVersion;
  isPinningComment: boolean;
  setIsPinningComment: (pinning: boolean) => void;
  pendingPinCoords: { x: number; y: number; z: number } | null;
  setPendingPinCoords: (coords: { x: number; y: number; z: number } | null) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  version,
  isPinningComment,
  setIsPinningComment,
  pendingPinCoords,
  setPendingPinCoords,
  comments,
  setComments
}) => {
  const { currentUser, currentRole, can, updateVersionStatus, showToast } = useApp();
  const [commentText, setCommentText] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ModelStatus>('Approved');

  // Load comments
  useEffect(() => {
    const load = async () => {
      const data = await api.getComments(version.id);
      setComments(data);
    };
    load();
  }, [version.id]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const newC = await api.addComment(
        version.id,
        commentText,
        currentUser,
        pendingPinCoords
      );
      setComments(prev => [...prev, newC]);
      setCommentText('');
      setPendingPinCoords(null);
      setIsPinningComment(false);
      showToast('Comment posted successfully', 'success');
    } catch {
      showToast('Failed to post comment', 'error');
    }
  };

  const handleResolve = async (commentId: string) => {
    const ok = await api.resolveComment(commentId);
    if (ok) {
      setComments(prev =>
        prev.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c)
      );
    }
  };

  const handleApplyStatusChange = async () => {
    await updateVersionStatus(version.id, targetStatus, statusNote);
    setIsStatusModalOpen(false);
    setStatusNote('');
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto">
      {/* Header & Status Change (FR-V2) */}
      <div className="p-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Review & Comments (FR-V2, V3)
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {comments.length} items
          </span>
        </div>

        {/* Manager / Admin Status Controls (FR-V2) */}
        {can('change_status') ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                setTargetStatus('Approved');
                setIsStatusModalOpen(true);
              }}
              className="flex-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Asset
            </button>
            <button
              onClick={() => {
                setTargetStatus('Needs fix');
                setIsStatusModalOpen(true);
              }}
              className="flex-1 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Needs Fix
            </button>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600">
            Status: <span className="font-semibold text-slate-800">{version.status}</span> (Managed by Project Lead)
          </div>
        )}
      </div>

      {/* 3D Pin Button (FR-V3) */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/40">
        <button
          onClick={() => {
            setIsPinningComment(!isPinningComment);
            if (pendingPinCoords) setPendingPinCoords(null);
          }}
          className={`w-full py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
            isPinningComment
              ? 'bg-rose-600 text-white shadow-lg animate-pulse'
              : pendingPinCoords
              ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {isPinningComment
            ? 'Click on 3D Model Surface to Drop Pin...'
            : pendingPinCoords
            ? `Pin Placed at (${pendingPinCoords.x}, ${pendingPinCoords.y}, ${pendingPinCoords.z})`
            : 'Pin Comment to 3D Point'}
        </button>
      </div>

      {/* Comments List */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {comments.map((c, idx) => (
          <div
            key={c.id}
            className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
              c.resolved
                ? 'bg-slate-50/40 border-slate-200/60 opacity-60'
                : 'bg-slate-50/80 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800">{c.user_name}</span>
                <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-600 font-mono">
                  {c.user_role}
                </span>
              </div>
              <button
                onClick={() => handleResolve(c.id)}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                  c.resolved
                    ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                    : 'text-slate-600 hover:text-emerald-400'
                }`}
                title="Toggle resolved state"
              >
                {c.resolved ? '✓ Resolved' : 'Mark Resolved'}
              </button>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed">{c.body}</p>

            {/* Pinned 3D Coordinate Badge (FR-V3) */}
            {c.pin_position && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 w-fit">
                <MapPin className="w-3 h-3 text-rose-400" />
                <span>Point: ({c.pin_position.x}, {c.pin_position.y}, {c.pin_position.z})</span>
              </div>
            )}

            <div className="text-[10px] text-slate-500 pt-0.5 font-mono">
              {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSendComment} className="p-3 border-t border-slate-200 bg-white/90 space-y-2">
        {pendingPinCoords && (
          <div className="flex items-center justify-between text-[10px] text-emerald-400 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/30">
            <span>3D Pin Active</span>
            <button
              type="button"
              onClick={() => setPendingPinCoords(null)}
              className="text-slate-600 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add feedback or review note..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Status Reason Feedback Modal (FR-V2) */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Update Version Status to "{targetStatus}"
            </h3>
            <div>
              <label className="text-xs text-slate-600 block mb-1">
                Reason / Revision Notes (will notify artist):
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Approved for Meta Quest 3 engine integration, or please re-bake normal map..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyStatusChange}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
              >
                Confirm & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
