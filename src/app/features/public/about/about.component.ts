import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <section class="page-public">
      <h1>À propos de Tontine Marché</h1>
      <div class="card prose">
        <p>
          La tontine constitue l'un des principaux mécanismes d'épargne populaire en Afrique de l'Ouest.
          Chaque jour, des milliers de commerçants confient une partie de leurs revenus à un agent collecteur.
        </p>
        <p>
          Tontine Marché modernise cette activité grâce à une plateforme web sécurisée, centralisée et évolutive,
          permettant de gérer les opérations quotidiennes de manière fiable et transparente.
        </p>
        <p>
          La solution s'adresse aux structures multi-agences qui souhaitent supprimer les carnets papier,
          réduire les erreurs de calcul et renforcer le contrôle des collectes.
        </p>
      </div>
    </section>
  `
})
export class AboutComponent {}
