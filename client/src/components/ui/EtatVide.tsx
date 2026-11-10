import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ProprietesEtatVide {
  icone: LucideIcon;
  titre: string;
  description?: string;
  action?: ReactNode;
}

export function EtatVide({ icone: Icone, titre, description, action }: ProprietesEtatVide) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-base-200 text-base-content/40">
        <Icone size={26} />
      </span>
      <div>
        <p className="font-medium text-base-content">{titre}</p>
        {description && <p className="mt-1 max-w-md text-sm text-base-content/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}
