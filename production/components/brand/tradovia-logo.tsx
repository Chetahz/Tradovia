import Link from "next/link";

type TradoviaLogoProps = {
  compact?: boolean;
  href?: string;
};

export function TradoviaLogo({ compact = false, href = "/" }: TradoviaLogoProps) {
  return (
    <Link className={`tradovia-logo${compact ? " tradovia-logo--compact" : ""}`} href={href} aria-label="Tradovia home">
      <span className="tradovia-logo__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="tradovia-logo__word">TRADOVIA</span>
    </Link>
  );
}
