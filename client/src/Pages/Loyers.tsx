import {
  CalendarPlus,
  CircleAlert,
  CreditCard,
  Plus,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeStatutLoyer } from '../components/ui/Badges';
import { BandeauErreur, BandeauSucces } from '../components/ui/BandeauErreur';
import { CarteStatistique } from '../components/ui/CarteStatistique';
import { Champ } from '../components/ui/Champ';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { Modale } from '../components/ui/Modale';
import { useMessageFlash } from '../hooks/useMessageFlash';
import { api } from '../services/api';
import type { DonneesLoyer, Locataire, Loyer, ModePaiement, StatutLoyer } from '../types';
import {
  dateDuJour,
  formaterDate,
  formaterMontant,
  formaterMois,
  moisActuel,
} from '../utils/format';
import { LIBELLES_MODE_PAIEMENT } from '../utils/libelles';

type FiltreStatut = 'TOUS' | StatutLoyer;

interface FormulaireLoyer {
  locataireId: string;
  montantDu: string;
  mois: string;
  dateEcheance: string;
  montantRecu: string;
  modePaiement: ModePaiement;
  datePaiement: string;
}

interface FormulairePaiement {
  montantRecu: string;
  modePaiement: ModePaiement;
  datePaiement: string;
}

function formulaireLoyerVide(): FormulaireLoyer {
  const mois = moisActuel();

  return {
    locataireId: '',
    montantDu: '',
    mois,
    dateEcheance: `${mois}-05`,
    montantRecu: '0',
    modePaiement: 'ESPECES',
    datePaiement: dateDuJour(),
  };
}

const ONGLETS: Array<{ cle: FiltreStatut; libelle: string }> = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'PAYE', libelle: 'Payés' },
  { cle: 'PARTIEL', libelle: 'Partiels' },
  { cle: 'EN_ATTENTE', libelle: 'En attente' },
  { cle: 'EN_RETARD', libelle: 'En retard' },
];

const Loyers = () => {
  const [parametres, setParametres] = useSearchParams();
  const locataireFiltre = parametres.get('locataire');

  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>('TOUS');
  const [moisFiltre, setMoisFiltre] = useState('');
  const { message, afficherMessage } = useMessageFlash();

  const [modaleLoyer, setModaleLoyer] = useState(false);
  const [formulaireLoyer, setFormulaireLoyer] = useState<FormulaireLoyer>(formulaireLoyerVide);
  const [erreurLoyer, setErreurLoyer] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const [loyerAPayer, setLoyerAPayer] = useState<Loyer | null>(null);
  const [formulairePaiement, setFormulairePaiement] = useState<FormulairePaiement>({
    montantRecu: '',
    modePaiement: 'ESPECES',
    datePaiement: dateDuJour(),
  });
  const [erreurPaiement, setErreurPaiement] = useState<string | null>(null);
  const [encaissement, setEncaissement] = useState(false);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const [listeLoyers, listeLocataires] = await Promise.all([
        api.loyers.lister(),
        api.locataires.lister(),
      ]);
      setLoyers(listeLoyers);
      setLocataires(listeLocataires);
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

  const loyersPeriode = useMemo(
    () =>
      loyers.filter((loyer) => {
        if (moisFiltre && loyer.mois !== moisFiltre) {
          return false;
        }

        if (locataireFiltre && loyer.locataireId !== locataireFiltre) {
          return false;
        }

        return true;
      }),
    [loyers, moisFiltre, locataireFiltre],
  );

  const loyersFiltres = useMemo(
    () =>
      filtreStatut === 'TOUS'
        ? loyersPeriode
        : loyersPeriode.filter((loyer) => loyer.statut === filtreStatut),
    [loyersPeriode, filtreStatut],
  );

  const totalDu = loyersFiltres.reduce((total, loyer) => total + loyer.montantDu, 0);
  const totalRecu = loyersFiltres.reduce((total, loyer) => total + loyer.montantRecu, 0);
  const resteAPercevoir = Math.max(totalDu - totalRecu, 0);

  const nomLocataireFiltre = locataires.find(
    (locataire) => locataire.id === locataireFiltre,
  )?.nom;

  const effacerFiltreLocataire = () => {
    const suivants = new URLSearchParams(parametres);
    suivants.delete('locataire');
    setParametres(suivants, { replace: true });
  };

  const ouvrirModalLoyer = () => {
    setFormulaireLoyer(formulaireLoyerVide());
    setErreurLoyer(null);
    setModaleLoyer(true);
  };

  const choisirLocataire = (locataireId: string) => {
    const locataire = locataires.find((element) => element.id === locataireId);
    setFormulaireLoyer((precedent) => ({
      ...precedent,
      locataireId,
      montantDu: precedent.montantDu || String(locataire?.loyerMensuel ?? ''),
    }));
  };

  const enregistrerLoyer = async (evenement: FormEvent) => {
    evenement.preventDefault();

    if (!formulaireLoyer.locataireId) {
      setErreurLoyer('Veuillez sélectionner un locataire');
      return;
    }

    if (!formulaireLoyer.mois) {
      setErreurLoyer('Veuillez sélectionner le mois concerné');
      return;
    }

    const montantRecu = Number(formulaireLoyer.montantRecu) || 0;
    const donnees: DonneesLoyer = {
      locataireId: formulaireLoyer.locataireId,
      montantDu: formulaireLoyer.montantDu ? Number(formulaireLoyer.montantDu) : undefined,
      mois: formulaireLoyer.mois,
      dateEcheance: formulaireLoyer.dateEcheance || undefined,
      montantRecu,
      modePaiement: formulaireLoyer.modePaiement,
      datePaiement:
        montantRecu > 0 ? formulaireLoyer.datePaiement || dateDuJour() : undefined,
    };

    setEnregistrement(true);

    try {
      await api.loyers.creer(donnees);
      afficherMessage('Loyer enregistré avec succès');
      setModaleLoyer(false);
      await charger(true);
    } catch (probleme) {
      setErreurLoyer((probleme as Error).message);
    } finally {
      setEnregistrement(false);
    }
  };

  const ouvrirPaiement = (loyer: Loyer) => {
    setLoyerAPayer(loyer);
    setFormulairePaiement({
      montantRecu: String(Math.max(loyer.montantDu - loyer.montantRecu, 0)),
      modePaiement: loyer.modePaiement,
      datePaiement: dateDuJour(),
    });
    setErreurPaiement(null);
  };

  const encaisser = async (evenement: FormEvent) => {
    evenement.preventDefault();

    if (!loyerAPayer) {
      return;
    }

    const montantRecu = Number(formulairePaiement.montantRecu);

    if (!Number.isFinite(montantRecu) || montantRecu <= 0) {
      setErreurPaiement('Le montant encaissé doit être supérieur à zéro');
      return;
    }

    setEncaissement(true);

    try {
      await api.loyers.payer(loyerAPayer.id, {
        montantRecu,
        modePaiement: formulairePaiement.modePaiement,
        datePaiement: formulairePaiement.datePaiement || undefined,
      });
      afficherMessage('Paiement enregistré avec succès');
      setLoyerAPayer(null);
      await charger(true);
    } catch (probleme) {
      setErreurPaiement((probleme as Error).message);
    } finally {
      setEncaissement(false);
    }
  };

  const genererLoyers = async () => {
    const mois = moisActuel();

    if (
      !window.confirm(
        `Générer les loyers de ${formaterMois(mois)} pour tous les locataires actifs ?`,
      )
    ) {
      return;
    }

    try {
      const resultat = await api.loyers.generer(mois);
      afficherMessage(
        `${resultat.crees} loyer(s) créé(s) pour ${formaterMois(resultat.mois)}, ${resultat.ignores} déjà existant(s).`,
      );
      await charger(true);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    }
  };

  const supprimerLoyer = async (loyer: Loyer) => {
    if (
      !window.confirm(
        `Supprimer le loyer de ${loyer.locataire?.nom ?? 'ce locataire'} pour ${formaterMois(loyer.mois)} ?`,
      )
    ) {
      return;
    }

    try {
      await api.loyers.supprimer(loyer.id);
      afficherMessage('Loyer supprimé');
      await charger(true);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    }
  };

  const resteDuLoyer = loyerAPayer
    ? Math.max(loyerAPayer.montantDu - loyerAPayer.montantRecu, 0)
    : 0;

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Gestion des loyers"
        description="Enregistrez les paiements, suivez les impayés et générez les loyers du mois."
        actions={
          <>
            <button
              type="button"
              onClick={() => void genererLoyers()}
              className="btn btn-ghost btn-sm gap-2"
            >
              <CalendarPlus size={16} />
              Générer le mois
            </button>
            <button
              type="button"
              onClick={ouvrirModalLoyer}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus size={16} />
              Enregistrer un loyer
            </button>
          </>
        }
      />

      {message && <BandeauSucces message={message} />}
      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStatistique
          libelle="Total dû"
          valeur={formaterMontant(totalDu)}
          detail={`${loyersFiltres.length} loyer(s) affiché(s)`}
          icone={Wallet}
        />
        <CarteStatistique
          libelle="Total encaissé"
          valeur={formaterMontant(totalRecu)}
          detail={
            totalDu > 0 ? `${Math.round((totalRecu / totalDu) * 100)} % recouvré` : 'Aucun loyer'
          }
          icone={CreditCard}
          ton="succes"
        />
        <CarteStatistique
          libelle="Reste à percevoir"
          valeur={formaterMontant(resteAPercevoir)}
          detail="Sur la sélection affichée"
          icone={CircleAlert}
          ton={resteAPercevoir > 0 ? 'alerte' : 'succes'}
        />
      </div>

      <section className="card border border-base-300/70 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-base-300/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {ONGLETS.map((onglet) => {
              const nombre =
                onglet.cle === 'TOUS'
                  ? loyersPeriode.length
                  : loyersPeriode.filter((loyer) => loyer.statut === onglet.cle).length;

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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="month"
                aria-label="Filtrer par mois"
                className="input input-bordered input-sm w-40"
                value={moisFiltre}
                onChange={(evenement) => setMoisFiltre(evenement.target.value)}
              />

              {moisFiltre && (
                <button
                  type="button"
                  onClick={() => setMoisFiltre('')}
                  className="btn btn-ghost btn-xs"
                >
                  Tous les mois
                </button>
              )}

              {locataireFiltre && (
                <span className="badge badge-primary badge-outline gap-1 py-2.5">
                  {nomLocataireFiltre ?? 'Locataire'}
                  <button
                    type="button"
                    onClick={effacerFiltreLocataire}
                    aria-label="Retirer le filtre locataire"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>

            <p className="text-xs text-base-content/50">
              {loyersFiltres.length} loyer(s) sur {loyers.length}
            </p>
          </div>
        </div>

        {chargement ? (
          <div className="p-6">
            <Chargement texte="Chargement des loyers…" />
          </div>
        ) : loyersFiltres.length === 0 ? (
          <EtatVide
            icone={Wallet}
            titre="Aucun loyer trouvé"
            description="Modifiez les filtres ou enregistrez un nouveau loyer."
            action={
              <button type="button" onClick={ouvrirModalLoyer} className="btn btn-primary btn-sm">
                Enregistrer un loyer
              </button>
            }
          />
        ) : (
          <>
            {/* Vue tableau sur écran moyen et grand */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Locataire</th>
                    <th>Appartement</th>
                    <th>Montant dû</th>
                    <th>Reçu</th>
                    <th>Reste</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loyersFiltres.map((loyer) => {
                    const reste = Math.max(loyer.montantDu - loyer.montantRecu, 0);

                    return (
                      <tr key={loyer.id} className="hover">
                        <td className="whitespace-nowrap font-medium capitalize">
                          {formaterMois(loyer.mois)}
                        </td>
                        <td>{loyer.locataire?.nom ?? '—'}</td>
                        <td>{loyer.locataire?.appartement?.numero ?? '—'}</td>
                        <td className="whitespace-nowrap">{formaterMontant(loyer.montantDu)}</td>
                        <td className="whitespace-nowrap text-success">
                          {formaterMontant(loyer.montantRecu)}
                        </td>
                        <td className="whitespace-nowrap font-medium text-error">
                          {formaterMontant(reste)}
                        </td>
                        <td className="whitespace-nowrap">{formaterDate(loyer.dateEcheance)}</td>
                        <td>
                          <BadgeStatutLoyer statut={loyer.statut} />
                        </td>
                        <td>
                          <div className="flex justify-end gap-1">
                            {loyer.statut !== 'PAYE' && (
                              <button
                                type="button"
                                onClick={() => ouvrirPaiement(loyer)}
                                className="btn btn-ghost btn-sm gap-1 text-primary"
                              >
                                <CreditCard size={14} />
                                Encaisser
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void supprimerLoyer(loyer)}
                              className="btn btn-ghost btn-sm btn-square text-error"
                              aria-label="Supprimer le loyer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vue cartes sur mobile */}
            <div className="grid gap-3 p-4 md:hidden">
              {loyersFiltres.map((loyer) => {
                const reste = Math.max(loyer.montantDu - loyer.montantRecu, 0);
                const progression =
                  loyer.montantDu > 0
                    ? Math.min(Math.round((loyer.montantRecu / loyer.montantDu) * 100), 100)
                    : 0;

                return (
                  <article
                    key={loyer.id}
                    className="rounded-xl border border-base-300/70 bg-base-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-base-content/45">
                          {formaterMois(loyer.mois)}
                        </p>
                        <p className="truncate font-semibold">{loyer.locataire?.nom ?? '—'}</p>
                        <p className="text-xs text-base-content/55">
                          {loyer.locataire?.appartement?.numero ?? 'Sans appartement'}
                        </p>
                      </div>
                      <BadgeStatutLoyer statut={loyer.statut} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-base-content/45">Dû</p>
                        <p className="font-medium">{formaterMontant(loyer.montantDu)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/45">Reçu</p>
                        <p className="font-medium text-success">{formaterMontant(loyer.montantRecu)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/45">Reste</p>
                        <p className="font-medium text-error">{formaterMontant(reste)}</p>
                      </div>
                    </div>

                    <progress
                      className={`progress mt-3 w-full ${
                        loyer.statut === 'PAYE' ? 'progress-success' : 'progress-primary'
                      }`}
                      value={progression}
                      max={100}
                    />

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-base-300/60 pt-2">
                      <span className="text-xs text-base-content/45">
                        Échéance : {formaterDate(loyer.dateEcheance)}
                      </span>
                      <div className="flex gap-1">
                        {loyer.statut !== 'PAYE' && (
                          <button
                            type="button"
                            onClick={() => ouvrirPaiement(loyer)}
                            className="btn btn-primary btn-xs gap-1"
                          >
                            <CreditCard size={13} />
                            Encaisser
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void supprimerLoyer(loyer)}
                          className="btn btn-ghost btn-xs btn-square text-error"
                          aria-label="Supprimer le loyer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Modale
        ouvert={modaleLoyer}
        titre="Enregistrer un loyer"
        description="Le statut est calculé automatiquement selon le montant reçu."
        onFermer={() => setModaleLoyer(false)}
        taille="lg"
        pied={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModaleLoyer(false)}>
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-loyer"
              className="btn btn-primary"
              disabled={enregistrement}
            >
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form
          id="formulaire-loyer"
          onSubmit={(evenement) => void enregistrerLoyer(evenement)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Champ libelle="Locataire">
              <select
                className="select select-bordered w-full"
                value={formulaireLoyer.locataireId}
                onChange={(evenement) => choisirLocataire(evenement.target.value)}
                required
              >
                <option value="">— Choisir un locataire —</option>
                {locataires.map((locataire) => (
                  <option key={locataire.id} value={locataire.id}>
                    {locataire.appartement?.numero ?? 'Sans appartement'} — {locataire.nom}
                  </option>
                ))}
              </select>
            </Champ>
          </div>

          <Champ libelle="Mois concerné">
            <input
              type="month"
              className="input input-bordered w-full"
              value={formulaireLoyer.mois}
              onChange={(evenement) =>
                setFormulaireLoyer({ ...formulaireLoyer, mois: evenement.target.value })
              }
              required
            />
          </Champ>

          <Champ libelle="Date d'échéance">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaireLoyer.dateEcheance}
              onChange={(evenement) =>
                setFormulaireLoyer({ ...formulaireLoyer, dateEcheance: evenement.target.value })
              }
            />
          </Champ>

          <Champ libelle="Montant dû (FCFA)">
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={formulaireLoyer.montantDu}
              onChange={(evenement) =>
                setFormulaireLoyer({ ...formulaireLoyer, montantDu: evenement.target.value })
              }
              placeholder="Ex. 150000"
            />
          </Champ>

          <Champ libelle="Montant reçu (FCFA)">
            <input
              type="number"
              min={0}
              className="input input-bordered w-full"
              value={formulaireLoyer.montantRecu}
              onChange={(evenement) =>
                setFormulaireLoyer({ ...formulaireLoyer, montantRecu: evenement.target.value })
              }
            />
          </Champ>

          <Champ libelle="Mode de paiement">
            <select
              className="select select-bordered w-full"
              value={formulaireLoyer.modePaiement}
              onChange={(evenement) =>
                setFormulaireLoyer({
                  ...formulaireLoyer,
                  modePaiement: evenement.target.value as ModePaiement,
                })
              }
            >
              {Object.entries(LIBELLES_MODE_PAIEMENT).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
          </Champ>

          <Champ libelle="Date de paiement">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaireLoyer.datePaiement}
              onChange={(evenement) =>
                setFormulaireLoyer({ ...formulaireLoyer, datePaiement: evenement.target.value })
              }
            />
          </Champ>

          {erreurLoyer && <p className="text-sm text-error sm:col-span-2">{erreurLoyer}</p>}
        </form>
      </Modale>

      <Modale
        ouvert={Boolean(loyerAPayer)}
        titre="Encaisser un paiement"
        description={
          loyerAPayer
            ? `${loyerAPayer.locataire?.nom ?? 'Locataire'} — ${formaterMois(loyerAPayer.mois)}`
            : undefined
        }
        onFermer={() => setLoyerAPayer(null)}
        pied={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setLoyerAPayer(null)}>
              Annuler
            </button>
            <button
              type="submit"
              form="formulaire-paiement"
              className="btn btn-primary"
              disabled={encaissement}
            >
              {encaissement ? 'Encaissement…' : 'Encaisser'}
            </button>
          </>
        }
      >
        {loyerAPayer && (
          <form
            id="formulaire-paiement"
            onSubmit={(evenement) => void encaisser(evenement)}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-base-200/70 p-3 text-sm">
              <div>
                <p className="text-xs text-base-content/50">Montant dû</p>
                <p className="font-semibold">{formaterMontant(loyerAPayer.montantDu)}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Déjà reçu</p>
                <p className="font-semibold text-success">
                  {formaterMontant(loyerAPayer.montantRecu)}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Reste</p>
                <p className="font-semibold text-error">{formaterMontant(resteDuLoyer)}</p>
              </div>
            </div>

            <Champ libelle="Montant encaissé maintenant (FCFA)">
              <input
                type="number"
                min={1}
                className="input input-bordered w-full"
                value={formulairePaiement.montantRecu}
                onChange={(evenement) =>
                  setFormulairePaiement({
                    ...formulairePaiement,
                    montantRecu: evenement.target.value,
                  })
                }
                required
              />
            </Champ>

            <div className="grid gap-4 sm:grid-cols-2">
              <Champ libelle="Mode de paiement">
                <select
                  className="select select-bordered w-full"
                  value={formulairePaiement.modePaiement}
                  onChange={(evenement) =>
                    setFormulairePaiement({
                      ...formulairePaiement,
                      modePaiement: evenement.target.value as ModePaiement,
                    })
                  }
                >
                  {Object.entries(LIBELLES_MODE_PAIEMENT).map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </Champ>

              <Champ libelle="Date de paiement">
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formulairePaiement.datePaiement}
                  onChange={(evenement) =>
                    setFormulairePaiement({
                      ...formulairePaiement,
                      datePaiement: evenement.target.value,
                    })
                  }
                />
              </Champ>
            </div>

            {erreurPaiement && <p className="text-sm text-error">{erreurPaiement}</p>}
          </form>
        )}
      </Modale>
    </div>
  );
};

export default Loyers;
