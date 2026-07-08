import { Component, OnInit, computed } from '@angular/core';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SiteContentService } from '../../core/services/site-content.service';
import { ChatAssistantComponent } from '../../shared/components/chat-assistant/chat-assistant.component';



@Component({

  selector: 'app-public-layout',

  standalone: true,

  imports: [RouterOutlet, RouterLink, RouterLinkActive, ChatAssistantComponent],

  templateUrl: './public-layout.component.html',

  styleUrl: './public-layout.component.scss'

})

export class PublicLayoutComponent implements OnInit {

  menuOpen = false;

  readonly layout = computed(() => this.cms.section('layout'));



  constructor(public cms: SiteContentService) {}



  ngOnInit(): void {

    this.cms.load().subscribe();

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

