import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "../use-speech-recognition";

describe("useSpeechRecognition", () => {
  let mockRecognitionInstance: any;

  beforeEach(() => {
    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "";
      start = vi.fn(function (this: any) {
        if (this.onstart) this.onstart();
      });
      stop = vi.fn(function (this: any) {
        if (this.onend) this.onend();
      });
      abort = vi.fn();
      onstart: any = null;
      onresult: any = null;
      onerror: any = null;
      onend: any = null;

      constructor() {
        mockRecognitionInstance = this;
      }
    }

    (window as any).SpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
    vi.clearAllMocks();
  });

  it("detects browser support correctly", () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.isSupported).toBe(true);
    expect(result.current.isListening).toBe(false);
  });

  it("starts and stops listening correctly", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(mockRecognitionInstance.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.stopListening();
    });

    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  it("delivers final transcript to callback", () => {
    const onFinalTranscript = vi.fn();
    const { result } = renderHook(() =>
      useSpeechRecognition({ onFinalTranscript })
    );

    act(() => {
      result.current.startListening();
    });

    // Simulate final speech event
    act(() => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: "Today was a great day." }], { isFinal: true }),
        ],
      });
    });

    expect(onFinalTranscript).toHaveBeenCalledWith("Today was a great day.");
  });

  it("updates interim transcript while speaking", () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    act(() => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: "Today was" }], { isFinal: false }),
        ],
      });
    });

    expect(result.current.interimTranscript).toBe("Today was");
  });
});

