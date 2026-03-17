
"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "./use-confirm";
import { useLanguage } from "@/context/LanguageContext";

type NavigationBlockerContextType = {
  setFormDirty: (isDirty: boolean) => void;
  isFormDirty: boolean;
  handleNavigation: (href: string) => Promise<void>;
};

const NavigationBlockerContext = createContext<NavigationBlockerContextType | null>(null);

type NavigationBlockerProviderProps = {
  children: ReactNode;
};

export function NavigationBlockerProvider({ children }: NavigationBlockerProviderProps) {
  const [isFormDirty, setIsFormDirty] = useState(false);
  const router = useRouter();
  const language = useLanguage();

  const langKey = useMemo(() => {
    switch (language.language) {
      case "EN": {
        return {
          title: "Unsaved Changes",
          message: "You have unsaved changes. Are you sure you want to leave without saving?",
          variant: "destructive",
          cancelButton: "Cancel",
          confirmButton: "OK"
        }
      }
      case "TH": {
        return {
          title: "การเปลี่ยนแปลงที่ยังไม่ได้บันทึก",
          message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกโดยไม่บันทึก?",
          variant: "destructive",
          cancelButton: "ยกเลิก",
          confirmButton: "ตกลง"
        }
      }
    }
  }, [language]);

  const [ConfirmDialog, confirm] = useConfirm({
    ...langKey,
    variant: "destructive"
  });

  const handleNavigation = useCallback(
    async (href: string) => {
      if (isFormDirty) {
        const ok = await confirm();
        if (ok) {
          setIsFormDirty(false);
          router.push(href);
        }
      } else {
        router.push(href);
      }
    },
    [isFormDirty, confirm, router]
  );

  const setFormDirty = useCallback((isDirty: boolean) => {
    setIsFormDirty(isDirty);
  }, []);

  return (
    <NavigationBlockerContext.Provider
      value={{
        setFormDirty,
        isFormDirty,
        handleNavigation,
      }}
    >
      <ConfirmDialog />
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useFormNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error("useFormNavigationBlocker must be used within NavigationBlockerProvider");
  }
  return context;
}
