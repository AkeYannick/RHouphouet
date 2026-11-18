import {
  Ban,
  CalendarDays,
  CheckCircle2,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { BadgeStatutContrat } from '../components/ui/Badges';
import { BandeauErreur, BandeauSucces } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Champ } from '../components/ui/Champ';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { Modale } from '../components/ui/Modale';
import { useMessageFlash } from '../hooks/useMessageFlash';
import { api } from '../services/api';
import type {
  Appartement,
  Contrat,
  DonneesContrat,
  Locataire,
  StatutContrat,
} from '../types';
import { dateDuJour, formaterDate, formaterMontant } from '../utils/format';

type FiltreStatut = 'TOUS' | StatutContrat;

interface FormulaireContrat {
  locataireId: string;
  appartementId: string;
  dateDebut: string;
  dateFin: string;
  loyerMensuel: string;
  caution: string;
  chargesMensuelles: string;
  statut: StatutContrat;
  clauses: string;
}

function formulaireVide(): FormulaireContrat {
  return {
    locataireId: '',
    appartementId: '',
    dateDebut: dateDuJour(),
    dateFin: '',
    loyerMensuel: '',
    caution: '',
    chargesMensuelles: '0',
    statut: 'ACTIF',
    clauses: '',
  };
}

const ONGLETS: Array<{ cle: FiltreStatut; libelle: string }> = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'ACTIF', libelle: 'Actifs' },
  { cle: 'TERMINE', libelle: 'Terminés' },
  { cle: 'RESILIE', libelle: 'Résiliés' },
];

/** Extrait un message lisible d'une erreur inconnue */
function messageErreur(probleme: unknown): string {
  return probleme instanceof Error ? probleme.message : 'Une erreur est survenue';
}

const Contrats = () => {
  const [contrats, setContrats] = useState<Contrat[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [appartements, setAppartements] = useState<Appartement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('TOUS');
  const { message, afficherMessage } = useMessageFlash();

  const [chargementLocataires, setChargementLocataires] = useState(false);
  const [erreurLocataires, setErreurLocataires] = useState<string | null>(null);

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formulaire, setFormulaire] = useState<FormulaireContrat>(formulaireVide);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  /**
   * Chargement indépendant des trois listes : si l'une échoue,
   * les deux autres s'affichent quand même.
   */
  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    const [rContrats, rLocataires, rAppartements] = await Promise.allSettled([
      api.contrats.lister(),
      api.locataires.lister(),
      api.appartements.lister(),
    ]);

    const erreurs: string[] = [];

    if (rContrats.status === 'fulfilled') {
      setContrats(rContrats.value);
    } else {
      erreurs.push(`Contrats : ${messageErreur(rContrats.reason)}`);
    }

    if (rLocataires.status === 'fulfilled') {
      setLocataires(rLocataires.value);
      setErreurLocataires(null);
    } else {
      const texte = messageErreur(rLocataires.reason);
      setErreurLocataires(texte);
      erreurs.push(`Locataires : ${texte}`);
    }

    if (rAppartements.status === 'fulfilled') {
      setAppartements(rAppartements.value);
    } else {
      erreurs.push(`Appartements : ${messageErreur(rAppartements.reason)}`);
    }

    setErreur(erreurs.length > 0 ? erreurs.join(' · ') : null);

    if (!silencieux) {
      setChargement(false);
    }
  }, []);

  /** Recharge uniquement les locataires (ouverture de la modale ou bouton « Réessayer ») */
  const chargerLocataires = useCallback(async () => {
    setChargementLocataires(true);

    try {
      const liste = await api.locataires.lister();
      setLocataires(liste);
      setErreurLocataires(null);
    } catch (probleme) {
      setErreurLocataires(messageErreur(probleme));
    } finally {
      setChargementLocataires(false);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const contratsFiltres = useMemo(
    () =>
      filtreStatut === 'TOUS'
        ? contrats
        : contrats.filter((contrat) => contrat.statut === filtreStatut),
    [contrats, filtreStatut],
  );

  const contratsActifs = useMemo(
    () => contrats.filter((contrat) => contrat.statut === 'ACTIF'),
    [contrats],
  );

  const loyersMensuelsActifs = contratsActifs.reduce(
    (total, contrat) => total + (contrat.loyerMensuel ?? 0),
    0,
  );
  const cautionsActives = contratsActifs.reduce(
    (total, contrat) => total + (contrat.caution ?? 0),
    0,
  );

  /** Locataires qui ont déjà un contrat actif (pour éviter les doublons) */
  const idsAvecContratActif = useMemo(() => {
    const ids = new Set<string>();
    for (const contrat of contratsActifs) {
      if (contrat.locataire?.id) {
        ids.add(contrat.locataire.id);
      }
    }
    return ids;
  }, [contratsActifs]);

  const ouvrirModale = () => {
    setFormulaire(formulaireVide());
    setErreurFormulaire(null);
    setModaleOuverte(true);
    void chargerLocataires(); // liste toujours à jour à l'ouverture
  };

  const fermerModale = () => {
    if (enregistrement) return; // pas de fermeture pendant l'enregistrement
    setModaleOuverte(false);
  };

  const choisirLocataire = (locataireId: string) => {
    const locataire = locataires.find((element) => element.id === locataireId);
    setFormulaire((precedent) => ({
      ...precedent,
      locataireId,
      appartementId: locataire?.appartementId ?? '',
      loyerMensuel: locataire ? String(locataire.loyerMensuel ?? '') : '',
      caution: locataire ? String(locataire.caution ?? '') : '',
    }));
  };

  const creer = async (evenement: FormEvent) => {
    evenement.preventDefault();

    if (enregistrement) return; // évite le double envoi

    if (!formulaire.locataireId) {
      setErreurFormulaire('Veuillez sélectionner un locataire');
      return;
    }

    if (!formulaire.dateDebut) {
      setErreurFormulaire('La date de début est obligatoire');
      return;
    }

    if (formulaire.dateFin && formulaire.dateFin < formulaire.dateDebut) {
      setErreurFormulaire('La date de fin doit être postérieure à la date de début');
      return;
    }

    const loyer = Number(formulaire.loyerMensuel);
    if (!Number.isFinite(loyer) || loyer <= 0) {
      setErreurFormulaire('Le loyer mensuel doit être supérieur à 0');
      return;
    }

    const caution = formulaire.caution ? Number(formulaire.caution) : undefined;
    const charges = formulaire.chargesMensuelles ? Number(formulaire.chargesMensuelles) : 0;

    if (
      (caution !== undefined && (!Number.isFinite(caution) || caution < 0)) ||
      !Number.isFinite(charges) ||
      charges < 0
    ) {
      setErreurFormulaire('La caution et les charges doivent être des montants positifs');
      return;
    }

    if (
      formulaire.statut === 'ACTIF' &&
      idsAvecContratActif.has(formulaire.locataireId) &&
      !window.confirm(
        'Ce locataire a déjà un contrat actif. Créer quand même un nouveau contrat actif ?',
      )
    ) {
      return;
    }

    const donnees: DonneesContrat = {
      locataireId: formulaire.locataireId,
      appartementId: formulaire.appartementId || undefined,
      dateDebut: formulaire.dateDebut,
      dateFin: formulaire.dateFin || undefined,
      loyerMensuel: loyer,
      caution,
      statut: formulaire.statut,
      clauses: formulaire.clauses.trim() || undefined,
    };

    setEnregistrement(true);
    setErreurFormulaire(null);

    try {
      await api.contrats.creer(donnees);
      afficherMessage('Contrat créé avec succès');
      setModaleOuverte(false);
      await charger(true);
    } catch (probleme) {
      setErreurFormulaire(messageErreur(probleme));
    } finally {
      setEnregistrement(false);
    }
  };

  const changerStatut = async (contrat: Contrat, statut: StatutContrat) => {
    const libelles: Record<StatutContrat, string> = {
      ACTIF: 'activer',
      TERMINE: 'terminer',
      RESILIE: 'résilier',
    };

    if (!window.confirm(`Voulez-vous ${libelles[statut]} le contrat ${contrat.numero} ?`)) {
      return;
    }

    try {
      await api.contrats.modifier(contrat.id, { statut });
      afficherMessage(`Contrat ${contrat.numero} mis à jour`);
      await charger(true);
    } catch (probleme) {
      setErreur(messageErreur(probleme));
    }
  };

  const supprimer = async (contrat: Contrat) => {
    if (
      !window.confirm(
        `Supprimer définitivement le contrat ${contrat.numero} de ${
          contrat.locataire?.nom ?? 'ce locataire'
        } ?`,
      )
    ) {
      return;
    }

    try {
      await api.contrats.supprimer(contrat.id);
      afficherMessage('Contrat supprimé');
      await charger(true);
    } catch (probleme) {
      setErreur(messageErreur(probleme));
    }
  };

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Contrats de location"
        description="Créez et suivez les contrats liant vos locataires à leurs logements."
        actions={
          <button type="button" onClick={ouvrirModale} className="btn btn-primary btn-sm gap-2">
            <Plus size={16} />
            Créer un contrat
          </button>
        }
      />

      {message && <BandeauSucces message={message} />}
      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStatistique
          libelle="Contrats actifs"
          valeur={String(contratsActifs.length)}
          detail={`${contrats.length} contrat(s) au total`}
          icone={FileText}
          ton="succes"
        />
        <CarteStatistique
          libelle="Loyers mensuels"
          valeur={formaterMontant(loyersMensuelsActifs)}
          detail="Cumul des contrats actifs"
          icone={Wallet}
        />
        <CarteStatistique
          libelle="Cautions détenues"
          valeur={formaterMontant(cautionsActives)}
          detail="Contrats actifs"
          icone={ShieldCheck}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ONGLETS.map((onglet) => {
          const nombre =
            onglet.cle === 'TOUS'
              ? contrats.length
              : contrats.filter((contrat) => contrat.statut === onglet.cle).length;

          return (
            <button
              key={onglet.cle}
              type="button"
              onClick={() => setFiltreStatut(onglet.cle)}
              className={`btn btn-sm ${
                filtreStatut === onglet.cle ? 'btn-primary' : 'btn-ghost'
              }`}
            >
              {onglet.libelle}
              <span
                className={`badge badge-xs border-0 ${
                  filtreStatut === onglet.cle ? 'badge-neutral' : 'badge-ghost'
                }`}
              >
                {nombre}
              </span>
            </button>
          );
        })}
      </div>

      {chargement ? (
        <div className="card border border-base-300/70 bg-base-100 p-6 shadow-sm">
          <Chargement texte="Chargement des contrats…" />
        </div>
      ) : contratsFiltres.length === 0 ? (
        <div className="card border border-base-300/70 bg-base-100 shadow-sm">
          <EtatVide
            icone={FileText}
            titre="Aucun contrat trouvé"
            description={
              filtreStatut === 'TOUS'
                ? "Créez un contrat pour formaliser la location d'un logement."
                : 'Aucun contrat ne correspond à ce filtre.'
            }
            action={
              <button type="button" onClick={ouvrirModale} className="btn btn-primary btn-sm">
                Créer un contrat
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {contratsFiltres.map((contrat) => (
            <article
              key={contrat.id}
              className="card border border-base-300/70 bg-base-100 shadow-sm"
            >
              <div className="card-body gap-3 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-base-content/50">
                      {contrat.numero}
                    </p>
                    <h2 className="truncate text-lg font-semibold">
                      {contrat.locataire?.nom ?? 'Locataire'}
                    </h2>
                    <p className="text-xs text-base-content/55">
                      {contrat.appartement?.numero ?? 'Aucun appartement rattaché'}
                    </p>
                  </div>
                  <BadgeStatutContrat statut={contrat.statut} />
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-base-200/60 p-3 text-sm">
                  <div>
                    <p className="text-xs text-base-content/50">Loyer</p>
                    <p className="font-semibold">{formaterMontant(contrat.loyerMensuel)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50">Caution</p>
                    <p className="font-semibold">{formaterMontant(contrat.caution)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-base-content/50">Charges</p>
                    <p className="font-semibold">
                      {formaterMontant(contrat.chargesMensuelles)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} />
                    Début : {formaterDate(contrat.dateDebut)}
                  </span>
                  <span>
                    {contrat.dateFin ? `Fin : ${formaterDate(contrat.dateFin)}` : 'Sans terme'}
                  </span>
                </div>

                {contrat.clauses && (
                  <details className="text-xs text-base-content/60">
                    <summary className="cursor-pointer font-medium text-primary">
                      Voir les clauses
                    </summary>
                    <p className="mt-2 whitespace-pre-line leading-relaxed">
                      {contrat.clauses}
                    </p>
                  </details>
                )}

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-base-300/60 pt-3">
                  <div className="flex flex-wrap gap-1">
                    {contrat.statut !== 'ACTIF' && (
                      <button
                        type="button"
                        onClick={() => void changerStatut(contrat, 'ACTIF')}
                        className="btn btn-ghost btn-xs gap-1 text-success"
                      >
                        <CheckCircle2 size={13} />
                        Activer
                      </button>
                    )}
                    {contrat.statut === 'ACTIF' && (
                      <>
                        <button
                          type="button"
                          onClick={() => void changerStatut(contrat, 'TERMINE')}
                          className="btn btn-ghost btn-xs gap-1"
                        >
                          <CheckCircle2 size={13} />
                          Terminer
                        </button>
                        <button
                          type="button"
                          onClick={() => void changerStatut(contrat, 'RESILIE')}
                          className="btn btn-ghost btn-xs gap-1 text-warning"
                        >
                          <Ban size={13} />
                          Résilier
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void supprimer(contrat)}
                    className="btn btn-ghost btn-xs btn-square text-error"
                    aria-label="Supprimer le contrat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modale
        ouvert={modaleOuverte}
        titre="Créer un contrat de location"
        description="Les montants sont préremplis à partir de la fiche du locataire."
        onFermer={fermerModale}
        taille="lg"
        pied={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={fermerModale}
              disabled={enregistrement}
            >
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-contrat"
              className="btn btn-primary"
              disabled={enregistrement || chargementLocataires}
            >
              {enregistrement ? 'Création…' : 'Créer le contrat'}
            </button>
          </>
        }
      >
        <form
          id="formulaire-contrat"
          onSubmit={(evenement) => void creer(evenement)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Champ libelle="Locataire">
              <select
                className="select select-bordered w-full"
                value={formulaire.locataireId}
                onChange={(evenement) => choisirLocataire(evenement.target.value)}
                disabled={chargementLocataires}
                required
              >
                <option value="">
                  {chargementLocataires
                    ? 'Chargement des locataires…'
                    : locataires.length === 0
                      ? 'Aucun locataire disponible'
                      : '— Choisir un locataire —'}
                </option>
                {locataires.map((locataire) => (
                  <option key={locataire.id} value={locataire.id}>
                    {locataire.appartement?.numero ?? 'Sans appartement'} — {locataire.nom}
                    {idsAvecContratActif.has(locataire.id) ? ' (contrat actif)' : ''}
                  </option>
                ))}
              </select>
            </Champ>

            {erreurLocataires && (
              <p className="mt-1 text-xs text-error">
                Impossible de charger les locataires : {erreurLocataires}{' '}
                <button
                  type="button"
                  className="link"
                  onClick={() => void chargerLocataires()}
                >
                  Réessayer
                </button>
              </p>
            )}
          </div>

          <Champ libelle="Appartement concerné">
            <select
              className="select select-bordered w-full"
              value={formulaire.appartementId}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, appartementId: evenement.target.value })
              }
            >
              <option value="">— Aucun appartement —</option>
              {appartements.map((appartement) => (
                <option key={appartement.id} value={appartement.id}>
                  {appartement.numero} — {formaterMontant(appartement.loyerMensuel)}
                </option>
              ))}
            </select>
          </Champ>

          <Champ libelle="Statut initial">
            <select
              className="select select-bordered w-full"
              value={formulaire.statut}
              onChange={(evenement) =>
                setFormulaire({
                  ...formulaire,
                  statut: evenement.target.value as StatutContrat,
                })
              }
            >
              <option value="ACTIF">Actif</option>
              <option value="TERMINE">Terminé</option>
              <option value="RESILIE">Résilié</option>
            </select>
          </Champ>

          <Champ libelle="Date de début">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaire.dateDebut}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, dateDebut: evenement.target.value })
              }
              required
            />
          </Champ>

          <Champ libelle="Date de fin (optionnelle)">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaire.dateFin}
              min={formulaire.dateDebut || undefined}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, dateFin: evenement.target.value })
              }
            />
          </Champ>

          <Champ libelle="Loyer mensuel (FCFA)">
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={formulaire.loyerMensuel}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, loyerMensuel: evenement.target.value })
              }
              required
            />
          </Champ>

          <Champ libelle="Caution (FCFA)">
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={formulaire.caution}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, caution: evenement.target.value })
              }
            />
          </Champ>

          

          <div className="sm:col-span-2">
            <Champ libelle="Clauses particulières (optionnel)">
              <textarea
                className="textarea textarea-bordered min-h-24 w-full"
                value={formulaire.clauses}
                onChange={(evenement) =>
                  setFormulaire({ ...formulaire, clauses: evenement.target.value })
                }
                placeholder="Ex. loyer payable le 5 de chaque mois, charges locatives incluses…"
              />
            </Champ>
          </div>

          {erreurFormulaire && (
            <p className="text-sm text-error sm:col-span-2" role="alert">
              {erreurFormulaire}
            </p>
          )}
        </form>
      </Modale>
    </div>
  );
};

export default Contrats;