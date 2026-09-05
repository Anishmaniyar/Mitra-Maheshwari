import { useState } from "react";

/**
 * Organization logo. The real asset ships at /cropped-logo-removebg-preview.webp
 * (frontend/public/); if it is ever missing the component falls back to a
 * clean monogram automatically.
 */
interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const LOGO_ASSET_PATH = "/cropped-logo-removebg-preview.webp";

export function Logo({ variant = "full", className = "" }: LogoProps) {
  const [assetFailed, setAssetFailed] = useState(false);

  const mark = assetFailed ? (
    <span className="logo__mark" aria-hidden="true">
      MM
    </span>
  ) : (
    <img
      src={LOGO_ASSET_PATH}
      alt="Mitra Maheshwari Seva Pratishthan"
      className="logo__img"
      onError={() => setAssetFailed(true)}
    />
  );

  return (
    <span className={`logo ${className}`.trim()}>
      {mark}
      {variant === "full" && (
        <span className="logo__text">
          <span className="logo__name">Mitra Maheshwari</span>
          <span className="logo__sub">Seva Pratishthan</span>
        </span>
      )}
    </span>
  );
}