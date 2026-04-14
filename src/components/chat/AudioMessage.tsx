import { Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AudioMessageProps {
  src: string;
  duration?: number;
  isMe: boolean;
}

const AudioMessage = ({ src, duration, isMe }: AudioMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animRef = useRef<number>();

  const totalDuration = duration || 0;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      const tick = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
          setCurrentTime(audio.currentTime);
        }
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    };

    const onPause = () => {
      setIsPlaying(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isMe ? "bg-white/20 hover:bg-white/30" : "bg-foreground/10 hover:bg-foreground/20"
        }`}
      >
        {isPlaying ? (
          <Pause className={`w-3.5 h-3.5 ${isMe ? "text-primary-foreground" : "text-foreground"}`} />
        ) : (
          <Play className={`w-3.5 h-3.5 ${isMe ? "text-primary-foreground" : "text-foreground"}`} />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        {/* Waveform bar */}
        <div className={`h-1.5 rounded-full overflow-hidden ${isMe ? "bg-white/20" : "bg-foreground/10"}`}>
          <div
            className={`h-full rounded-full transition-all ${isMe ? "bg-white/80" : "bg-foreground/50"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
          {formatTime(isPlaying ? currentTime : totalDuration)}
        </span>
      </div>
    </div>
  );
};

export default AudioMessage;
