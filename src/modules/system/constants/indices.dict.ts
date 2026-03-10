export const INDICES_DICT = {
  en: {
    toolbar: {
      title: "Index Management",
      subtitle: "Indices & ILM Policies",
      searchPlaceholder: "Type and press Enter to search indices...",
      lifecyclePhase: "Lifecycle phase",
      allPhases: "All phases",
      managePolicy: "Manage Policy",
      deleteSelected: "Delete",
    },
    table: {
      loading: "Loading indices...",
      noData: "No indices match your search criteria.",
      rowsPerPage: "Rows per page:",
      of: "of",
      columns: {
        name: "Name",
        health: "Health",
        status: "Status",
        primaries: "Primaries",
        replicas: "Replicas",
        docsCount: "Docs count",
        storageSize: "Storage size",
      }
    },
    detailPanel: {
      title: "INDEX DETAILS",
      tabTable: "TABLE",
      tabJson: "JSON",
      searchPlaceholder: "Search field or value...",
      headerField: "FIELD",
      headerValue: "VALUE",
      copyJson: "Copy JSON",
      paginationOf: "of",
      copied: "Copied",
      syncing: "Syncing Stats & Settings...",
      noData: "No Data Available"
    },
    policyModal: {
      title: "Index Policy",
      subtitle: "censor-logs-ilm-policy",
      warmPhase: "Warm phase (Days)",
      coldPhase: "Cold phase (Days)",
      deletePhase: "Delete phase (Days)",
      moveLabel: "Move data into phase when",
      deleteLabel: "Delete data when",
      daysOld: "old",
      loading: "Loading policy...",
      error: "Current Index Policy not found or backend issue.",
      btnSave: "Save",
      btnCancel: "Cancel",
      btnClose: "Close"
    },
    deleteConfirm: {
      title: "Confirm Delete",
      warning: "This action cannot be undone.",
      messageSingle: "Are you sure you want to delete this index?",
      messageBulk: "Are you sure you want to delete {{count}} selected indices?",
      btnDelete: "Delete",
      btnCancel: "Cancel"
    }
  },
  th: {
    toolbar: {
      title: "จัดการดัชนี",
      subtitle: "Index และนโยบาย ILM",
      searchPlaceholder: "พิมพ์แล้วกด Enter เพื่อค้นหาดัชนี...",
      lifecyclePhase: "เฟส Lifecycle",
      allPhases: "ทุกเฟส",
      managePolicy: "จัดการนโยบาย",
      deleteSelected: "ลบรายการที่เลือก",
    },
    table: {
      loading: "กำลังโหลดข้อมูลดัชนี...",
      noData: "ไม่พบข้อมูลดัชนีที่ตรงตามเงื่อนไข",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      columns: {
        name: "ชื่อดัชนี",
        health: "สุขภาพ",
        status: "สถานะ",
        primaries: "Primaries",
        replicas: "Replicas",
        docsCount: "จำนวนเอกสาร",
        storageSize: "พื้นที่จัดเก็บ",
      }
    },
    detailPanel: {
      title: "รายละเอียดดัชนี",
      tabTable: "ตาราง",
      tabJson: "JSON",
      searchPlaceholder: "ค้นหาฟิลด์หรือข้อมูล...",
      headerField: "ฟิลด์",
      headerValue: "ข้อมูล",
      copyJson: "คัดลอก JSON",
      paginationOf: "จาก",
      copied: "คัดลอกแล้ว",
      syncing: "กำลังเชื่อมต่อข้อมูล...",
      noData: "ไม่พบข้อมูลรายละเอียด"
    },
    policyModal: {
      title: "นโยบายดัชนี (Index Policy)",
      subtitle: "censor-logs-ilm-policy",
      warmPhase: "Warm phase (จำนวนวัน)",
      coldPhase: "Cold phase (จำนวนวัน)",
      deletePhase: "Delete phase (จำนวนวัน)",
      moveLabel: "ย้ายข้อมูลเข้าเฟสนี้เมื่อมีอายุเกิน",
      deleteLabel: "ลบข้อมูลเมื่อมีอายุเกิน",
      daysOld: "วัน",
      loading: "กำลังโหลดนโยบาย...",
      error: "ไม่พบข้อมูลนโยบายปัจจุบัน หรือระบบหลังบ้านมีปัญหา",
      btnSave: "บันทึก",
      btnCancel: "ยกเลิก",
      btnClose: "ปิด"
    },
    deleteConfirm: {
      title: "ยืนยันการลบ",
      warning: "การดำเนินการนี้ไม่สามารถย้อนกลับได้",
      messageSingle: "คุณแน่ใจหรือไม่ว่าต้องการลบดัชนีนี้?",
      messageBulk: "คุณแน่ใจหรือไม่ว่าต้องการลบดัชนีจำนวน {{count}} รายการที่เลือกไว้?",
      btnDelete: "ลบข้อมูล",
      btnCancel: "ยกเลิก"
    }
  }
};

export type IndicesDictType = typeof INDICES_DICT.en;