import {
  ArrowLeft,
  Check,
  CheckCheck,
  MessageSquare,
  Search,
  Send,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BandeauErreur } from '../components/ui/BandeauErreur';
import { Chargement } from '../components/ui/Chargement';
import { EnTetePage } from '../components/ui/EnTetePage';
import { EtatVide } from '../components/ui/EtatVide';
import { api } from '../services/api';
import type { Conversation, DetailConversation } from '../types';
import {
  formaterDateHeure,
  formaterDateRelative,
  formaterMontant,
  initiales,
} from '../utils/format';

const Messagerie = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [idActif, setIdActif] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailConversation | null>(null);
  const [recherche, setRecherche] = useState('');
  const [brouillon, setBrouillon] = useState('');
  const [chargement, setChargement] = useState(true);
  const [chargementMessages, setChargementMessages] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const zoneMessages = useRef<HTMLDivElement>(null);

  const chargerConversations = useCallback(async (silencieux = false) => {
    if (!silencieux) {
      setChargement(true);
    }

    try {
      const donnees = await api.messages.conversations();
      setConversations(donnees);
      setErreur(null);
    } catch (probleme) {
      if (!silencieux) {
        setErreur((probleme as Error).message);
      }
    } finally {
      if (!silencieux) {
        setChargement(false);
      }
    }
  }, []);

  const chargerMessages = useCallback(async (locataireId: string, silencieux = false) => {
    if (!silencieux) {
      setChargementMessages(true);
    }

    try {
      const donnees = await api.messages.listerParLocataire(locataireId);
      setDetail(donnees);
      setErreur(null);
      await api.messages.marquerLus(locataireId, 'ADMIN');
      setConversations((liste) =>
        liste.map((conversation) =>
          conversation.locataire.id === locataireId ? { ...conversation, nonLus: 0 } : conversation,
        ),
      );
    } catch (probleme) {
      if (!silencieux) {
        setErreur((probleme as Error).message);
      }
    } finally {
      if (!silencieux) {
        setChargementMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    void chargerConversations();
  }, [chargerConversations]);

  useEffect(() => {
    const intervalle = window.setInterval(() => {
      void chargerConversations(true);

      if (idActif) {
        void chargerMessages(idActif, true);
      }
    }, 15000);

    return () => window.clearInterval(intervalle);
  }, [chargerConversations, chargerMessages, idActif]);

  useEffect(() => {
    const zone = zoneMessages.current;

    if (zone) {
      zone.scrollTop = zone.scrollHeight;
    }
  }, [detail]);

  const conversationsFiltrees = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    if (!terme) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const { nom, telephone, appartement } = conversation.locataire;
      return (
        nom.toLowerCase().includes(terme) ||
        telephone.toLowerCase().includes(terme) ||
        (appartement?.numero ?? '').toLowerCase().includes(terme)
      );
    });
  }, [conversations, recherche]);

  const totalNonLus = useMemo(
    () => conversations.reduce((somme, conversation) => somme + conversation.nonLus, 0),
    [conversations],
  );

  const selectionner = (conversation: Conversation) => {
    setIdActif(conversation.locataire.id);
    setDetail(null);
    setErreurEnvoi(null);
    setBrouillon('');
    void chargerMessages(conversation.locataire.id);
  };

  const envoyerMessage = async (evenement: FormEvent<HTMLFormElement>) => {
    evenement.preventDefault();

    if (!idActif) {
      return;
    }

    const contenu = brouillon.trim();

    if (!contenu || envoi) {
      return;
    }

    setEnvoi(true);
    setErreurEnvoi(null);

    try {
      const message = await api.messages.envoyer({
        locataireId: idActif,
        expediteur: 'ADMIN',
        contenu,
      });
      setDetail((precedent) =>
        precedent ? { ...precedent, messages: [...precedent.messages, message] } : precedent,
      );
      setConversations((liste) =>
        liste.map((conversation) =>
          conversation.locataire.id === idActif
            ? { ...conversation, dernierMessage: message }
            : conversation,
        ),
      );
      setBrouillon('');
    } catch (probleme) {
      setErreurEnvoi((probleme as Error).message);
    } finally {
      setEnvoi(false);
    }
  };

  const fermerConversation = () => {
    setIdActif(null);
    setDetail(null);
    setErreurEnvoi(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <EnTetePage
        titre="Messagerie"
        description="Échangez directement avec vos locataires depuis l'espace de gestion."
        actions={
          totalNonLus > 0 ? (
            <span className="badge badge-error gap-1 border-0 text-white">
              <MessageSquare size={13} />
              {totalNonLus} message{totalNonLus > 1 ? 's' : ''} non lu{totalNonLus > 1 ? 's' : ''}
            </span>
          ) : undefined
        }
      />

      {erreur && <BandeauErreur message={erreur} onReessayer={() => void chargerConversations()} />}

      <div className="card overflow-hidden border border-base-300/70 bg-base-100 shadow-sm">
        <div className="grid h-[calc(100dvh-20rem)] min-h-[20rem] grid-cols-1 lg:h-[calc(100dvh-13rem)] lg:grid-cols-[340px_1fr]">
          <aside
            className={`${idActif ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-base-300/70 lg:border-r`}
          >
            <div className="border-b border-base-300/70 p-3">
              <label className="input input-bordered input-sm flex w-full items-center gap-2">
                <Search size={16} className="text-base-content/50" />
                <input
                  type="search"
                  className="grow text-sm"
                  placeholder="Rechercher un locataire…"
                  value={recherche}
                  onChange={(evenement) => setRecherche(evenement.target.value)}
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {chargement ? (
                <div className="p-4">
                  <Chargement texte="Chargement des conversations…" />
                </div>
              ) : conversationsFiltrees.length === 0 ? (
                <EtatVide
                  icone={MessageSquare}
                  titre="Aucune conversation"
                  description={
                    recherche
                      ? 'Aucun locataire ne correspond à votre recherche.'
                      : 'Les échanges avec vos locataires apparaîtront ici.'
                  }
                />
              ) : (
                <ul className="divide-y divide-base-300/50">
                  {conversationsFiltrees.map((conversation) => {
                    const actif = conversation.locataire.id === idActif;

                    return (
                      <li key={conversation.locataire.id}>
                        <button
                          type="button"
                          onClick={() => selectionner(conversation)}
                          className={`flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-base-200/70 ${
                            actif ? 'bg-primary/5' : ''
                          }`}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {initiales(conversation.locataire.nom)}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold text-base-content">
                                {conversation.locataire.nom}
                              </span>
                              {conversation.dernierMessage && (
                                <span className="shrink-0 text-[11px] text-base-content/45">
                                  {formaterDateRelative(conversation.dernierMessage.creeLe)}
                                </span>
                              )}
                            </span>

                            <span className="mt-0.5 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-base-content/60">
                                {conversation.dernierMessage
                                  ? `${
                                      conversation.dernierMessage.expediteur === 'ADMIN'
                                        ? 'Vous : '
                                        : ''
                                    }${conversation.dernierMessage.contenu}`
                                  : 'Aucun message pour le moment'}
                              </span>
                              {conversation.nonLus > 0 && (
                                <span className="badge badge-error badge-sm shrink-0 border-0 text-[10px] text-white">
                                  {conversation.nonLus}
                                </span>
                              )}
                            </span>

                            <span className="mt-1 block text-[11px] text-base-content/45">
                              {conversation.locataire.appartement
                                ? conversation.locataire.appartement.numero
                                : 'Sans appartement'}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section className={`${idActif ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col`}>
            {!idActif ? (
              <div className="grid flex-1 place-items-center p-6">
                <EtatVide
                  icone={MessageSquare}
                  titre="Sélectionnez une conversation"
                  description="Choisissez un locataire dans la liste pour consulter et envoyer des messages."
                />
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-base-300/70 px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    onClick={fermerConversation}
                    className="btn btn-ghost btn-circle btn-sm lg:hidden"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {detail ? initiales(detail.locataire.nom) : '…'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-base-content">
                      {detail?.locataire.nom ?? 'Conversation'}
                    </p>
                    <p className="truncate text-xs text-base-content/55">
                      {detail?.locataire.appartement
                        ? detail.locataire.appartement.numero
                        : 'Sans appartement'}
                      {detail ? ` · ${detail.locataire.telephone}` : ''}
                    </p>
                  </div>

                  {detail && (
                    <Link
                      to={`/Loyers?locataire=${detail.locataire.id}`}
                      className="btn btn-ghost btn-xs gap-1 sm:btn-sm"
                      title="Voir les loyers du locataire"
                    >
                      <Wallet size={16} />
                      <span className="hidden sm:inline">Loyers</span>
                    </Link>
                  )}
                </header>

                <div ref={zoneMessages} className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                  {chargementMessages ? (
                    <Chargement texte="Chargement des messages…" />
                  ) : !detail || detail.messages.length === 0 ? (
                    <EtatVide
                      icone={MessageSquare}
                      titre="Aucun message"
                      description={`Envoyez le premier message à ${
                        detail?.locataire.nom ?? 'ce locataire'
                      }.`}
                    />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {detail.messages.map((message) => {
                        const deAdmin = message.expediteur === 'ADMIN';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${deAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                                deAdmin
                                  ? 'rounded-br-md bg-primary text-primary-content'
                                  : 'rounded-bl-md bg-base-200 text-base-content'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
                              <span
                                className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                                  deAdmin ? 'text-primary-content/70' : 'text-base-content/45'
                                }`}
                              >
                                {formaterDateHeure(message.creeLe)}
                                {deAdmin &&
                                  (message.lu ? <CheckCheck size={12} /> : <Check size={12} />)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form
                  onSubmit={envoyerMessage}
                  className="border-t border-base-300/70 p-3 sm:p-4"
                >
                  {erreurEnvoi && <p className="mb-2 text-xs text-error">{erreurEnvoi}</p>}

                  <div className="flex items-end gap-2">
                    <textarea
                      className="textarea textarea-bordered max-h-32 min-h-11 w-full resize-none py-2 text-sm"
                      rows={1}
                      placeholder="Écrivez votre message…"
                      value={brouillon}
                      onChange={(evenement) => setBrouillon(evenement.target.value)}
                      onKeyDown={(evenement) => {
                        if (evenement.key === 'Enter' && !evenement.shiftKey) {
                          evenement.preventDefault();
                          evenement.currentTarget.form?.requestSubmit();
                        }
                      }}
                      disabled={envoi || chargementMessages}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-square"
                      disabled={envoi || !brouillon.trim() || chargementMessages}
                      aria-label="Envoyer le message"
                    >
                      {envoi ? (
                        <span className="loading loading-spinner loading-sm" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-base-content/40">
                    Entrée pour envoyer · Maj + Entrée pour aller à la ligne
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      </div>

      {detail && (
        <p className="text-center text-xs text-base-content/45">
          Loyer mensuel du locataire : {formaterMontant(detail.locataire.loyerMensuel)}
        </p>
      )}
    </div>
  );
};

export default Messagerie;
