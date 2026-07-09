import { useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function VoiceRecorder({ onSend, onCancel, disabled }) {
  const [state, setState] = useState("idle"); // idle | recording | preview
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, []);

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setState("preview");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setState("recording");
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      setError("Microphone access denied.");
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }

  function discard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setState("idle");
    onCancel?.();
  }

  async function send() {
    if (!audioBlob) return;
    const ext = audioBlob.type.includes("ogg") ? "ogg" : "webm";
    const file = new File([audioBlob], `voice-${Date.now()}.${ext}`, { type: audioBlob.type });
    await onSend(file);
    discard();
  }

  return (
    <div className="voice-recorder">
      {error && <p className="voice-recorder__error">{error}</p>}

      {state === "idle" && (
        <button
          type="button"
          className="voice-btn voice-btn--record"
          title="Record voice message"
          aria-label="Record voice message"
          disabled={disabled}
          onClick={startRecording}
        >
          <Mic size={17} />
        </button>
      )}

      {state === "recording" && (
        <div className="voice-recorder__active">
          <span className="voice-recorder__dot" aria-hidden="true" />
          <span className="voice-recorder__time">{formatDuration(duration)}</span>
          <button
            type="button"
            className="voice-btn voice-btn--stop"
            title="Stop recording"
            aria-label="Stop recording"
            onClick={stopRecording}
          >
            <Square size={14} />
          </button>
          <button
            type="button"
            className="voice-btn voice-btn--discard"
            title="Discard"
            aria-label="Discard recording"
            onClick={discard}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {state === "preview" && audioUrl && (
        <div className="voice-recorder__preview">
          <audio src={audioUrl} controls className="voice-recorder__audio" />
          <span className="voice-recorder__time">{formatDuration(duration)}</span>
          <button
            type="button"
            className="voice-btn voice-btn--send"
            title="Send voice message"
            aria-label="Send voice message"
            disabled={disabled}
            onClick={send}
          >
            <Send size={14} />
          </button>
          <button
            type="button"
            className="voice-btn voice-btn--discard"
            title="Discard"
            aria-label="Discard recording"
            onClick={discard}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
