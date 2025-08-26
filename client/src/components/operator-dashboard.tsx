import { useEffect, useRef, useState } from "react";
import { Agent, Mission } from "@shared/schema";
import { SocketClient } from "@/lib/socket";
import L from "leaflet";

interface OperatorDashboardProps {
  socket: SocketClient;
}

export default function OperatorDashboard({ socket }: OperatorDashboardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [agentMarkers, setAgentMarkers] = useState<Map<string, L.CircleMarker>>(
    new Map(),
  );
  const [missionMarkers, setMissionMarkers] = useState<
    Map<string, L.CircleMarker>
  >(new Map());

  console.log('activate');

  useEffect(() => {
    if (mapRef.current && !map) {
      const mapInstance = L.map(mapRef.current).setView([48.8566, 2.3522], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance);

      setMap(mapInstance);

      // Set up socket callbacks for operator
      socket.setCallbacks({
        onInitialData: (data) => {
          setAgents(data.agents);
          setMissions(data.missions);
        },
        onNewMission: (mission) => {
          setMissions((prev) => [...prev, mission]);
        },
        onMissionUpdated: (data) => {
          setMissions((prev) =>
            prev.map((m) => (m.id === data.mission.id ? data.mission : m)),
          );
          setAgents(data.agents);
        },
      });
    }

    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [socket]);

  useEffect(() => {
      console.log('useEffect');
    if (!map) return;

    // Clear existing markers
    agentMarkers.forEach((marker) => marker.remove());
    missionMarkers.forEach((marker) => marker.remove());

    const newAgentMarkers = new Map<string, L.CircleMarker>();
    const newMissionMarkers = new Map<string, L.CircleMarker>();

    // Add agent markers
    agents.forEach((agent) => {
      const color =
        agent.status === "available"
          ? "#3b82f6"
          : agent.status === "assigned"
            ? "#f59e0b"
            : "#10b981";

      const marker = L.circleMarker([agent.lat, agent.lng], {
        radius: 10,
        fillColor: color,
        color: "white",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-center text-slate-800 text-white">
          <strong>${agent.name}</strong><br>
          <span class="text-sm">Status: ${agent.status}</span><br>
          <span class="text-xs">${agent.id}</span>
        </div>
      `);

      // Handle agent selection
      marker.on("click", () => {
        if (agent.status === "available") {
          toggleAgentSelection(agent, marker);
        }
      });

      newAgentMarkers.set(agent.id, marker);
    });

    // Add mission markers
    missions.forEach((mission) => {
      const marker = L.circleMarker([mission.lat, mission.lng], {
        radius: 15,
        fillColor: "#ef4444",
        color: "white",
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(`
        <div class="text-center text-slate-800">
          <strong class="text-red-600">${mission.id}</strong><br>
          <span class="text-sm">Status: ${mission.status}</span><br>
          <span class="text-xs">${new Date(mission.timestamp).toLocaleTimeString()}</span>
        </div>
      `);

      newMissionMarkers.set(mission.id, marker);
    });

    setAgentMarkers(newAgentMarkers);
    setMissionMarkers(newMissionMarkers);
  }, [map, agents, missions]);

  const toggleAgentSelection = (agent: Agent, marker: L.CircleMarker) => {
    const isSelected = selectedAgents.some((a) => a.id === agent.id);

    if (isSelected) {
      setSelectedAgents((prev) => prev.filter((a) => a.id !== agent.id));
      marker.setStyle({ fillColor: "#3b82f6" });
    } else {
      // Ensure no duplicates by filtering first, then adding
      setSelectedAgents((prev) => {
        const filtered = prev.filter((a) => a.id !== agent.id);
        return [...filtered, agent];
      });
      marker.setStyle({ fillColor: "#8b5cf6" });
    }
  };

  const handleAssignAgents = () => {
    const pendingMission = missions.find((m) => m.status === "pending");
    if (pendingMission && selectedAgents.length > 0) {
      socket.send({
        type: "operator:assign_agents",
        missionId: pendingMission.id,
        agentIds: selectedAgents.map((a) => a.id),
      });
      setSelectedAgents([]);
    }
  };

  const availableAgents = agents.filter((a) => a.status === "available").length;
  const assignedAgents = agents.filter((a) => a.status === "assigned").length;
  const activeMissions = missions.filter((m) => m.status !== "completed");

  return (
    <div className="h-full flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 bg-navy-800 rounded-lg p-4 shadow-xl border border-slate-700 min-w-72 z-[1000]">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <i className="fas fa-users mr-2 text-blue-400"></i>
            Mission Control
          </h3>

          {/* Agent Statistics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-navy-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">
                {availableAgents}
              </div>
              <div className="text-xs text-slate-400">Available</div>
            </div>
            <div className="bg-navy-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {assignedAgents}
              </div>
              <div className="text-xs text-slate-400">Assigned</div>
            </div>
          </div>

          {/* Selected Agents Display */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Selected Agents</label>
              <span className="text-xs text-slate-400">
                {selectedAgents.length} selected
              </span>
            </div>
            <div
              className={`bg-navy-700 rounded-lg p-3 min-h-16 text-sm ${selectedAgents.length === 0 ? "text-slate-400" : "text-slate-200"}`}
            >
              {selectedAgents.length === 0
                ? "Click agents on map to select"
                : selectedAgents.map((agent, index) => (
                    <div
                      key={`selected-${agent.id}-${index}`}
                      className="flex items-center justify-between py-1"
                    >
                      <span>{agent.name}</span>
                      <span className="text-xs text-slate-500">{agent.id}</span>
                    </div>
                  ))}
            </div>
          </div>

          {/* Assignment Button */}
          <button
            onClick={handleAssignAgents}
            disabled={
              selectedAgents.length === 0 ||
              !missions.some((m) => m.status === "pending")
            }
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            data-testid="button-assign-agents"
          >
            <i className="fas fa-paper-plane mr-2"></i>
            Assign Selected Agents
          </button>
        </div>

        {/* Active Missions Panel */}
        <div className="absolute bottom-4 left-4 bg-navy-800 rounded-lg p-4 shadow-xl border border-slate-700 max-w-sm z-[1000]">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <i className="fas fa-exclamation-triangle mr-2 text-red-400"></i>
            Active Missions
          </h3>

          <div className="space-y-3">
            {activeMissions.length === 0 ? (
              <div className="text-slate-400 text-center py-4">
                No active missions
              </div>
            ) : (
              activeMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="bg-red-900/30 border border-red-500 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-400">
                      {mission.id}
                    </span>
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                      {mission.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <div>
                      <i className="fas fa-map-marker-alt mr-1"></i>{" "}
                      {mission.lat.toFixed(4)}° N, {mission.lng.toFixed(4)}° E
                    </div>
                    <div>
                      <i className="fas fa-clock mr-1"></i>{" "}
                      {new Date(mission.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-slate-400 text-center mt-3">
            {activeMissions.length} active mission
            {activeMissions.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
