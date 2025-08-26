import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["available", "assigned", "accepted"] }).notNull().default("available"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
});

export const missions = pgTable("missions", {
  id: varchar("id").primaryKey(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  status: text("status", { enum: ["pending", "assigned", "accepted", "completed"] }).notNull().default("pending"),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  assignedAgents: text("assigned_agents").array(),
  acceptedBy: varchar("accepted_by"),
});

export const insertAgentSchema = createInsertSchema(agents);
export const insertMissionSchema = createInsertSchema(missions).omit({ 
  id: true, 
  timestamp: true 
});

export type Agent = typeof agents.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertMission = z.infer<typeof insertMissionSchema>;
