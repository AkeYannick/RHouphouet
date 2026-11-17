import 'package:flutter/foundation.dart';
import 'package:rmobile/core/data/espace_locataire_repository.dart';
import 'package:rmobile/core/network/api_client.dart';
import 'package:rmobile/features/auth/model/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ProfilViewModel extends ChangeNotifier {
  ProfilViewModel({EspaceLocataireRepository? repository})
    : _repository = repository ?? EspaceLocataireRepository() {
    chargerProfil();
  }

  final EspaceLocataireRepository _repository;

  LocataireModel? _locataire;
  bool _isLoading = true;
  bool _deconnexionEnCours = false;
  String? _errorMessage;

  LocataireModel? get locataire => _locataire;
  bool get isLoading => _isLoading;
  bool get deconnexionEnCours => _deconnexionEnCours;
  String? get errorMessage => _errorMessage;

  String get nomComplet => _locataire?.nomComplet ?? 'Locataire';
  String get telephone => _locataire?.telephone ?? '';
  String get anciennete => _locataire?.anciennete ?? '';
  String get initiales => _locataire?.initiales ?? 'L';
  String get logement => _locataire?.logement ?? '';
  String? get email => _locataire?.email;

  Future<void> chargerProfil() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _locataire = await _repository.profil();
    } on ApiException catch (erreur) {
      _errorMessage = erreur.sessionExpiree
          ? 'Votre session a expiré. Reconnectez-vous pour continuer.'
          : erreur.message;
    } catch (_) {
      _errorMessage = 'Impossible de charger votre profil. Réessayez.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> seDeconnecter() async {
    if (_deconnexionEnCours) return;

    _deconnexionEnCours = true;
    notifyListeners();

    try {
      await _repository.deconnexion();
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('est_connecte', false);
    } finally {
      _locataire = null;
      _deconnexionEnCours = false;
      notifyListeners();
    }
  }
}
