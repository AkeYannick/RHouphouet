import {
  CalendarDays,
  Layers,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BandeauErreur, BandeauSucces } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Champ } from '../components/ui/Champ';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { Modale } from '../components/ui/Modale';
import { useMessageFlash } from '../hooks/useMessageFlash';
import { api } from '../services/api';
import type { Appartement, CategorieCharge, Charge, DonneesCharge } from '../types';
import { dateDuJour, formaterDate, formaterMontant, moisActuel } from '../utils/format';
import { LIBELLES_CATEGORIE_CHARGE } from '../utils/libelles';

type FiltreCategorie = 'TOUTES' | CategorieCharge;

interface FormulaireCharge {
  libelle: string;
  categorie: CategorieCharge;
  montant: string;
  date: string;
  appartementId: string;
}

const CATEGORIES: CategorieCharge[] = [
  'ENTRETIEN',
  'REPARATION',
  'EAU_ELECTRICITE',
  'TAXE_IMPOT',
  'ASSURANCE',
  'AUTRE',
];

const CLASSES_CATEGORIE: Record<CategorieCharge, string> = {
  ENTRETIEN: 'badge-info',
  REPARATION: 'badge-warning',
  EAU_ELECTRICITE: 'badge-primary',
  TAXE_IMPOT: 'badge-error',
  ASSURANCE: 'badge-success',
  AUTRE: 'badge-ghost',
};

function formulaireVide(): FormulaireCharge {
  return {
    libelle: '',
    categorie: 'ENTRETIEN',
    montant: '',
    date: dateDuJour(),
    appartementId: '',
  };
}

const Charges = () => {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [appartements, setAppartements] = useState<Appartement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const { message, afficherMessage } = useMessageFlash();

  const [filtreCategorie, setFiltreCategorie] = useState<FiltreCategorie>('TOUTES');
  const [filtreMois, setFiltreMois] = useState('');

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formulaire, setFormulaire] = useState<FormulaireCharge>(formulaireVide);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const [chargeASupprimer, setChargeASupprimer] = useState<Charge | null>(null);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);

    try {
      const [listeCharges, listeAppartements] = await Promise.all([
        api.charges.lister(),
        api.appartements.lister(),
      ]);
      setCharges(listeCharges);
      setAppartements(listeAppartements);
      setErreur(null);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const chargesFiltrees = useMemo(() => {
    return charges.filter((charge) => {
      const correspondCategorie =
        filtreCategorie === 'TOUTES' || charge.categorie === filtreCategorie;
      const correspondMois = !filtreMois || charge.date.slice(0, 7) === filtreMois;
      return correspondCategorie && correspondMois;
    });
  }, [charges, filtreCategorie, filtreMois]);

  const statistiques = useMemo(() => {
    const total = chargesFiltrees.reduce((somme, charge) => somme + charge.montant, 0);
    const moisEnCours = moisActuel();
    const totalMois = charges
      .filter((charge) => charge.date.slice(0, 7) === moisEnCours)
      .reduce((somme, charge) => somme + charge.montant, 0);

    const totauxParCategorie = new Map<CategorieCharge, number>();

    chargesFiltrees.forEach((charge) => {
      totauxParCategorie.set(
        charge.categorie,
        (totauxParCategorie.get(charge.categorie) ?? 0) + charge.montant,
      );
    });

    const entreePrincipale = [...totauxParCategorie.entries()].sort(
      (premier, second) => second[1] - premier[1],
    )[0];

    return {
      total,
      totalMois,
      nombre: chargesFiltrees.length,
      categoriePrincipale: entreePrincipale?.[0] ?? null,
      montantPrincipal: entreePrincipale?.[1] ?? 0,
    };
  }, [charges, chargesFiltrees]);

  const montantMoyen = statistiques.nombre
    ? Math.round(statistiques.total / statistiques.nombre)
    : 0;

  const ouvrirModale = () => {
    setFormulaire(formulaireVide());
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const fermerModale = () => {
    if (!enregistrement) {
      setModaleOuverte(false);
    }
  };

  const ajouterCharge = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();

    const libelle = formulaire.libelle.trim();
    const montant = Number(formulaire.montant);

    if (!libelle) {
      setErreurFormulaire('Le libellé de la charge est obligatoire');
      return;
    }

    if (!Number.isFinite(montant) || montant <= 0) {
      setErreurFormulaire('Le montant doit être supérieur à zéro');
      return;
    }

    if (!formulaire.date) {
      setErreurFormulaire('La date de la charge est obligatoire');
      return;
    }

    const donnees: DonneesCharge = {
      libelle,
      categorie: formulaire.categorie,
      montant: Math.round(montant),
      date: formulaire.date,
      appartementId: formulaire.appartementId || undefined,
    };

    setEnregistrement(true);
    setErreurFormulaire(null);

    try {
      const charge = await api.charges.creer(donnees);
      setCharges((precedent) => [charge, ...precedent]);
      setModaleOuverte(false);
      afficherMessage('Charge enregistrée avec succès');
    } catch (probleme) {
      setErreurFormulaire((probleme as Error).message);
    } finally {
      setEnregistrement(false);
    }
  };

  const confirmerSuppression = async () => {
    if (!chargeASupprimer) {
      return;
    }

    setSuppression(true);

    try {
      await api.charges.supprimer(chargeASupprimer.id);
      setCharges((precedent) => precedent.filter((charge) => charge.id !== chargeASupprimer.id));
      setChargeASupprimer(null);
      afficherMessage('Charge supprimée avec succès');
    } catch (probleme) {
      setErreur((probleme as Error).message);
      setChargeASupprimer(null);
    } finally {
      setSuppression(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <EnTetePage
        titre="Charges & dépenses"
        description="Suivez les dépenses liées à l'entretien et à la gestion de vos appartements."
        actions={
          <button type="button" onClick={ouvrirModale} className="btn btn-primary btn-sm sm:btn-md">
            <Plus size={18} />
            Ajouter une charge
          </button>
        }
      />

      {erreur && <BandeauErreur message={erreur} onReessayer={charger} />}
      {message && <BandeauSucces message={message} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          libelle="Total des charges"
          valeur={formaterMontant(statistiques.total)}
          detail={filtreMois ? `Mois sélectionné` : 'Toutes les périodes'}
          icone={Wallet}
          ton="erreur"
        />
        <CarteStatistique
          libelle="Charges du mois"
          valeur={formaterMontant(statistiques.totalMois)}
          detail="Mois en cours"
          icone={CalendarDays}
          ton="alerte"
        />
        <CarteStatistique
          libelle="Opérations"
          valeur={String(statistiques.nombre)}
          detail={`Montant moyen : ${formaterMontant(montantMoyen)}`}
          icone={Receipt}
          ton="primaire"
        />
        <CarteStatistique
          libelle="Poste principal"
          valeur={
            statistiques.categoriePrincipale
              ? LIBELLES_CATEGORIE_CHARGE[statistiques.categoriePrincipale]
              : '—'
          }
          detail={
            statistiques.categoriePrincipale
              ? formaterMontant(statistiques.montantPrincipal)
              : 'Aucune charge enregistrée'
          }
          icone={TrendingDown}
          ton="neutre"
        />
      </div>

      <div className="card border border-base-300/70 bg-base-100 shadow-sm">
        <div className="card-body gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-base-content">Historique des charges</h2>
              <p className="text-xs text-base-content/60">
                {statistiques.nombre} charge{statistiques.nombre > 1 ? 's' : ''} affichée
                {statistiques.nombre > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="select select-bordered select-sm w-full sm:w-52"
                value={filtreCategorie}
                onChange={(evenement) =>
                  setFiltreCategorie(evenement.target.value as FiltreCategorie)
                }
                aria-label="Filtrer par catégorie"
              >
                <option value="TOUTES">Toutes les catégories</option>
                {CATEGORIES.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE_CHARGE[categorie]}
                  </option>
                ))}
              </select>

              <input
                type="month"
                className="input input-bordered input-sm w-full sm:w-44"
                value={filtreMois}
                onChange={(evenement) => setFiltreMois(evenement.target.value)}
                aria-label="Filtrer par mois"
              />

              {(filtreMois || filtreCategorie !== 'TOUTES') && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setFiltreMois('');
                    setFiltreCategorie('TOUTES');
                  }}
                >
                  <X size={16} />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {chargement ? (
            <Chargement texte="Chargement des charges…" />
          ) : chargesFiltrees.length === 0 ? (
            <EtatVide
              icone={Layers}
              titre="Aucune charge enregistrée"
              description="Ajoutez vos premières dépenses pour suivre la rentabilité de vos appartements."
              action={
                <button type="button" className="btn btn-primary btn-sm" onClick={ouvrirModale}>
                  <Plus size={16} />
                  Ajouter une charge
                </button>
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Libellé</th>
                      <th>Catégorie</th>
                      <th>Appartement</th>
                      <th className="text-right">Montant</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargesFiltrees.map((charge) => (
                      <tr key={charge.id} className="hover:bg-base-200/50">
                        <td className="whitespace-nowrap text-sm">{formaterDate(charge.date)}</td>
                        <td className="text-sm font-medium text-base-content">{charge.libelle}</td>
                        <td>
                          <span
                            className={`badge badge-sm border-0 font-medium ${CLASSES_CATEGORIE[charge.categorie]}`}
                          >
                            {LIBELLES_CATEGORIE_CHARGE[charge.categorie]}
                          </span>
                        </td>
                        <td className="text-sm text-base-content/70">
                          {charge.appartement?.numero ?? 'Général'}
                        </td>
                        <td className="text-right text-sm font-semibold text-error">
                          {formaterMontant(charge.montant)}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs text-error"
                            onClick={() => setChargeASupprimer(charge)}
                            aria-label={`Supprimer la charge ${charge.libelle}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 lg:hidden">
                {chargesFiltrees.map((charge) => (
                  <div
                    key={charge.id}
                    className="rounded-xl border border-base-300/70 bg-base-100 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-base-content">
                          {charge.libelle}
                        </p>
                        <p className="mt-0.5 text-xs text-base-content/60">
                          {formaterDate(charge.date)}
                          {charge.appartement ? ` · ${charge.appartement.numero}` : ' · Général'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => setChargeASupprimer(charge)}
                        aria-label={`Supprimer la charge ${charge.libelle}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span
                        className={`badge badge-sm border-0 font-medium ${CLASSES_CATEGORIE[charge.categorie]}`}
                      >
                        {LIBELLES_CATEGORIE_CHARGE[charge.categorie]}
                      </span>
                      <span className="text-sm font-semibold text-error">
                        {formaterMontant(charge.montant)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Modale
        ouvert={modaleOuverte}
        titre="Ajouter une charge"
        description="Enregistrez une dépense liée à un appartement ou à la gestion générale."
        onFermer={fermerModale}
        pied={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm sm:btn-md"
              onClick={fermerModale}
              disabled={enregistrement}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-charge"
              className="btn btn-primary btn-sm sm:btn-md"
              disabled={enregistrement}
            >
              {enregistrement && <span className="loading loading-spinner loading-xs" />}
              Enregistrer
            </button>
          </>
        }
      >
        <form id="formulaire-charge" className="flex flex-col gap-4" onSubmit={ajouterCharge}>
          {erreurFormulaire && <BandeauErreur message={erreurFormulaire} />}

          <Champ libelle="Libellé" htmlFor="charge-libelle">
            <input
              id="charge-libelle"
              type="text"
              className="input input-bordered w-full"
              placeholder="Ex : Réparation de la robinetterie"
              value={formulaire.libelle}
              onChange={(evenement) =>
                setFormulaire((precedent) => ({ ...precedent, libelle: evenement.target.value }))
              }
              required
            />
          </Champ>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ libelle="Catégorie" htmlFor="charge-categorie">
              <select
                id="charge-categorie"
                className="select select-bordered w-full"
                value={formulaire.categorie}
                onChange={(evenement) =>
                  setFormulaire((precedent) => ({
                    ...precedent,
                    categorie: evenement.target.value as CategorieCharge,
                  }))
                }
              >
                {CATEGORIES.map((categorie) => (
                  <option key={categorie} value={categorie}>
                    {LIBELLES_CATEGORIE_CHARGE[categorie]}
                  </option>
                ))}
              </select>
            </Champ>

            <Champ libelle="Date" htmlFor="charge-date">
              <input
                id="charge-date"
                type="date"
                className="input input-bordered w-full"
                value={formulaire.date}
                onChange={(evenement) =>
                  setFormulaire((precedent) => ({ ...precedent, date: evenement.target.value }))
                }
                required
              />
            </Champ>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ libelle="Montant (FCFA)" htmlFor="charge-montant">
              <input
                id="charge-montant"
                type="number"
                min={1}
                step={1}
                className="input input-bordered w-full"
                placeholder="Ex : 75 000"
                value={formulaire.montant}
                onChange={(evenement) =>
                  setFormulaire((precedent) => ({ ...precedent, montant: evenement.target.value }))
                }
                required
              />
            </Champ>

            <Champ
              libelle="Appartement concerné"
              htmlFor="charge-appartement"
              aide="Laissez vide pour une dépense générale"
            >
              <select
                id="charge-appartement"
                className="select select-bordered w-full"
                value={formulaire.appartementId}
                onChange={(evenement) =>
                  setFormulaire((precedent) => ({
                    ...precedent,
                    appartementId: evenement.target.value,
                  }))
                }
              >
                <option value="">Aucun (dépense générale)</option>
                {appartements.map((appartement) => (
                  <option key={appartement.id} value={appartement.id}>
                    {appartement.numero}
                    {appartement.designation ? ` — ${appartement.designation}` : ''}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
        </form>
      </Modale>

      <Modale
        ouvert={chargeASupprimer !== null}
        titre="Supprimer la charge"
        description="Cette action est définitive et ne peut pas être annulée."
        onFermer={() => {
          if (!suppression) {
            setChargeASupprimer(null);
          }
        }}
        pied={
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm sm:btn-md"
              onClick={() => setChargeASupprimer(null)}
              disabled={suppression}
            >
              Annuler
            </button>
            <button
              type="button"
              className="btn btn-error btn-sm sm:btn-md"
              onClick={confirmerSuppression}
              disabled={suppression}
            >
              {suppression && <span className="loading loading-spinner loading-xs" />}
              Supprimer
            </button>
          </>
        }
      >
        <p className="text-sm text-base-content/80">
          Voulez-vous vraiment supprimer la charge{' '}
          <span className="font-semibold">{chargeASupprimer?.libelle}</span> d'un montant de{' '}
          <span className="font-semibold">
            {chargeASupprimer ? formaterMontant(chargeASupprimer.montant) : '—'}
          </span>{' '}
          ?
        </p>
      </Modale>
    </div>
  );
};

export default Charges;
