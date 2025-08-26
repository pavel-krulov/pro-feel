import { type Agent, type Mission, type InsertAgent, type InsertMission } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Agent operations
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  
  // Mission operations
  getMissions(): Promise<Mission[]>;
  getMission(id: string): Promise<Mission | undefined>;
  createMission(mission: InsertMission): Promise<Mission>;
  updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined>;
}

export class MemStorage implements IStorage {
  private agents: Map<string, Agent>;
  private missions: Map<string, Mission>;
  private missionCounter: number = 0;

  constructor() {
    this.agents = new Map();
    this.missions = new Map();
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize 5-6 agents around Paris, France
    const parisAgents: InsertAgent[] = [
      { id: "AGENT-001", name: "Agent Smith", status: "available", lat: 48.8566, lng: 2.3522 },
      { id: "AGENT-002", name: "Agent Johnson", status: "available", lat: 48.8606, lng: 2.3376 },
      { id: "AGENT-003", name: "Agent Chen", status: "available", lat: 48.8529, lng: 2.3499 },
      { id: "AGENT-004", name: "Agent Williams", status: "available", lat: 48.8584, lng: 2.2945 },
      { id: "AGENT-005", name: "Agent Brown", status: "available", lat: 48.8738, lng: 2.2950 },
      { id: "AGENT-006", name: "Agent Davis", status: "available", lat: 48.8648, lng: 2.3489 },
    ];

    parisAgents.forEach(agent => {
      this.agents.set(agent.id, agent as Agent);
    });
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent: Agent = { ...insertAgent } as Agent;
    this.agents.set(agent.id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async getMissions(): Promise<Mission[]> {
    return Array.from(this.missions.values());
  }

  async getMission(id: string): Promise<Mission | undefined> {
    return this.missions.get(id);
  }

  async createMission(insertMission: InsertMission): Promise<Mission> {
    this.missionCounter++;
    const id = `MISSION-${this.missionCounter.toString().padStart(3, '0')}`;
    
    const mission: Mission = {
      ...insertMission,
      id,
      timestamp: new Date(),
    } as Mission;
    
    this.missions.set(id, mission);
    return mission;
  }

  async updateMission(id: string, updates: Partial<Mission>): Promise<Mission | undefined> {
    const mission = this.missions.get(id);
    if (!mission) return undefined;
    
    const updatedMission = { ...mission, ...updates };
    this.missions.set(id, updatedMission);
    return updatedMission;
  }
}

export const storage = new MemStorage();
