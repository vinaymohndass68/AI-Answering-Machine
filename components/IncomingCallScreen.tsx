
import React from 'react';
import { PhoneIcon } from './icons';

interface IncomingCallScreenProps {
  onAccept: () => void;
  onDecline: () => void;
  isConnecting: boolean;
}

const CallButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className: string;
  disabled?: boolean;
}> = ({ onClick, icon, label, className, disabled }) => (
  <div className="flex flex-col items-center space-y-2">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {icon}
    </button>
    <span className="text-gray-300 text-sm">{label}</span>
  </div>
);

export const IncomingCallScreen: React.FC<IncomingCallScreenProps> = ({ onAccept, onDecline, isConnecting }) => {
  return (
    <div className="flex flex-col justify-between h-full bg-gray-800 text-white p-8 text-center">
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
          <span className="text-5xl font-bold text-white">?</span>
        </div>
        <h1 className="text-3xl font-bold tracking-wider">Unknown Number</h1>
        <p className="text-gray-400 mt-2">Incoming Call...</p>
        {isConnecting && (
          <p className="text-green-400 mt-4 animate-pulse">Connecting...</p>
        )}
      </div>

      <div className="flex justify-around items-center w-full">
        <CallButton
          onClick={onDecline}
          icon={<PhoneIcon className="w-8 h-8 transform rotate-[135deg]" />}
          label="Decline"
          className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          disabled={isConnecting}
        />
        <CallButton
          onClick={onAccept}
          icon={<PhoneIcon className="w-8 h-8" />}
          label="Accept"
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
          disabled={isConnecting}
        />
      </div>
    </div>
  );
};
