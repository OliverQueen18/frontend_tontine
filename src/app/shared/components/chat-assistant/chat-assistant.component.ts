import { Component, Input, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { ChatAssistantService, ChatContext, ChatMessage } from '../../../core/services/chat-assistant.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-chat-assistant',
  standalone: true,
  imports: [FormsModule, NgClass, DatePipe],
  templateUrl: './chat-assistant.component.html',
  styleUrl: './chat-assistant.component.scss'
})
export class ChatAssistantComponent implements OnInit, AfterViewChecked {
  @Input({ required: true }) context!: ChatContext;

  open = signal(false);
  messages = signal<ChatMessage[]>([]);
  draft = '';
  typing = signal(false);
  private scrollPending = false;

  @ViewChild('messagesEl') messagesEl?: ElementRef<HTMLElement>;

  constructor(
    private chat: ChatAssistantService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.resetConversation();
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending) {
      this.scrollToBottom();
      this.scrollPending = false;
    }
  }

  get suggestions() {
    return this.chat.suggestions(this.context, this.auth.role());
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open() && !this.messages().length) {
      this.resetConversation();
    }
  }

  close(): void {
    this.open.set(false);
  }

  sendSuggestion(query: string): void {
    this.draft = query;
    this.send();
  }

  send(): void {
    const text = this.draft.trim();
    if (!text || this.typing()) return;

    this.messages.update(msgs => [...msgs, this.chat.createMessage('user', text)]);
    this.draft = '';
    this.typing.set(true);
    this.scrollPending = true;

    setTimeout(() => {
      const answer = this.chat.reply(text, this.context, this.auth.role());
      this.messages.update(msgs => [...msgs, this.chat.createMessage('assistant', answer)]);
      this.typing.set(false);
      this.scrollPending = true;
    }, 350);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private resetConversation(): void {
    this.messages.set([this.chat.createMessage('assistant', this.chat.welcome(this.context))]);
    this.scrollPending = true;
  }

  private scrollToBottom(): void {
    const el = this.messagesEl?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
