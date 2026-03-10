"use client";

import { useState, useEffect } from 'react';

interface BrandingData {
  shortName: string;
  logoUrl: string;
}

export const useBranding = () => {
  const [branding, setBranding] = useState<BrandingData>({
    shortName: "PLEASE-PROTECT", 
    logoUrl: "",                 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const orgId = localStorage.getItem("orgId") || "default"; 
        

        const [shortNameRes, logoRes] = await Promise.allSettled([
          fetch(`${baseUrl}/api/Configuration/org/${orgId}/action/GetOrgShortName`), 
          fetch(`${baseUrl}/api/Configuration/org/${orgId}/action/GetLogo`)
        ]);

        let fetchedShortName = "PLEASE-PROTECT";
        let fetchedLogoUrl = "";

        if (shortNameRes.status === 'fulfilled' && shortNameRes.value.ok) {
          const data = await shortNameRes.value.json();
          if (data.status === "SUCCESS" && data.configuration?.configValue) {
            fetchedShortName = data.configuration.configValue; 
          }
        }

        if (logoRes.status === 'fulfilled' && logoRes.value.ok) {
          const data = await logoRes.value.json();
          if (data.status === "SUCCESS" && data.configuration?.configValue) {
            fetchedLogoUrl = data.configuration.configValue; 
          }
        }

        setBranding({
          shortName: fetchedShortName,
          logoUrl: fetchedLogoUrl
        });

      } catch (error) {
        console.error("Failed to fetch branding data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return { branding, isLoading };
};