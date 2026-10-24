'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud, Search, Trash2, Copy, Check, Eye, RefreshCw, Image as ImageIcon,
  X, AlertTriangle, FolderPlus, FolderOpen, Folder, Edit2, MoveRight, ChevronRight, Home,
} from 'lucide-react';

interface MediaAssetItem {
  id: string; name: string; url: string; bucket: string;
  path: string; sizeBytes: number; mimeType: string; createdAt: string;
}
type FolderDef = { name: string; prefix: string; bucket: 'talago-tour-media' | 'talago-media'; };
const DEFAULT_FOLDERS: FolderDef[] = [
  { name: 'Tour Photos', prefix: 'tours/', bucket: 'talago-tour-media' },
  { name: 'General Media', prefix: 'general/', bucket: 'talago-media' },
];
const FOLDERS_KEY = 'talago_media_folders_v1';
function loadFolders(): FolderDef[] {
  if (typeof window === 'undefined') return DEFAULT_FOLDERS;
  try { const s = localStorage.getItem(FOLDERS_KEY); if (s) return JSON.parse(s); } catch {}
  return DEFAULT_FOLDERS;
}
function saveFolders(f: FolderDef[]) { try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(f)); } catch {} }

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [folders, setFolders] = useState<FolderDef[]>(DEFAULT_FOLDERS);
  const [activeFolder, setActiveFolder] = useState<FolderDef | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderBucket, setNewFolderBucket] = useState<'talago-tour-media' | 'talago-media'>('talago-tour-media');
  const [renamingFolder, setRenamingFolder] = useState<FolderDef | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveModal, setMoveModal] = useState<{ item: MediaAssetItem; targetFolder: FolderDef | null } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { setFolders(loadFolders()); }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (activeFolder) params.set('bucket', activeFolder.bucket);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/media?${params}`);
      if (res.ok) {
        const data = await res.json();
        let all: MediaAssetItem[] = data.items || [];
        if (activeFolder) all = all.filter((i) => i.path.startsWith(activeFolder.prefix));
        setItems(all);
      }
    } catch (err) { console.error('[AdminMedia]', err); }
    finally { setLoading(false); }
  }, [activeFolder, search]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleCopyUrl = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setCopiedUrl(url); setTimeout(() => setCopiedUrl(null), 2000); } catch {}
  };

  const handleUpload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setIsUploading(true); setUploadProgress(25);
    try {
      const fd = new FormData();
      list.forEach((f) => fd.append('files', f));
      fd.append('bucket', activeFolder?.bucket ?? 'talago-tour-media');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      setUploadProgress(85);
      if (res.ok) await fetchMedia();
    } catch (err) { console.error('[AdminMedia] Upload', err); }
    finally { setIsUploading(false); setUploadProgress(0); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: deleteTarget.bucket, path: deleteTarget.path, id: deleteTarget.id }),
      });
      if (res.ok) { setItems((p) => p.filter((i) => i.id !== deleteTarget.id)); setDeleteTarget(null); }
    } catch (err) { console.error('[AdminMedia] Delete', err); }
    finally { setIsDeleting(false); }
  };

  const handleMoveItem = async () => {
    if (!moveModal?.item || !moveModal.targetFolder) return;
    setIsMoving(true);
    try {
      const { item, targetFolder } = moveModal;
      const blob = await (await fetch(item.url)).blob();
      const file = new File([blob], item.name, { type: item.mimeType });
      const fd = new FormData(); fd.append('files', file); fd.append('bucket', targetFolder.bucket);
      const upRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (!upRes.ok) throw new Error('Upload failed');
      await fetch('/api/admin/media', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: item.bucket, path: item.path, id: item.id }),
      });
      setMoveModal(null); await fetchMedia();
    } catch (err) { alert('Move failed: ' + (err instanceof Error ? err.message : 'error')); }
    finally { setIsMoving(false); }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const slug = newFolderName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const prefix = newFolderBucket === 'talago-tour-media' ? `tours/${slug}/` : `${slug}/`;
    const updated = [...folders, { name: newFolderName.trim(), prefix, bucket: newFolderBucket }];
    setFolders(updated); saveFolders(updated); setNewFolderName(''); setShowNewFolder(false);
  };

  const handleRenameFolder = () => {
    if (!renamingFolder || !renameValue.trim()) return;
    const updated = folders.map((f) => f === renamingFolder ? { ...f, name: renameValue.trim() } : f);
    setFolders(updated); saveFolders(updated); setRenamingFolder(null);
  };

  const handleDeleteFolder = (f: FolderDef) => {
    const count = items.filter((i) => i.path.startsWith(f.prefix)).length;
    if (count > 0) { alert(`Cannot delete "${f.name}" — ${count} image(s) inside. Move or delete them first.`); return; }
    const updated = folders.filter((x) => x !== f);
    setFolders(updated); saveFolders(updated);
    if (activeFolder === f) setActiveFolder(null);
  };

  return (
    <div className="min-h-screen bg-[#070F1E] p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Media Library</h1>
            <p className="text-xs text-slate-400">
              Supabase Storage &middot; {items.length} files{activeFolder ? ` in "${activeFolder.name}"` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowNewFolder(true)} className="flex items-center gap-2 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-2.5 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all">
            <FolderPlus className="h-3.5 w-3.5" /> New Folder
          </button>
          <button onClick={() => fetchMedia()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#00E5FF]' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-1 w-56 shrink-0">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">Folders</p>
          <button onClick={() => setActiveFolder(null)} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left ${!activeFolder ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            <Home className="h-3.5 w-3.5 shrink-0" /> <span className="flex-1">All Files</span>
          </button>
          {folders.map((f, fi) => (
            <div key={fi} className="group relative">
              {renamingFolder === f ? (
                <div className="flex items-center gap-1 px-1">
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameFolder(); if (e.key === 'Escape') setRenamingFolder(null); }} className="flex-1 rounded-lg bg-white/10 px-2 py-1 text-xs text-white outline-none" />
                  <button onClick={handleRenameFolder} className="text-emerald-400 hover:text-white p-0.5"><Check className="h-3 w-3" /></button>
                  <button onClick={() => setRenamingFolder(null)} className="text-slate-500 hover:text-white p-0.5"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <button onClick={() => setActiveFolder(activeFolder === f ? null : f)} className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all text-left ${activeFolder === f ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  {activeFolder === f ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
                  <span className="flex-1 truncate">{f.name}</span>
                  <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                </button>
              )}
              {renamingFolder !== f && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 z-10">
                  <button onClick={(e) => { e.stopPropagation(); setRenamingFolder(f); setRenameValue(f.name); }} className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-slate-400 hover:text-white" title="Rename"><Edit2 className="h-2.5 w-2.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f); }} className="flex h-5 w-5 items-center justify-center rounded bg-red-500/10 text-red-400 hover:text-red-300" title="Delete folder"><Trash2 className="h-2.5 w-2.5" /></button>
                </div>
              )}
            </div>
          ))}
          {showNewFolder && (
            <div className="mt-1 rounded-xl border border-[#00E5FF]/20 bg-[#0B1528] p-3 space-y-2">
              <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }} placeholder="Folder name…" className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none" />
              <select value={newFolderBucket} onChange={(e) => setNewFolderBucket(e.target.value as any)} className="w-full rounded-lg bg-white/10 px-2 py-1.5 text-xs text-white outline-none">
                <option value="talago-tour-media">Tours Bucket</option>
                <option value="talago-media">General Bucket</option>
              </select>
              <div className="flex gap-1.5">
                <button onClick={handleCreateFolder} className="flex-1 rounded-lg bg-[#00E5FF] py-1.5 text-[10px] font-black text-[#070F1E]">Create</button>
                <button onClick={() => setShowNewFolder(false)} className="flex-1 rounded-lg bg-white/5 py-1.5 text-[10px] font-bold text-slate-400">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Mobile folder tabs */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setActiveFolder(null)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${!activeFolder ? 'bg-white/20 text-white' : 'border border-white/10 bg-white/5 text-slate-400'}`}>All</button>
            {folders.map((f, fi) => (
              <button key={fi} onClick={() => setActiveFolder(activeFolder === f ? null : f)} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${activeFolder === f ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30' : 'border border-white/10 bg-white/5 text-slate-400'}`}>{f.name}</button>
            ))}
          </div>

          {/* Search + Breadcrumb */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-1">
              <button onClick={() => setActiveFolder(null)} className="flex items-center gap-1 hover:text-white transition"><Home className="h-3 w-3" /> All Files</button>
              {activeFolder && (<><ChevronRight className="h-3 w-3" /><span className="font-bold text-white">{activeFolder.name}</span></>)}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files…" className="w-full sm:w-60 rounded-xl border border-white/10 bg-[#0B1528] pl-8 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none" />
            </div>
          </div>

          {/* Upload Zone */}
          <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) handleUpload(e.dataTransfer.files); }} className={`relative rounded-2xl border-2 border-dashed p-4 transition-all duration-300 ${dragOver ? 'border-[#00E5FF] bg-[#00E5FF]/10' : 'border-white/10 bg-[#0B1528] hover:border-[#00E5FF]/30'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                  {isUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{isUploading ? 'Uploading…' : `Upload to "${activeFolder?.name || 'Tours'}"`}</p>
                  <p className="text-[10px] text-slate-400">Drag &amp; drop or click &middot; WebP, JPEG, PNG, AVIF &middot; max 10MB</p>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black text-[#070F1E] cursor-pointer hover:brightness-110 transition-all">
                <UploadCloud className="h-3.5 w-3.5" /> Select Files
                <input type="file" multiple accept="image/*" onChange={(e) => { if (e.target.files) handleUpload(e.target.files); }} className="hidden" />
              </label>
            </div>
            {isUploading && (<div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#00E5FF] transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div>)}
          </div>

          {/* Gallery */}
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3"><RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" /><p className="text-xs text-slate-400">Loading…</p></div>
          ) : items.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0B1528] text-center p-8">
              <ImageIcon className="h-8 w-8 text-slate-600" /><p className="text-sm font-bold text-white">No images found</p><p className="text-xs text-slate-400">Upload images above or select a different folder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((item) => {
                const sz = item.sizeBytes ? `${(item.sizeBytes / 1024).toFixed(0)} KB` : '';
                return (
                  <div key={item.id} className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0B1528] overflow-hidden hover:border-[#00E5FF]/40 transition-all duration-200">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060D1A]">
                      <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      {sz && <span className="absolute top-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white/80 backdrop-blur-sm">{sz}</span>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-[2px]">
                        <button onClick={() => setPreviewItem(item)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleCopyUrl(item.url)} className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${copiedUrl === item.url ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'} text-white`}>{copiedUrl === item.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}</button>
                        <button onClick={() => setMoveModal({ item, targetFolder: null })} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20" title="Move to folder"><MoveRight className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(item)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    <div className="p-2"><p className="truncate text-[10px] font-semibold text-slate-300" title={item.name}>{item.name}</p></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
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

      {/* Move Modal */}
      {moveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMoveModal(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-[#00E5FF]/20 bg-[#0B1528] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Move to Folder</h3>
            <p className="text-xs text-slate-400 mb-4 truncate">{moveModal.item.name}</p>
            <div className="space-y-2 mb-5">
              {folders.map((f, fi) => (
                <button key={fi} type="button" onClick={() => setMoveModal((m) => m ? { ...m, targetFolder: f } : null)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs font-semibold transition-all ${moveModal.targetFolder === f ? 'border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'}`}>
                  <Folder className="h-4 w-4 shrink-0" /> {f.name}
                  <span className="text-[10px] text-slate-500 ml-auto">{f.bucket === 'talago-tour-media' ? 'Tours' : 'General'}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setMoveModal(null)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10">Cancel</button>
              <button disabled={!moveModal.targetFolder || isMoving} onClick={handleMoveItem} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#00E5FF] py-2.5 text-xs font-black text-[#070F1E] disabled:opacity-40">
                {isMoving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MoveRight className="h-3.5 w-3.5" />} Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
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
