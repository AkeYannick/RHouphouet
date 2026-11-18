import { SetMetadata } from '@nestjs/common';

export const CLE_ROUTE_PUBLIQUE = 'routePublique';

/** Permet d'exposer une route sans exiger de session administrateur */
export const Public = () => SetMetadata(CLE_ROUTE_PUBLIQUE, true);
