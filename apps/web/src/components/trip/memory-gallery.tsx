'use client';

import React, { useRef, useState } from 'react';
import { useAppStore } from '@/stores/app-store';

interface MemoryGalleryProps {
  tripId: string;
}

export function MemoryGallery({ tripId }: MemoryGalleryProps) {
  const { tripPhotos, addTripPhoto, removeTripPhoto, currentUser } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoomedPhotoId, setZoomedPhotoId] = useState<string | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  const photos = tripPhotos[tripId] || [];

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please pick an image file.');
      return;
    }
    // Read as data URL so we can persist it (mock - would be S3 upload in real app)
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setPendingImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = () => {
    if (!pendingImage) return;
    addTripPhoto(tripId, pendingImage, pendingCaption || undefined);
    setPendingImage(null);
    setPendingCaption('');
  };

  const cancelUpload = () => {
    setPendingImage(null);
    setPendingCaption('');
  };

  const zoomedPhoto = zoomedPhotoId ? photos.find(p => p.id === zoomedPhotoId) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900">Memories</p>
        </div>
        {photos.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full">
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Pending preview before upload */}
      {pendingImage && (
        <div className="mb-3 bg-slate-50 rounded-xl overflow-hidden">
          <img src={pendingImage} alt="Preview" loading="lazy" decoding="async" className="w-full h-48 object-cover" />
          <div className="p-3 space-y-2">
            <input
              type="text"
              value={pendingCaption}
              onChange={e => setPendingCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-200"
              maxLength={120}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmUpload}
                className="flex-1 px-3 py-2 bg-pink-500 text-white text-sm font-bold rounded-lg active:scale-95 transition-all"
              >
                Add to gallery
              </button>
              <button
                onClick={cancelUpload}
                className="px-3 py-2 text-slate-600 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-50 flex items-center justify-center mb-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.8">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 mb-2">No memories yet.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-pink-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
          >
            Add the first photo
          </button>
        </div>
      ) : (
        <>
          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {photos.map(photo => (
              <button
                key={photo.id}
                onClick={() => setZoomedPhotoId(photo.id)}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 hover:opacity-90 active:scale-95 transition-all group"
              >
                <img src={photo.imageUrl} alt={photo.caption || 'memory'} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-[9px] text-white font-medium line-clamp-1">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-xs text-pink-700 font-bold transition-colors"
          >
            + Add a photo
          </button>
        </>
      )}

      {/* Zoom modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedPhotoId(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setZoomedPhotoId(null); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {currentUser?.id === zoomedPhoto.uploadedBy && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Remove this photo?')) {
                  removeTripPhoto(tripId, zoomedPhoto.id);
                  setZoomedPhotoId(null);
                }
              }}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500 transition-colors"
              aria-label="Delete"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6" />
              </svg>
            </button>
          )}
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={zoomedPhoto.imageUrl} alt={zoomedPhoto.caption || 'memory'} loading="eager" decoding="async" className="w-full max-h-[70vh] object-contain rounded-xl" />
            {zoomedPhoto.caption && (
              <p className="text-white text-center mt-3 font-medium">{zoomedPhoto.caption}</p>
            )}
            <p className="text-white/60 text-center text-xs mt-1">
              By {zoomedPhoto.uploadedByName || 'Someone'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
