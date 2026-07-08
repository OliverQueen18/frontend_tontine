import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="page-public">
      <h1>Contact</h1>
      <div class="card contact-card">
        <p>Une question sur la plateforme ou une demande de démonstration ?</p>
        <form (ngSubmit)="sent = true">
          <label>Nom
            <input [(ngModel)]="nom" name="nom" required />
          </label>
          <label>Email
            <input type="email" [(ngModel)]="email" name="email" required />
          </label>
          <label>Message
            <textarea [(ngModel)]="message" name="message" rows="4" required></textarea>
          </label>
          <button class="btn btn-primary" type="submit">Envoyer</button>
        </form>
        @if (sent) {
          <p class="success">Merci, votre message a bien été pris en compte.</p>
        }
      </div>
    </section>
  `
})
export class ContactComponent {
  nom = '';
  email = '';
  message = '';
  sent = false;
}
