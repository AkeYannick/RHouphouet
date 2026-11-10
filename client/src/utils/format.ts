export function formaterMontant(montant: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(montant)} FCFA`;
}

export function formaterNombre(valeur: number): string {
  return new Intl.NumberFormat('fr-FR').format(valeur);
}

export function formaterDate(valeur?: string | null): string {
  if (!valeur) {
    return '—';
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formaterDateHeure(valeur?: string | null): string {
  if (!valeur) {
    return '—';
  }

  const date = new Date(valeur);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formaterMois(mois: string): string {
  const [annee, numeroMois] = mois.split('-').map(Number);

  if (!annee || !numeroMois) {
    return mois;
  }

  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(annee, numeroMois - 1, 1),
  );
}

export function formaterMoisCourt(mois: string): string {
  const [annee, numeroMois] = mois.split('-').map(Number);

  if (!annee || !numeroMois) {
    return mois;
  }

  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
    new Date(annee, numeroMois - 1, 1),
  );
}

export function formaterDateRelative(valeur: string): string {
  const date = new Date(valeur);
  const difference = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "à l'instant";
  }

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const heures = Math.floor(minutes / 60);

  if (heures < 24) {
    return `il y a ${heures} h`;
  }

  const jours = Math.floor(heures / 24);

  if (jours < 7) {
    return `il y a ${jours} j`;
  }

  return formaterDate(valeur);
}

export function moisActuel(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function anneeActuelle(): number {
  return new Date().getFullYear();
}

export function dateDuJour(): string {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function valeurDateInput(valeur?: string | null): string {
  return valeur ? valeur.slice(0, 10) : '';
}

export function initiales(nom: string): string {
  return nom
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot.charAt(0).toUpperCase())
    .join('');
}
