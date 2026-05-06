import React from "react";
import { View } from "react-native";

interface Props {
  size: number;
  progress: number;
  color: string;
  trackColor: string;
  ticks?: number;
  tickWidth?: number;
  tickHeight?: number;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<Props> = ({
  size,
  progress,
  color,
  trackColor,
  ticks = 56,
  tickWidth = 4,
  tickHeight = 14,
  children,
}) => {
  const safe = Math.min(1, Math.max(0, progress));
  const radius = size / 2 - tickHeight / 2 - 4;

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: ticks }).map((_, i) => {
        const angleDeg = (i / ticks) * 360 - 90;
        const angleRad = (angleDeg * Math.PI) / 180;
        const isActive = i / ticks < safe;
        const cx = size / 2 + Math.cos(angleRad) * radius;
        const cy = size / 2 + Math.sin(angleRad) * radius;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: cx - tickWidth / 2,
              top: cy - tickHeight / 2,
              width: tickWidth,
              height: tickHeight,
              backgroundColor: isActive ? color : trackColor,
              borderRadius: tickWidth / 2,
              transform: [{ rotate: `${angleDeg + 90}deg` }],
            }}
          />
        );
      })}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </View>
  );
};

export default CircularProgress;
