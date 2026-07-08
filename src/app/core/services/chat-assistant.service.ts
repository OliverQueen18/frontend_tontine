import { Injectable } from '@angular/core';
import { RoleType } from '../models/models';
import {
  CHAT_KNOWLEDGE,
  CHAT_ROLE_SUGGESTIONS,
  CHAT_SUGGESTIONS,
  CHAT_WELCOME,
  ChatSuggestion
} from '../data/chat-assistant-knowledge';

export type ChatContext = 'public' | 'app';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatAssistantService {
  private idSeq = 0;

  welcome(context: ChatContext): string {
    return CHAT_WELCOME[context];
  }

  suggestions(context: ChatContext, userRole?: RoleType | null): ChatSuggestion[] {
    const base = [...CHAT_SUGGESTIONS[context]];
    if (context === 'app' && userRole && CHAT_ROLE_SUGGESTIONS[userRole]) {
      return [...base, ...CHAT_ROLE_SUGGESTIONS[userRole]!];
    }
    return base;
  }

  createMessage(role: 'user' | 'assistant', text: string): ChatMessage {
    return {
      id: `msg-${++this.idSeq}`,
      role,
      text,
      time: new Date()
    };
  }

  reply(query: string, context: ChatContext, userRole?: RoleType | null): string {
    const normalized = this.normalize(query);
    if (!normalized) {
      return 'Posez-moi une question ou choisissez une suggestion ci-dessous.';
    }

    let best: { score: number; answer: string } | null = null;

    for (const entry of CHAT_KNOWLEDGE) {
      if (entry.scope !== 'both' && entry.scope !== context) continue;
      if (entry.roles?.length && userRole && !entry.roles.includes(userRole)) continue;

      const score = this.matchScore(normalized, entry.keywords);
      if (score > 0 && (!best || score > best.score)) {
        best = { score, answer: entry.answer };
      }
    }

    if (best && best.score >= 2) {
      return this.formatAnswer(best.answer);
    }

    return this.fallback(context, userRole);
  }

  private matchScore(query: string, keywords: string[]): number {
    let score = 0;
    for (const kw of keywords) {
      const k = this.normalize(kw);
      if (query.includes(k)) {
        score += k.length > 6 ? 3 : 2;
      } else if (k.split(/\s+/).every(w => w.length > 2 && query.includes(w))) {
        score += 1;
      }
    }
    return score;
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^\w\sàâäéèêëïîôùûüç'-]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatAnswer(text: string): string {
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  }

  private fallback(context: ChatContext, userRole?: RoleType | null): string {
    const hints = this.suggestions(context, userRole)
      .slice(0, 4)
      .map(s => `• ${s.label}`)
      .join('\n');

    if (context === 'public') {
      return `Je n'ai pas trouvé de réponse précise. Essayez par exemple :\n${hints}\n\nOu consultez la page Contact pour nous écrire directement.`;
    }

    return `Je n'ai pas trouvé de réponse précise pour votre rôle. Suggestions :\n${hints}\n\nReformulez votre question ou contactez votre administrateur d'agence.`;
  }
}
