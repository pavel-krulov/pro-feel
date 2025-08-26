import { useEffect, useState } from "react";
import { SocketClient } from "@/lib/socket";
import OperatorDashboard from "@/components/operator-dashboard";
import ClientPortal from "@/components/client-portal";
import GuardInterface from "@/components/guard-interface";
import { Agent, Mission } from "@shared/schema";

type TabType = 'operator' | 'client' | 'guard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('operator');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const socketClient = new SocketClient(activeTab, activeTab === 'guard' ? 'AGENT-003' : undefined);
    
    socketClient.connect().then(() => {
      setIsConnected(true);
      setSocket(socketClient);
    }).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    });

    return () => {
      if (socketClient) {
        socketClient.disconnect();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: 'UTC'
      }) + ' UTC');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);


  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const getTabButtonClass = (tab: TabType) => {
    return activeTab === tab
      ? "tab-button active px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-400 bg-navy-700"
      : "tab-button px-6 py-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-navy-700";
  };

  if (!socket) {
    return (
      <div className="h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Connecting to Mission Logic...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-900 text-slate-100 font-sans h-screen flex flex-col">
      {/* Header */}
      <header className="bg-navy-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-shield-alt text-blue-500 text-2xl"></i>
              <h1 className="text-xl font-bold text-white">Mission Logic</h1>
            </div>
            <div className="flex items-center space-x-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-slate-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-300">
              <span data-testid="text-current-time">{currentTime}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-sm"></i>
              </div>
              <span className="text-sm font-medium">Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-navy-800 border-b border-slate-700 px-6">
        <div className="flex space-x-1">
          <button 
            className={getTabButtonClass('operator')}
            onClick={() => handleTabChange('operator')}
            data-testid="tab-operator"
          >
            <i className="fas fa-map-marked-alt mr-2"></i>
            Operator Dashboard
          </button>
          <button 
            className={getTabButtonClass('client')}
            onClick={() => handleTabChange('client')}
            data-testid="tab-client"
          >
            <i className="fas fa-user-shield mr-2"></i>
            Client Portal
          </button>
          <button 
            className={getTabButtonClass('guard')}
            onClick={() => handleTabChange('guard')}
            data-testid="tab-guard"
          >
            <i className="fas fa-walking mr-2"></i>
            Guard Interface
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'operator' && <OperatorDashboard socket={socket} />}
        {activeTab === 'client' && <ClientPortal socket={socket} />}
        {activeTab === 'guard' && <GuardInterface socket={socket} />}
      </main>
    </div>
  );
}
