interface AlertMarkerProps {
  x: number;
  y?: number;
  height: number;
  severity?: string | null;
  label: string;
}

const severityColor = (severity?: string | null) => {
  if (severity === "CRITICAL") return "#DC2626";
  if (severity === "HIGH") return "#EF4444";
  if (severity === "MEDIUM") return "#F97316";
  return "#F59E0B";
};

export function AlertMarker({ x, y = 12, height, severity, label }: AlertMarkerProps) {
  const color = severityColor(severity);
  return (
    <g aria-label={label} role="img">
      <line
        x1={x}
        x2={x}
        y1={8}
        y2={height - 8}
        stroke={color}
        strokeDasharray="3 3"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x}
        cy={y}
        r="4"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
