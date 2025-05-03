import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LinkifyPipe } from "../../../pipes/linkify.pipe";

@Component({
  selector: 'app-show-messages',
  standalone: true,
  imports: [LinkifyPipe],
  templateUrl: './show-messages.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowMessagesComponent {
  @Input({required: true}) messages: string[] = [];
}
