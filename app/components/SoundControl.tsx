interface SoundControlProps {
  readonly muted: boolean;
  readonly volume: number;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onVolumeChange: (volume: number) => void;
}

/** Lives in the header for now. Ticket 09 moves it into the settings panel. */
export function SoundControl({
  muted,
  volume,
  onMutedChange,
  onVolumeChange,
}: SoundControlProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onMutedChange(!muted)}
        aria-pressed={muted}
        aria-label={muted ? "Unmute sound" : "Mute sound"}
        className="rounded-sm border border-stage-edge px-2 py-1.5 text-xs text-bone-dim transition-colors hover:border-brass-dim hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-hot"
      >
        {muted ? "Sound off" : "Sound on"}
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        disabled={muted}
        onChange={(event) => onVolumeChange(Number(event.target.value))}
        aria-label="Volume"
        className="h-1 w-16 cursor-pointer accent-brass disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}
