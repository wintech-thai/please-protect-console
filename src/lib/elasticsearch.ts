import { Client } from '@elastic/elasticsearch'

const client = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
  auth: {
    username: process.env.ELASTIC_USERNAME || 'admin',
    password: process.env.ELASTIC_PASSWORD || 'DuelHdboww0up;23'
  },
  tls: {
    rejectUnauthorized: false
  }
})

export default client