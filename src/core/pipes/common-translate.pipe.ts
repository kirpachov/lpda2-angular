import { Pipe, PipeTransform } from '@angular/core';

const dict: Record<string, string> = {
  "active": $localize`Attivo`,
  "banned": $localize`Bannato`,
  "not_verified": $localize`Non verificato`,
  "unsubscribed": $localize`Disiscritto`,
  "male": $localize`Maschio`,
  "female": $localize`Femmina`,
  "address": $localize`Indirizzo`,
  "phone": $localize`Telefono`,
  "email": $localize`Email`,
  "whatsapp_number": $localize`Numero WhatsApp`,
  "whatsapp_url": $localize`URL WhatsApp`,
  "facebook_url": $localize`URL Facebook`,
  "instagram_url": $localize`URL Instagram`,
  "tripadvisor_url": $localize`URL TripAdvisor`,
  "homepage_url": $localize`URL Homepage`,
  "google_url": $localize`URL Google`,
  "it": $localize`Italiano`,
  "en": $localize`Inglese`,
  "minutes": $localize`Minuti`,
  "hours": $localize`Ore`,
  "days": $localize`Giorni`,
  "weeks": $localize`Settimane`,
  "minute": $localize`Minuto`,
  "hour": $localize`Ora`,
  "day": $localize`Giorno`,
  "week": $localize`Settimana`,
};

@Pipe({
  name: 'commonTranslate',
  standalone: true
})
export class CommonTranslatePipe implements PipeTransform {

  transform(value: unknown): string {
    if (!(typeof value == "string" && value.length > 0)) return ``;

    return dict[value] || value;
  }
}
