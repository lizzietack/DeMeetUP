import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, X } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

interface VoiceRecorderProps {
  onSend: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onSend, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // If permission denied or unavailable
      alert("Microphone access is required to record voice notes.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  }, []);

  const cancelRecording = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecordedBlob(null);
    setDuration(0);
  }, [isRecording]);

  const handleSend = useCallback(() => {
    if (recordedBlob) {
      onSend(recordedBlob, duration);
      setRecordedBlob(null);
      setDuration(0);
    }
  }, [recordedBlob, duration, onSend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // If we have a recorded blob, show send/cancel UI
  if (recordedBlob) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-destructive" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-sm text-foreground font-mono">{formatTime(duration)}</span>
          <span className="text-xs text-muted-foreground">Voice note</span>
        </div>
        <button
          onClick={handleSend}
          disabled={disabled}
          className="w-9 h-9 rounded-full gradient-gold flex items-center justify-center glow-gold disabled:opacity-50"
        >
          <Send className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    );
  }

  // If recording, show stop UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={cancelRecording}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5 text-destructive" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-secondary rounded-full px-4 py-2.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-sm text-foreground font-mono">{formatTime(duration)}</span>
          <span className="text-xs text-muted-foreground">Recording...</span>
        </div>
        <button
          onClick={stopRecording}
          className="w-9 h-9 rounded-full bg-destructive flex items-center justify-center"
        >
          <Square className="w-4 h-4 text-white fill-white" />
        </button>
      </div>
    );
  }

  // Default: just the mic button (rendered by parent, but we expose startRecording)
  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
    >
      <Mic className="w-5 h-5 text-muted-foreground" />
    </button>
  );
};

export default VoiceRecorder;
