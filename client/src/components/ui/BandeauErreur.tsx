import { TriangleAlert } from 'lucide-react';

interface ProprietesBandeauErreur {
  message: string;
  onReessayer?: () => void;
}

export function BandeauErreur({ message, onReessayer }: ProprietesBandeauErreur) {
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <TriangleAlert size={18} />
      <span className="text-sm">{message}</span>
      {onReessayer && (
        <button type="button" onClick={onReessayer} className="btn btn-ghost btn-sm">
          Réessayer
        </button>
      )}
    </div>
  );
}

export function BandeauSucces({ message }: { message: string }) {
  return (
    <div role="status" className="alert alert-success alert-soft">
      <span className="text-sm">{message}</span>
    </div>
  );
}
