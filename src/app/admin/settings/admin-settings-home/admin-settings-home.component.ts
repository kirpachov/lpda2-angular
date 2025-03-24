import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from "@angular/router";
import {NgClass, NgForOf} from "@angular/common";
import {MatIcon} from "@angular/material/icon";
import { Title } from '@angular/platform-browser';


export type Setting = {
  name: string;
  description: string;
  path: string;

  icon: {
    source: "material";
    name: string;
  }
};

@Component({
  selector: 'app-admin-settings-home',
  standalone: true,
  imports: [
    MatIcon,
    NgClass,
    NgForOf,
    RouterLink
  ],
  templateUrl: './admin-settings-home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSettingsHomeComponent {
  readonly _ = inject(Title).setTitle($localize`Impostazioni | La Porta D'Acqua`);

  readonly settings: Setting[] = [
    {
      name: $localize`Utenti`,
      description: $localize`Aggiungi o elimina utenti`,
      path: 'users',
      icon: {
        source: 'material',
        name: 'group'
      }
    },
    {
      name: $localize`Preferenze`,
      description: $localize`Modifica impostazioni per il tuo utente`,
      path: `preferences`,
      icon: {
        source: `material`,
        name: `manage_accounts`
      }
    },
    {
      name: $localize`Contatti`,
      description: $localize`Modifica contatti visibili sul sito e nelle mail`,
      path: `contacts`,
      icon: {
        source: `material`,
        name: `call`
      }
    },
    {
      name: $localize`Impostazioni`,
      description: $localize`Modifica impostazioni al livello di sistema`,
      path: `settings`,
      icon: {
        source: `material`,
        name: `settings`
      }
    },
    {
      name: $localize`Pagamenti alla prenotazione`,
      description: $localize`Definisci quando è richiesto un pagamento per una prenotazione e di quanto.`,
      path: `preorder_reservation_groups`,
      icon: {
        source: `material`,
        name: `price_change`
      }
    },
    {
      name: $localize`Comunicazioni pubbliche`,
      description: $localize`Mostra messaggi personalizzati nelle pagine pubbliche. Questi messaggi sono sempre visibili nelle pagine pubbliche.`,
      path: `public_messages`,
      icon: {
        source: `material`,
        name: `chat`
      }
    },
    {
      name: $localize`Messaggi alla prenotazione`,
      description: $localize`Mostra messaggi personalizzati alle persone che cercano di prenotare per date specifiche. Per esempio, potresti voler avvertire che sono disponibili solo tavoli all'aperto per una data specifica.`,
      path: `reservation-turn-messages`,
      icon: {
        source: `material`,
        name: `feedback`
      }
    },
    {
      name: $localize`Chiusure`,
      description: $localize`Modifica chiusure`,
      path: `holidays`,
      icon: {
        source: `material`,
        name: `beach_access`
      }
    },
    {
      name: $localize`Turni di prenotazione`,
      description: $localize`Configura gli orari in cui è possibile creare prenotazioni`,
      path: `reservation-turns`,
      icon: {
        source: `material`,
        name: `view_timeline`
      }
    },
    {
      name: $localize`Tipologie di tavoli`,
      description: $localize`Amministra le tiplogie di tavoli disponibili`,
      path: `table_types`,
      icon: {
        source: `material`,
        name: `table_restaurant`
      }
    },
  ];
}
