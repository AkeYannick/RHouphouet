import 'package:flutter/foundation.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:rmobile/features/contrat/model/contrat_model.dart';

class ContratViewModel extends ChangeNotifier {
  ContratViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository() {
    charger();
  }

  final EspaceLocataireRepository _repository;

  ContratModel? _contrat;
  bool _isLoading = true;
  String? _errorMessage;
  bool _sessionExpiree = false;

  ContratModel? get contrat => _contrat;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get sessionExpiree => _sessionExpiree;

  Future<void> charger() async {
    _isLoading = true;
    notifyListeners();

    try {
      _contrat = await _repository.contrat();
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
      _errorMessage = 'Impossible de charger votre contrat. Réessayez.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
