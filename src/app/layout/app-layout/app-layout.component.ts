import { AfterViewInit, Component, computed, HostListener, OnInit, inject } from '@angular/core';

import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { DemandeInscriptionBadgeService } from '../../core/services/demande-inscription-badge.service';
import { TourService } from '../../core/services/tour.service';
import { ChatAssistantComponent } from '../../shared/components/chat-assistant/chat-assistant.component';
import { ProductTourComponent } from '../../shared/components/product-tour/product-tour.component';

import { NgClass } from '@angular/common';

import { filter } from 'rxjs/operators';



interface NavItem {

  label: string;

  icon: string;

  route: string;

  roles?: string[];

}



@Component({

  selector: 'app-app-layout',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, ChatAssistantComponent, ProductTourComponent],

  templateUrl: './app-layout.component.html',

  styleUrl: './app-layout.component.scss'

})

export class AppLayoutComponent implements OnInit, AfterViewInit {

  sidebarOpen = false;

  isMobile = false;

  readonly inscriptionBadge = inject(DemandeInscriptionBadgeService);

  readonly tour = inject(TourService);

  private readonly router = inject(Router);



  private readonly allItems: NavItem[] = [

    { label: 'Dashboard', icon: 'pi pi-home', route: '/app/dashboard' },

    { label: 'Agences', icon: 'pi pi-building', route: '/app/agences', roles: ['SUPER_ADMIN'] },

    { label: 'Demandes inscription', icon: 'pi pi-inbox', route: '/app/demandes-inscription', roles: ['SUPER_ADMIN'] },

    { label: 'Utilisateurs', icon: 'pi pi-shield', route: '/app/utilisateurs', roles: ['SUPER_ADMIN'] },

    { label: 'Équipe', icon: 'pi pi-users', route: '/app/utilisateurs', roles: ['ADMIN_AGENCE'] },

    { label: 'Site web', icon: 'pi pi-globe', route: '/app/site-web', roles: ['SUPER_ADMIN'] },

    { label: 'Agents', icon: 'pi pi-users', route: '/app/agents', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'] },

    { label: 'Marchés', icon: 'pi pi-map-marker', route: '/app/marches', roles: ['AGENT', 'ADMIN_AGENCE', 'SUPER_ADMIN'] },

    { label: 'Clients', icon: 'pi pi-id-card', route: '/app/clients', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER'] },

    { label: 'Collectes', icon: 'pi pi-wallet', route: '/app/collectes', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT'] },

    { label: 'Restitutions', icon: 'pi pi-money-bill', route: '/app/restitutions', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER', 'AGENT'] },

    { label: 'Opérations', icon: 'pi pi-shopping-cart', route: '/app/operations', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER'] },

    { label: 'Catégories opération', icon: 'pi pi-tags', route: '/app/categories-operation', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'] },

    { label: 'Caisse', icon: 'pi pi-inbox', route: '/app/caisse', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER'] },

    { label: 'Rapports', icon: 'pi pi-chart-bar', route: '/app/rapports' },

    { label: 'Simulateur', icon: 'pi pi-calculator', route: '/app/simulateur', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'] },

    { label: 'Audit', icon: 'pi pi-history', route: '/app/audit', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AUDITEUR'] },

    { label: 'Mon profil', icon: 'pi pi-user', route: '/app/profil' },

    { label: 'Paramètres', icon: 'pi pi-cog', route: '/app/parametres', roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'] },

  ];



  readonly menu = computed(() => {

    const role = this.auth.role();

    return this.allItems.filter(i => !i.roles || (role && i.roles.includes(role)));

  });



  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }

  startTour(): void {
    this.tour.start('app');
  }

  ngOnInit(): void {

    this.updateViewport();

    this.inscriptionBadge.refresh();

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.inscriptionBadge.refresh();
    });

  }

  ngAfterViewInit(): void {

    if (!this.tour.hasSeen('app')) {
      setTimeout(() => this.tour.start('app'), 700);
    }

  }



  @HostListener('window:resize')

  onResize(): void {

    this.updateViewport();

  }



  toggleSidebar(): void {

    this.sidebarOpen = !this.sidebarOpen;

  }



  closeSidebar(): void {

    if (this.isMobile) {

      this.sidebarOpen = false;

    }

  }



  private updateViewport(): void {

    const mobile = window.innerWidth <= 900;

    if (mobile !== this.isMobile) {

      this.isMobile = mobile;

      this.sidebarOpen = !mobile;

    }

  }

}

