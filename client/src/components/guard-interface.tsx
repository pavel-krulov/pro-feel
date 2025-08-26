import { useState, useEffect } from "react";
import { Mission } from "@shared/schema";
import { SocketClient } from "@/lib/socket";

interface GuardInterfaceProps {
  socket: SocketClient;
}

export default function GuardInterface({ socket }: GuardInterfaceProps) {
  const [missionOffers, setMissionOffers] = useState<Mission[]>([]);
  const [guardStatus, setGuardStatus] = useState<string>('Available');
  const [guardName] = useState<string>('Agent Sarah Chen');
  const [guardId] = useState<string>('AGENT-003');

  useEffect(() => {
    socket.setCallbacks({
      onMissionOffer: (mission: Mission) => {
        console.log('Guard received mission offer:', mission);
        setMissionOffers(prev => [...prev, mission]);
      }
    });
  }, [socket]);

  const handleAcceptMission = (mission: Mission) => {
    socket.send({
      type: 'agent:accept_mission',
      missionId: mission.id,
      agentId: guardId
    });
    
    // Remove mission from offers
    setMissionOffers(prev => prev.filter(m => m.id !== mission.id));
    setGuardStatus('On Mission');
  };

  const handleDeclineMission = (mission: Mission) => {
    socket.send({
      type: 'agent:decline_mission',
      missionId: mission.id,
      agentId: guardId
    });
    
    // Remove mission from offers
    setMissionOffers(prev => prev.filter(m => m.id !== mission.id));
  };

  const getStatusColor = () => {
    switch (guardStatus) {
      case 'Available': return 'text-green-400';
      case 'On Mission': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full bg-navy-900">
      <div className="max-w-4xl mx-auto pt-8 px-6">
        {/* Guard Header */}
        <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                <i className="fas fa-user-ninja text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold" data-testid="text-guard-name">{guardName}</h2>
                <p className="text-slate-400" data-testid="text-guard-id">ID: {guardId}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${guardStatus === 'Available' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`font-medium ${getStatusColor()}`} data-testid="text-guard-status">{guardStatus}</span>
              </div>
              <div className="text-sm text-slate-400">Last active: 2 mins ago</div>
            </div>
          </div>
        </div>

        {/* Mission Notifications */}
        <div className="grid gap-6">
          <div className="bg-navy-800 rounded-xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold flex items-center">
                <i className="fas fa-bell mr-3 text-yellow-400"></i>
                Mission Assignments
              </h3>
            </div>
            
            <div className="p-6" data-testid="container-mission-offers">
              {missionOffers.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <i className="fas fa-clock text-4xl mb-4"></i>
                  <p className="text-lg mb-2">Waiting for mission assignments</p>
                  <p className="text-sm">You will be notified when new missions become available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {missionOffers.map(mission => (
                    <div key={mission.id} className="bg-red-900/20 border border-red-500 rounded-xl">
                      <div className="p-6 border-b border-red-500/30">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-semibold text-red-400 flex items-center">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            New Mission Assignment
                          </h4>
                          <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">URGENT</span>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold mb-3 text-red-400">Mission Details</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start space-x-2">
                                <i className="fas fa-hashtag text-slate-400 mt-1"></i>
                                <div>
                                  <span className="text-slate-400">Mission ID:</span>
                                  <span className="font-medium ml-2">{mission.id}</span>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <i className="fas fa-map-marker-alt text-slate-400 mt-1"></i>
                                <div>
                                  <span className="text-slate-400">Location:</span>
                                  <span className="font-medium ml-2">{mission.lat.toFixed(4)}° N, {mission.lng.toFixed(4)}° E</span>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <i className="fas fa-clock text-slate-400 mt-1"></i>
                                <div>
                                  <span className="text-slate-400">Requested:</span>
                                  <span className="font-medium ml-2">{new Date(mission.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <div className="flex items-start space-x-2">
                                <i className="fas fa-route text-slate-400 mt-1"></i>
                                <div>
                                  <span className="text-slate-400">ETA:</span>
                                  <span className="font-medium ml-2">12 minutes</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-semibold mb-3 text-red-400">Client Information</h5>
                            <div className="bg-navy-700 rounded-lg p-4 text-sm">
                              <div className="text-slate-400 mb-2">Priority: <span className="text-red-400 font-medium">High</span></div>
                              <div className="text-slate-400 mb-2">Type: <span className="text-white font-medium">Security Response</span></div>
                              <div className="text-slate-400">Status: <span className="text-yellow-400 font-medium">Awaiting Response</span></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-4 mt-6 pt-6 border-t border-slate-700">
                          <button 
                            onClick={() => handleAcceptMission(mission)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                            data-testid={`button-accept-mission-${mission.id}`}
                          >
                            <i className="fas fa-check-circle mr-2"></i>
                            Accept Mission
                          </button>
                          <button 
                            onClick={() => handleDeclineMission(mission)}
                            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                            data-testid={`button-decline-mission-${mission.id}`}
                          >
                            <i className="fas fa-times-circle mr-2"></i>
                            Decline Mission
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Guard Status Panel */}
          <div className="bg-navy-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <i className="fas fa-tachometer-alt mr-3 text-blue-400"></i>
              Status Dashboard
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-navy-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">12</div>
                <div className="text-sm text-slate-400">Completed Today</div>
              </div>
              <div className="bg-navy-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">8m</div>
                <div className="text-sm text-slate-400">Avg Response</div>
              </div>
              <div className="bg-navy-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-2">4.9</div>
                <div className="text-sm text-slate-400">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
