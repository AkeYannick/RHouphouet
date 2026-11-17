import 'package:flutter/foundation.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:rmobile/core/session/signaux_app.dart';
import 'package:rmobile/core/utils/format.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/auth/model/user_model.dart';
import 'package:rmobile/features/historique/model/paiement_model.dart';

class AccueilViewModel extends ChangeNotifier {
  AccueilViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository() {
    SignauxApp.paiements.addListener(_surPaiementEnregistre);
    charger();
  }

  final EspaceLocataireRepository _repository;

  LocataireModel? _locataire;
  List<LoyerModel> _loyers = const [];
  List<PaiementModel> _paiements = const [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _sessionExpiree = false;

  LocataireModel? get locataire => _locataire;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get sessionExpiree => _sessionExpiree;

  List<PaiementModel> get derniersPaiements => _paiements.take(3).toList();

  /// Loyer du mois courant, sinon le plus récent connu.
  LoyerModel? get loyerCourant {
    final mois = moisCourant();
    for (final loyer in _loyers) {
      if (loyer.mois == mois) {
        return loyer;
      }
    }
    return _loyers.isNotEmpty ? _loyers.first : null;
  }

  void _surPaiementEnregistre() {
    charger(silencieux: true);
  }

  Future<void> charger({bool silencieux = false}) async {
    if (!silencieux) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final profil = await _repository.profil();
      final loyers = await _repository.loyers();
      final paiements = await _repository.paiements();

      _locataire = profil;
      _loyers = loyers;
      _paiements = paiements;
      _errorMessage = null;
      _sessionExpiree = false;
    } on ApiException catch (erreur) {
      _sessionExpiree = erreur.sessionExpiree;
      _errorMessage = erreur.sessionExpiree
          ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
          : erreur.message;
      if (erreur.sessionExpiree) {
        await SessionStore.effacer();
      }
    } catch (_) {
      _errorMessage = 'Impossible de charger vos informations. Réessayez.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    SignauxApp.paiements.removeListener(_surPaiementEnregistre);
    super.dispose();
  }
}
