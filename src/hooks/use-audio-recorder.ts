"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface UseAudioRecorderOptions {
  onTranscription?: (text: string) => void;
}

export function useAudioRecorder({ onTranscription }: UseAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTranscriptionRef = useRef(onTranscription);

  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
  }, [onTranscription]);

  // Clean up recording and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      chunksRef.current = [];

      // Determine supported audio MIME type
      let mimeType = "";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
          mimeType = "audio/ogg";
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop audio tracks so browser microphone indicator turns off
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setStream(null);

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        if (audioBlob.size === 0) {
          setIsTranscribing(false);
          return;
        }

        // Send to server Groq Whisper endpoint
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
          formData.append("audio", audioBlob, `recording.${ext}`);

          const result = await apiFetch<{ text?: string }>("/diary/transcribe", { method: "POST", body: formData });

          const text = result.text?.trim() || "";
          if (text) {
            if (onTranscriptionRef.current) {
              onTranscriptionRef.current(text);
            }
            toast.success("Voice note transcribed by Whisper AI!");
          } else {
            toast.info("No speech detected in audio.");
          }
        } catch (err: any) {
          console.error("Transcription error:", err);
          toast.error(err.message || "Transcription failed.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250); // Collect data slices every 250ms
      setIsRecording(true);
      setDuration(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      toast.info("Recording started. Speak your thoughts…", { duration: 2000 });
    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Please allow microphone permissions in your browser.");
      } else {
        toast.error("Could not access microphone.");
      }
      setIsRecording(false);
      setStream(null);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);

    chunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsTranscribing(false);
    setDuration(0);
    toast.info("Voice recording cancelled.");
  }, []);

  return {
    isRecording,
    isTranscribing,
    duration,
    stream,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
