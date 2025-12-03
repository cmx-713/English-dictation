import { useState, useEffect, useCallback } from 'react';

export const useSpeech = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1); // 1 is normal speed
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filter for English voices
      const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
      setVoices(englishVoices);
      
      // Default to a decent voice if possible (Google US English, Microsoft Zira, etc.)
      if (!selectedVoice && englishVoices.length > 0) {
         const preferred = englishVoices.find(v => v.name.includes('Google US English')) || 
                           englishVoices.find(v => v.name.includes('US')) || 
                           englishVoices[0];
         setSelectedVoice(preferred);
      }
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [selectedVoice]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!text) return;

    window.speechSynthesis.cancel(); // Stop previous

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = (e) => {
        console.error("Speech error", e);
        setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, rate]);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    speak,
    cancel,
    isPlaying
  };
};

