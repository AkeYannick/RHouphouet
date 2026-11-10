import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ProprietesModale {
  ouvert: boolean;
  titre: string;
  description?: string;
  onFermer: () => void;
  children: ReactNode;
  pied?: ReactNode;
  taille?: 'md' | 'lg';
}

export function Modale({
  ouvert,
  titre,
  description,
  onFermer,
  children,
  pied,
  taille = 'md',
}: ProprietesModale) {
  useEffect(() => {
    if (!ouvert) {
      return;
    }

    const gererTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === 'Escape') {
        onFermer();
      }
    };

    const ancienDebordement = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', gererTouche);

    return () => {
      document.body.style.overflow = ancienDebordement;
      document.removeEventListener('keydown', gererTouche);
    };
  }, [ouvert, onFermer]);

  if (!ouvert) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titre}
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(evenement) => {
        if (evenement.target === evenement.currentTarget) {
          onFermer();
        }
      }}
    >
      <div
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-base-100 shadow-2xl sm:rounded-2xl ${
          taille === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-base-300/60 px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-base-content">{titre}</h2>
            {description && <p className="mt-0.5 text-xs text-base-content/60">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onFermer}
            className="btn btn-ghost btn-circle btn-sm"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">{children}</div>

        {pied && (
          <div className="flex flex-col-reverse gap-2 border-t border-base-300/60 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            {pied}
          </div>
        )}
      </div>
    </div>
  );
}
