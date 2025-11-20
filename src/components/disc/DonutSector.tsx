import React from 'react';

interface DonutSectorProps {
  startAngle: number; // degrees
  endAngle: number;   // degrees
  innerRadius: number; // px
  outerRadius: number; // px
  color: string;
  center?: number; // px, default 200
  style?: React.CSSProperties;
}

// Utility to convert polar to cartesian
function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
}

// Generate a clip-path polygon for a donut sector
function getDonutSectorClipPath(
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  outerRadius: number,
  center: number
) {
  // Use a small step for smoothness (1 degree)
  const points = [];
  const step = 1; // 1 degree for smooth curves
  // Outer arc
  for (let a = startAngle; a <= endAngle; a += step) {
    const { x, y } = polarToCartesian(center, outerRadius, a);
    points.push(`${x}px ${y}px`);
  }
  // End of outer arc
  const { x: xEnd, y: yEnd } = polarToCartesian(center, outerRadius, endAngle);
  points.push(`${xEnd}px ${yEnd}px`);
  // Inner arc (reverse)
  for (let a = endAngle; a >= startAngle; a -= step) {
    const { x, y } = polarToCartesian(center, innerRadius, a);
    points.push(`${x}px ${y}px`);
  }
  // Start of inner arc
  const { x: xStart, y: yStart } = polarToCartesian(center, innerRadius, startAngle);
  points.push(`${xStart}px ${yStart}px`);
  return `polygon(${points.join(',')})`;
}

export const DonutSector: React.FC<DonutSectorProps> = ({
  startAngle,
  endAngle,
  innerRadius,
  outerRadius,
  color,
  center = 400,
  style = {},
}) => {
  const clipPath = getDonutSectorClipPath(startAngle, endAngle, innerRadius, outerRadius, center);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: center * 2,
        height: center * 2,
        background: color,
        clipPath,
        WebkitClipPath: clipPath,
        zIndex: 2,
        ...style,
      }}
    />
  );
};
