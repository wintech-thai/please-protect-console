export const applicationDict = {
  EN: {
    list: {
      title: "Applications",
      subHeader: "Query and inspect deployed applications",
      searchPlaceholder: "Filter by name, namespace, path, or repo URL",
      loading: "Loading applications...",
      noData: "No applications found",
      rowsPerPage: "Rows per page:",
      of: "of",
      columns: {
        name: "Name",
        namespace: "Namespace",
        path: "Path",
        repoUrl: "Repo URL",
      },
    },
    config: {
      title: "Application Config",
      serviceLabel: "Service",
      description: "Edit only custom YAML. Custom fields override default values.",
      sections: {
        defaultConfig: "Default Config",
        draftConfig: "Draft Config",
        diffPreview: "Diff Preview (Current Real Config vs Current Editor Value)",
        diffHint: "Left = current on main branch, Right = value in editor that will be saved/merged",
      },
      buttons: {
        reload: "Reload",
        resetDraft: "Reset Draft",
        saveDraft: "Save Draft",
        merge: "Merge",
      },
      confirm: {
        saveTitle: "Save Draft",
        saveMessage: "Confirm save current draft config?",
        mergeTitle: "Merge Draft to Main",
        mergeMessage: "Confirm merge draft config to main branch?",
        confirmSave: "Save",
        confirmMerge: "Merge",
        cancel: "Cancel",
      },
      toast: {
        reloadSuccess: "Reloaded latest configurations",
        saveSuccess: "Draft saved successfully",
        mergeSuccess: "Draft merged to main successfully",
        invalidFields: "Found fields that are not allowed by current/default configuration",
      },
    },
  },
  TH: {
    list: {
      title: "แอปพลิเคชัน",
      subHeader: "ค้นหาและตรวจสอบแอปพลิเคชันที่ถูกติดตั้ง",
      searchPlaceholder: "กรองด้วยชื่อ namespace path หรือ repo URL",
      loading: "กำลังโหลดแอปพลิเคชัน...",
      noData: "ไม่พบแอปพลิเคชัน",
      rowsPerPage: "จำนวนแถวต่อหน้า:",
      of: "จาก",
      columns: {
        name: "ชื่อ",
        namespace: "เนมสเปซ",
        path: "พาธ",
        repoUrl: "Repo URL",
      },
    },
    config: {
      title: "ตั้งค่าแอปพลิเคชัน",
      serviceLabel: "เซอร์วิส",
      description: "แก้ไขได้เฉพาะ custom YAML โดยค่าที่ระบุจะ override ค่า default",
      sections: {
        defaultConfig: "ค่า Default",
        draftConfig: "ค่า Draft",
        diffPreview: "ตัวอย่าง Diff (ค่าจริงปัจจุบันเทียบกับค่าในตัวแก้ไข)",
        diffHint: "ซ้าย = ค่าปัจจุบันบน main branch, ขวา = ค่าใน editor ที่จะถูก save/merge",
      },
      buttons: {
        reload: "รีโหลด",
        resetDraft: "รีเซ็ต Draft",
        saveDraft: "บันทึก Draft",
        merge: "รวมเข้าหลัก",
      },
      confirm: {
        saveTitle: "บันทึก Draft",
        saveMessage: "ยืนยันการบันทึกค่า Draft ปัจจุบันหรือไม่?",
        mergeTitle: "รวม Draft เข้าสู่ Main",
        mergeMessage: "ยืนยันการรวมค่า Draft เข้าสู่ main branch หรือไม่?",
        confirmSave: "บันทึก",
        confirmMerge: "รวม",
        cancel: "ยกเลิก",
      },
      toast: {
        reloadSuccess: "รีโหลดค่าล่าสุดเรียบร้อย",
        saveSuccess: "บันทึก Draft สำเร็จ",
        mergeSuccess: "รวม Draft สำเร็จ",
        invalidFields: "พบฟิลด์ที่ไม่อนุญาตตามค่า current/default",
      },
    },
  },
};

export type ApplicationDict = typeof applicationDict.EN;
