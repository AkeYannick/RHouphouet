import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:rmobile/core/session/session_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BiometricViewModel extends ChangeNotifier {
  final LocalAuthentication _auth = LocalAuthentication();

  bool _isAuthenticating = false;
  bool _isFaceId = false;
  String? _errorMessage;

  bool get isAuthenticating => _isAuthenticating;
  bool get isFaceId => _isFaceId;
  String? get errorMessage => _errorMessage;

  /// Détecte si l'appareil privilégie le visage (Face ID) ou l'empreinte
  Future<void> verifierTypeBiometrie() async {
    try {
      final List<BiometricType> availableBiometrics =
          await _auth.getAvailableBiometrics();
      _isFaceId = availableBiometrics.contains(BiometricType.face);
      notifyListeners();
    } catch (_) {
      _isFaceId = false;
    }
  }

  /// Lance la vérification biométrique (compatible local_auth 3.0.2)
  Future<bool> authentifier() async {
    if (_isAuthenticating) return false;

    _errorMessage = null;
    _isAuthenticating = true;
    notifyListeners();

    try {
      final bool isDeviceSupported = await _auth.isDeviceSupported();

      if (!isDeviceSupported) {
        _errorMessage =
            "Aucun verrouillage sécurisé n'est configuré sur ce téléphone. Activez-le dans vos réglages ou connectez-vous par SMS.";
        _isAuthenticating = false;
        notifyListeners();
        return false;
      }

      // Nouvelle syntaxe local_auth 3.0.2 (paramètres directs sans AuthenticationOptions)
      final bool didAuthenticate = await _auth.authenticate(
        localizedReason:
            'Authentifiez-vous pour accéder à votre espace locataire',
        persistAcrossBackgrounding: true,
        biometricOnly: false,
      );

      _isAuthenticating = false;
      if (!didAuthenticate) {
        _errorMessage = "Authentification annulée ou non reconnue.";
      }
      notifyListeners();
      return didAuthenticate;
    } on LocalAuthException catch (e) {
      _isAuthenticating = false;
      if (e.code == LocalAuthExceptionCode.noBiometricsEnrolled ||
          e.code == LocalAuthExceptionCode.noCredentialsSet) {
        _errorMessage =
            "Aucune empreinte, reconnaissance faciale ou code PIN configuré sur ce téléphone.";
      } else if (e.code == LocalAuthExceptionCode.temporaryLockout ||
          e.code == LocalAuthExceptionCode.biometricLockout) {
        _errorMessage =
            "Trop de tentatives échouées. Déverrouillez votre téléphone avec son code PIN puis réessayez.";
      } else if (e.code == LocalAuthExceptionCode.userCanceled) {
        _errorMessage = "Authentification annulée.";
      } else {
        _errorMessage = "Erreur biométrique : ${e.description ?? e.code.name}";
      }
      notifyListeners();
      return false;
    } catch (e) {
      _isAuthenticating = false;
      _errorMessage = "Impossible de vérifier votre identité. Réessayez.";
      notifyListeners();
      return false;
    }
  }

  /// Déconnecte la session pour revenir à l'écran de connexion par SMS
  Future<void> seDeconnecter(VoidCallback onLogout) async {
    await SessionStore.effacer();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('est_connecte', false);
    onLogout();
  }
}
