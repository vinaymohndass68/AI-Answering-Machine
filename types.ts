
export interface Transcript {
  id: number;
  speaker: 'You' | 'Answering Machine';
  text: string;
  isFinal: boolean;
}
