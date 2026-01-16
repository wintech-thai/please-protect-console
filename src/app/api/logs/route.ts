import { NextResponse } from 'next/server'
import client from '@/lib/elasticsearch'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await client.search({
      index: 'censor-events-*', // ชื่อ Index ใน Elasticsearch
      
      size: 50,
      
      sort: [
        { '@timestamp': 'desc' }
      ] as any, 

      query: {
        bool: {
          must: [
            // กรองเอาเฉพาะที่มี Protocol จะได้ไม่เจอข้อมูลขยะ
            { exists: { field: "network.protocol" } }
          ]
        }
      }
    })

    const logs = result.hits.hits.map((hit: any) => {
      const src = hit._source
      
      const protocol = src.network?.protocol || src.proto || 'unknown'
      
      let info = 'N/A'
      
      if (protocol === 'dns') {
        info = src.dns?.question?.name || src.dns?.question?.registered_domain || 'N/A'
      } else if (protocol === 'http') {
        info = src.url?.original || src.host?.name || 'N/A'
      } else if (protocol === 'tls') {
        info = src.tls?.server?.name || 'N/A' // เผื่อมี traffic ที่เป็น HTTPS (TLS)
      }

      return {
        id: hit._id,
        timestamp: src['@timestamp'],
        protocol: protocol.toUpperCase(),
        
        src_ip: src.source?.ip || src.src_ip || 'N/A',
        src_port: src.source?.port || src.src_port || 0,
        
        dest_ip: src.destination?.ip || src.dest_ip || 'N/A',
        dest_port: src.destination?.port || src.dest_port || 0,
        
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