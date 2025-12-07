/**
 * YouTubePlayer Component
 * 
 * Integrates YouTube Iframe API with playback control and time tracking.
 * Supports seeking to specific timestamps for timeline notes.
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YouTubePlayerProps {
  videoId: string; // YouTube video ID (e.g., "dQw4w9WgXcQ")
  onTimeUpdate?: (currentTime: number) => void;
  onReady?: () => void;
  initialTime?: number; // Start at specific time (in seconds)
  autoplay?: boolean;
}

// Declare YouTube Iframe API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, onTimeUpdate, onReady, initialTime = 0, autoplay = false }, ref) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  /**
   * Load YouTube Iframe API
   */
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load API script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set callback for when API is ready
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  /**
   * Initialize YouTube player
   */
  const initializePlayer = () => {
    if (!containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        start: initialTime,
      },
      events: {
        onReady: handlePlayerReady,
        onStateChange: handleStateChange,
      },
    });
  };

  /**
   * Handle player ready event
   */
  const handlePlayerReady = () => {
    setIsReady(true);
    setDuration(playerRef.current.getDuration());
    onReady?.();

    // Start time tracking
    const interval = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  /**
   * Handle player state change
   */
  const handleStateChange = (event: any) => {
    const state = event.data;
    // 1 = playing, 2 = paused
    setIsPlaying(state === 1);
  };

  /**
   * Play/Pause toggle
   */
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  /**
   * Seek to specific time
   */
  const seekTo = (seconds: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(seconds, true);
  };

  /**
   * Skip forward/backward
   */
  const skip = (seconds: number) => {
    if (!playerRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seekTo(newTime);
  };

  /**
   * Format time as MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    seekTo,
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
  }));

  return (
    <div className="space-y-4 mb-4">
      {/* Player Container */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Custom Controls */}
      {isReady && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => skip(-10)}
            title="後退 10 秒"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayPause}
            title={isPlaying ? "暫停" : "播放"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => skip(10)}
            title="前進 10 秒"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="flex-1 text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
    </div>
  );
});

YouTubePlayer.displayName = 'YouTubePlayer';
