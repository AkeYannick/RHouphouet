import type { ReactNode } from 'react';

interface ProprietesChamp {
  libelle: string;
  htmlFor?: string;
  aide?: string;
  children: ReactNode;
}

export function Champ({ libelle, htmlFor, aide, children }: ProprietesChamp) {
  return (
    <label className="flex w-full flex-col gap-1.5" htmlFor={htmlFor}>
      <span className="text-sm font-medium text-base-content/80">{libelle}</span>
      {children}
      {aide && <span className="text-xs text-base-content/50">{aide}</span>}
    </label>
  );
}
