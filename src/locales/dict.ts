export const translations = {
  profile: {
    EN: {
      title: "UPDATE PROFILE",
      subHeader: "Manage your personal information",
      loading: "Loading profile data...",
      saving: "Saving...",
      success: "Profile updated successfully!",
      errorFetch: "Failed to load profile data",
      confirmTitle: "Unsaved Changes",
      confirmMsg: "You have unsaved changes. Are you sure you want to leave?",
      confirmLeave: "Leave",
      confirmCancel: "Cancel",
      labels: {
        username: "Username",
        email: "Email Address",
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone Number",
        secondaryEmail: "Secondary Email"
      },
      placeholders: {
        firstName: "Enter first name",
        lastName: "Enter last name",
        phone: "08X-XXX-XXXX",
        secondaryEmail: "example@gmail.com"
      },
      buttons: { save: "Save", cancel: "Cancel" }
    },
    TH: {
      title: "แก้ไขข้อมูลส่วนตัว",
      subHeader: "จัดการข้อมูลส่วนตัวของคุณ",
      loading: "กำลังโหลดข้อมูลโปรไฟล์...",
      saving: "กำลังบันทึก...",
      success: "อัปเดตโปรไฟล์สำเร็จ!",
      errorFetch: "โหลดข้อมูลโปรไฟล์ไม่สำเร็จ",
      confirmTitle: "ยังไม่ได้บันทึกการเปลี่ยนแปลง",
      confirmMsg: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
      confirmLeave: "ออกจากหน้านี้",
      confirmCancel: "ยกเลิก",
      labels: {
        username: "ชื่อผู้ใช้งาน",
        email: "อีเมล",
        firstName: "ชื่อ",
        lastName: "นามสกุล",
        phone: "เบอร์โทรศัพท์",
        secondaryEmail: "อีเมลสำรอง"
      },
      placeholders: {
        firstName: "กรอกชื่อ",
        lastName: "กรอกนามสกุล",
        phone: "08X-XXX-XXXX",
        secondaryEmail: "example@gmail.com"
      },
      buttons: { save: "บันทึก", cancel: "ยกเลิก" }
    }
  },

  common: {
    EN: {
      search: "Search",
      add: "ADD",
      delete: "DELETE",
      rowsPerPage: "Rows per page:",
      of: "of",
      loading: "Loading...",
      action: "Action",
      save: "Save",
      cancel: "Cancel",
      organization: "Organization",
      username: "Username",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password"
    },
    TH: {
      search: "ค้นหา",
      add: "เพิ่ม",
      delete: "ลบ",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      loading: "กำลังโหลด...",
      action: "จัดการ",
      save: "บันทึก",
      cancel: "ยกเลิก",
      organization: "หน่วยงาน",
      username: "ชื่อผู้ใช้",
      newPassword: "รหัสผ่านใหม่",
      confirmNewPassword: "ยืนยันรหัสผ่านใหม่"
    }
  },

  customerResetPassword: {
    EN: {
      title: "Reset Your Password",
      description: "Please create a new password for your account.",
      submitButton: "Reset Password",
      subHeader: "Please enter a new password for your account",
      registrationTermsAndExpiry: "By completing registration, you agree to our Terms of Service and Privacy Policy. This invitation link will expire after 24 hours.",
      successTitle: "Password Reset Successful",
      successDesc: "Your password has been successfully updated. You can now log in.",
      passwordMismatch: "Passwords do not match",
      backToLogin: "Back to Login"
    },
    TH: {
      title: "ตั้งรหัสผ่านใหม่",
      description: "กรุณากำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ",
      submitButton: "บันทึกรหัสผ่าน",
      subHeader: "กรุณากรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ",
      registrationTermsAndExpiry: "เมื่อเสร็จสิ้นการลงทะเบียน ถือว่าคุณยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัวของเรา ลิงก์คำเชิญนี้จะหมดอายุภายใน 24 ชั่วโมง",
      successTitle: "เปลี่ยนรหัสผ่านสำเร็จ",
      successDesc: "รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบได้ทันที",
      passwordMismatch: "รหัสผ่านไม่ตรงกัน",
      backToLogin: "กลับไปหน้าเข้าสู่ระบบ"
    }
  },

  passwordRequirements: {
    EN: {
      title: "Password Requirements:",
      length: "Password must be between 7-15 characters",
      upper: "Password must contain at least one uppercase letter",
      lower: "Password must contain at least one lowercase letter",
      special: "Password must contain at least one special character (!, @, or #)"
    },
    TH: {
      title: "เงื่อนไขรหัสผ่าน:",
      length: "รหัสผ่านต้องมีความยาวระหว่าง 7-15 ตัวอักษร",
      upper: "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
      lower: "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว",
      special: "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!, @, หรือ #)"
    }
  },

  changePassword: {
    EN: {
      title: "Change Password",
      desc: "Password must be 7-15 chars, contain A-Z, a-z, and special (!@#)",
      current: "Current Password",
      new: "New Password",
      confirm: "Confirm New Password",
      ph_current: "Enter current password",
      ph_new: "Enter new password",
      ph_confirm: "Confirm new password",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      success: "Password changed successfully",
      errorFields: "Please fill in all fields",
      errorMismatch: "Passwords do not match",
      errorUserNotFound: "Username not found",
      errorFailed: "Failed to change password",
      validateLength: "Password length must be between 7-15 characters",
      validateLower: "Password must contain at least 1 lowercase letter",
      validateUpper: "Password must contain at least 1 uppercase letter",
      validateSpecial: "Password must contain special character (!, @, #)"
    },
    TH: {
      title: "เปลี่ยนรหัสผ่าน",
      desc: "รหัสผ่านต้องมี 7-15 ตัวอักษร, มี A-Z, a-z และอักขระพิเศษ (!@#)",
      current: "รหัสผ่านปัจจุบัน",
      new: "รหัสผ่านใหม่",
      confirm: "ยืนยันรหัสผ่านใหม่",
      ph_current: "กรอกรหัสผ่านปัจจุบัน",
      ph_new: "กรอกรหัสผ่านใหม่",
      ph_confirm: "ยืนยันรหัสผ่านใหม่",
      cancel: "ยกเลิก",
      save: "บันทึก",
      saving: "กำลังบันทึก...",
      success: "เปลี่ยนรหัสผ่านสำเร็จ",
      errorFields: "กรุณากรอกข้อมูลให้ครบถ้วน",
      errorMismatch: "รหัสผ่านใหม่ไม่ตรงกัน",
      errorUserNotFound: "ไม่พบชื่อผู้ใช้งาน",
      errorFailed: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
      validateLength: "รหัสผ่านต้องมีความยาว 7-15 ตัวอักษร",
      validateLower: "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว",
      validateUpper: "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว",
      validateSpecial: "รหัสผ่านต้องมีอักขระพิเศษ (!, @, #) อย่างน้อย 1 ตัว"
    }
  },

  navbar: {
    EN: {
      profile: "Profile",
      changePassword: "Change Password",
      logout: "Logout",
      logoutSuccess: "Logged out successfully",

      overview: "Overview",
      events: "Events",
      layer7: "Layer7 Events",
      layer3: "Layer3 Events",
      alerts: "Alerts",
      administrator: "Administrator",
      users: "Users",
      roles: "Custom Roles",
      apiKeys: "API Keys",
      audit: "Audit Log",

      language: "Language"
    },
    TH: {
      profile: "โปรไฟล์",
      changePassword: "เปลี่ยนรหัสผ่าน",
      logout: "ออกจากระบบ",
      logoutSuccess: "ออกจากระบบเรียบร้อยแล้ว",

      overview: "ภาพรวมระบบ",
      events: "เหตุการณ์",
      layer7: "เหตุการณ์ Layer 7",
      layer3: "เหตุการณ์ Layer 3",
      alerts: "การแจ้งเตือน",
      administrator: "การจัดการระบบ",
      users: "ผู้ใช้",
      roles: "สิทธิ์ตามบทบาท",
      apiKeys: "กุญแจ API",
      audit: "ตรวจสอบการใช้งาน",

      language: "ภาษา"
    }
  },

  overview: {
    EN: {
      title: "System Overview",
      subtitle: "Real-time server metrics from Prometheus",
      stats: {
        cpu: { label: "CPU Usage", sub: "Average across all cores" },
        memory: { label: "Memory Usage", sub: "Used / Total" },
        network: { label: "Network I/O", sub: "RX + TX combined rate" },
        disk: { label: "Disk Usage", sub: "Used / Total" }
      },
      chartTitle: "CPU Load (1h)",
      load1: "Load 1m",
      load5: "Load 5m",
      load15: "Load 15m",
      systemInfo: "System Information",
      cpuCores: "CPU Cores",
      loadAvg: "Load Average",
      memBreakdown: "Memory",
      diskBreakdown: "Disk",
      total: "Total",
      used: "Used",
      available: "Available",
      mountpoint: "Mount",
      loading: "Loading metrics...",
      error: "Failed to load metrics",
      retry: "Retry",
      lastUpdated: "Last updated",
      autoRefresh: "Auto-refresh: 30s",
      rxRate: "RX",
      txRate: "TX"
    },
    TH: {
      title: "ภาพรวมระบบ",
      subtitle: "ข้อมูล Metric แบบเรียลไทม์จาก Prometheus",
      stats: {
        cpu: { label: "การใช้ CPU", sub: "เฉลี่ยทุก Core" },
        memory: { label: "การใช้หน่วยความจำ", sub: "ใช้งาน / ทั้งหมด" },
        network: { label: "เครือข่าย I/O", sub: "อัตรา RX + TX รวม" },
        disk: { label: "การใช้ดิสก์", sub: "ใช้งาน / ทั้งหมด" }
      },
      chartTitle: "โหลด CPU (1 ชั่วโมง)",
      load1: "โหลด 1 นาที",
      load5: "โหลด 5 นาที",
      load15: "โหลด 15 นาที",
      systemInfo: "ข้อมูลระบบ",
      cpuCores: "จำนวน Core",
      loadAvg: "โหลดเฉลี่ย",
      memBreakdown: "หน่วยความจำ",
      diskBreakdown: "ดิสก์",
      total: "ทั้งหมด",
      used: "ใช้งาน",
      available: "คงเหลือ",
      mountpoint: "จุดเมานท์",
      loading: "กำลังโหลด Metrics...",
      error: "โหลด Metrics ไม่สำเร็จ",
      retry: "ลองอีกครั้ง",
      lastUpdated: "อัปเดตล่าสุด",
      autoRefresh: "รีเฟรชอัตโนมัติ: 30 วินาที",
      rxRate: "รับ",
      txRate: "ส่ง"
    }
  },

  layer7: {
    EN: {
      title: "Layer 7 Traffic",
      subtitle: "HTTP/HTTPS Application Layer Analysis",
      placeholder: "Search IP, Path, Host, User-Agent...",
      filters: "Filters",
      rowsPerPage: "Rows per page:",
      of: "of",
      headers: {
        timestamp: "Timestamp",
        method: "Method",
        source: "Source",
        target: "Target Host & Path",
        status: "Status"
      },
      details: {
        title: "Request Details",
        url: "Full Request URL",
        responseTime: "Response Time",
        destPort: "Dest Port",
        clientInfo: "Client Info",
        userAgent: "User Agent",
        securityAlert: "Security Alert",
        securityMsg: "Potential unauthorized access or bad request detected (Status {status})."
      },
      noData: {
        message: 'No events found matching "{term}"'
      }
    },
    TH: {
      title: "จราจรข้อมูล Layer 7",
      subtitle: "การวิเคราะห์ HTTP/HTTPS Application Layer",
      placeholder: "ค้นหา IP, Path, Host, User-Agent...",
      filters: "ตัวกรอง",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      headers: {
        timestamp: "เวลา",
        method: "เมธอด",
        source: "ต้นทาง",
        target: "โฮสต์ปลายทาง & พาท",
        status: "สถานะ"
      },
      details: {
        title: "รายละเอียดคำขอ",
        url: "URL ปลายทาง",
        responseTime: "เวลาตอบสนอง",
        destPort: "พอร์ตปลายทาง",
        clientInfo: "ข้อมูลเครื่องลูกข่าย",
        userAgent: "User Agent",
        securityAlert: "แจ้งเตือนความปลอดภัย",
        securityMsg: "ตรวจพบการเข้าถึงที่อาจไม่ได้รับอนุญาตหรือคำขอที่ไม่ถูกต้อง (สถานะ {status})"
      },
      noData: {
        message: 'ไม่พบเหตุการณ์ที่ตรงกับ "{term}"'
      }
    }
  },

  layer3: {
    EN: {
      title: "Layer 3 Traffic Analysis",
      subtitle: "Network Layer Monitoring (TCP/UDP/ICMP)",
      placeholder: "Search IP, Port, Protocol...",
      filters: "Filters",
      rowsPerPage: "Rows per page:",
      of: "of",
      headers: {
        timestamp: "Timestamp",
        protocol: "Protocol",
        source: "Source",
        destination: "Destination",
        status: "Status",
        size: "Size"
      },
      details: {
        packetDetails: "Packet Details",
        tcpFlags: "TCP Flags",
        ttl: "TTL",
        networkInterface: "Network Interface",
        contextInfo: "Context & Info",
        sourceAsn: "Source ASN",
        destAsn: "Destination ASN",
        note: "Note"
      },
      noData: {
        message: 'No events found matching "{term}"'
      }
    },
    TH: {
      title: "วิเคราะห์จราจรข้อมูล Layer 3",
      subtitle: "การตรวจสอบ Network Layer (TCP/UDP/ICMP)",
      placeholder: "ค้นหา IP, Port, Protocol...",
      filters: "ตัวกรอง",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      headers: {
        timestamp: "เวลา",
        protocol: "โปรโตคอล",
        source: "ต้นทาง",
        destination: "ปลายทาง",
        status: "สถานะ",
        size: "ขนาด"
      },
      details: {
        packetDetails: "รายละเอียดแพ็กเก็ต",
        tcpFlags: "TCP Flags",
        ttl: "TTL",
        networkInterface: "Network Interface",
        contextInfo: "ข้อมูลบริบท",
        sourceAsn: "ASN ต้นทาง",
        destAsn: "ASN ปลายทาง",
        note: "หมายเหตุ"
      },
      noData: {
        message: 'ไม่พบเหตุการณ์ที่ตรงกับ "{term}"'
      }
    }
  },

  alerts: {
    EN: {
      header: "Security Alerts",
      subHeader: "Real-time threat detection module",
      cardTitle: "Security Alerts",
      description: "Coming soon",
      filters: "Filters",
      rowsPerPage: "Rows per page:",
      of: "of",
      searchPlaceholder: "Search alerts..."
    },
    TH: {
      header: "การแจ้งเตือนความปลอดภัย",
      subHeader: "โมดูลตรวจจับภัยคุกคามแบบเรียลไทม์",
      cardTitle: "การแจ้งเตือนความปลอดภัย",
      description: "พบกันเร็วๆ นี้",
      filters: "ตัวกรอง",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      searchPlaceholder: "ค้นหาการแจ้งเตือน..."
    }
  },

  customRoles: {
    EN: {
      title: "Custom Roles",
      subHeader: "Define and manage user roles and permissions",
      searchPlaceholder: "Search roles...",
      filters: {
        all: "Full Text Search",
        name: "Role Name",
        tags: "Tags"
      },
      columns: {
        roleName: "Role Name",
        description: "Description",
        tags: "Tags",
        action: "Action"
      },
      buttons: {
        add: "ADD",
        delete: "DELETE",
        deleteRole: "Delete Role",
        cancel: "Cancel"
      },
      modal: {
        title: "Delete Roles",
        message: "Are you sure you want to delete {count} selected role(s)? This action cannot be undone."
      },
      toast: {
        loadError: "Failed to load roles",
        deleteSuccess: "Deleted {count} role(s) successfully",
        deleteError: "Failed to delete roles"
      },
      rowsPerPage: "Rows per page:",
      of: "of",
      loading: "Loading...",
      noData: "No custom roles found"
    },
    TH: {
      title: "บทบาทกำหนดเอง",
      subHeader: "กำหนดและจัดการสิทธิ์การใช้งานของผู้ใช้",
      searchPlaceholder: "ค้นหาบทบาท...",
      filters: {
        all: "ค้นหาทั้งหมด",
        name: "ชื่อบทบาท",
        tags: "แท็ก"
      },
      columns: {
        roleName: "ชื่อบทบาท",
        description: "คำอธิบาย",
        tags: "แท็ก",
        action: "จัดการ"
      },
      buttons: {
        add: "เพิ่ม",
        delete: "ลบ",
        deleteRole: "ลบบทบาท",
        cancel: "ยกเลิก"
      },
      modal: {
        title: "ลบบทบาท",
        message: "คุณแน่ใจหรือไม่ที่จะลบ {count} บทบาทที่เลือก? การกระทำนี้ไม่สามารถย้อนกลับได้"
      },
      toast: {
        loadError: "โหลดข้อมูลบทบาทไม่สำเร็จ",
        deleteSuccess: "ลบ {count} บทบาทเรียบร้อยแล้ว",
        deleteError: "ลบบทบาทไม่สำเร็จ"
      },
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      loading: "กำลังโหลด...",
      noData: "ไม่พบข้อมูลบทบาท"
    }
  },

  createRole: {
    EN: {
      title: "Create Role Permission",
      subHeader: "Define a new custom role and permissions",
      infoTitle: "Role Information",
      loading: "Loading...",
      labels: {
        roleName: "Role Name",
        description: "Description",
        tags: "Tags",
        tagsPlaceholder: "Type and press Enter to add tag"
      },
      placeholders: {
        roleName: "e.g. Accountant",
        description: "Role description..."
      },
      permissionsTitle: "Permissions",
      searchPlaceholder: "Search permissions...",
      noPermissionsFound: 'No permissions found matching "{term}"',
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK"
      },
      toast: {
        success: "Role created successfully",
        error: "Failed to create role",
        duplicateRoleName: "Role Name '{name}' is already in use.",
        loadError: "Failed to load permission list"
      },
      validation: {
        roleName: "Role Name is required",
        description: "Description is required",
        tags: "At least one tag is required"
      }
    },
    TH: {
      title: "สร้างสิทธิ์การใช้งาน",
      subHeader: "กำหนดบทบาทและสิทธิ์การใช้งานใหม่",
      infoTitle: "ข้อมูลบทบาท",
      loading: "กำลังโหลด...",
      labels: {
        roleName: "ชื่อบทบาท",
        description: "คำอธิบาย",
        tags: "แท็ก",
        tagsPlaceholder: "พิมพ์และกด Enter เพื่อเพิ่มแท็ก"
      },
      placeholders: {
        roleName: "เช่น xxxx.",
        description: "คำอธิบายบทบาท..."
      },
      permissionsTitle: "สิทธิ์การใช้งาน",
      searchPlaceholder: "ค้นหาสิทธิ์การใช้งาน...",
      noPermissionsFound: 'ไม่พบสิทธิ์ที่ตรงกับ "{term}"',
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง"
      },
      toast: {
        success: "สร้างบทบาทสำเร็จ",
        error: "สร้างบทบาทไม่สำเร็จ",
        duplicateRoleName: "ชื่อบทบาท '{name}' ถูกใช้งานแล้วในระบบ",
        loadError: "โหลดรายการสิทธิ์ไม่สำเร็จ"
      },
      validation: {
        roleName: "กรุณาระบุชื่อบทบาท",
        description: "กรุณาระบุคำอธิบาย",
        tags: "ต้องระบุอย่างน้อย 1 แท็ก"
      }
    }
  },

  updateRole: {
    EN: {
      title: "Update Role Permission",
      subHeader: "Modify custom role details and permissions",
      infoTitle: "Role Information",
      loading: "Loading role details...",
      labels: {
        roleName: "Role Name",
        description: "Description",
        tags: "Tags",
        tagsPlaceholder: "Type and press Enter to add tag"
      },
      placeholders: {
        roleName: "e.g. Accountant",
        description: "Role description..."
      },
      permissionsTitle: "Permissions",
      searchPlaceholder: "Search permissions...",
      noPermissionsFound: 'No permissions found matching "{term}"',
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK"
      },
      toast: {
        success: "Role updated successfully",
        error: "Failed to update role",
        loadError: "Failed to load role data"
      },
      validation: {
        roleName: "Role Name is required",
        description: "Description is required",
        tags: "At least one tag is required"
      }
    },
    TH: {
      title: "แก้ไขสิทธิ์การใช้งาน",
      subHeader: "แก้ไขรายละเอียดบทบาทและสิทธิ์การใช้งาน",
      infoTitle: "ข้อมูลบทบาท",
      loading: "กำลังโหลดข้อมูลบทบาท...",
      labels: {
        roleName: "ชื่อบทบาท",
        description: "คำอธิบาย",
        tags: "แท็ก",
        tagsPlaceholder: "พิมพ์และกด Enter เพื่อเพิ่มแท็ก"
      },
      placeholders: {
        roleName: "เช่น นักบัญชี",
        description: "คำอธิบายบทบาท..."
      },
      permissionsTitle: "สิทธิ์การใช้งาน",
      searchPlaceholder: "ค้นหาสิทธิ์การใช้งาน...",
      noPermissionsFound: 'ไม่พบสิทธิ์ที่ตรงกับ "{term}"',
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง"
      },
      toast: {
        success: "อัปเดตบทบาทสำเร็จ",
        error: "อัปเดตบทบาทไม่สำเร็จ",
        loadError: "โหลดข้อมูลบทบาทไม่สำเร็จ"
      },
      validation: {
        roleName: "กรุณาระบุชื่อบทบาท",
        description: "กรุณาระบุคำอธิบาย",
        tags: "ต้องระบุอย่างน้อย 1 แท็ก"
      }
    }
  },

  users: {
    EN: {
      title: "Users",
      subHeader: "Manage system access and roles",
      searchPlaceholder: "Search users...",
      filters: {
        all: "Full Text Search",
        username: "Username",
        email: "Email"
      },
      columns: {
        username: "Username",
        email: "Email",
        tags: "Tags",
        customRole: "Custom Role",
        role: "Role",
        initialUser: "Initial User",
        status: "Status",
        action: "Action"
      },
      buttons: {
        add: "ADD",
        delete: "DELETE",
        disable: "Disable User",
        enable: "Enable User",
        cancel: "Cancel",
        resetPassword: "Reset Password Link",
        copy: "Copy Link",
        done: "Done",
        ok: "OK"
      },
      modal: {
        deleteTitle: "Delete Users",
        deleteMessage: "Are you sure you want to delete {count} selected user(s)? This action cannot be undone.",
        enableTitle: "Enable User",
        disableTitle: "Disable User",
        statusMessage: "Are you sure you want to {action} this user?",
        resetPasswordTitle: "Reset Password Link",
        resetPasswordMessage: "Copy the link below and send it to {name} to reset their password."
      },
      toast: {
        deleteSuccess: "Deleted {count} user(s) successfully",
        deleteError: "Failed to delete users",
        statusSuccess: "Updated status successfully",
        statusError: "Failed to update status",
        fetchError: "Failed to fetch users",
        generatingLink: "Generating reset link...",
        copySuccess: "Link copied to clipboard!",
        copyError: "Failed to copy link",
        resetLinkError: "Failed to generate reset link",
        invalidResponse: "Invalid response from server"
      },
      rowsPerPage: "Rows per page:",
      of: "of",
      loading: "Loading...",
      noData: "No users found"
    },
    TH: {
      title: "ผู้ใช้งาน",
      subHeader: "จัดการสิทธิ์การเข้าถึงและบทบาทผู้ใช้",
      searchPlaceholder: "ค้นหาผู้ใช้งาน...",
      filters: {
        all: "ค้นหาทั้งหมด",
        username: "ชื่อผู้ใช้",
        email: "อีเมล"
      },
      columns: {
        username: "ชื่อผู้ใช้",
        email: "อีเมล",
        tags: "แท็ก",
        customRole: "บทบาทกำหนดเอง",
        role: "บทบาท",
        initialUser: "ผู้ใช้ตั้งต้น",
        status: "สถานะ",
        action: "จัดการ"
      },
      buttons: {
        add: "เพิ่ม",
        delete: "ลบ",
        disable: "ระงับการใช้งาน",
        enable: "เปิดใช้งาน",
        cancel: "ยกเลิก",
        resetPassword: "ลิ้งก์รีเซ็ตรหัสผ่าน",
        copy: "คัดลอกลิงก์",
        done: "เสร็จสิ้น",
        ok: "ตกลง"
      },
      modal: {
        deleteTitle: "ลบผู้ใช้งาน",
        deleteMessage: "คุณแน่ใจหรือไม่ที่จะลบ {count} ผู้ใช้งานที่เลือก? การกระทำนี้ไม่สามารถย้อนกลับได้",
        enableTitle: "เปิดใช้งานผู้ใช้",
        disableTitle: "ระงับผู้ใช้",
        statusMessage: "คุณแน่ใจหรือไม่ที่จะ {action} ผู้ใช้งานนี้?",
        resetPasswordTitle: "ลิงก์รีเซ็ตรหัสผ่าน",
        resetPasswordMessage: "คัดลอกลิงก์ด้านล่างและส่งให้คุณ {name} เพื่อรีเซ็ตรหัสผ่าน"
      },
      toast: {
        deleteSuccess: "ลบ {count} ผู้ใช้งานเรียบร้อยแล้ว",
        deleteError: "ลบผู้ใช้งานไม่สำเร็จ",
        statusSuccess: "อัปเดตสถานะสำเร็จ",
        statusError: "อัปเดตสถานะไม่สำเร็จ",
        fetchError: "โหลดข้อมูลผู้ใช้งานไม่สำเร็จ",
        generatingLink: "กำลังสร้างลิงก์...",
        copySuccess: "คัดลอกลิงก์ไปยังคลิปบอร์ดแล้ว!",
        copyError: "คัดลอกลิงก์ไม่สำเร็จ",
        resetLinkError: "สร้างลิงก์รีเซ็ตไม่สำเร็จ",
        invalidResponse: "การตอบกลับจากเซิร์ฟเวอร์ไม่ถูกต้อง"
      },
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      loading: "กำลังโหลด...",
      noData: "ไม่พบข้อมูลผู้ใช้งาน"
    }
  },

  createUser: {
    EN: {
      title: "Create User",
      subHeader: "Add a new user to the organization",
      infoTitle: "User Information",
      rolesTitle: "Roles & Permissions",
      labels: {
        username: "Username",
        email: "Email",
        tags: "Tags",
        tagsPlaceholder: "Type and press Enter to add tags...",
        customRole: "Custom Role (Optional)",
        selectRole: "Select a custom role...",
        systemRoles: "System Roles",
        availableRoles: "Available Roles",
        selectedRoles: "Selected Roles"
      },
      placeholders: {
        username: "e.g. johndoe",
        email: "name@example.com"
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel",
        done: "Done & Return to Users"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK",
        inviteTitle: "User Invited Successfully",
        inviteMessage: "An invitation link has been generated. Please copy and share it with the user."
      },
      toast: {
        success: "User invited successfully",
        error: "Failed to invite user",
        rolesError: "Failed to load roles configuration",
        copySuccess: "Link copied to clipboard",
        duplicateEmail: "Email '{email}' is already in use",
        duplicateUsername: "Username '{username}' is already in use",
        duplicateData: "Duplicate data detected. Cannot create a new invitation."
      },
      validation: {
        username: "Username is required",
        email: "Email is required",
        emailInvalid: "Invalid email format",
        tags: "At least one tag is required"
      },
      loading: "Loading configurations...",
      noRolesAvailable: "No roles available",
      noRolesSelected: "No roles selected"
    },
    TH: {
      title: "สร้างผู้ใช้งาน",
      subHeader: "เพิ่มผู้ใช้งานใหม่เข้าสู่องค์กร",
      infoTitle: "ข้อมูลผู้ใช้งาน",
      rolesTitle: "บทบาทและสิทธิ์การใช้งาน",
      labels: {
        username: "ชื่อผู้ใช้",
        email: "อีเมล",
        tags: "แท็ก",
        tagsPlaceholder: "พิมพ์และกด Enter เพื่อเพิ่มแท็ก...",
        customRole: "บทบาทกำหนดเอง (ไม่บังคับ)",
        selectRole: "เลือกบทบาทกำหนดเอง...",
        systemRoles: "บทบาทของระบบ",
        availableRoles: "บทบาทที่มีอยู่",
        selectedRoles: "บทบาทที่เลือก"
      },
      placeholders: {
        username: "เช่น johndoe",
        email: "name@example.com"
      },
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก",
        done: "เสร็จสิ้นและกลับไปหน้าผู้ใช้งาน"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง",
        inviteTitle: "เชิญผู้ใช้งานสำเร็จ",
        inviteMessage: "ลิงก์คำเชิญถูกสร้างขึ้นแล้ว กรุณาคัดลอกและแชร์ให้กับผู้ใช้งาน"
      },
      toast: {
        success: "เชิญผู้ใช้งานสำเร็จ",
        error: "เชิญผู้ใช้งานไม่สำเร็จ",
        rolesError: "โหลดข้อมูลบทบาทไม่สำเร็จ",
        copySuccess: "คัดลอกลิงก์แล้ว",
        duplicateEmail: "อีเมล '{email}' ถูกใช้งานแล้วในระบบ",
        duplicateUsername: "ชื่อผู้ใช้งาน '{username}' ถูกใช้งานแล้วในระบบ",
        duplicateData: "ระบบตรวจพบข้อมูลซ้ำซ้อน ไม่สามารถสร้างการเชิญใหม่ได้"
      },
      validation: {
        username: "กรุณาระบุชื่อผู้ใช้",
        email: "กรุณาระบุอีเมล",
        emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
        tags: "ต้องระบุอย่างน้อย 1 แท็ก"
      },
      loading: "กำลังโหลดข้อมูล...",
      noRolesAvailable: "ไม่มีบทบาทที่เลือกได้",
      noRolesSelected: "ยังไม่ได้เลือกบทบาท"
    }
  },

  updateUser: {
    EN: {
      title: "Update User",
      subHeader: "Edit user information and permissions",
      infoTitle: "User Information",
      rolesTitle: "Roles & Permissions",
      labels: {
        username: "Username",
        email: "Email",
        tags: "Tags",
        tagsPlaceholder: "Type and press Enter to add tags...",
        customRole: "Custom Role (Optional)",
        selectRole: "Select a custom role...",
        systemRoles: "System Roles",
        availableRoles: "Available Roles",
        selectedRoles: "Selected Roles"
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel",
        ok: "OK"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK"
      },
      toast: {
        loadError: "Failed to load user information",
        dataNotFound: "User data not found",
        updateSuccess: "User updated successfully",
        updateError: "Failed to update user",
        rolesError: "Failed to load roles configuration"
      },
      loading: "Loading user profile...",
      noRolesAvailable: "No roles available",
      noRolesSelected: "No roles selected"
    },
    TH: {
      title: "แก้ไขผู้ใช้งาน",
      subHeader: "แก้ไขข้อมูลผู้ใช้งานและสิทธิ์การใช้งาน",
      infoTitle: "ข้อมูลผู้ใช้งาน",
      rolesTitle: "บทบาทและสิทธิ์การใช้งาน",
      labels: {
        username: "ชื่อผู้ใช้",
        email: "อีเมล",
        tags: "แท็ก",
        tagsPlaceholder: "พิมพ์และกด Enter เพื่อเพิ่มแท็ก...",
        customRole: "บทบาทกำหนดเอง (ไม่บังคับ)",
        selectRole: "เลือกบทบาทกำหนดเอง...",
        systemRoles: "บทบาทของระบบ",
        availableRoles: "บทบาทที่มีอยู่",
        selectedRoles: "บทบาทที่เลือก"
      },
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก",
        ok: "ตกลง"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง"
      },
      toast: {
        loadError: "โหลดข้อมูลผู้ใช้ไม่สำเร็จ",
        dataNotFound: "ไม่พบข้อมูลผู้ใช้งาน",
        updateSuccess: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
        updateError: "อัปเดตข้อมูลผู้ใช้ไม่สำเร็จ",
        rolesError: "โหลดข้อมูลบทบาทไม่สำเร็จ"
      },
      loading: "กำลังโหลดข้อมูลผู้ใช้...",
      noRolesAvailable: "ไม่มีบทบาทที่เลือกได้",
      noRolesSelected: "ยังไม่ได้เลือกบทบาท"
    }
  },
  apiKeys: {
    EN: {
      title: "API Keys",
      subHeader: "Manage API access keys and permissions",
      searchPlaceholder: "Search API keys...",
      filters: {
        all: "Full Text Search",
        name: "Key Name",
        desc: "Description"
      },
      columns: {
        keyName: "Key Name",
        description: "Description",
        customRole: "Custom Role",
        roles: "Roles",
        status: "Status",
        action: "Action"
      },
      buttons: {
        add: "ADD",
        delete: "DELETE",
        disable: "Disable Key",
        enable: "Enable Key",
        cancel: "Cancel",
        ok: "OK"
      },
      modal: {
        deleteTitle: "Delete API Keys",
        deleteMessage: "Are you sure you want to delete {count} selected key(s)? This action cannot be undone.",
        enableTitle: "Enable Key",
        disableTitle: "Disable Key",
        statusMessage: "Are you sure you want to {action} this API key?"
      },
      toast: {
        deleteSuccess: "Deleted {count} API key(s) successfully",
        deleteError: "Failed to delete API keys",
        statusSuccess: "Updated status successfully",
        statusError: "Failed to update status",
        fetchError: "Failed to fetch API keys",
        rolesError: "Failed to fetch roles"
      },
      rowsPerPage: "Rows per page:",
      of: "of",
      loading: "Loading...",
      noData: "No API keys found"
    },
    TH: {
      title: "คีย์ API",
      subHeader: "จัดการคีย์สำหรับการเข้าถึง API และสิทธิ์การใช้งาน",
      searchPlaceholder: "ค้นหาคีย์ API...",
      filters: {
        all: "ค้นหาทั้งหมด",
        name: "ชื่อคีย์",
        desc: "คำอธิบาย"
      },
      columns: {
        keyName: "ชื่อคีย์",
        description: "คำอธิบาย",
        customRole: "บทบาทกำหนดเอง",
        roles: "บทบาท",
        status: "สถานะ",
        action: "จัดการ"
      },
      buttons: {
        add: "เพิ่ม",
        delete: "ลบ",
        disable: "ระงับการใช้งาน",
        enable: "เปิดใช้งาน",
        cancel: "ยกเลิก",
        ok: "ตกลง"
      },
      modal: {
        deleteTitle: "ลบคีย์ API",
        deleteMessage: "คุณแน่ใจหรือไม่ที่จะลบ {count} คีย์ที่เลือก? การกระทำนี้ไม่สามารถย้อนกลับได้",
        enableTitle: "เปิดใช้งานคีย์",
        disableTitle: "ระงับคีย์",
        statusMessage: "คุณแน่ใจหรือไม่ที่จะ {action} คีย์ API นี้?"
      },
      toast: {
        deleteSuccess: "ลบ {count} คีย์เรียบร้อยแล้ว",
        deleteError: "ลบคีย์ API ไม่สำเร็จ",
        statusSuccess: "อัปเดตสถานะสำเร็จ",
        statusError: "อัปเดตสถานะไม่สำเร็จ",
        fetchError: "โหลดข้อมูลคีย์ API ไม่สำเร็จ",
        rolesError: "โหลดข้อมูลบทบาทไม่สำเร็จ"
      },
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก",
      loading: "กำลังโหลด...",
      noData: "ไม่พบข้อมูลคีย์ API"
    }
  },
  createApiKey: {
    EN: {
      title: "Create API Key",
      subHeader: "Generate a new API access key",
      infoTitle: "Key Information",
      rolesTitle: "Roles & Permissions",
      labels: {
        keyName: "Key Name",
        description: "Description",
        customRole: "Custom Role (Optional)",
        selectRole: "Select a custom role...",
        systemRoles: "System Roles",
        availableRoles: "Available Roles",
        selectedRoles: "Selected Roles"
      },
      placeholders: {
        keyName: "e.g. Production Service Key",
        description: "Key description"
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel",
        done: "Done & Return"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK",
        successTitle: "API Key Created Successfully",
        successMessage: "This token will only be shown once. Please copy it now and store it securely."
      },
      toast: {
        success: "API Key created successfully",
        error: "Failed to create API Key",
        rolesError: "Failed to load roles configuration",
        copySuccess: "Copied to clipboard",
        tokenError: "API Key created but failed to retrieve the token string.",
        duplicateKeyName: "API Key Name '{name}' is already in use"
      },
      validation: {
        keyName: "Key Name is required",
        description: "Key description is required"
      },
      loading: "Loading configurations...",
      noRolesAvailable: "No roles available",
      noRolesSelected: "No roles selected"
    },
    TH: {
      title: "สร้างคีย์ API",
      subHeader: "สร้างคีย์สำหรับการเข้าถึง API ใหม่",
      infoTitle: "ข้อมูลคีย์",
      rolesTitle: "บทบาทและสิทธิ์การใช้งาน",
      labels: {
        keyName: "ชื่อคีย์",
        description: "คำอธิบาย",
        customRole: "บทบาทกำหนดเอง (ไม่บังคับ)",
        selectRole: "เลือกบทบาทกำหนดเอง...",
        systemRoles: "บทบาทของระบบ",
        availableRoles: "บทบาทที่มีอยู่",
        selectedRoles: "บทบาทที่เลือก"
      },
      placeholders: {
        keyName: "เช่น Production Service Key",
        description: "คำอธิบายคีย์"
      },
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก",
        done: "เสร็จสิ้นและกลับ"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง",
        successTitle: "สร้างคีย์ API สำเร็จ",
        successMessage: "โทเค็นนี้จะแสดงเพียงครั้งเดียว กรุณาคัดลอกและเก็บรักษาไว้อย่างปลอดภัย"
      },
      toast: {
        success: "สร้างคีย์ API สำเร็จ",
        error: "สร้างคีย์ API ไม่สำเร็จ",
        rolesError: "โหลดข้อมูลบทบาทไม่สำเร็จ",
        copySuccess: "คัดลอกลงคลิปบอร์ดแล้ว",
        duplicateKeyName: "ชื่อคีย์ '{name}' ถูกใช้งานแล้วในระบบ",
        tokenError: "สร้างคีย์สำเร็จแต่ไม่สามารถดึงข้อมูลโทเค็นได้"
      },
      validation: {
        keyName: "กรุณาระบุชื่อคีย์",
        description: "กรุณาระบุคำอธิบาย"
      },
      loading: "กำลังโหลดข้อมูล...",
      noRolesAvailable: "ไม่มีบทบาทที่เลือกได้",
      noRolesSelected: "ยังไม่ได้เลือกบทบาท"
    }
  },
  updateApiKey: {
    EN: {
      title: "Update API Key",
      subHeader: "Edit API key details and permissions",
      infoTitle: "Key Information",
      rolesTitle: "Roles & Permissions",
      labels: {
        keyName: "Key Name",
        description: "Description",
        customRole: "Custom Role (Optional)",
        selectRole: "Select a custom role...",
        systemRoles: "System Roles",
        availableRoles: "Available Roles",
        selectedRoles: "Selected Roles"
      },
      placeholders: {
        description: "Purpose of this key..."
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        leave: "Leave",
        stay: "Cancel",
        ok: "OK"
      },
      modal: {
        title: "Leave Page",
        message: "You have unsaved changes. Are you sure you want to leave?",
        ok: "OK"
      },
      toast: {
        updateSuccess: "API Key updated successfully",
        updateError: "Failed to update API key",
        loadError: "Failed to load API key information",
        dataNotFound: "API Key data not found"
      },
      validation: {
        description: "Description is required"
      },
      loading: "Loading API key...",
      noRolesAvailable: "No roles available",
      noRolesSelected: "No roles selected"
    },
    TH: {
      title: "แก้ไขคีย์ API",
      subHeader: "แก้ไขรายละเอียดคีย์และสิทธิ์การใช้งาน",
      infoTitle: "ข้อมูลคีย์",
      rolesTitle: "บทบาทและสิทธิ์การใช้งาน",
      labels: {
        keyName: "ชื่อคีย์",
        description: "คำอธิบาย",
        customRole: "บทบาทกำหนดเอง (ไม่บังคับ)",
        selectRole: "เลือกบทบาทกำหนดเอง...",
        systemRoles: "บทบาทของระบบ",
        availableRoles: "บทบาทที่มีอยู่",
        selectedRoles: "บทบาทที่เลือก"
      },
      placeholders: {
        description: "วัตถุประสงค์ของคีย์นี้..."
      },
      buttons: {
        save: "บันทึก",
        cancel: "ยกเลิก",
        leave: "ออกจากหน้านี้",
        stay: "ยกเลิก",
        ok: "ตกลง"
      },
      modal: {
        title: "ออกจากหน้านี้",
        message: "คุณมีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก คุณแน่ใจหรือไม่ว่าต้องการออกจากหน้านี้?",
        ok: "ตกลง"
      },
      toast: {
        updateSuccess: "อัปเดตคีย์ API สำเร็จ",
        updateError: "อัปเดตคีย์ API ไม่สำเร็จ",
        loadError: "โหลดข้อมูลคีย์ไม่สำเร็จ",
        dataNotFound: "ไม่พบข้อมูลคีย์ API"
      },
      validation: {
        description: "กรุณาระบุคำอธิบาย"
      },
      loading: "กำลังโหลดข้อมูล...",
      noRolesAvailable: "ไม่มีบทบาทที่เลือกได้",
      noRolesSelected: "ยังไม่ได้เลือกบทบาท"
    }
  },
  auditLog: {
    EN: {
      title: "Audit Log",
      subHeader: "Track system activities and changes",
      description: "Coming soon",
      filters: "Filters",
      searchPlaceholder: "Search logs...",
      rowsPerPage: "Rows per page:",
      of: "of"
    },
    TH: {
      title: "บันทึกการใช้งาน",
      subHeader: "ติดตามกิจกรรมและการเปลี่ยนแปลงในระบบ",
      description: "พบกันเร็วๆ นี้",
      filters: "ตัวกรอง",
      searchPlaceholder: "ค้นหาบันทึก...",
      rowsPerPage: "แถวต่อหน้า:",
      of: "จาก"
    }
  },
  userSignup: {
    EN: {
      title: "Complete Your Registration",
      subHeader: "Please fill in your details to complete registration",
      submit: "Complete Registration",
      processing: "Processing...",
      success: "Registration Completed Successfully",
      registrationTermsAndExpiry: "By completing registration, you agree to our Terms of Service and Privacy Policy. This invitation link will expire after 24 hours.",
      error: "Registration Failed. Please try again.",
      required: "This field is required",
      passwordMismatch: "Passwords do not match",
      labels: {
        firstName: "First Name",
        lastName: "Last Name",
        username: "Username",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm Password"
      }
    },
    TH: {
      title: "ลงทะเบียนของคุณให้เสร็จสิ้น",
      subHeader: "กรุณากรอกรายละเอียดเพื่อทำการลงทะเบียนให้เสร็จสมบูรณ์",
      submit: "ยืนยันการลงทะเบียน",
      processing: "กำลังดำเนินการ...",
      success: "ลงทะเบียนสำเร็จ",
      registrationTermsAndExpiry: "เมื่อเสร็จสิ้นการลงทะเบียน ถือว่าคุณยอมรับเงื่อนไขการให้บริการและนโยบายความเป็นส่วนตัวของเรา ลิงก์คำเชิญนี้จะหมดอายุภายใน 24 ชั่วโมง",
      error: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      required: "กรุณาระบุข้อมูล",
      passwordMismatch: "รหัสผ่านไม่ตรงกัน",
      labels: {
        firstName: "ชื่อจริง",
        lastName: "นามสกุล",
        username: "ชื่อผู้ใช้",
        email: "อีเมล",
        password: "รหัสผ่าน",
        confirmPassword: "ยืนยันรหัสผ่าน"
      }
    }
  },

};
