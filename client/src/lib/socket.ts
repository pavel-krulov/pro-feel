import { Agent, Mission } from '@shared/schema';

export interface SocketMessage {
  type: string;
  [key: string]: any;
}

export interface SocketCallbacks {
  onInitialData?: (data: { agents: Agent[], missions: Mission[] }) => void;
  onNewMission?: (mission: Mission) => void;
  onMissionUpdated?: (data: { mission: Mission, agents: Agent[] }) => void;
  onMissionStatusUpdate?: (data: { mission: Mission, agent: Agent, status: string }) => void;
  onMissionOffer?: (mission: Mission) => void;
  onMissionCreated?: (mission: Mission) => void;
  onError?: (error: string) => void;
}

export class SocketClient {
  private ws: WebSocket | null = null;
  private callbacks: SocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  // Cache last known data so UI can rehydrate after tab switches or late subscription
  private lastAgents: Agent[] | null = null;
  private lastMissions: Mission[] | null = null;

  constructor(private clientType: 'operator' | 'client' | 'guard', private agentId?: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Register client type
          this.send({
            type: 'register',
            clientType: this.clientType,
            agentId: this.agentId
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: SocketMessage) {
    switch (data.type) {
      case 'initial_data': {
        const payload = data as unknown as { agents: Agent[]; missions: Mission[] };
        this.lastAgents = payload.agents;
        this.lastMissions = payload.missions;
        this.callbacks.onInitialData?.(payload);
        break;
      }
      case 'server:new_mission': {
        const mission = (data as any).mission as Mission;
        // Update cache
        this.lastMissions = Array.isArray(this.lastMissions)
          ? [...this.lastMissions.filter((m) => m.id !== mission.id), mission]
          : [mission];
        this.callbacks.onNewMission?.(mission);
        break;
      }
      case 'server:mission_updated': {
        const payload = data as unknown as { mission: Mission; agents: Agent[] };
        // Update caches
        this.lastMissions = Array.isArray(this.lastMissions)
          ? this.lastMissions.map((m) => (m.id === payload.mission.id ? payload.mission : m))
          : [payload.mission];
        this.lastAgents = payload.agents;
        this.callbacks.onMissionUpdated?.(payload);
        break;
      }
      case 'server:mission_status_update':
        this.callbacks.onMissionStatusUpdate?.(data as any);
        break;
      case 'server:mission_offer':
        this.callbacks.onMissionOffer?.((data as any).mission);
        break;
      case 'server:mission_created': {
        const mission = (data as any).mission as Mission;
        // Keep cache in sync
        this.lastMissions = Array.isArray(this.lastMissions)
          ? [...this.lastMissions.filter((m) => m.id !== mission.id), mission]
          : [mission];
        this.callbacks.onMissionCreated?.(mission);
        break;
      }
      case 'error':
        this.callbacks.onError?.((data as any).message);
        break;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }

  send(message: SocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  setCallbacks(callbacks: SocketCallbacks) {
    this.callbacks = callbacks;
    // If we have cached data, immediately provide it to new listeners
    if (this.lastAgents && this.lastMissions) {
      this.callbacks.onInitialData?.({ agents: this.lastAgents, missions: this.lastMissions });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
