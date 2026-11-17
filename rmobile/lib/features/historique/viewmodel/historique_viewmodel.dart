import 'package:flutter/foundation.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:rmobile/core/session/signaux_app.dart';
import 'package:rmobile/features/accueil/model/loyer_model.dart';
import 'package:rmobile/features/historique/model/paiement_model.dart';

class HistoriqueViewModel extends ChangeNotifier {
  HistoriqueViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository() {
    SignauxApp.paiements.addListener(_surPaiementEnregistre);
    charger();
  }

  final EspaceLocataireRepository _repository;

  int _onglet = 0;
  List<LoyerModel> _loyers = const [];
  List<PaiementModel> _paiements = const [];
  bool _isLoading = true;
  String? _errorMessage;
  bool _sessionExpiree = false;

  int get onglet => _onglet;
  List<LoyerModel> get loyers => _loyers;
  List<PaiementModel> get paiements => _paiements;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get sessionExpiree => _sessionExpiree;

  void changerOnglet(int index) {
    if (_onglet == index) return;
    _onglet = index;
    notifyListeners();
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
      final loyers = await _repository.loyers();
      final paiements = await _repository.paiements();

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
      _errorMessage = 'Impossible de charger votre historique. Réessayez.';
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
