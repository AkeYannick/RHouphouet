import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/features/accueil/view/accueil_screen.dart';
import 'package:rmobile/features/contrat/view/contrat_screen.dart';
import 'package:rmobile/features/historique/view/historique_screen.dart';
import 'package:rmobile/features/messages/view/messages_screen.dart';
import 'package:rmobile/features/navigationBar/viewmodel/navigation_viewmodel.dart';
import 'package:rmobile/features/profil/view/profil_screen.dart';

class NavigationScreen extends StatefulWidget {
  const NavigationScreen({super.key});

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen> {
  final NavigationViewModel _viewModel = NavigationViewModel();

  // Liste des pages correspondant aux onglets du bas
  final List<Widget> _pages = const [
    AccueilScreen(),
    HistoriqueScreen(),
    ContratScreen(),
    MessagesScreen(),
    ProfilScreen(),
  ];

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: AppColors.blanc,
          // IndexedStack garde les pages en mémoire quand on change d'onglet
          body: IndexedStack(index: _viewModel.currentIndex, children: _pages),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: AppColors.blanc,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 12,
                  offset: const Offset(0, -3),
                ),
              ],
            ),
            child: NavigationBarTheme(
              data: NavigationBarThemeData(
                indicatorColor: const Color(0xFFEDF1FC),
                labelTextStyle: WidgetStateProperty.resolveWith((states) {
                  if (states.contains(WidgetState.selected)) {
                    return TextStyle(
                      color: AppColors.bleuBouton,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    );
                  }
                  return TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  );
                }),
              ),
              child: NavigationBar(
                height: 70,
                backgroundColor: AppColors.blanc,
                elevation: 0,
                selectedIndex: _viewModel.currentIndex,
                onDestinationSelected: _viewModel.changerOnglet,
                destinations: [
                  NavigationDestination(
                    icon: Icon(
                      Icons.home_outlined,
                      color: Colors.grey.shade600,
                    ),
                    // selectedIcon: Icon(Icons.home_rounded, color: AppColors.bleuBouton),
                    label: 'Accueil',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.history, color: Colors.grey.shade600),
                    // selectedIcon: Icon(Icons.receipt_long_rounded, color: AppColors.bleuBouton),
                    label: 'Historique',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.file_copy, color: Colors.grey.shade600),
                    // selectedIcon: Icon(Icons.chat_bubble_rounded, color: AppColors.bleuBouton),
                    label: 'Contrat',
                  ),
                  NavigationDestination(
                    icon: Icon(Icons.message, color: Colors.grey.shade600),
                    // selectedIcon: Icon(Icons.person_rounded, color: AppColors.bleuBouton),
                    label: 'Messages',
                  ),

                  NavigationDestination(
                    icon: Icon(
                      Icons.person_outline_rounded,
                      color: Colors.grey.shade600,
                    ),
                    // selectedIcon: Icon(Icons.person_rounded, color: AppColors.bleuBouton),
                    label: 'Profil',
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
