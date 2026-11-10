import { useEffect, useState } from 'react';

/** Affiche un message de succès temporaire (4 secondes) en haut d'une page */
export function useMessageFlash() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) {
      return;
    }

    const minuterie = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(minuterie);
  }, [message]);

  return {
    message,
    afficherMessage: setMessage,
    effacerMessage: () => setMessage(null),
  };
}
