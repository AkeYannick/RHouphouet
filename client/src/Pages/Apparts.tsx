import { Building2, Home, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BadgeStatutAppartement } from '../components/ui/Badges';
import { BandeauErreur, BandeauSucces } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Champ } from '../components/ui/Champ';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { Modale } from '../components/ui/Modale';
import { useMessageFlash } from '../hooks/useMessageFlash';
import { api } from '../services/api';
import type { Appartement, DonneesAppartement, StatutAppartement } from '../types';
import { formaterMontant } from '../utils/format';
import { LIBELLES_STATUT_APPARTEMENT } from '../utils/libelles';

interface FormulaireAppartement {
  numero: string;
  designation: string;
  loyerMensuel: string;
  nombrePieces: string;
  statut: StatutAppartement;
}

const FORMULAIRE_VIDE: FormulaireAppartement = {
  numero: '',
  designation: '',
  loyerMensuel: '',
  nombrePieces: '1',
  statut: 'LIBRE',
};

const Apparts = () => {
  const [appartements, setAppartements] = useState<Appartement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [appartementEnEdition, setAppartementEnEdition] = useState<Appartement | null>(null);
  const [formulaire, setFormulaire] = useState<FormulaireAppartement>(FORMULAIRE_VIDE);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const { message, afficherMessage } = useMessageFlash();

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const resultat = await api.appartements.lister();
      setAppartements(resultat);
      setErreur(null);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    } finally {
      if (!silencieux) {
        setChargement(false);
      }
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const ouvrirCreation = () => {
    setAppartementEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const ouvrirEdition = (appartement: Appartement) => {
    setAppartementEnEdition(appartement);
    setFormulaire({
      numero: appartement.numero,
      designation: appartement.designation ?? '',
      loyerMensuel: String(appartement.loyerMensuel),
      nombrePieces: String(appartement.nombrePieces),
      statut: appartement.statut,
    });
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const enregistrer = async (evenement: FormEvent) => {
    evenement.preventDefault();
    const loyerMensuel = Number(formulaire.loyerMensuel);

    if (!formulaire.numero.trim()) {
      setErreurFormulaire("Le numéro de l'appartement est obligatoire");
      return;
    }

    if (!Number.isFinite(loyerMensuel) || loyerMensuel <= 0) {
      setErreurFormulaire('Le loyer mensuel doit être supérieur à zéro');
      return;
    }

    const donnees: DonneesAppartement = {
      numero: formulaire.numero.trim(),
      designation: formulaire.designation.trim() || undefined,
      loyerMensuel,
      nombrePieces: Number(formulaire.nombrePieces) || 1,
      statut: formulaire.statut,
    };

    setEnregistrement(true);

    try {
      if (appartementEnEdition) {
        await api.appartements.modifier(appartementEnEdition.id, donnees);
        afficherMessage('Appartement modifié avec succès');
      } else {
        await api.appartements.creer(donnees);
        afficherMessage('Appartement ajouté avec succès');
      }

      setModaleOuverte(false);
      await charger(true);
    } catch (probleme) {
      setErreurFormulaire((probleme as Error).message);
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (appartement: Appartement) => {
    if (
      !window.confirm(
        `Supprimer l'appartement « ${appartement.numero} » ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    try {
      await api.appartements.supprimer(appartement.id);
      afficherMessage('Appartement supprimé');
      await charger(true);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    }
  };

  const occupes = appartements.filter((appartement) => appartement.locataires?.length).length;
  const revenusPotentiels = appartements.reduce(
    (total, appartement) => total + appartement.loyerMensuel,
    0,
  );

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Appartements"
        description="Suivez l'occupation et les loyers de chaque logement."
        actions={
          <button type="button" onClick={ouvrirCreation} className="btn btn-primary btn-sm gap-2">
            <Plus size={16} />
            Ajouter un appartement
          </button>
        }
      />

      {message && <BandeauSucces message={message} />}
      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStatistique
          libelle="Appartements"
          valeur={String(appartements.length)}
          detail="Total du parc immobilier"
          icone={Building2}
        />
        <CarteStatistique
          libelle="Occupés"
          valeur={String(occupes)}
          detail={`${appartements.length - occupes} disponible(s)`}
          icone={Home}
          ton="succes"
        />
        <CarteStatistique
          libelle="Disponibles"
          valeur={String(appartements.length - occupes)}
          detail="Prêts à être loués"
          icone={Home}
          ton="neutre"
        />
        <CarteStatistique
          libelle="Loyers potentiels"
          valeur={formaterMontant(revenusPotentiels)}
          detail="Somme des loyers mensuels"
          icone={Wallet}
          ton="primaire"
        />
      </div>

      {chargement ? (
        <div className="card border border-base-300/70 bg-base-100 p-6 shadow-sm">
          <Chargement texte="Chargement des appartements…" />
        </div>
      ) : appartements.length === 0 ? (
        <div className="card border border-base-300/70 bg-base-100 shadow-sm">
          <EtatVide
            icone={Building2}
            titre="Aucun appartement enregistré"
            description="Ajoutez votre premier appartement pour commencer la gestion locative."
            action={
              <button type="button" onClick={ouvrirCreation} className="btn btn-primary btn-sm">
                Ajouter un appartement
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {appartements.map((appartement) => {
            const locataire = appartement.locataires?.[0];
            const occupe = Boolean(locataire) || appartement.statut === 'OCCUPE';

            return (
              <article
                key={appartement.id}
                className="card border border-base-300/70 bg-base-100 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="card-body gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/45">
                        Appartement
                      </p>
                      <h2 className="truncate text-xl font-semibold text-base-content">
                        {appartement.numero}
                      </h2>
                      <p className="mt-0.5 line-clamp-1 text-xs text-base-content/55">
                        {appartement.designation ?? `${appartement.nombrePieces} pièce(s)`}
                      </p>
                    </div>
                    <BadgeStatutAppartement statut={appartement.statut} />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-base-content/45">Locataire</dt>
                      <dd className="truncate font-medium">{locataire?.nom ?? 'Aucun'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">Loyer mensuel</dt>
                      <dd className="font-medium">{formaterMontant(appartement.loyerMensuel)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">Caution</dt>
                      <dd className="font-medium">
                        {locataire ? formaterMontant(locataire.caution) : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-base-content/45">Pièces</dt>
                      <dd className="font-medium">{appartement.nombrePieces}</dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-1 border-t border-base-300/60 pt-3">
                    <Link
                      to={locataire ? `/Loyers?locataire=${locataire.id}` : '/Loyers'}
                      className="btn btn-ghost btn-sm flex-1"
                    >
                      Voir les loyers
                    </Link>
                    <button
                      type="button"
                      onClick={() => ouvrirEdition(appartement)}
                      className="btn btn-ghost btn-sm btn-square"
                      aria-label={`Modifier ${appartement.numero}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void supprimer(appartement)}
                      disabled={occupe}
                      className="btn btn-ghost btn-sm btn-square text-error disabled:text-base-content/20"
                      aria-label={`Supprimer ${appartement.numero}`}
                      title={occupe ? 'Retirez d’abord le locataire' : 'Supprimer'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modale
        ouvert={modaleOuverte}
        titre={appartementEnEdition ? 'Modifier un appartement' : 'Ajouter un appartement'}
        description="Les champs marqués sont nécessaires au calcul des loyers."
        onFermer={() => setModaleOuverte(false)}
        pied={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setModaleOuverte(false)}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-appartement"
              className="btn btn-primary"
              disabled={enregistrement}
            >
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form
          id="formulaire-appartement"
          onSubmit={(evenement) => void enregistrer(evenement)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Champ libelle="Numéro de l'appartement">
            <input
              className="input input-bordered w-full"
              value={formulaire.numero}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, numero: evenement.target.value })
              }
              placeholder="Ex. Apt 04"
              required
            />
          </Champ>

          <Champ libelle="Nombre de pièces">
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={formulaire.nombrePieces}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, nombrePieces: evenement.target.value })
              }
            />
          </Champ>

          <Champ libelle="Loyer mensuel (FCFA)">
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={formulaire.loyerMensuel}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, loyerMensuel: evenement.target.value })
              }
              placeholder="Ex. 150000"
              required
            />
          </Champ>

          <Champ libelle="Statut">
            <select
              className="select select-bordered w-full"
              value={formulaire.statut}
              onChange={(evenement) =>
                setFormulaire({
                  ...formulaire,
                  statut: evenement.target.value as StatutAppartement,
                })
              }
            >
              {Object.entries(LIBELLES_STATUT_APPARTEMENT).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
          </Champ>

          <div className="sm:col-span-2">
            <Champ libelle="Désignation (facultatif)">
              <input
                className="input input-bordered w-full"
                value={formulaire.designation}
                onChange={(evenement) =>
                  setFormulaire({ ...formulaire, designation: evenement.target.value })
                }
                placeholder="Ex. Appartement 2 pièces - 1er étage"
              />
            </Champ>
          </div>

          {erreurFormulaire && (
            <p className="text-sm text-error sm:col-span-2">{erreurFormulaire}</p>
          )}
        </form>
      </Modale>
    </div>
  );
};

export default Apparts;
