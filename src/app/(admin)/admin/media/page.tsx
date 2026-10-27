'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UploadCloud, Search, Trash2, Copy, Check, Eye, RefreshCw, Image as ImageIcon,
  X, AlertTriangle, FolderPlus, FolderOpen, Folder, Edit2, MoveRight, ChevronRight, Home,
  CheckSquare, Square, Menu, CheckCircle2,
} from 'lucide-react';

interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  bucket: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export type FolderDef = {
  id: string;
  name: string;
  prefix: string;
  bucket: 'talago-tour-media' | 'talago-media';
  createdAt?: string;
};

const DEFAULT_FOLDERS: FolderDef[] = [
  { id: 'tours-root', name: 'All Tour Photos', prefix: 'tours/', bucket: 'talago-tour-media' },
  { id: 'general-root', name: 'General Media', prefix: 'general/', bucket: 'talago-media' },
];

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Persistent Folders State
  const [folders, setFolders] = useState<FolderDef[]>(DEFAULT_FOLDERS);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [activeFolder, setActiveFolder] = useState<FolderDef | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderBucket, setNewFolderBucket] = useState<'talago-tour-media' | 'talago-media'>('talago-tour-media');
  const [renamingFolder, setRenamingFolder] = useState<FolderDef | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [mobileFolderDrawerOpen, setMobileFolderDrawerOpen] = useState(false);

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMoveModalOpen, setBatchMoveModalOpen] = useState(false);
  const [targetBatchFolder, setTargetBatchFolder] = useState<FolderDef | null>(null);
  const [isBatchMoving, setIsBatchMoving] = useState(false);
  const [batchActionNotice, setBatchActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Load persistent folders from API
  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true);
    try {
      const res = await fetch('/api/admin/media/folders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          setFolders(data.folders);
        }
      }
    } catch (err) {
      console.warn('[AdminMedia] Failed to load folders from server:', err);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Load Media Items
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (activeFolder) {
        params.set('bucket', activeFolder.bucket);
        params.set('folder', activeFolder.prefix);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const res = await fetch(`/api/admin/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        let all: MediaAssetItem[] = data.items || [];
        if (activeFolder) {
          all = all.filter((i) => i.path.startsWith(activeFolder.prefix));
        }
        setItems(all);
        // Clear any selections that no longer exist
        setSelectedIds((prev) => {
          const valid = new Set<string>();
          const currentItemIds = new Set(all.map((item) => item.id));
          prev.forEach((id) => {
            if (currentItemIds.has(id)) valid.add(id);
          });
          return valid;
        });
      }
    } catch (err) {
      console.error('[AdminMedia]', err);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, search]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Copy URL
  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {}
  };

  // Upload handler (supports multiple files)
  const handleUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setIsUploading(true);
    setUploadProgress(25);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append('files', f));
      fd.append('bucket', activeFolder?.bucket ?? 'talago-tour-media');
      if (activeFolder?.prefix) {
        fd.append('folder', activeFolder.prefix);
      }
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      setUploadProgress(85);
      if (res.ok) {
        await fetchMedia();
        setBatchActionNotice({ message: `Successfully uploaded ${list.length} image(s).`, type: 'success' });
        setTimeout(() => setBatchActionNotice(null), 4000);
      }
    } catch (err) {
      console.error('[AdminMedia] Upload error:', err);
      setBatchActionNotice({ message: 'Failed to upload images.', type: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Single Item Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: deleteTarget.bucket, path: deleteTarget.path, id: deleteTarget.id }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('[AdminMedia] Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Multi-Selection Actions
  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisible = () => {
    if (selectedIds.size === items.length && items.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  // Native Server-Side Batch Move (Zero Client Re-Upload)
  const handleBatchMove = async () => {
    if (!targetBatchFolder || selectedItems.length === 0) return;
    setIsBatchMoving(true);
    try {
      const payload = {
        items: selectedItems.map((item) => ({
          bucket: item.bucket,
          path: item.path,
          name: item.name,
          id: item.id,
        })),
        targetBucket: targetBatchFolder.bucket,
        targetPrefix: targetBatchFolder.prefix,
      };

      const res = await fetch('/api/admin/media/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Batch move failed.');

      setBatchMoveModalOpen(false);
      setSelectedIds(new Set());
      await fetchMedia();

      if (Array.isArray(result.errors) && result.errors.length > 0) {
        if (result.movedCount > 0) {
          setBatchActionNotice({
            message: `Partially moved ${result.movedCount} of ${result.totalRequested} file(s). ${result.errors.length} failed: ${result.errors.join('; ')}`,
            type: 'error',
          });
        } else {
          setBatchActionNotice({
            message: `Failed to move all files: ${result.errors.join('; ')}`,
            type: 'error',
          });
        }
      } else {
        setBatchActionNotice({
          message: `Successfully moved ${result.movedCount} file(s) to "${targetBatchFolder.name}".`,
          type: 'success',
        });
      }
      setTimeout(() => setBatchActionNotice(null), 6000);
    } catch (err) {
      console.error('[AdminMedia] Batch move failed:', err);
      setBatchActionNotice({
        message: err instanceof Error ? err.message : 'Batch move failed.',
        type: 'error',
      });
    } finally {
      setIsBatchMoving(false);
    }
  };

  // Batch Delete
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    setIsBatchDeleting(true);
    try {
      let successCount = 0;
      for (const item of selectedItems) {
        const res = await fetch('/api/admin/media', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: item.bucket, path: item.path, id: item.id }),
        });
        if (res.ok) successCount++;
      }
      setBatchDeleteConfirmOpen(false);
      setSelectedIds(new Set());
      await fetchMedia();
      setBatchActionNotice({
        message: `Deleted ${successCount} item(s) permanently.`,
        type: 'success',
      });
      setTimeout(() => setBatchActionNotice(null), 4000);
    } catch (err) {
      console.error('[AdminMedia] Batch delete failed:', err);
      setBatchActionNotice({ message: 'Batch deletion encountered an error.', type: 'error' });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Folder creation inline validation message
  const [newFolderError, setNewFolderError] = useState('');

  // Folder Operations
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setNewFolderError('Please enter a folder name.');
      return;
    }
    setNewFolderError('');
    try {
      const res = await fetch('/api/admin/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName.trim(), bucket: newFolderBucket }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewFolderError(data.error || 'Failed to create folder.');
        return;
      }

      const createdName = newFolderName.trim();
      setFolders(data.folders);
      setNewFolderName('');
      setShowNewFolder(false);
      setMobileFolderDrawerOpen(false);
      if (data.folder) {
        setActiveFolder(data.folder);
      }
      setBatchActionNotice({ message: `Folder "${createdName}" created.`, type: 'success' });
      setTimeout(() => setBatchActionNotice(null), 3000);
    } catch (err) {
      setNewFolderError(err instanceof Error ? err.message : 'Could not create folder.');
    }
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renameValue.trim()) return;
    try {
      const res = await fetch('/api/admin/media/folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: renamingFolder.id, name: renameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename folder.');

      setFolders(data.folders);
      if (activeFolder?.id === renamingFolder.id) {
        setActiveFolder(data.folder);
      }
      setRenamingFolder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not rename folder.');
    }
  };

  const handleDeleteFolder = async (f: FolderDef) => {
    const count = items.filter((i) => i.path.startsWith(f.prefix)).length;
    if (count > 0 && !window.confirm(`Folder "${f.name}" contains ${count} item(s). Are you sure you want to remove it? (Files will remain in base storage).`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/media/folders?id=${encodeURIComponent(f.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete folder.');

      setFolders(data.folders);
      if (activeFolder?.id === f.id) setActiveFolder(null);
      setBatchActionNotice({ message: `Folder "${f.name}" removed.`, type: 'success' });
      setTimeout(() => setBatchActionNotice(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete folder.');
    }
  };

  return (
    <div className="min-h-screen bg-[#070F1E] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-lg shadow-[#00E5FF]/5">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Media Library</h1>
            <p className="text-xs text-slate-400">
              Persistent Storage &middot; {items.length} files{activeFolder ? ` in "${activeFolder.name}"` : ' (all folders)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mobile Folder Toggle Button */}
          <button
            onClick={() => setMobileFolderDrawerOpen(true)}
            className="flex lg:hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
          >
            <Folder className="h-3.5 w-3.5 text-[#00E5FF]" /> Folders ({folders.length})
          </button>

          <button
            type="button"
            onClick={() => { setShowNewFolder(true); setNewFolderError(''); }}
            className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3.5 py-2 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all shadow-sm shadow-[#00E5FF]/5"
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>

          <button
            onClick={() => { fetchMedia(); fetchFolders(); }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#00E5FF]' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {batchActionNotice && (
        <div className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between transition-all ${
          batchActionNotice.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            : 'border-red-500/30 bg-red-500/10 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {batchActionNotice.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
            <span>{batchActionNotice.message}</span>
          </div>
          <button onClick={() => setBatchActionNotice(null)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex gap-6">
        {/* Desktop Sidebar Folders */}
        <div className="hidden lg:flex flex-col gap-1 w-64 shrink-0 border-r border-white/10 pr-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Folders</p>
            {foldersLoading && <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />}
          </div>

          <button
            onClick={() => setActiveFolder(null)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all text-left ${
              !activeFolder ? 'bg-white/10 text-white font-bold border border-white/15' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Home className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">All Files</span>
          </button>

          {folders.map((f) => (
            <div key={f.id} className="group relative">
              {renamingFolder?.id === f.id ? (
                <div className="flex items-center gap-1 px-1 py-1">
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameFolder();
                      if (e.key === 'Escape') setRenamingFolder(null);
                    }}
                    className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-white outline-none border border-[#00E5FF]/40"
                  />
                  <button onClick={handleRenameFolder} className="text-emerald-400 hover:text-white p-1"><Check className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setRenamingFolder(null)} className="text-slate-500 hover:text-white p-1"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveFolder(activeFolder?.id === f.id ? null : f)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all text-left ${
                    activeFolder?.id === f.id
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {activeFolder?.id === f.id ? (
                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  )}
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-[10px] text-slate-600 font-mono">
                    {f.bucket === 'talago-tour-media' ? 'tour' : 'gen'}
                  </span>
                </button>
              )}

              {renamingFolder?.id !== f.id && f.id !== 'tours-root' && f.id !== 'general-root' && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 z-10 bg-[#070F1E] px-1 rounded-lg">
                  <button
                    onClick={(e) => { e.stopPropagation(); setRenamingFolder(f); setRenameValue(f.name); }}
                    className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-slate-400 hover:text-white"
                    title="Rename folder"
                  >
                    <Edit2 className="h-2.5 w-2.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }}
                    className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 hover:text-red-300"
                    title="Delete folder"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* New Folder Button */}
          <button
            type="button"
            onClick={() => { setShowNewFolder(true); setNewFolderError(''); }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-2.5 text-xs font-semibold text-slate-400 hover:border-[#00E5FF]/40 hover:text-[#00E5FF] transition-all"
          >
            <FolderPlus className="h-3.5 w-3.5" /> + New Folder
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Breadcrumb & Search & Multi-Select Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <button onClick={() => setActiveFolder(null)} className="flex items-center gap-1 hover:text-white transition">
                <Home className="h-3 w-3" /> All
              </button>
              {activeFolder && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                  <span className="font-bold text-white flex items-center gap-1">
                    <Folder className="h-3 w-3 text-[#00E5FF]" /> {activeFolder.name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={items.length === 0}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                {selectedIds.size === items.length && items.length > 0 ? (
                  <CheckSquare className="h-3.5 w-3.5 text-[#00E5FF]" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-slate-400" />
                )}
                {selectedIds.size === items.length && items.length > 0 ? 'Clear Selection' : 'Select All'}
              </button>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search in media…"
                  className="w-full sm:w-56 rounded-xl border border-white/10 bg-[#0B1528] pl-8 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sticky Multi-Select Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="rounded-2xl border border-[#00E5FF]/40 bg-[#0B1528]/95 p-3.5 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00E5FF] text-[10px] font-black text-[#070F1E]">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-bold text-white">
                  {selectedIds.size} asset{selectedIds.size === 1 ? '' : 's'} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBatchMoveModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-3.5 py-2 text-xs font-black text-[#070F1E] hover:brightness-110 shadow-md shadow-[#00E5FF]/10 transition-all"
                >
                  <MoveRight className="h-3.5 w-3.5" /> Move to Folder
                </button>

                <button
                  onClick={() => setBatchDeleteConfirmOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500/20 border border-red-500/30 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/30 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>

                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
            }}
            className={`relative rounded-2xl border-2 border-dashed p-4 transition-all duration-300 ${
              dragOver ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-white/10 bg-[#0B1528] hover:border-[#00E5FF]/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                  {isUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {isUploading ? 'Uploading images to storage…' : `Upload directly to "${activeFolder?.name || 'All Files'}"`}
                  </p>
                  <p className="text-[10px] text-slate-400">Multi-file upload &middot; WebP, JPEG, PNG &middot; zero duplicate copies</p>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black text-[#070F1E] cursor-pointer hover:brightness-110 transition-all shrink-0">
                <UploadCloud className="h-3.5 w-3.5" /> Choose Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => { if (e.target.files) handleUpload(e.target.files); }}
                  className="hidden"
                />
              </label>
            </div>
            {isUploading && (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#00E5FF] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>

          {/* Image Grid */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-[#0B1528]">
              <RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" />
              <p className="text-xs text-slate-400 font-medium">Loading media assets…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0B1528] text-center p-8">
              <ImageIcon className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-bold text-white">No images in this folder</p>
              <p className="text-xs text-slate-400 max-w-sm">Upload images directly using the button above or select a different folder from the sidebar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const sz = item.sizeBytes ? `${(item.sizeBytes / 1024).toFixed(0)} KB` : '';
                return (
                  <div
                    key={item.id}
                    className={`group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden bg-[#0B1528] ${
                      isSelected ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/30 shadow-lg shadow-[#00E5FF]/10' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {/* Checkbox Overlay (Mobile & Desktop Accessible) */}
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.id)}
                      aria-label={isSelected ? `Deselect ${item.name}` : `Select ${item.name}`}
                      className={`absolute top-2 left-2 z-20 flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#00E5FF] text-[#070F1E] shadow-md'
                          : 'bg-black/60 text-white/70 hover:bg-black/90 hover:text-white backdrop-blur-sm'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>

                    {/* Image Thumbnail */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060D1A]">
                      <img
                        src={item.url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {sz && (
                        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white/90 backdrop-blur-sm">
                          {sz}
                        </span>
                      )}

                      {/* Quick Action Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
                          title="Preview full size"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(item.url)}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                            copiedUrl === item.url ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'
                          } text-white`}
                          title="Copy public URL"
                        >
                          {copiedUrl === item.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIds(new Set([item.id]));
                            setBatchMoveModalOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
                          title="Move to another folder"
                        >
                          <MoveRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="Delete photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2">
                      <p className="truncate text-[10px] font-semibold text-slate-300" title={item.name}>
                        {item.name}
                      </p>
                      <p className="truncate text-[9px] text-slate-500 font-mono">
                        {item.path}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Folder Drawer (Bottom Sheet) */}
      {mobileFolderDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileFolderDrawerOpen(false)} />
          <div className="relative z-10 w-full max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-[#0B1528] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#00E5FF]" />
                <h3 className="text-sm font-bold text-white">Media Folders</h3>
              </div>
              <button onClick={() => setMobileFolderDrawerOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={() => { setActiveFolder(null); setMobileFolderDrawerOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-xs font-bold ${
                !activeFolder ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-300'
              }`}
            >
              <Home className="h-4 w-4" /> All Files
            </button>

            <div className="space-y-1.5">
              {folders.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <button
                    onClick={() => { setActiveFolder(f); setMobileFolderDrawerOpen(false); }}
                    className={`flex-1 flex items-center gap-3 rounded-xl p-3 text-left text-xs font-semibold ${
                      activeFolder?.id === f.id ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold' : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <Folder className="h-4 w-4 shrink-0 text-[#00E5FF]" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{f.bucket === 'talago-tour-media' ? 'tours' : 'gen'}</span>
                  </button>
                  {f.id !== 'tours-root' && f.id !== 'general-root' && (
                    <button
                      onClick={() => handleDeleteFolder(f)}
                      className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      title="Delete folder"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileFolderDrawerOpen(false);
                setShowNewFolder(true);
                setNewFolderError('');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 py-3 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all"
            >
              <FolderPlus className="h-4 w-4" /> Add New Folder
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Create Folder Modal — visible and responsive on all screen sizes */}
      {showNewFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); setNewFolderError(''); }}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/30 bg-[#0B1528] p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-lg shadow-[#00E5FF]/5">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Create New Folder</h3>
                  <p className="text-xs text-slate-400">Organize your persistent media storage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowNewFolder(false); setNewFolderName(''); setNewFolderError(''); }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateFolder();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Folder Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => { setNewFolderName(e.target.value); setNewFolderError(''); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); setNewFolderError(''); }
                  }}
                  placeholder="e.g. Hurghada Diving, Pyramids VIP"
                  className={`w-full rounded-xl bg-[#070F1E] px-4 py-3 text-sm text-white placeholder-slate-500 outline-none border transition-all ${
                    newFolderError ? 'border-red-400 focus:border-red-400' : 'border-white/10 focus:border-[#00E5FF]'
                  }`}
                />
                {newFolderError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {newFolderError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Storage Bucket
                </label>
                <select
                  value={newFolderBucket}
                  onChange={(e) => setNewFolderBucket(e.target.value as 'talago-tour-media' | 'talago-media')}
                  className="w-full rounded-xl bg-[#070F1E] px-4 py-3 text-sm text-white outline-none border border-white/10 focus:border-[#00E5FF]"
                >
                  <option value="talago-tour-media">Tours Bucket (talago-tour-media)</option>
                  <option value="talago-media">General Bucket (talago-media)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select storage bucket destination for this folder.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowNewFolder(false); setNewFolderName(''); setNewFolderError(''); }}
                  className="flex-1 rounded-xl bg-white/5 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="flex-1 rounded-xl bg-[#00E5FF] py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00E5FF]/20"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Move Modal */}
      {batchMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBatchMoveModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#00E5FF]/30 bg-[#0B1528] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MoveRight className="h-4 w-4 text-[#00E5FF]" /> Move {selectedItems.length} Image(s)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select target destination folder. The files will be moved instantaneously in persistent storage without re-uploading.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTargetBatchFolder(f)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs font-semibold transition-all ${
                    targetBatchFolder?.id === f.id
                      ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF]'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <Folder className="h-4 w-4 shrink-0 text-[#00E5FF]" />
                  <div className="flex-1 truncate">
                    <p className="font-bold">{f.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{f.prefix}</p>
                  </div>
                  <span className="text-[10px] rounded bg-white/5 px-2 py-0.5 text-slate-400">
                    {f.bucket === 'talago-tour-media' ? 'Tours' : 'General'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBatchMoveModalOpen(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetBatchFolder || isBatchMoving}
                onClick={handleBatchMove}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#00E5FF] py-2.5 text-xs font-black text-[#070F1E] disabled:opacity-40 hover:brightness-110 shadow-lg shadow-[#00E5FF]/15"
              >
                {isBatchMoving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MoveRight className="h-3.5 w-3.5" />}
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {batchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setBatchDeleteConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/30 bg-[#0B1528] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete {selectedItems.length} File(s)?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl">
              Are you sure you want to delete these {selectedItems.length} selected assets from storage? Any tours referencing them will show missing images.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBatchDeleteConfirmOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={isBatchDeleting}
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isBatchDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => setPreviewItem(null)} />
          <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0B1528] p-4 flex flex-col items-center shadow-2xl overflow-hidden">
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-bold text-white truncate max-w-md">{previewItem.name}</span>
              <button onClick={() => setPreviewItem(null)} className="rounded-full p-1.5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <img src={previewItem.url} alt={previewItem.name} className="max-h-[70vh] w-auto rounded-xl object-contain" />
            <div className="w-full flex items-center justify-between pt-3 border-t border-white/10 mt-3 text-xs">
              <span className="font-mono text-slate-400 truncate max-w-lg">{previewItem.url}</span>
              <button onClick={() => handleCopyUrl(previewItem.url)} className="flex items-center gap-1.5 rounded-lg bg-[#00E5FF] px-3 py-1.5 text-xs font-black text-[#070F1E]"><Copy className="h-3.5 w-3.5" /> Copy URL</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20"><AlertTriangle className="h-6 w-6" /></div>
              <div><h3 className="text-base font-bold text-white">Delete Asset?</h3><p className="text-xs text-slate-400">This action cannot be undone.</p></div>
            </div>
            <p className="text-xs text-slate-300 mb-6 bg-white/5 p-3 rounded-xl font-mono truncate">{deleteTarget.path}</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white">Cancel</button>
              <button disabled={isDeleting} onClick={handleDelete} className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50">
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
