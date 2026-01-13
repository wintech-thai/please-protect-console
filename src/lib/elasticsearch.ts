import { Client } from '@elastic/elasticsearch'

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'admin',
    password: process.env.ELASTICSEARCH_PASSWORD || '5january'
  },
  tls: {
    rejectUnauthorized: false
  }
})

export default client