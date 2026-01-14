# please-protect-console
**Please-Protect Sensor** คือระบบ Web Interface สำหรับตรวจสอบและเฝ้าระวังภัยคุกคามทางไซเบอร์ (Cyber Threat Monitoring Dashboard) ที่ออกแบบมาเพื่อทำงานร่วมกับข้อมูลจาก Suricata Zeek และ Arkime โดยเน้นการแสดงผลข้อมูล Traffic ในระดับ Layer 3 และ Layer 7

## 🚀 Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Containerization:** Docker (Standalone Build)

## ✨ Key Features

- **System Overview:** แดชบอร์ดสรุปสถานะระบบ ปริมาณ Traffic และภัยคุกคามที่ตรวจพบ
- **Event Monitoring:**
  - **Layer 7 Events:** ตรวจสอบ HTTP/HTTPS Request logs (Path, Method, Status Code)
  - **Layer 3 Events:** ตรวจสอบ Network Connections (TCP/UDP/ICMP logs)
- **Security Alerts:** แจ้งเตือนภัยคุกคามตามระดับความรุนแรง (Severity)
- **User Management:** ระบบจัดการผู้ใช้งานและสิทธิ์ (Administrator)
- **Private Network Optimized:** ปรับแต่งให้ทำงานได้ในสภาพแวดล้อมที่ไม่มีอินเทอร์เน็ต (Air-gapped / Intranet)

---

## 🛠️ Getting Started (Local Development)

### 1. Prerequisites
- Node.js 18.17 หรือใหม่กว่า
- npm หรือ pnpm

### 2. Installation
```bash
# Clone repository
git clone [https://github.com/wintech-thai/please-protect-console.git](https://github.com/wintech-thai/please-protect-console.git)

# เข้าสู่โฟลเดอร์
cd please-protect-console

# ติดตั้ง Dependencies
npm install

# build docker image 
docker build -t please-protect-console .

# start container
docker run -d -p 3000:3000 --name protect-console-app please-protect-console
 