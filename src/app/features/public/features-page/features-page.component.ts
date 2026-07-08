import { Component } from '@angular/core';

@Component({
  selector: 'app-features-page',
  standalone: true,
  template: `
    <section class="page-public">
      <h1>Fonctionnalités</h1>
      <p class="lead">Tous les modules prévus par le cahier des charges, organisés par domaine.</p>
      <div class="grid">
        <article class="card">
          <h3>Administration</h3>
          <ul>
            <li>Gestion multi-agences</li>
            <li>Utilisateurs et rôles</li>
            <li>Marchés et quartiers</li>
            <li>Paramètres de commission</li>
          </ul>
        </article>
        <article class="card">
          <h3>Exploitation</h3>
          <ul>
            <li>Clients et codes automatiques</li>
            <li>Portefeuilles agents</li>
            <li>Collectes journalières</li>
            <li>Signature électronique</li>
            <li>Transferts de clients</li>
            <li>Restitutions</li>
          </ul>
        </article>
        <article class="card">
          <h3>Comptabilité</h3>
          <ul>
            <li>Ouverture / clôture de caisse</li>
            <li>Dépenses et recettes</li>
            <li>Bénéfices automatiques</li>
            <li>Commissions administrateur</li>
          </ul>
        </article>
        <article class="card">
          <h3>Pilotage</h3>
          <ul>
            <li>Tableaux de bord par profil</li>
            <li>Rapports et statistiques</li>
            <li>Journal d'audit</li>
            <li>Indicateurs de performance</li>
          </ul>
        </article>
      </div>
    </section>
  `
})
export class FeaturesPageComponent {}
