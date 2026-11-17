import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:rmobile/core/session/session_store.dart';

enum SplashDestination { onboarding, biometrie, accueil }

class SplashViewmodel extends ChangeNotifier {
  bool _isTerminer = false;
  SplashDestination _destination = SplashDestination.onboarding;

  bool get isTerminer => _isTerminer;
  SplashDestination get destination => _destination;

  Future<void> pageSuivant() async {
    await Future.delayed(const Duration(milliseconds: 1800));

    final aSession = await SessionStore.aUneSession();
    var biometrie = false;

    if (aSession) {
      try {
        biometrie = await LocalAuthentication().isDeviceSupported();
      } catch (_) {
        biometrie = false;
      }
    }

    if (!aSession) {
      _destination = SplashDestination.onboarding;
    } else if (biometrie) {
      _destination = SplashDestination.biometrie;
    } else {
      _destination = SplashDestination.accueil;
    }

    _isTerminer = true;
    notifyListeners();
  }
}
