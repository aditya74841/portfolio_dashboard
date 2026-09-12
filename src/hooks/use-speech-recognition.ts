"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// Extend Window interface for Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface UseSpeechRecognitionOptions {
  onFinalTranscript?: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

export function useSpeechRecognition({
  onFinalTranscript,
  lang = "en-US",
  continuous = true,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptChunk = result[0]?.transcript || "";

          if (result.isFinal) {
            const finalizedText = transcriptChunk.trim();
            if (finalizedText) {
              if (onFinalTranscriptRef.current) {
                onFinalTranscriptRef.current(finalizedText);
              }
            }
          } else {
            currentInterim += transcriptChunk;
          }
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        console.warn("Speech recognition event:", errType);

        if (errType === "not-allowed" || errType === "service-not-allowed") {
          shouldListenRef.current = false;
          setIsListening(false);
          setError("Microphone permission denied.");
          toast.error("Microphone access was denied. Please allow microphone permissions in your browser.");
        } else if (errType === "no-speech") {
          // Normal timeout on silence - do not display an error
        } else if (errType === "network") {
          setError("Network error occurred during speech recognition.");
        }
      };

      recognition.onend = () => {
        setInterimTranscript("");
        // If the user hasn't explicitly stopped, auto-restart to maintain continuous dictation
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to initialize SpeechRecognition:", err);
      setIsSupported(false);
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, [lang, continuous]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      shouldListenRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
      toast.info("Voice typing started. Speak your thoughts…", { duration: 2500 });
    } catch {
      // If already started, ignore error
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setInterimTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}

