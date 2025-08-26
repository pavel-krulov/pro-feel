import { useState, useEffect } from "react";
import { Mission } from "@shared/schema";
import { SocketClient } from "@/lib/socket";

interface ClientPortalProps {
  socket: SocketClient;
}

export default function ClientPortal({ socket }: ClientPortalProps) {
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [requestStatus, setRequestStatus] = useState<string>('Ready to Request');
  const [statusDescription, setStatusDescription] = useState<string>('Click the button below to request security assistance');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [requestButtonDisabled, setRequestButtonDisabled] = useState<boolean>(false);

  useEffect(() => {
    socket.setCallbacks({
      onMissionCreated: (mission: Mission) => {
        console.log('Client received mission created:', mission);
        setCurrentMission(mission);
        setRequestStatus('Request Sent');
        setStatusDescription('Your security request has been received and is being processed');
        setCurrentStep(1);
      },
      onMissionStatusUpdate: (data) => {
        console.log('Client received mission status update:', data);
        if (data.mission.id === currentMission?.id) {
          setCurrentMission(data.mission);
          if (data.status === 'accepted') {
            setRequestStatus('Security Guard En Route');
            setStatusDescription(`${data.agent.name} is on the way to your location`);
            setCurrentStep(4);
          }
        }
      },
      onMissionUpdated: (data) => {
        console.log('Client received mission updated:', data);
        if (data.mission.id === currentMission?.id) {
          setCurrentMission(data.mission);
          if (data.mission.status === 'assigned') {
            setRequestStatus('Guard Assigned');
            setStatusDescription('A security guard has been assigned to your request');
            setCurrentStep(3);
          }
        }
      }
    });
  }, [socket]);

  const handleRequestSecurity = () => {
    // Generate random coordinates around Paris
    const lat = 48.8566 + (Math.random() - 0.5) * 0.02;
    const lng = 2.3522 + (Math.random() - 0.5) * 0.02;
    
    setRequestButtonDisabled(true);
    
    socket.send({
      type: 'client:request_mission',
      lat,
      lng
    });

    // Re-enable button after 30 seconds to prevent spam
    setTimeout(() => setRequestButtonDisabled(false), 30000);
  };

  const getStepColor = (step: number) => {
    return currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-600';
  };

  const getStatusIndicatorColor = () => {
    if (!currentMission) return 'bg-gray-500';
    switch (currentMission.status) {
      case 'pending': return 'bg-yellow-500 animate-pulse';
      case 'assigned': return 'bg-blue-500 animate-pulse';
      case 'accepted': return 'bg-green-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full bg-navy-900">
      <div className="max-w-2xl mx-auto pt-16 px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-user-shield text-3xl text-white"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Security Request Portal</h2>
          <p className="text-slate-400 text-lg">Request immediate security assistance with one click</p>
        </div>

        {/* Request Status Card */}
        <div className="bg-navy-800 rounded-xl p-8 mb-8 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Request Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor()}`}></div>
              <span className="text-sm text-slate-400">
                {currentMission ? new Date(currentMission.timestamp).toLocaleTimeString() : 'No active request'}
              </span>
            </div>
          </div>
          
          <div className="bg-navy-700 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2" data-testid="text-request-status">{requestStatus}</div>
              <div className="text-slate-400" data-testid="text-status-description">{statusDescription}</div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${getStepColor(1)}`}>
                <i className="fas fa-play text-sm"></i>
              </div>
              <span className="text-xs text-slate-400">Request</span>
            </div>
            <div className="flex-1 h-px bg-slate-600 mx-4"></div>
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${getStepColor(2)}`}>
                <i className="fas fa-search text-sm"></i>
              </div>
              <span className="text-xs text-slate-400">Processing</span>
            </div>
            <div className="flex-1 h-px bg-slate-600 mx-4"></div>
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${getStepColor(3)}`}>
                <i className="fas fa-user-check text-sm"></i>
              </div>
              <span className="text-xs text-slate-400">Assigned</span>
            </div>
            <div className="flex-1 h-px bg-slate-600 mx-4"></div>
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${getStepColor(4)}`}>
                <i className="fas fa-running text-sm"></i>
              </div>
              <span className="text-xs text-slate-400">En Route</span>
            </div>
          </div>
        </div>

        {/* Request Button */}
        <div className="text-center">
          <button 
            onClick={handleRequestSecurity}
            disabled={requestButtonDisabled}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-xl text-lg transition-all transform hover:scale-105 disabled:transform-none"
            data-testid="button-request-security"
          >
            <i className="fas fa-exclamation-circle mr-3"></i>
            Request Security Assistance
          </button>
          
          <p className="text-slate-400 text-sm mt-4">
            Emergency services will be dispatched to your location
          </p>
        </div>

        {/* Contact Information */}
        <div className="bg-navy-800 rounded-xl p-6 mt-8 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <i className="fas fa-phone text-blue-400"></i>
              <div>
                <div className="font-medium">24/7 Hotline</div>
                <div className="text-slate-400">+33 1 XX XX XX XX</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <i className="fas fa-envelope text-blue-400"></i>
              <div>
                <div className="font-medium">Email Support</div>
                <div className="text-slate-400">support@missionlogic.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
