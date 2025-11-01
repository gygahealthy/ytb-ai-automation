interface PlayheadProps {
  position: number;
  hasScenes: boolean;
}

export default function Playhead({ position, hasScenes }: PlayheadProps) {
  if (!hasScenes) return null;

  return (
    <div
      className="absolute w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-cyan-500 dark:from-cyan-400 dark:via-blue-500 dark:to-cyan-400 shadow-lg shadow-cyan-400/60 dark:shadow-cyan-500/50 pointer-events-none transition-all duration-100"
      style={{
        left: `${position + 8}px`, // +8px to align with timeline marks that start at pl-2 padding
        top: "0px",
        height: "calc(100% - 8px)",
        zIndex: 50,
      }}
    >
      {/* Playhead marker triangle at the top */}
      <div
        className="absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-500 dark:border-t-cyan-400"
        style={{
          top: "0px",
          left: "-5.5px",
        }}
      />
    </div>
  );
}
