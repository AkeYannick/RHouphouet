import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/auth/model/user_model.dart';
import 'package:rmobile/features/contrat/model/contrat_model.dart';
import 'package:rmobile/features/historique/model/paiement_model.dart';
import 'package:rmobile/features/messages/model/message_model.dart';

/// Point d'entrée unique vers l'API de l'espace locataire.
class EspaceLocataireRepository {
  EspaceLocataireRepository({ApiClient? client})
    : _client = client ?? ApiClient();

  final ApiClient _client;

  static const String _base = '/espace-locataire';

  /// Demande l'envoi d'un code à 6 chiffres.
  /// Renvoie le code de démonstration lorsque le serveur le fournit.
  Future<String?> demanderCode(String telephone) async {
    final reponse = await _client.post(
      '$_base/connexion',
      donnees: {'telephone': telephone},
    );

    if (reponse is Map) {
      return reponse['codeDemo']?.toString();
    }
    return null;
  }

  /// Vérifie le code, enregistre la session et renvoie le locataire connecté.
  Future<LocataireModel> verifierCode({
    required String telephone,
    required String code,
  }) async {
    final reponse = await _client.post(
      '$_base/verifier',
      donnees: {'telephone': telephone, 'code': code},
    );

    if (reponse is! Map) {
      throw const ApiException('Réponse inattendue du serveur.');
    }

    final jeton = reponse['jeton']?.toString();
    final locataireJson = reponse['locataire'];

    if (jeton == null || jeton.isEmpty || locataireJson is! Map) {
      throw const ApiException('Réponse inattendue du serveur.');
    }

    final locataire = Map<String, dynamic>.from(locataireJson);
    await SessionStore.enregistrer(jeton: jeton, locataire: locataire);

    return LocataireModel.fromJson(locataire);
  }

  Future<LocataireModel> profil() async {
    final reponse = await _authentifie(() => _client.get('$_base/moi'));

    if (reponse is! Map) {
      throw const ApiException('Profil indisponible.');
    }

    return LocataireModel.fromJson(Map<String, dynamic>.from(reponse));
  }

  Future<List<LoyerModel>> loyers() async {
    final reponse = await _authentifie(() => _client.get('$_base/loyers'));

    if (reponse is! List) {
      return const [];
    }

    return reponse
        .whereType<Map>()
        .map((json) => LoyerModel.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }

  Future<List<PaiementModel>> paiements() async {
    final reponse = await _authentifie(() => _client.get('$_base/paiements'));

    if (reponse is! List) {
      return const [];
    }

    return reponse
        .whereType<Map>()
        .map((json) => PaiementModel.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }

  Future<LoyerModel> payer({
    required String mois,
    required int montant,
    String? modePaiement,
    String? note,
  }) async {
    final reponse = await _authentifie(
      () => _client.post(
        '$_base/paiements',
        donnees: {
          'mois': mois,
          'montant': montant,
          'modePaiement': ?modePaiement,
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
        },
      ),
    );

    if (reponse is! Map) {
      throw const ApiException('Paiement enregistré mais réponse inattendue.');
    }

    return LoyerModel.fromJson(Map<String, dynamic>.from(reponse));
  }

  Future<ContratModel?> contrat() async {
    final reponse = await _authentifie(() => _client.get('$_base/contrat'));

    if (reponse is! Map) {
      return null;
    }

    return ContratModel.fromJson(Map<String, dynamic>.from(reponse));
  }

  /// PDF du contrat actif, généré par le serveur.
  Future<List<int>> telechargerContratPdf() {
    return _authentifie(() => _client.getOctets('$_base/contrat/pdf'));
  }

  Future<List<MessageModel>> messages() async {
    final reponse = await _authentifie(() => _client.get('$_base/messages'));
    final liste = reponse is Map ? reponse['messages'] : reponse;

    if (liste is! List) {
      return const [];
    }

    return liste
        .whereType<Map>()
        .map((json) => MessageModel.fromJson(Map<String, dynamic>.from(json)))
        .toList();
  }

  Future<MessageModel> envoyerMessage(String contenu) async {
    final reponse = await _authentifie(
      () => _client.post('$_base/messages', donnees: {'contenu': contenu}),
    );

    if (reponse is! Map) {
      throw const ApiException('Message envoyé mais réponse inattendue.');
    }

    return MessageModel.fromJson(Map<String, dynamic>.from(reponse));
  }

  Future<void> deconnexion() async {
    try {
      await _client.post('$_base/deconnexion');
    } catch (_) {
      // La session locale est effacée même si le serveur est injoignable.
    } finally {
      await SessionStore.effacer();
    }
  }

  /// Efface la session si le jeton n'est plus valide côté serveur.
  Future<T> _authentifie<T>(Future<T> Function() action) async {
    try {
      return await action();
    } on ApiException catch (erreur) {
      if (erreur.sessionExpiree) {
        await SessionStore.effacer();
      }
      rethrow;
    }
  }
}
