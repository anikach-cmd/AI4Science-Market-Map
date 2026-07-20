import { useMemo, useState } from "react";
import { extractDomain, faviconUrl, logoDevUrl } from "../config/logo";
import { monogramColor, monogramLetter } from "../utils/monogram";

interface CompanyLogoProps {
  name: string;
  websiteUrl: string;
  size?: number;
}

/**
 * Tries logo.dev, then a favicon service, then a colored monogram.
 * Never renders a broken <img>.
 */
export function CompanyLogo({ name, websiteUrl, size = 28 }: CompanyLogoProps) {
  const domain = useMemo(() => extractDomain(websiteUrl), [websiteUrl]);
  const sources = useMemo(
    () => (domain ? [logoDevUrl(domain), faviconUrl(domain)] : []),
    [domain]
  );
  const [stage, setStage] = useState(0);

  const showImage = domain && stage < sources.length;

  if (showImage) {
    return (
      <img
        key={sources[stage]}
        src={sources[stage]}
        alt=""
        width={size}
        height={size}
        className="company-logo-img"
        style={{ width: size, height: size }}
        onError={() => setStage((s) => s + 1)}
      />
    );
  }

  return (
    <div
      className="company-logo-monogram"
      style={{
        width: size,
        height: size,
        background: monogramColor(name || domain),
        fontSize: size * 0.5,
      }}
    >
      {monogramLetter(name || domain)}
    </div>
  );
}
