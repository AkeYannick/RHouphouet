import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/onboarding/model/onboarding_model.dart';
// TODO: Adapte ce chemin selon l'emplacement de ta LoginScreen
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/onboarding/viewmodel/onboarding_viewmodel.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final OnboardingViewModel _viewModel = OnboardingViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  void _naviguerVersLogin() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: AppColors.blanc,
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            actions: [
              if (!_viewModel.estDernierePage)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: TextButton(
                    onPressed: () =>
                        _viewModel.terminerOnboarding(_naviguerVersLogin),
                    child: Text(
                      "Passer",
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          body: Column(
            children: [
              Expanded(
                child: PageView.builder(
                  controller: _viewModel.pageController,
                  itemCount: _viewModel.pages.length,
                  onPageChanged: _viewModel.onPageChanged,
                  itemBuilder: (context, index) {
                    return WidgetOnboarding(data: _viewModel.pages[index]);
                  },
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: List.generate(
                          _viewModel.pages.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.only(right: 6),
                            height: 6,
                            width: _viewModel.currentPage == index ? 24 : 6,
                            decoration: BoxDecoration(
                              color: _viewModel.currentPage == index
                                  ? AppColors.bleuBouton
                                  : Colors.grey.shade300,
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.bleuBouton,
                            foregroundColor: AppColors.blanc,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: () =>
                              _viewModel.pageSuivante(_naviguerVersLogin),
                          iconAlignment: IconAlignment.end,
                          icon: const Icon(Icons.arrow_right_alt, size: 22),
                          label: Text(
                            _viewModel.estDernierePage
                                ? "Commencer"
                                : "Continuer",
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class WidgetOnboarding extends StatelessWidget {
  final OnboardingModel data;

  const WidgetOnboarding({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 52,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(32, 90, 32, 32),
            decoration: const BoxDecoration(
              color: Color(0xFFEDF1FC),
              borderRadius: BorderRadius.vertical(
                bottom: Radius.circular(32),
              ),
            ),
            child: Center(
              child: Image.asset(data.image, fit: BoxFit.contain),
            ),
          ),
        ),
        const SizedBox(height: 28),
        Expanded(
          flex: 42,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.span.toUpperCase(),
                  style: TextStyle(
                    color: AppColors.bleuBouton,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 10),
                RichText(
                  text: TextSpan(
                    style: const TextStyle(
                      fontSize: 30,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                    ),
                    children: [
                      TextSpan(
                        text: "${data.titre1}\n",
                        style: TextStyle(color: AppColors.bleuprofond),
                      ),
                      TextSpan(
                        text: data.titre2,
                        style: TextStyle(color: AppColors.bleuBouton),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  data.description,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 15,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
