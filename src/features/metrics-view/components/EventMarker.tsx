interface EventMarkerProps {
  x: number;
  height: number;
  label: string;
}

export function EventMarker({ x, height, label }: EventMarkerProps) {
  return (
    <g aria-label={label} role="img">
      <line
        x1={x}
        x2={x}
        y1={10}
        y2={height - 10}
        stroke="#64748B"
        strokeDasharray="2 4"
        strokeOpacity="0.55"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={x - 3}
        y="7"
        width="6"
        height="6"
        rx="1.5"
        fill="#64748B"
        stroke="white"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
