
import React, { useState, useEffect, useRef } from 'react';
import { PhoneIcon } from './icons';
import type { Transcript } from '../types';

interface ActiveCallScreenProps {
  onEndCall: () => void;
  transcripts: Transcript[];
}

const CallTimer: React.FC = () => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return <p className="text-gray-400 text-sm">{formatTime(duration)}</p>;
};


export const ActiveCallScreen: React.FC<ActiveCallScreenProps> = ({ onEndCall, transcripts }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts]);

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-6">
            <div className="text-center mb-4">
                <h1 className="text-2xl font-semibold">Answering Machine</h1>
                <CallTimer />
            </div>

            <div ref={scrollRef} className="flex-grow bg-black/30 rounded-lg p-4 overflow-y-auto space-y-4 mb-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {transcripts.map((t) => (
                    <div key={t.id} className={`flex flex-col ${t.speaker === 'You' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${
                            t.speaker === 'You' 
                                ? 'bg-green-600 text-white rounded-br-none' 
                                : 'bg-gray-700 text-gray-200 rounded-bl-none'
                            } ${!t.isFinal ? 'opacity-70' : ''}`}
                        >
                            <p className="text-sm">{t.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-center">
                <button
                    onClick={onEndCall}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center transform transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
                >
                    <PhoneIcon className="w-8 h-8 transform rotate-[135deg]" />
                </button>
            </div>
        </div>
    );
};
