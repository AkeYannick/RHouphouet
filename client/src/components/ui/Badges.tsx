import type { StatutAppartement, StatutLoyer, TypeNotification } from '../../types';
import {
  CLASSES_STATUT_APPARTEMENT,
  CLASSES_STATUT_LOYER,
  LIBELLES_STATUT_APPARTEMENT,
  LIBELLES_STATUT_LOYER,
  LIBELLES_TYPE_NOTIFICATION,
} from '../../utils/libelles';

const CLASSES_TYPE_NOTIFICATION: Record<TypeNotification, string> = {
  LOYER: 'badge-info',
  PAIEMENT: 'badge-success',
  MESSAGE: 'badge-primary',
  SYSTEME: 'badge-ghost',
};

export function BadgeStatutLoyer({ statut }: { statut: StatutLoyer }) {
  return (
    <span className={`badge badge-sm border-0 font-medium ${CLASSES_STATUT_LOYER[statut]}`}>
      {LIBELLES_STATUT_LOYER[statut]}
    </span>
  );
}

export function BadgeStatutAppartement({ statut }: { statut: StatutAppartement }) {
  return (
    <span className={`badge badge-sm border-0 font-medium ${CLASSES_STATUT_APPARTEMENT[statut]}`}>
      {LIBELLES_STATUT_APPARTEMENT[statut]}
    </span>
  );
}

export function BadgeTypeNotification({ type }: { type: TypeNotification }) {
  return (
    <span className={`badge badge-sm border-0 font-medium ${CLASSES_TYPE_NOTIFICATION[type]}`}>
      {LIBELLES_TYPE_NOTIFICATION[type]}
    </span>
  );
}
