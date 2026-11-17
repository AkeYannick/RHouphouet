import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/auth/view/biometric_lock_screen.dart';
import 'package:rmobile/features/navigationBar/view/navigation_screen.dart';
import 'package:rmobile/features/onboarding/view/onboarding_screen.dart';
import 'package:rmobile/features/splash/viewmodel/splash_viewmodel.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final SplashViewmodel _viewModel = SplashViewmodel();

  @override
  void initState() {
    super.initState();
    // Écoute les changements d'état du ViewModel
    _viewModel.addListener(_onStateChanged);
    // Démarre le timer
    _viewModel.pageSuivant();
  }

  void _onStateChanged() {
    if (_viewModel.isTerminer && mounted) {
      final destination = switch (_viewModel.destination) {
        SplashDestination.biometrie => const BiometricLockScreen(),
        SplashDestination.accueil => const NavigationScreen(),
        SplashDestination.onboarding => const OnboardingScreen(),
      };

      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => destination),
      );
    }
  }

  @override
  void dispose() {
    // Nettoyage de l'écouteur pour éviter les fuites de mémoire
    _viewModel.removeListener(_onStateChanged);
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bleuprofond,
      body: Stack(
        children: [
          // Forme en haut à droite
          const Positioned(
            top: -60,
            right: -60,
            child: _DecorShape(size: 300),
          ),

          // Forme en bas à gauche
          const Positioned(
            bottom: -60,
            left: -60,
            child: _DecorShape(size: 200),
          ),

          // Logo et slogan au centre
          SafeArea(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/Logo/logoRH.png',
                    width: 180,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Votre loyer simplement',
                    style: TextStyle(
                      color: AppColors.blanc,
                      fontSize: 22,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Barre de chargement en bas
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Center(
              child: SizedBox(
                width: 130,
                height: 10,
                child: LinearProgressIndicator(
                  color: AppColors.blanc,
                  backgroundColor: AppColors.bleuclair,
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Forme décorative réutilisable
class _DecorShape extends StatelessWidget {
  final double size;
  const _DecorShape({required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.bleuclair,
        borderRadius: BorderRadius.circular(size / 2),
      ),
    );
  }
}
