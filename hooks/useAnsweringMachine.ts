
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { encode, decode, decodeAudioData, createPcmBlob } from '../utils/audio';
import type { Transcript } from '../types';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export function useAnsweringMachine() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const mainAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const micSourceForInput = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const recorderDestinationNode = useRef<MediaStreamAudioDestinationNode | null>(null);

  const nextAudioStartTime = useRef(0);
  const audioPlaybackSources = useRef(new Set<AudioBufferSourceNode>());

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const transcriptIdCounter = useRef(0);

  const handleServerMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      const text = message.serverContent.inputTranscription.text;
      const isFinal = message.serverContent.inputTranscription.isFinal;
      currentInputTranscription.current += text;
      updateTranscript('You', currentInputTranscription.current, isFinal);
    }

    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      const isFinal = message.serverContent.outputTranscription.isFinal;
      currentOutputTranscription.current += text;
      updateTranscript('Answering Machine', currentOutputTranscription.current, isFinal);
    }

    if (message.serverContent?.turnComplete) {
      currentInputTranscription.current = '';
      currentOutputTranscription.current = '';
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && mainAudioContext.current) {
      nextAudioStartTime.current = Math.max(nextAudioStartTime.current, mainAudioContext.current.currentTime);
      const audioBuffer = await decodeAudioData(decode(base64Audio), mainAudioContext.current, OUTPUT_SAMPLE_RATE, 1);
      const source = mainAudioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      
      source.connect(mainAudioContext.current.destination);
      if (recorderDestinationNode.current) {
        source.connect(recorderDestinationNode.current);
      }

      source.addEventListener('ended', () => { audioPlaybackSources.current.delete(source); });
      source.start(nextAudioStartTime.current);
      nextAudioStartTime.current += audioBuffer.duration;
      audioPlaybackSources.current.add(source);
    }

    if (message.serverContent?.interrupted) {
      for (const source of audioPlaybackSources.current.values()) {
        source.stop();
        audioPlaybackSources.current.delete(source);
      }
      nextAudioStartTime.current = 0;
    }
  }, []);

  const updateTranscript = useCallback((speaker: 'You' | 'Answering Machine', text: string, isFinal: boolean) => {
    setTranscripts(prev => {
      const lastTranscript = prev[prev.length - 1];
      if (lastTranscript && lastTranscript.speaker === speaker && !lastTranscript.isFinal) {
        const updated = [...prev];
        updated[prev.length - 1] = { ...lastTranscript, text, isFinal };
        return updated;
      } else {
        transcriptIdCounter.current++;
        return [...prev, { id: transcriptIdCounter.current, speaker, text, isFinal }];
      }
    });
  }, []);

  const endCall = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    if (scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
    }
    if (micSourceForInput.current) {
      micSourceForInput.current.disconnect();
      micSourceForInput.current = null;
    }
    if (inputAudioContext.current) {
      inputAudioContext.current.close();
      inputAudioContext.current = null;
    }
    if (mainAudioContext.current) {
      mainAudioContext.current.close();
      mainAudioContext.current = null;
    }
    if (sessionPromise.current) {
      sessionPromise.current.then(session => session.close());
      sessionPromise.current = null;
    }
    for (const source of audioPlaybackSources.current.values()) {
      source.stop();
    }
    audioPlaybackSources.current.clear();
    nextAudioStartTime.current = 0;
    setIsConnecting(false);
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startCall = useCallback(async () => {
    setIsConnecting(true);
    setTranscripts([]);
    setRecordingUrl(null);
    transcriptIdCounter.current = 0;
    clearError();

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      mainAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

      recorderDestinationNode.current = mainAudioContext.current.createMediaStreamDestination();
      const micSourceForRecording = mainAudioContext.current.createMediaStreamSource(mediaStream.current);
      micSourceForRecording.connect(recorderDestinationNode.current);

      mediaRecorder.current = new MediaRecorder(recorderDestinationNode.current.stream);
      recordedChunks.current = [];
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        recordedChunks.current = [];
      };
      mediaRecorder.current.start();

      sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a friendly and helpful personal answering machine. Your goal is to take a message for the user. Keep your responses concise and start the conversation by saying "Welcome to the answering machine of Vinay Mohan Das. How can I help you today?"',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened.');
            if (mediaStream.current && inputAudioContext.current) {
              micSourceForInput.current = inputAudioContext.current.createMediaStreamSource(mediaStream.current);
              scriptProcessor.current = inputAudioContext.current.createScriptProcessor(4096, 1, 1);

              scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                // Fix: Per Gemini API guidelines, rely solely on the session promise to resolve before sending data.
                // The conditional check is not needed and can cause issues.
                sessionPromise.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              micSourceForInput.current.connect(scriptProcessor.current);
              scriptProcessor.current.connect(inputAudioContext.current.destination);
            }
            setIsConnecting(false);
          },
          onmessage: handleServerMessage,
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError(new Error(e.message || 'A network error occurred.'));
            setIsConnecting(false);
            endCall();
          },
          onclose: (e: CloseEvent) => {
            console.log('Session closed.');
            setIsConnecting(false);
          },
        }
      });
      await sessionPromise.current;

    } catch (error) {
      console.error("Failed to start call:", error);
      setError(error as Error);
      setIsConnecting(false);
      endCall();
      throw error;
    }
  }, [handleServerMessage, endCall, clearError]);

  const clearRecording = useCallback(() => {
    setRecordingUrl(null);
  }, []);

  return { startCall, endCall, transcripts, isConnecting, recordingUrl, clearRecording, error, clearError };
}