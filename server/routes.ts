import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

interface ClientConnection {
  ws: WebSocket;
  type: 'operator' | 'client' | 'guard';
  agentId?: string; // For guard connections
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSocket server on distinct path to avoid conflicts with Vite HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients: Map<WebSocket, ClientConnection> = new Map();

  // REST API routes
  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await storage.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch agents' });
    }
  });

  app.get('/api/missions', async (req, res) => {
    try {
      const missions = await storage.getMissions();
      res.json(missions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch missions' });
    }
  });

  // WebSocket handling
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);

        switch (data.type) {
          case 'register':
            // Register client type (operator, client, guard)
            clients.set(ws, { 
              ws, 
              type: data.clientType,
              agentId: data.agentId 
            });
            
            // Send initial data
            if (data.clientType === 'operator') {
              const agents = await storage.getAgents();
              const missions = await storage.getMissions();
              ws.send(JSON.stringify({
                type: 'initial_data',
                agents,
                missions
              }));
            }
            break;

          case 'client:request_mission':
            // Client requests security assistance
            const mission = await storage.createMission({
              lat: data.lat,
              lng: data.lng,
              status: 'pending',
              assignedAgents: null,
              acceptedBy: null
            });

            // Notify all operators
            broadcastToType('operator', {
              type: 'server:new_mission',
              mission
            });

            // Confirm to client
            ws.send(JSON.stringify({
              type: 'server:mission_created',
              mission
            }));
            break;

          case 'operator:assign_agents':
            // Operator assigns agents to mission
            const { missionId, agentIds } = data;
            
            // Update mission
            await storage.updateMission(missionId, {
              status: 'assigned',
              assignedAgents: agentIds
            });

            // Update agent statuses
            for (const agentId of agentIds) {
              await storage.updateAgent(agentId, { status: 'assigned' });
            }

            const updatedMission = await storage.getMission(missionId);
            const updatedAgents = await storage.getAgents();

            // Broadcast updates to operators
            broadcastToType('operator', {
              type: 'server:mission_updated',
              mission: updatedMission,
              agents: updatedAgents
            });

            // Send mission offers to specific guards
            for (const agentId of agentIds) {
              const guardClients: ClientConnection[] = [];
              clients.forEach(client => {
                if (client.type === 'guard' && client.agentId === agentId) {
                  guardClients.push(client);
                }
              });
              
              for (const guardClient of guardClients) {
                if (guardClient.ws.readyState === WebSocket.OPEN) {
                  guardClient.ws.send(JSON.stringify({
                    type: 'server:mission_offer',
                    mission: updatedMission
                  }));
                }
              }
            }
            break;

          case 'agent:accept_mission':
            // Guard accepts mission
            const { missionId: acceptedMissionId, agentId: acceptingAgentId } = data;
            
            // Update mission and agent
            await storage.updateMission(acceptedMissionId, {
              status: 'accepted',
              acceptedBy: acceptingAgentId
            });
            
            await storage.updateAgent(acceptingAgentId, { status: 'accepted' });

            const acceptedMission = await storage.getMission(acceptedMissionId);
            const acceptingAgent = await storage.getAgent(acceptingAgentId);

            // Notify all operators and clients
            broadcastToAll({
              type: 'server:mission_status_update',
              mission: acceptedMission,
              agent: acceptingAgent,
              status: 'accepted'
            });
            break;

          case 'agent:decline_mission':
            // Guard declines mission - could implement logic to reassign
            console.log('Agent declined mission:', data);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  function broadcastToType(clientType: string, message: any) {
    const targetClients: ClientConnection[] = [];
    clients.forEach(client => {
      if (client.type === clientType && client.ws.readyState === WebSocket.OPEN) {
        targetClients.push(client);
      }
    });
    
    const messageStr = JSON.stringify(message);
    for (const client of targetClients) {
      client.ws.send(messageStr);
    }
  }

  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(messageStr);
      }
    });
  }

  return httpServer;
}
