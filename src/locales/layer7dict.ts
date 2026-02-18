
export const L7_DICT = {
  en: {
    filterBar: { 
      label: "Filters", 
      clearAll: "Clear all" 
    },
    topNav: {
      title: "Layer 7 Traffic Analysis",
      subtitle: "Application Layer Monitoring",
      searchPlaceholder: "Filter your data using KQL syntax",
      refresh: "Refresh",
      refreshing: "Refreshing...",
    },
    sidebar: {
      searchPlaceholder: "Search field names",
      popularFields: "Popular Fields",
      availableFields: "Available Fields",
      selectedFields: "Selected Fields",
      noFieldsFound: "No fields available",
      stats: {
        topValues: "Top Values",
      }
    },
    table: {
      title: "Documents",
      loading: "Fetching records...",
      viewDetails: "View details",
      rowsPerPage: "Rows per page:",
      of: "of",
      noData: "No data found",
      columns: {
        "@timestamp": "TimeStamp",
        "event.id": "Event.ID",
        "event.dataset": "Event.Dataset",
        "source.ip": "Source.IP",
        "source.port": "Source.Port",
        "destination.ip": "Destination.IP",
        "destination.port": "Destination Port",
        "network.protocol": "Protocol",
        "actions": "Actions"
      } as Record<string, string>
    },
    flyout: {
      title: "Document Details",
      tabTable: "Table",
      tabJson: "JSON",
      searchPlaceholder: "Search field names or values...",
      field: "Field",
      value: "Value",
      copyJson: "Copy JSON",
      copied: "Copied",
      paginationOf: "of",
    },
    timePicker: {
      absoluteTitle: "Absolute Range",
      from: "From",
      to: "To",
      apply: "Apply",
      searchPlaceholder: "Search quick ranges...",
      customRange: "Custom Range",
      last5m: "Last 5 minutes",
      last15m: "Last 15 minutes",
      last30m: "Last 30 minutes",
      last1h: "Last 1 hour",
      last3h: "Last 3 hours",
      last6h: "Last 6 hours",
      last12h: "Last 12 hours",
      last24h: "Last 24 hours",
      last2d: "Last 2 days",
      last7d: "Last 7 days",
      last30d: "Last 30 days",
    }
  },
  th: {
    filterBar: { 
      label: "ตัวกรอง", 
      clearAll: "ล้างทั้งหมด" 
    },
    topNav: {
      title: "การวิเคราะห์ทราฟฟิก Layer 7",
      subtitle: "การตรวจสอบระดับแอปพลิเคชัน",
      searchPlaceholder: "ค้นหาข้อมูลด้วยไวยากรณ์ KQL...",
      refresh: "รีเฟรช",
      refreshing: "กำลังรีเฟรช...",
    },
    sidebar: {
      searchPlaceholder: "ค้นหาชื่อฟิลด์...",
      popularFields: "ฟิลด์ยอดนิยม",
      availableFields: "ฟิลด์ทั้งหมด",
      selectedFields: "ฟิลด์ที่เลือก",
      noFieldsFound: "ไม่พบฟิลด์",
      stats: {
        topValues: "ค่าที่พบบ่อย",
      }
    },
    table: {
      title: "รายการข้อมูล",
      loading: "กำลังดึงข้อมูล...",
      viewDetails: "ดูรายละเอียด",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      noData: "ไม่พบข้อมูล",
      columns: {
        "@timestamp": "เวลา",
        "event.id": "ไอดีเหตุการณ์",
        "event.dataset": "ชุดข้อมูล",
        "source.ip": "ไอพีต้นทาง",
        "source.port": "พอร์ตต้นทาง",
        "destination.ip": "ไอพีปลายทาง",
        "destination.port": "พอร์ตปลายทาง",
        "network.protocol": "โปรโตคอล",
        "actions": "จัดการ"
      } as Record<string, string>
    },
    flyout: {
      title: "รายละเอียดเอกสาร",
      tabTable: "ตาราง",
      tabJson: "JSON",
      searchPlaceholder: "ค้นหาชื่อฟิลด์หรือข้อมูล...",
      field: "ฟิลด์",
      value: "ข้อมูล",
      copyJson: "คัดลอก JSON",
      copied: "คัดลอกแล้ว",
      paginationOf: "จาก",
    },
    timePicker: {
      absoluteTitle: "ช่วงเวลาที่กำหนดเอง",
      from: "จาก",
      to: "ถึง",
      apply: "ตกลง",
      searchPlaceholder: "ค้นหาช่วงเวลา...",
      customRange: "กำหนดเอง",
      last5m: "5 นาทีล่าสุด",
      last15m: "15 นาทีล่าสุด",
      last30m: "30 นาทีล่าสุด",
      last1h: "1 ชั่วโมงล่าสุด",
      last3h: "3 ชั่วโมงล่าสุด",
      last6h: "6 ชั่วโมงล่าสุด",
      last12h: "12 ชั่วโมงล่าสุด",
      last24h: "24 ชั่วโมงล่าสุด",
      last2d: "2 วันล่าสุด",
      last7d: "7 วันล่าสุด",
      last30d: "30 วันล่าสุด",
    }
  }
};

export type L7DictType = typeof L7_DICT.en;