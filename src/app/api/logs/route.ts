// src/app/api/logs/route.ts
import { NextResponse } from 'next/server'
import client from '@/lib/elasticsearch'


export async function GET() {
  try {
    const result = await client.search({
      index: 'censor-events-*', // แก้ชื่อ Index ให้ตรงกับ Kibana
      
      size: 50,
      
      sort: [
        { '@timestamp': 'desc' }
      ] as any, 

      query: {
        bool: {
          must: [
            // ดึงข้อมูลที่มี field network.protocol อยู่ (ทั้ง http และ dns)
            { exists: { field: "network.protocol" } }
          ]
        }
      }
    })

    // Mapping ข้อมูล
    const logs = result.hits.hits.map((hit: any) => {
      const src = hit._source
      
      const protocol = src.network?.protocol || 'unknown'
      let info = 'N/A'
      
      if (protocol === 'dns') {
        info = src.dns?.question?.name || src.dns?.question?.registered_domain || 'N/A'
      } else if (protocol === 'http') {
        info = src.url?.original || src.host?.name || 'N/A'
      }

      return {
        id: hit._id,
        timestamp: src['@timestamp'],
        protocol: protocol.toUpperCase(),
        src_ip: src.source?.ip || 'N/A',
        src_port: src.source?.port || 0,
        dest_ip: src.destination?.ip || 'N/A',
        dest_port: src.destination?.port || 0,
        info: info,
        status: src.http?.response?.status_code || src.dns?.response_code || 'OK'
      }
    })

    return NextResponse.json(logs)

  } catch (error) {
    console.error('ES Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch', details: error }, 
      { status: 500 }
    )
  }
}