export const eventSummaryDict = {
  EN: {
    title: "Event Summary",
    subtitle: "Elasticsearch analytics by event.dataset, source.ip, destination.ip",
    filter: {
      label: "Filter event.dataset",
      all: "All event.dataset",
      selectedSuffix: "datasets selected",
      noneFound: "No dataset found",
      clear: "Clear dataset filter",
    },
    actions: {
      refresh: "Refresh",
    },
    status: {
      loading: "Loading Event Summary...",
      loadError: "Failed to load Event Summary dashboard",
    },
    stats: {
      currentEps: "Current Event Per Second",
      currentEpsHint: "Based on latest interval",
      avgEps: "Average Event Per Second",
      avgEpsHint: "Across selected time range",
      totalEvents: "Total Events",
      totalEventsHint: "In current filter",
    },
    charts: {
      epsOverTime: "Event Per Second Over Time",
      datasetDistribution: "event.dataset Distribution",
      datasetSeries: "event.dataset Count Time Series",
      topSource: "Top source.ip (Selected Range)",
      uniqueSource: "Unique source.ip Over Time",
      topDestination: "Top destination.ip (Selected Range)",
      uniqueDestination: "Unique destination.ip Over Time",
      aggregationField: "Aggregation field",
      totalEpsLegend: "total EPS",
    },
  },
  TH: {
    title: "สรุปเหตุการณ์",
    subtitle: "การวิเคราะห์ Elasticsearch ตาม event.dataset, source.ip, destination.ip",
    filter: {
      label: "กรอง event.dataset",
      all: "ทุก event.dataset",
      selectedSuffix: "datasets ที่เลือก",
      noneFound: "ไม่พบ dataset",
      clear: "ล้างตัวกรอง dataset",
    },
    actions: {
      refresh: "รีเฟรช",
    },
    status: {
      loading: "กำลังโหลดสรุปเหตุการณ์...",
      loadError: "โหลดหน้า Event Summary ไม่สำเร็จ",
    },
    stats: {
      currentEps: "อีเวนต์ต่อวินาทีปัจจุบัน",
      currentEpsHint: "คำนวณจากช่วงล่าสุด",
      avgEps: "อีเวนต์ต่อวินาทีเฉลี่ย",
      avgEpsHint: "เฉลี่ยทั้งช่วงเวลาที่เลือก",
      totalEvents: "จำนวนเหตุการณ์ทั้งหมด",
      totalEventsHint: "ภายใต้ตัวกรองปัจจุบัน",
    },
    charts: {
      epsOverTime: "อีเวนต์ต่อวินาทีตามเวลา",
      datasetDistribution: "สัดส่วน event.dataset",
      datasetSeries: "จำนวน event.dataset ตามเวลา",
      topSource: "Top source.ip (ช่วงเวลาที่เลือก)",
      uniqueSource: "จำนวน source.ip ที่ไม่ซ้ำตามเวลา",
      topDestination: "Top destination.ip (ช่วงเวลาที่เลือก)",
      uniqueDestination: "จำนวน destination.ip ที่ไม่ซ้ำตามเวลา",
      aggregationField: "ฟิลด์ที่ใช้ aggregate",
      totalEpsLegend: "EPS รวม",
    },
  },
};

export type EventSummaryDict = typeof eventSummaryDict.EN;
