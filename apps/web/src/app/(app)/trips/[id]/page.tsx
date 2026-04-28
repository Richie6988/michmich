'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import { BarryMascot, BarryMark, BarryLoader } from '@/components/barry/brand';

export default function TripDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { activeTrip, setActiveTrip, updateTripStatus } = useAppStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => { setActiveTrip(id as string); }, [id, setActiveTrip]);

  if (!activeTrip) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BarryMascot mood="searching" size={64} />
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://barry.app/join/${activeTrip.inviteToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (activeTrip.status === 'draft' || activeTrip.status === 'inviting') {
      updateTripStatus(activeTrip.id, 'constraints');
      router.push(`/trips/${activeTrip.id}/constraints`);
    } else {
      router.push(`/trips/${activeTrip.id}/constraints`);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <BarryMascot mood="default" size={72} />
        <h1 className="font-display font-bold text-2xl text-barry-black mt-3">{activeTrip.name}</h1>
        {activeTrip.scheduledAt && (
          <p className="text-barry-grey text-sm mt-1">
            {new Date(activeTrip.scheduledAt).toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
      </div>

      {/* Invite section */}
      <div className="barry-card mb-4">
        <h3 className="font-semibold text-sm text-barry-black mb-3">Inviter des amis</h3>
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-barry-grey font-mono truncate">
            barry.app/join/{activeTrip.inviteToken.slice(0, 8)}...
          </div>
          <button onClick={handleCopyLink} className="btn-primary py-2.5 px-4 text-sm">
            {copied ? 'Copie !' : 'Copier'}
          </button>
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] font-semibold text-sm transition-colors hover:bg-[#25D366]/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Envoyer via WhatsApp
        </button>
      </div>

      {/* Participants */}
      <div className="barry-card mb-6">
        <h3 className="font-semibold text-sm text-barry-black mb-3">
          {activeTrip.participants.length} participant{activeTrip.participants.length > 1 ? 's' : ''}
        </h3>
        <div className="space-y-3">
          {activeTrip.participants.map(p => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-barry-blue flex items-center justify-center text-white text-xs font-bold">
                  {p.user?.firstName?.[0]}{p.user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-barry-black">
                    {p.user?.firstName} {p.user?.lastName}
                    {p.userId === activeTrip.organizerId && (
                      <span className="text-[10px] text-barry-coral ml-1">Organisateur</span>
                    )}
                  </p>
                  {p.originLabel && (
                    <p className="text-[11px] text-barry-grey">{p.originLabel}</p>
                  )}
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                p.status === 'constraints_set' ? 'bg-emerald-50 text-emerald-700' :
                p.status === 'voted' ? 'bg-blue-50 text-blue-700' :
                p.status === 'accepted' ? 'bg-amber-50 text-amber-600' :
                'bg-gray-50 text-gray-500'
              }`}>
                {p.status === 'constraints_set' ? 'Pret' :
                 p.status === 'voted' ? 'A vote' :
                 p.status === 'accepted' ? 'En attente' : 'Invite'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleNext} className="btn-primary w-full">
        Definir les contraintes
      </button>
    </div>
  );
}
