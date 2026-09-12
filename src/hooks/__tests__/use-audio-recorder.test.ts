import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudioRecorder } from "../use-audio-recorder";

describe("useAudioRecorder", () => {
  let mockTrack: any;
  let mockStream: any;
  let mockMediaRecorderInstance: any;

  beforeEach(() => {
    mockTrack = { stop: vi.fn() };
    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
    };

    class MockMediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      state = "inactive";
      ondataavailable: any = null;
      onstop: any = null;
      start = vi.fn(function (this: any) {
        this.state = "recording";
      });
      stop = vi.fn(function (this: any) {
        this.state = "inactive";
        if (this.onstop) this.onstop();
      });

      constructor() {
        mockMediaRecorderInstance = this;
      }
    }

    (window as any).MediaRecorder = MockMediaRecorder;

    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn(async () => mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    delete (window as any).MediaRecorder;
    vi.clearAllMocks();
  });

  it("initializes with default idle state", () => {
    const { result } = renderHook(() => useAudioRecorder());
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.duration).toBe(0);
  });

  it("starts and stops recording correctly", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockMediaRecorderInstance.start).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.stopRecording();
    });

    expect(mockMediaRecorderInstance.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
  });

  it("cancels recording and stops audio tracks cleanly", async () => {
    const { result } = renderHook(() => useAudioRecorder());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      result.current.cancelRecording();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.duration).toBe(0);
  });
});

