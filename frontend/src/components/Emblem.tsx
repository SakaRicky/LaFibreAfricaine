// Gold interwoven-diamond emblem — geometric nod to woven fibre and toghu motifs.
export default function Emblem({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.4">
        <rect x="16.5" y="4.5" width="15" height="15" transform="rotate(45 24 12)" />
        <rect x="16.5" y="28.5" width="15" height="15" transform="rotate(45 24 36)" />
        <rect x="4.5" y="16.5" width="15" height="15" transform="rotate(45 12 24)" />
        <rect x="28.5" y="16.5" width="15" height="15" transform="rotate(45 36 24)" />
      </g>
      <rect x="21" y="21" width="6" height="6" transform="rotate(45 24 24)" fill="currentColor" />
    </svg>
  );
}
