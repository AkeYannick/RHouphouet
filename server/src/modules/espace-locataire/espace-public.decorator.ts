import { SetMetadata } from '@nestjs/common';

export const CLE_ROUTE_ESPACE_PUBLIQUE = 'routeEspacePublique';

/** Route de l'espace locataire accessible sans jeton locataire (connexion, code OTP) */
export const EspacePublic = () => SetMetadata(CLE_ROUTE_ESPACE_PUBLIQUE, true);
