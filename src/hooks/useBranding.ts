"use client";

import { useState, useEffect } from 'react';

interface BrandingData {
  shortName: string;
  logoUrl: string;
  description: string[];
}

export const useBranding = () => {
  const [branding, setBranding] = useState<BrandingData>({
    shortName: "PLEASE-PROTECT",
    logoUrl: "",
    description: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const orgId = localStorage.getItem("orgId") || "default"; 
        

        const [shortNameRes, logoRes, descRes] = await Promise.allSettled([
          fetch(`${baseUrl}/api/Configuration/org/${orgId}/action/GetOrgShortName`),
          fetch(`${baseUrl}/api/Configuration/org/${orgId}/action/GetLogo`),
          fetch(`${baseUrl}/api/Configuration/org/${orgId}/action/GetOrgDescription`),
        ]);

        let fetchedShortName = "PLEASE-PROTECT";
        let fetchedLogoUrl = "";
        let fetchedDescription: string[] = [];

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

        if (descRes.status === 'fulfilled' && descRes.value.ok) {
          const data = await descRes.value.json();
          if (data.status === "SUCCESS" && data.configuration?.configValue) {
            fetchedDescription = data.configuration.configValue
              .split("|")
              .map((s: string) => s.trim())
              .filter(Boolean)
              .slice(0, 2);
          }
        }

        setBranding({
          shortName: fetchedShortName,
          logoUrl: fetchedLogoUrl,
          description: fetchedDescription,
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