interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const LOGO_ASSET_PATH = `${import.meta.env.BASE_URL}cropped-logo-removebg-preview.webp`;

export function Logo({ variant = "full", className = "" }: LogoProps) {
  return (
    <span className={`logo ${className}`.trim()}>
      <img
        src={LOGO_ASSET_PATH}
        alt="Mitra Maheshwari Seva Pratishthan"
        className="logo__img"
      />
      {variant === "full" && (
        <span className="logo__text">
          <span className="logo__name">Mitra Maheshwari</span>
          <span className="logo__sub">Seva Pratishthan</span>
        </span>
      )}
    </span>
  );
}