import type { ReactNode } from 'react';

interface ProprietesEnTetePage {
  titre: string;
  description?: string;
  actions?: ReactNode;
}

export function EnTetePage({ titre, description, actions }: ProprietesEnTetePage) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-base-content sm:text-3xl">
          {titre}
        </h1>
        {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
