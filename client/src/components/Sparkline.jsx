export default function Sparkline({ data = [], width = 80, height = 24, stroke = '#0ea5a4' }) {
  const series = (data || []).map((d) => Number(d)).filter((n) => Number.isFinite(n));
  if (series.length === 0) {
    return <svg width={width} height={height} />;
  }

  const max = Math.max(...series);
  const min = Math.min(...series);
  const range = max - min || 1;

  const points = series.map((d, i) => {
    const x = series.length === 1 ? width / 2 : (i / (series.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={stroke} strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
