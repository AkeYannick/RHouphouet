export function Chargement({ texte = 'Chargement des données…' }: { texte?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-base-content/60">
      <span className="loading loading-spinner loading-sm" />
      <span>{texte}</span>
    </div>
  );
}
