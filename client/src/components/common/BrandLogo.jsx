export const BRAND_LOGO_SRC = "/brand/eksaha-horizontal.svg";
export const BRAND_ICON_SRC = "/brand/eksaha-icon.svg";

export function BrandLogo({ compact = false, className = "", imageClassName = "" }) {
  const src = compact ? BRAND_ICON_SRC : BRAND_LOGO_SRC;
  const sizeClass = compact ? "h-9 w-9" : "h-7 w-auto sm:h-8";

  return (
    <span className={`inline-flex items-center ${className}`} aria-label="EkSaha">
      <img src={src} alt="" className={`brand-logo-image ${sizeClass} shrink-0 object-contain ${imageClassName}`} />
    </span>
  );
}
