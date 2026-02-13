
export interface AuditLogDocument {
  "@timestamp": string;
  
  // User Info
  user_name?: string;
  client_ip?: string;
  
  // Identity Info 
  id_type?: string;    
  role?: string;       
  // Action / API
  action?: string;     
  resource?: string;
  path?: string;

  // Status
  status_code?: number; 

  // Details
  description?: string;
  details?: any;
  
  [key: string]: any; 
}

export interface AuditLogSearchParams {
  page: number;
  pageSize: number;
  keyword: string;
  startDate?: string;
  endDate?: string;
}