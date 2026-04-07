
import React, { useState, useCallback, useEffect } from 'react';
import { IncomingCallScreen } from './components/IncomingCallScreen';
import { ActiveCallScreen } from './components/ActiveCallScreen';
import { CallEndedScreen } from './components/CallEndedScreen';
import { SelectApiKeyScreen } from './components/SelectApiKeyScreen';
import { useAnsweringMachine } from './hooks/useAnsweringMachine';
import type { Transcript } from './types';

type CallState = 'INCOMING' | 'ACTIVE' | 'ENDED';

// Aistudio type declaration
// Fix: Use a named interface for the global `aistudio` object to prevent type conflicts.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

export default function App() {
  const [callState, setCallState] = useState<CallState>('INCOMING');
  const [hasApiKey, setHasApiKey] = useState(false);

  const {
    startCall,
    endCall,
    transcripts,
    isConnecting,
    recordingUrl,
    clearRecording,
    error,
    clearError,
  } = useAnsweringMachine();
  
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(keySelected);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    if (error?.message.includes('Requested entity was not found')) {
      setHasApiKey(false);
      clearError();
    }
  }, [error, clearError]);

  const handleSelectApiKey = useCallback(async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  }, []);

  const handleAcceptCall = useCallback(async () => {
    try {
      await startCall();
      setCallState('ACTIVE');
    } catch (error) {
      console.error("Failed to start call:", error);
      alert("Could not access microphone. Please check permissions and try again.");
    }
  }, [startCall]);

  const handleEndCall = useCallback(() => {
    endCall();
    setCallState('ENDED');
  }, [endCall]);

  const handleCallAgain = useCallback(() => {
    clearRecording();
    setCallState('INCOMING');
  }, [clearRecording]);

  const renderContent = () => {
    if (!hasApiKey) {
      return <SelectApiKeyScreen onSelectApiKey={handleSelectApiKey} />;
    }
    
    switch (callState) {
      case 'INCOMING':
        return (
          <IncomingCallScreen
            onAccept={handleAcceptCall}
            onDecline={handleEndCall}
            isConnecting={isConnecting}
          />
        );
      case 'ACTIVE':
        return (
          <ActiveCallScreen
            onEndCall={handleEndCall}
            transcripts={transcripts as Transcript[]}
          />
        );
      case 'ENDED':
        return (
          <CallEndedScreen
            onCallAgain={handleCallAgain}
            recordingUrl={recordingUrl}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-900 font-sans">
      <div className="w-full max-w-sm h-[700px] max-h-[90vh] bg-black rounded-3xl border-4 border-gray-700 shadow-2xl overflow-hidden flex flex-col">
        {renderContent()}
      </div>
    </main>
  );
}