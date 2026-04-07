
import React from 'react';
import { PhoneIcon } from './icons';

interface CallEndedScreenProps {
  onCallAgain: () => void;
  recordingUrl: string | null;
}

export const CallEndedScreen: React.FC<CallEndedScreenProps> = ({ onCallAgain, recordingUrl }) => {
  return (
    <div className="flex flex-col justify-center items-center h-full bg-gray-800 text-white p-8 text-center">
      <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mb-6 shadow-lg opacity-80">
        <PhoneIcon className="w-12 h-12 transform rotate-[135deg]" />
      </div>
      <h1 className="text-3xl font-bold">Call Ended</h1>
      <p className="text-gray-400 mt-2 mb-8">The conversation has been terminated.</p>
      {recordingUrl && (
        <a
          href={recordingUrl}
          download="call_recording.webm"
          className="mb-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Download Recording
        </a>
      )}
      <button
        onClick={onCallAgain}
        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
      >
        Call Again
      </button>
    </div>
  );
};
