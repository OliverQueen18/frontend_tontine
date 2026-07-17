import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent) },
      { path: 'fonctionnalites', loadComponent: () => import('./features/public/features-page/features-page.component').then(m => m.FeaturesPageComponent) },
      { path: 'a-propos', loadComponent: () => import('./features/public/about/about.component').then(m => m.AboutComponent) },
      { path: 'contact', loadComponent: () => import('./features/public/contact/contact.component').then(m => m.ContactComponent) },
      { path: 'devenez-collecteur', loadComponent: () => import('./features/public/devenez-collecteur/devenez-collecteur.component').then(m => m.DevenezCollecteurComponent) },
    ]
  },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-layout/app-layout.component').then(m => m.AppLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      {
        path: 'agences',
        canActivate: [roleGuard('SUPER_ADMIN')],
        loadComponent: () => import('./features/agences/agences.component').then(m => m.AgencesComponent)
      },
      {
        path: 'demandes-inscription',
        canActivate: [roleGuard('SUPER_ADMIN')],
        loadComponent: () => import('./features/demandes-inscription/demandes-inscription.component').then(m => m.DemandesInscriptionComponent)
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE')],
        loadComponent: () => import('./features/utilisateurs/utilisateurs.component').then(m => m.UtilisateursComponent)
      },
      {
        path: 'agents',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE')],
        loadComponent: () => import('./features/agents/agents.component').then(m => m.AgentsComponent)
      },
      {
        path: 'marches',
        canActivate: [roleGuard('AGENT', 'ADMIN_AGENCE', 'SUPER_ADMIN')],
        loadComponent: () => import('./features/marches/marches.component').then(m => m.MarchesComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent)
      },
      {
        path: 'clients/:id',
        loadComponent: () => import('./features/clients/client-detail.component').then(m => m.ClientDetailComponent)
      },
      {
        path: 'collectes',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT')],
        loadComponent: () => import('./features/collectes/collectes.component').then(m => m.CollectesComponent)
      },
      {
        path: 'restitutions',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER', 'AGENT')],
        loadComponent: () => import('./features/restitutions/restitutions.component').then(m => m.RestitutionsComponent)
      },
      {
        path: 'operations',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER')],
        loadComponent: () => import('./features/depenses/depenses.component').then(m => m.DepensesComponent)
      },
      { path: 'depenses', redirectTo: 'operations', pathMatch: 'full' },
      {
        path: 'categories-operation',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE')],
        loadComponent: () => import('./features/categories-operation/categories-operation.component').then(m => m.CategoriesOperationComponent)
      },
      {
        path: 'caisse',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER')],
        loadComponent: () => import('./features/caisse/caisse.component').then(m => m.CaisseComponent)
      },
      {
        path: 'rapports',
        loadComponent: () => import('./features/rapports/rapports.component').then(m => m.RapportsComponent)
      },
      {
        path: 'simulateur',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE')],
        loadComponent: () => import('./features/simulateur/simulateur.component').then(m => m.SimulateurComponent)
      },
      {
        path: 'audit',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE', 'AUDITEUR')],
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent)
      },
      {
        path: 'parametres',
        canActivate: [roleGuard('SUPER_ADMIN', 'ADMIN_AGENCE')],
        loadComponent: () => import('./features/parametres/parametres.component').then(m => m.ParametresComponent)
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/profil/profil.component').then(m => m.ProfilComponent)
      },
      {
        path: 'site-web',
        canActivate: [roleGuard('SUPER_ADMIN')],
        loadComponent: () => import('./features/site-cms/site-cms.component').then(m => m.SiteCmsComponent)
      },
    ]
  },
  { path: '**', redirectTo: '' }
];
