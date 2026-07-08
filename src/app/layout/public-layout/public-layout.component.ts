import { AfterViewInit, Component, OnInit, computed, inject } from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SiteContentService } from '../../core/services/site-content.service';
import { TourService } from '../../core/services/tour.service';
import { ChatAssistantComponent } from '../../shared/components/chat-assistant/chat-assistant.component';
import { ProductTourComponent } from '../../shared/components/product-tour/product-tour.component';



@Component({

  selector: 'app-public-layout',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatAssistantComponent, ProductTourComponent],

  templateUrl: './public-layout.component.html',

  styleUrl: './public-layout.component.scss'

})

export class PublicLayoutComponent implements OnInit, AfterViewInit {

  menuOpen = false;

  readonly layout = computed(() => this.cms.section('layout'));

  private readonly tour = inject(TourService);



  constructor(public cms: SiteContentService) {}



  ngOnInit(): void {

    this.cms.load().subscribe();

  }



  ngAfterViewInit(): void {

    if (!this.tour.hasSeen('public')) {
      setTimeout(() => this.tour.start('public'), 900);
    }

  }



  phoneHref(): string {

    return 'tel:' + this.layout().phone.replace(/\s/g, '');

  }



  iconUrl(): string {

    return this.cms.resolveMediaUrl(this.layout().brandIconUrl);

  }



  logoUrl(): string {

    return this.cms.resolveMediaUrl(this.layout().footerLogoUrl);

  }

  collecteurRoute(): string {
    return this.layout().collecteurRoute || '/devenez-collecteur';
  }

}

