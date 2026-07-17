import { useCallback, useEffect, useState } from 'react';
import {
  fetchCompanyBranding,
  fetchDefaultCompany,
  invalidateDefaultCompanyCache,
  resolveCompanyLogoUrl,
  type CompanyBrandingDto,
  type CompanyDto,
} from '../api/companies';

export interface CompanyBranding {
  businessName: string;
  logoText: string;
  logoImage: string;
  hasLogo: boolean;
  updatedAt?: string;
}

const DEFAULT_BRANDING: CompanyBranding = {
  businessName: 'IMS',
  logoText: 'Inventory + Production',
  logoImage: '',
  hasLogo: false,
};

function brandingFromPublic(dto: CompanyBrandingDto | null): CompanyBranding {
  if (!dto) return DEFAULT_BRANDING;
  const logoImage = resolveCompanyLogoUrl(dto.logoUrl);
  return {
    businessName: dto.businessName?.trim() || DEFAULT_BRANDING.businessName,
    logoText: dto.logoText?.trim() || DEFAULT_BRANDING.logoText,
    logoImage,
    hasLogo: dto.hasLogo && Boolean(logoImage),
    updatedAt: dto.updatedAt,
  };
}

function brandingFromCompany(company: CompanyDto | null): CompanyBranding {
  if (!company) return DEFAULT_BRANDING;
  const logoRef = company.logoUrl || company.logoImage;
  const logoImage = resolveCompanyLogoUrl(logoRef);
  return {
    businessName: company.businessName?.trim() || DEFAULT_BRANDING.businessName,
    logoText: company.logoText?.trim() || DEFAULT_BRANDING.logoText,
    logoImage,
    hasLogo: Boolean(company.hasLogo ?? logoImage),
    updatedAt: company.updatedAt,
  };
}

/** Loads default company logo/title for sidebar and login branding. */
export function useCompanyBranding(options?: { yearDb?: string; authenticated?: boolean }) {
  const yearDb = options?.yearDb?.trim() || undefined;
  const authenticated = options?.authenticated ?? false;
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (authenticated) {
        const company = await fetchDefaultCompany();
        setBranding(brandingFromCompany(company));
      } else {
        const publicBranding = await fetchCompanyBranding(yearDb);
        setBranding(brandingFromPublic(publicBranding));
      }
    } finally {
      setLoading(false);
    }
  }, [authenticated, yearDb]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onBrandingChanged = () => {
      void refresh();
    };
    window.addEventListener('ims:company-branding-changed', onBrandingChanged);
    return () => window.removeEventListener('ims:company-branding-changed', onBrandingChanged);
  }, [refresh]);

  return { branding, loading, refresh };
}

export function refreshCompanyBrandingCache() {
  invalidateDefaultCompanyCache();
}
