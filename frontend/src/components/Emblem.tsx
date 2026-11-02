// Shared brand mark; the adjacent wordmark supplies the accessible brand name.
export default function Emblem({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <img
      src="/brand/golden-floral-diamond-logo.png"
      alt=""
      aria-hidden="true"
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
