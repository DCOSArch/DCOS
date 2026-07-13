"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  className?: string;
  shimmerWidth?: number;
  speed?: number;
}

export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  className,
  shimmerWidth = 100,
  speed = 3,
}) => {
  return (
    <div
      className={cn(
        "inline-block bg-clip-text text-transparent bg-no-repeat",
        "animate-[shimmer_var(--speed)_infinite_linear]",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0) 100%)`,
        backgroundSize: `${shimmerWidth}px 100%`,
        backgroundColor: "rgba(255,255,255,0.2)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        ["--speed" as any]: `${speed}s`,
      }}
    >
      {text}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -${shimmerWidth}px 0;
          }
          100% {
            background-position: calc(100% + ${shimmerWidth}px) 0;
          }
        }
      `}</style>
    </div>
  );
};
