export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'MANAGER' | 'AGENT' | 'EMPLOYEE';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export interface User {
  id: string;
  org_id?: string | null;
  department_id?: string | null;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  organization?: Organization | null;
  department?: Department | null;
}

export interface Organization {
  id: string;
  name: string;
  org_code: string;
  domain?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  user_count?: number;
  open_tickets_count?: number;
}

export interface Ticket {
  id: string;
  org_id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  department_id?: string | null;
  creator_id: string;
  assignee_id?: string | null;
  ai_suggested_category?: string | null;
  ai_confidence?: number | null;
  sla_due_at?: string | null;
  resolved_at?: string | null;
  rating?: number | null;
  feedback?: string | null;
  created_at: string;
  updated_at: string;
  creator?: User;
  assignee?: User;
  department?: Department;
  comments?: TicketComment[];
  activities?: TicketActivity[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  user?: User;
}

export interface TicketActivity {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  details?: string | null;
  created_at: string;
  user?: User;
}

export interface KBDocument {
  id: string;
  org_id: string;
  title: string;
  file_type: string;
  file_path: string;
  uploaded_by: string;
  chunk_count: number;
  is_indexed: boolean;
  created_at: string;
  uploader?: User;
}

export interface ChatThread {
  id: string;
  org_id: string;
  user_id: string;
  title: string;
  channel_type: string;
  ticket_id?: string | null;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  org_id: string;
  sender_id?: string | null;
  sender_type: 'USER' | 'AI_BOT' | 'AGENT' | 'SYSTEM';
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  organization?: Organization | null;
}
