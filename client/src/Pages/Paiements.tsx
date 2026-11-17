import {
  Banknote,
  CircleAlert,
  Plus,
  ReceiptText,
  Trash2,
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
import type {
  DonneesPaiementLocataire,
  Locataire,
  Loyer,
  ModePaiement,
  Paiement,
} from '../types';
import {
  dateDuJour,
  formaterDate,
  formaterMontant,
  formaterMois,
  moisActuel,
} from '../utils/format';
import { LIBELLES_MODE_PAIEMENT } from '../utils/libelles';

interface FormulairePaiement {
  locataireId: string;
  mois: string;
  montant: string;
  modePaiement: ModePaiement;
  datePaiement: string;
  note: string;
}

function formulaireVide(): FormulairePaiement {
  return {
    locataireId: '',
    mois: moisActuel(),
    montant: '',
    modePaiement: 'MOBILE_MONEY',
    datePaiement: dateDuJour(),
    note: '',
  };
}

const Paiements = () => {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [locataires, setLocataires] = useState<Locataire[]>([]);
  const [loyers, setLoyers] = useState<Loyer[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [moisFiltre, setMoisFiltre] = useState('');
  const [locataireFiltre, setLocataireFiltre] = useState('');
  const { message, afficherMessage } = useMessageFlash();

  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [formulaire, setFormulaire] = useState<FormulairePaiement>(formulaireVide);
  const [erreurFormulaire, setErreurFormulaire] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const charger = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const [listePaiements, listeLocataires, listeLoyers] = await Promise.all([
        api.paiements.lister(),
        api.locataires.lister(),
        api.loyers.lister(),
      ]);
      setPaiements(listePaiements);
      setLocataires(listeLocataires);
      setLoyers(listeLoyers);
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

  const paiementsFiltres = useMemo(
    () =>
      paiements.filter((paiement) => {
        if (moisFiltre && paiement.loyer?.mois !== moisFiltre) {
          return false;
        }

        if (locataireFiltre && paiement.locataireId !== locataireFiltre) {
          return false;
        }

        return true;
      }),
    [paiements, moisFiltre, locataireFiltre],
  );

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

  const totalEncaisse = paiementsFiltres.reduce(
    (total, paiement) => total + paiement.montant,
    0,
  );
  const resteAPercevoir = loyersPeriode.reduce(
    (total, loyer) => total + Math.max(loyer.montantDu - loyer.montantRecu, 0),
    0,
  );

  const loyerDuFormulaire = useMemo(
    () =>
      loyers.find(
        (loyer) =>
          loyer.locataireId === formulaire.locataireId && loyer.mois === formulaire.mois,
      ) ?? null,
    [loyers, formulaire.locataireId, formulaire.mois],
  );

  const resteDuFormulaire = loyerDuFormulaire
    ? Math.max(loyerDuFormulaire.montantDu - loyerDuFormulaire.montantRecu, 0)
    : 0;

  const ouvrirModale = () => {
    setFormulaire(formulaireVide());
    setErreurFormulaire(null);
    setModaleOuverte(true);
  };

  const choisirLocataire = (locataireId: string) => {
    const locataire = locataires.find((element) => element.id === locataireId);
    const loyer = loyers.find(
      (element) => element.locataireId === locataireId && element.mois === formulaire.mois,
    );
    const montant = loyer
      ? Math.max(loyer.montantDu - loyer.montantRecu, 0)
      : (locataire?.loyerMensuel ?? 0);

    setFormulaire((precedent) => ({
      ...precedent,
      locataireId,
      montant: montant > 0 ? String(montant) : '',
    }));
  };

  const enregistrer = async (evenement: FormEvent) => {
    evenement.preventDefault();

    if (!formulaire.locataireId) {
      setErreurFormulaire('Veuillez sélectionner un locataire');
      return;
    }

    if (!formulaire.mois) {
      setErreurFormulaire('Veuillez sélectionner le mois concerné');
      return;
    }

    const montant = Number(formulaire.montant);

    if (!Number.isFinite(montant) || montant <= 0) {
      setErreurFormulaire('Le montant doit être supérieur à zéro');
      return;
    }

    if (loyerDuFormulaire && montant > resteDuFormulaire) {
      setErreurFormulaire(
        `Le montant dépasse le reste à payer (${formaterMontant(resteDuFormulaire)})`,
      );
      return;
    }

    const donnees: DonneesPaiementLocataire = {
      locataireId: formulaire.locataireId,
      mois: formulaire.mois,
      montant,
      modePaiement: formulaire.modePaiement,
      datePaiement: formulaire.datePaiement || dateDuJour(),
      note: formulaire.note.trim() || undefined,
    };

    setEnregistrement(true);

    try {
      await api.paiements.creer(donnees);
      afficherMessage('Paiement enregistré avec succès');
      setModaleOuverte(false);
      await charger(true);
    } catch (probleme) {
      setErreurFormulaire((probleme as Error).message);
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (paiement: Paiement) => {
    if (
      !window.confirm(
        `Supprimer le paiement de ${formaterMontant(paiement.montant)} de ${
          paiement.locataire?.nom ?? 'ce locataire'
        } ?`,
      )
    ) {
      return;
    }

    try {
      await api.paiements.supprimer(paiement.id);
      afficherMessage('Paiement supprimé');
      await charger(true);
    } catch (probleme) {
      setErreur((probleme as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <EnTetePage
        titre="Paiements"
        description="Enregistrez les versements des locataires et suivez les encaissements."
        actions={
          <button type="button" onClick={ouvrirModale} className="btn btn-primary btn-sm gap-2">
            <Plus size={16} />
            Enregistrer un paiement
          </button>
        }
      />

      {message && <BandeauSucces message={message} />}
      {erreur && <BandeauErreur message={erreur} onReessayer={() => void charger()} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <CarteStatistique
          libelle="Total encaissé"
          valeur={formaterMontant(totalEncaisse)}
          detail={`${paiementsFiltres.length} versement(s)`}
          icone={Banknote}
          ton="succes"
        />
        <CarteStatistique
          libelle="Reste à percevoir"
          valeur={formaterMontant(resteAPercevoir)}
          detail={moisFiltre ? formaterMois(moisFiltre) : 'Tous les mois'}
          icone={CircleAlert}
          ton={resteAPercevoir > 0 ? 'alerte' : 'succes'}
        />
        <CarteStatistique
          libelle="Locataires suivis"
          valeur={String(
            new Set(paiementsFiltres.map((paiement) => paiement.locataireId)).size,
          )}
          detail="Ayant effectué un versement"
          icone={ReceiptText}
        />
      </div>

      <section className="card border border-base-300/70 bg-base-100 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-base-300/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              aria-label="Filtrer par mois"
              className="input input-bordered input-sm w-40"
              value={moisFiltre}
              onChange={(evenement) => setMoisFiltre(evenement.target.value)}
            />

            <select
              aria-label="Filtrer par locataire"
              className="select select-bordered select-sm w-52"
              value={locataireFiltre}
              onChange={(evenement) => setLocataireFiltre(evenement.target.value)}
            >
              <option value="">Tous les locataires</option>
              {locataires.map((locataire) => (
                <option key={locataire.id} value={locataire.id}>
                  {locataire.nom}
                </option>
              ))}
            </select>

            {(moisFiltre || locataireFiltre) && (
              <button
                type="button"
                onClick={() => {
                  setMoisFiltre('');
                  setLocataireFiltre('');
                }}
                className="btn btn-ghost btn-xs gap-1"
              >
                <X size={12} />
                Réinitialiser
              </button>
            )}
          </div>

          <p className="text-xs text-base-content/50">
            {paiementsFiltres.length} paiement(s) sur {paiements.length}
          </p>
        </div>

        {chargement ? (
          <div className="p-6">
            <Chargement texte="Chargement des paiements…" />
          </div>
        ) : paiementsFiltres.length === 0 ? (
          <EtatVide
            icone={ReceiptText}
            titre="Aucun paiement trouvé"
            description="Modifiez les filtres ou enregistrez un nouveau versement."
            action={
              <button type="button" onClick={ouvrirModale} className="btn btn-primary btn-sm">
                Enregistrer un paiement
              </button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Locataire</th>
                    <th>Appartement</th>
                    <th>Mois</th>
                    <th>Montant</th>
                    <th>Mode</th>
                    <th>Référence</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsFiltres.map((paiement) => (
                    <tr key={paiement.id} className="hover">
                      <td className="whitespace-nowrap">
                        {formaterDate(paiement.datePaiement)}
                      </td>
                      <td>{paiement.locataire?.nom ?? '—'}</td>
                      <td>{paiement.locataire?.appartement?.numero ?? '—'}</td>
                      <td className="whitespace-nowrap capitalize">
                        {paiement.loyer ? formaterMois(paiement.loyer.mois) : '—'}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-success">
                        {formaterMontant(paiement.montant)}
                      </td>
                      <td>{LIBELLES_MODE_PAIEMENT[paiement.modePaiement]}</td>
                      <td className="whitespace-nowrap font-mono text-xs text-base-content/60">
                        {paiement.reference}
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void supprimer(paiement)}
                            className="btn btn-ghost btn-sm btn-square text-error"
                            aria-label="Supprimer le paiement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {paiementsFiltres.map((paiement) => (
                <article
                  key={paiement.id}
                  className="rounded-xl border border-base-300/70 bg-base-100 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {paiement.locataire?.nom ?? '—'}
                      </p>
                      <p className="text-xs text-base-content/55">
                        {paiement.locataire?.appartement?.numero ?? 'Sans appartement'} ·{' '}
                        {paiement.loyer ? formaterMois(paiement.loyer.mois) : '—'}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-success">
                      {formaterMontant(paiement.montant)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-base-300/60 pt-2">
                    <span className="text-xs text-base-content/50">
                      {formaterDate(paiement.datePaiement)} ·{' '}
                      {LIBELLES_MODE_PAIEMENT[paiement.modePaiement]}
                    </span>
                    <button
                      type="button"
                      onClick={() => void supprimer(paiement)}
                      className="btn btn-ghost btn-xs btn-square text-error"
                      aria-label="Supprimer le paiement"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <Modale
        ouvert={modaleOuverte}
        titre="Enregistrer un paiement"
        description="Le versement met à jour le loyer du mois concerné."
        onFermer={() => setModaleOuverte(false)}
        taille="lg"
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
              form="formulaire-paiement-locataire"
              className="btn btn-primary"
              disabled={enregistrement}
            >
              {enregistrement ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <form
          id="formulaire-paiement-locataire"
          onSubmit={(evenement) => void enregistrer(evenement)}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Champ libelle="Locataire">
              <select
                className="select select-bordered w-full"
                value={formulaire.locataireId}
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
              value={formulaire.mois}
              onChange={(evenement) => {
                const mois = evenement.target.value;
                const loyer = loyers.find(
                  (element) =>
                    element.locataireId === formulaire.locataireId && element.mois === mois,
                );
                setFormulaire((precedent) => ({
                  ...precedent,
                  mois,
                  montant: loyer
                    ? String(Math.max(loyer.montantDu - loyer.montantRecu, 0))
                    : precedent.montant,
                }));
              }}
              required
            />
          </Champ>

          <Champ libelle="Date du versement">
            <input
              type="date"
              className="input input-bordered w-full"
              value={formulaire.datePaiement}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, datePaiement: evenement.target.value })
              }
            />
          </Champ>

          <Champ libelle="Montant versé (FCFA)">
            <input
              type="number"
              min={1}
              className="input input-bordered w-full"
              value={formulaire.montant}
              onChange={(evenement) =>
                setFormulaire({ ...formulaire, montant: evenement.target.value })
              }
              required
            />
          </Champ>

          <Champ libelle="Mode de paiement">
            <select
              className="select select-bordered w-full"
              value={formulaire.modePaiement}
              onChange={(evenement) =>
                setFormulaire({
                  ...formulaire,
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

          <div className="sm:col-span-2">
            <Champ libelle="Note (optionnelle)">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Ex. reçu Mobile Money n°…"
                value={formulaire.note}
                onChange={(evenement) =>
                  setFormulaire({ ...formulaire, note: evenement.target.value })
                }
              />
            </Champ>
          </div>

          {formulaire.locataireId && formulaire.mois && (
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-base-200/70 p-3 text-sm sm:col-span-2">
              <div>
                <p className="text-xs text-base-content/50">Loyer du mois</p>
                <p className="font-semibold">
                  {loyerDuFormulaire ? formaterMontant(loyerDuFormulaire.montantDu) : 'À créer'}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Déjà reçu</p>
                <p className="font-semibold text-success">
                  {formaterMontant(loyerDuFormulaire?.montantRecu ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/50">Reste</p>
                <p className="font-semibold text-error">
                  {loyerDuFormulaire ? formaterMontant(resteDuFormulaire) : '—'}
                </p>
              </div>
            </div>
          )}

          {erreurFormulaire && (
            <p className="text-sm text-error sm:col-span-2">{erreurFormulaire}</p>
          )}
        </form>
      </Modale>
    </div>
  );
};

export default Paiements;
