export const subnetTranslations = {
  subnetList: {
    EN: {
      title: "Subnet Mapping",
      subHeader: "Manage network subnets and assign them to departments.",
      searchPlaceholder: "Search subnet or department...",
      columns: {
        cidr: "CIDR Block",
        department: "Department Name",
        totalIp: "Total IP Addresses",
        tags: "Tags", 
        actions: "Actions"
      },
      buttons: {
        add: "ADD",
        delete: "DELETE"
      },
      loading: "Loading subnets...",
      noData: "No subnets found",
      pagination: {
        rowsPerPage: "Rows per page",
        of: "of"
      },
      toast: {
        loadError: "Failed to load subnets.",
        deleteSuccess: "Successfully deleted {count} subnet(s) and refreshed cache.",
        deleteError: "Failed to delete selected subnets."
      },
      deleteModal: {
        title: "Delete Subnets",
        message: "Are you sure you want to delete {count} selected subnet(s)? This action cannot be undone.",
        confirm: "Delete",
        cancel: "Cancel"
      }
    },
    TH: {
      title: "การจัดการ Subnet",
      subHeader: "จัดการโครงสร้างเครือข่ายและระบุหน่วยงานที่รับผิดชอบ",
      searchPlaceholder: "ค้นหา Subnet หรือหน่วยงาน...",
      columns: {
        cidr: "ช่วงเครือข่าย (CIDR)",
        department: "ชื่อหน่วยงาน",
        totalIp: "จำนวน IP ทั้งหมด",
        tags: "แท็ก", 
        actions: "จัดการ"
      },
      buttons: {
        add: "เพิ่ม",
        delete: "ลบ"
      },
      loading: "กำลังโหลดข้อมูล Subnet...",
      noData: "ไม่พบข้อมูล Subnet",
      pagination: {
        rowsPerPage: "แถวต่อหน้า",
        of: "จาก"
      },
      toast: {
        loadError: "ไม่สามารถโหลดข้อมูล Subnet ได้",
        deleteSuccess: "ลบข้อมูล {count} รายการและอัปเดตแคชเรียบร้อยแล้ว",
        deleteError: "ไม่สามารถลบข้อมูลที่เลือกได้"
      },
      deleteModal: {
        title: "ยืนยันการลบข้อมูล",
        message: "คุณแน่ใจหรือไม่ว่าต้องการลบ Subnet ที่เลือกจำนวน {count} รายการ? การดำเนินการนี้ไม่สามารถย้อนกลับได้",
        confirm: "ลบข้อมูล",
        cancel: "ยกเลิก"
      }
    }
  },
  createSubnet: {
    EN: {
      title: "Add Subnet Mapping",
      subHeader: "Map a new IP network zone to a specific department.",
      infoTitle: "Subnet Information",
      labels: {
        cidr: "CIDR Block",
        department: "Department Name",
        tags: "Tags (Press Enter to add)",
        tagsPlaceholder: "e.g., internal, hq, server"
      },
      placeholders: {
        cidr: "e.g., 192.168.1.0/24",
        department: "e.g., Department Name"
      },
      validation: {
        cidrRequired: "CIDR block is required",
        cidrInvalid: "Invalid IPv4 CIDR format (e.g., 192.168.1.0/24)",
        departmentRequired: "Department name is required",
        ipv4Format: "Requires IPv4 format with /0 to /32 prefix"
      },
      helper: {
        totalIp: "Total IP Addresses: "
      },
      buttons: {
        save: "Save",
        cancel: "Cancel"
      },
      toast: {
        success: "Subnet mapped and cache updated successfully",
        error: "Failed to map subnet. Please try again."
      },
      exitModal: {
        title: "Unsaved Changes",
        message: "You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost.",
        stay: "Cancel",
        leave: "OK"
      }
    },
    TH: {
      title: "เพิ่มการจับคู่ Subnet",
      subHeader: "กำหนดช่วงเครือข่ายใหม่ให้กับหน่วยงานที่เกี่ยวข้อง",
      infoTitle: "ข้อมูล Subnet",
      labels: {
        cidr: "ช่วงเครือข่าย (CIDR)",
        department: "ชื่อหน่วยงาน",
        tags: "แท็ก (กด Enter เพื่อเพิ่ม)",
        tagsPlaceholder: "เช่น internal, hq, server"
      },
      placeholders: {
        cidr: "ตัวอย่าง 192.168.1.0/24",
        department: "ระบุชื่อหน่วยงาน"
      },
      validation: {
        cidrRequired: "กรุณาระบุช่วงเครือข่าย (CIDR)",
        cidrInvalid: "รูปแบบ CIDR ไม่ถูกต้อง (ตัวอย่าง 192.168.1.0/24)",
        departmentRequired: "กรุณาระบุชื่อหน่วยงาน",
        ipv4Format: "ต้องเป็นรูปแบบ IPv4 พร้อม Prefix /0 ถึง /32"
      },
      helper: {
        totalIp: "จำนวน IP ทั้งหมด: "
      },
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก"
      },
      toast: {
        success: "เพิ่มข้อมูล Subnet และอัปเดตแคชสำเร็จแล้ว",
        error: "ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      },
      exitModal: {
        title: "ยังไม่ได้บันทึกข้อมูล",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก แน่ใจหรือไม่ว่าต้องการออกจากหน้านี้? ข้อมูลที่แก้ไขจะสูญหาย",
        stay: "ยกเลิก",
        leave: "ออก"
      }
    }
  },
  updateSubnet: {
    EN: {
      title: "Edit Subnet Mapping",
      subHeader: "Update IP network zone details or reassigned department.",
      toast: {
        success: "Subnet updated and cache refreshed successfully",
        error: "Failed to update subnet. Please try again.",
        loadError: "Failed to load subnet data."
      }
    },
    TH: {
      title: "แก้ไขข้อมูล Subnet",
      subHeader: "ปรับปรุงรายละเอียดเครือข่ายหรือเปลี่ยนหน่วยงานที่รับผิดชอบ",
      toast: {
        success: "แก้ไขข้อมูลและรีเฟรชแคชเรียบร้อยแล้ว",
        error: "ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        loadError: "ไม่สามารถโหลดข้อมูล Subnet ได้"
      }
    }
  }
};