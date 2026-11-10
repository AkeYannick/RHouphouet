/** N'accepte que les chemins internes pour éviter les redirections vers un site externe */
export function lienInterne(lien: string | null | undefined, defaut = '/Notifications'): string {
  if (!lien || !lien.startsWith('/') || lien.startsWith('//')) {
    return defaut;
  }

  return lien;
}

/** N'accepte qu'un chemin interne comme destination après connexion */
export function cheminInterne(destination: string | null | undefined, defaut = '/'): string {
  if (!destination || !destination.startsWith('/') || destination.startsWith('//')) {
    return defaut;
  }

  return destination;
}
