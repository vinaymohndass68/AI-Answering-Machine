
import React from 'react';

interface SelectApiKeyScreenProps {
  onSelectApiKey: () => void;
}

export const SelectApiKeyScreen: React.FC<SelectApiKeyScreenProps> = ({ onSelectApiKey }) => {
  return (
    <div className="flex flex-col justify-center items-center h-full bg-gray-800 text-white p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Select API Key</h1>
      <p className="text-gray-400 mt-2 mb-8 max-w-sm">
        To use this application, you need to select a Google AI API key.
        Your key is stored securely and only used for this session.
        Please note that usage of the Gemini API may incur charges. 
        For more details, see the{' '}
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          billing documentation
        </a>.
      </p>
      <button
        onClick={onSelectApiKey}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Select API Key
      </button>
    </div>
  );
};
