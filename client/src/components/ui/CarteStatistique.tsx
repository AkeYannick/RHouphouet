import type { LucideIcon } from 'lucide-react';

type TonCarte = 'primaire' | 'succes' | 'alerte' | 'erreur' | 'neutre';

interface ProprietesCarteStatistique {
  libelle: string;
  valeur: string;
  detail?: string;
  icone: LucideIcon;
  ton?: TonCarte;
}

const TONS: Record<TonCarte, string> = {
  primaire: 'bg-primary/10 text-primary',
  succes: 'bg-success/10 text-success',
  alerte: 'bg-warning/15 text-warning',
  erreur: 'bg-error/10 text-error',
  neutre: 'bg-base-200 text-base-content/70',
};

export function CarteStatistique({
  libelle,
  valeur,
  detail,
  icone: Icone,
  ton = 'primaire',
}: ProprietesCarteStatistique) {
  return (
    <div className="card border border-base-300/70 bg-base-100 shadow-sm">
      <div className="card-body gap-0 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/50">
              {libelle}
            </p>
            <p className="mt-2 truncate text-xl font-semibold text-base-content sm:text-2xl">
              {valeur}
            </p>
          </div>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONS[ton]}`}>
            <Icone size={20} />
          </span>
        </div>
        {detail && <p className="mt-2 text-xs text-base-content/60">{detail}</p>}
      </div>
    </div>
  );
}
