type EventCallback = (data: any) => void;

export class RealtimeSocketService {
  private ws: WebSocket | null = null;
  private threadId: string = '';
  private token: string = '';
  private callbacks: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;

  connect(threadId: string, token: string) {
    this.threadId = threadId;
    this.token = token;

    const wsUrl = `ws://127.0.0.1:8000/api/v1/chat/ws/${threadId}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to thread ${threadId}`);
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event_type, data } = payload;
        
        if (this.callbacks.has(event_type)) {
          this.callbacks.get(event_type)?.forEach((cb) => cb(data));
        }
      } catch (e) {
        console.error('[WebSocket] Message parse error:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Connection closed, attempting reconnect in 3s...');
      this.reconnectTimer = setTimeout(() => {
        if (this.threadId && this.token) {
          this.connect(this.threadId, this.token);
        }
      }, 3000);
    };
  }

  send(eventType: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event_type: eventType, ...data }));
    }
  }

  sendTyping(isTyping: boolean) {
    this.send('TYPING_INDICATOR', { is_typing: isTyping });
  }

  sendReadReceipt(messageId: string) {
    this.send('READ_RECEIPT', { message_id: messageId });
  }

  sendMessage(content: string) {
    this.send('NEW_MESSAGE', { content });
  }

  on(eventType: string, callback: EventCallback) {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, new Set());
    }
    this.callbacks.get(eventType)?.add(callback);
  }

  off(eventType: string, callback: EventCallback) {
    if (this.callbacks.has(eventType)) {
      this.callbacks.get(eventType)?.delete(callback);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtimeSocket = new RealtimeSocketService();
