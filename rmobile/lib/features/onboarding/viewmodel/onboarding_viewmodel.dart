import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rmobile/features/onboarding/model/onboarding_model.dart';

class OnboardingViewModel extends ChangeNotifier {
  final PageController pageController = PageController();
  int _currentPage = 0;

  int get currentPage => _currentPage;
  bool get estDernierePage => _currentPage == pages.length - 1;

  final List<OnboardingModel> pages = const [
    OnboardingModel(
      image: "assets/Images/Furniture store-bro.png",
      span: "TOUT AU MÊME ENDROIT",
      titre1: "Votre loyer,",
      titre2: "sans les tracas.",
      description:
          "Payez, suivez vos quittances et retrouvez votre contrat en quelques secondes.",
    ),
    OnboardingModel(
      image: "assets/Images/Payment Information-rafiki.png",
      span: "PAIEMENTS SÉCURISÉS",
      titre1: "Payez sereinement,",
      titre2: "chaque mois.",
      description:
          "Vos transactions sont chiffrées et une confirmation vous est envoyée instantanément.",
    ),
    OnboardingModel(
      image: "assets/Images/Pricing plans-amico - Copie.png",
      span: "RESTEZ EN CONTACT",
      titre1: "Votre bailleur,",
      titre2: "à portée de main.",
      description:
          "Échangez facilement et gardez un historique clair de toutes vos demandes.",
    ),
  ];

  void onPageChanged(int index) {
    _currentPage = index;
    notifyListeners();
  }

  /// Sauvegarde que l'onboarding a été vu et exécute la navigation
  Future<void> terminerOnboarding(VoidCallback onComplete) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_vu', true);
    onComplete();
  }

  /// Passe à la page suivante ou termine l'onboarding sur la dernière page
  Future<void> pageSuivante(VoidCallback onComplete) async {
    if (!estDernierePage) {
      pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      await terminerOnboarding(onComplete);
    }
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }
}
