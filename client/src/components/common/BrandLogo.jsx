const BRAND_ASSETS = {
  color: {
    full: "/brand/eksaha-horizontal.svg",
    compact: "/brand/eksaha-icon.svg",
  },
  white: {
    full: "/brand/eksaha-horizontal-white.svg",
    compact: "/brand/eksaha-icon-white.svg",
  },
};

function LogoImage({ compact, tone, alt, sizeClass, imageClassName }) {
  const dimensions = compact ? { width: 40, height: 40 } : { width: 160, height: 60 };

  return (
    <img
      src={BRAND_ASSETS[tone][compact ? "compact" : "full"]}
      alt={alt}
      {...dimensions}
      draggable="false"
      className={`${sizeClass} shrink-0 object-contain ${imageClassName}`}
    />
  );
}

export function BrandLogo({
  compact = false,
  size = "md",
  tone = "auto",
  alt = "EkSaha",
  className = "",
  imageClassName = "",
}) {
  const sizeClass = compact ? "size-10" : size === "sm" ? "h-12 w-auto" : "h-14 w-auto";

  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      {tone === "auto" ? (
        <>
          <LogoImage compact={compact} tone="color" alt={alt} sizeClass={sizeClass} imageClassName={`dark:hidden ${imageClassName}`} />
          <LogoImage compact={compact} tone="white" alt={alt} sizeClass={sizeClass} imageClassName={`hidden dark:block ${imageClassName}`} />
        </>
      ) : (
        <LogoImage compact={compact} tone={tone} alt={alt} sizeClass={sizeClass} imageClassName={imageClassName} />
      )}
    </span>
  );
}
