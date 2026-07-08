import { Component, OnInit, computed } from '@angular/core';

import { RouterLink } from '@angular/router';

import { SiteContentService } from '../../../core/services/site-content.service';



@Component({

  selector: 'app-home',

  standalone: true,

  imports: [RouterLink],

  templateUrl: './home.component.html',

  styleUrl: './home.component.scss'

})

export class HomeComponent implements OnInit {

  readonly hero = computed(() => this.cms.section('hero'));

  readonly features = computed(() => this.cms.section('features').items);

  readonly about = computed(() => this.cms.section('about'));

  readonly steps = computed(() => this.cms.section('steps'));

  readonly cta = computed(() => this.cms.section('cta'));



  constructor(public cms: SiteContentService) {}



  ngOnInit(): void {

    this.cms.load().subscribe();

  }



  heroBg(): string {

    const url = this.cms.resolveMediaUrl(this.hero().backgroundImageUrl);

    return `url('${url}')`;

  }



  personBg(): string {

    const url = this.cms.resolveMediaUrl(this.hero().personImageUrl);

    return `url('${url}')`;

  }



  aboutBg(): string {

    const url = this.cms.resolveMediaUrl(this.about().imageUrl);

    return `url('${url}')`;

  }

}

