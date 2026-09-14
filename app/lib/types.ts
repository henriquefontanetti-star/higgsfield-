import type { Role } from "./constants";

export interface Session {
  userId: string;
  name: string;
  role: Role;
}

export interface EmployeeRef {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  position: string | null;
  skills: string | null;
  active: boolean;
  hiredAt?: string;
  _count?: { serviceItems: number };
}

export interface Category {
  id: string;
  name: string;
  active: boolean;
  order: number;
}

export interface ServiceItem {
  id: string;
  orderId: number;
  categoryId: string;
  category: Category;
  description: string | null;
  value: number;
  responsibleId: string | null;
  responsible: EmployeeRef | null;
  priority: string;
  deadline: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  document: string | null;
  city: string | null;
  type: string;
  origin: string | null;
  createdAt: string;
  ordersCount?: number;
  firstOrderDate?: string | null;
  lastOrderDate?: string | null;
  revenue?: number;
  avgTicket?: number | null;
  classification?: "NOVO" | "RECORRENTE" | "INATIVO" | "OFICINA_PARCEIRO";
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: string;
  changedBy: EmployeeRef | null;
}

export interface Photo {
  id: string;
  url: string;
  category: string;
  createdAt: string;
  uploadedBy: EmployeeRef | null;
}

export interface Rework {
  id: string;
  reason: string;
  responsible: EmployeeRef | null;
  estimatedCost: number | null;
  notes: string | null;
  occurredAt: string;
}

export interface OwnerIntervention {
  id: string;
  orderId: number | null;
  order?: { id: number } | null;
  category: string;
  description: string;
  solution: string | null;
  resolvedBy: EmployeeRef | null;
  occurredAt: string;
}

export interface Order {
  id: number;
  client: Client;
  attendedBy: EmployeeRef | null;
  motorBrand: string | null;
  motorModel: string | null;
  motorYear: string | null;
  motorDisplacement: string | null;
  motorType: string | null;
  motorSerial: string | null;
  motorMileage: string | null;
  entryDate: string;
  expectedDeliveryDate: string | null;
  origin: string | null;
  notes: string | null;
  status: string;
  priority: string;
  discount: number;
  budgetStatus: string;
  budgetSentAt: string | null;
  budgetApprovedAt: string | null;
  budgetNotes: string | null;
  executionStartedAt: string | null;
  executionEndedAt: string | null;
  qualityCheckedAt: string | null;
  deliveredAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentDate: string | null;
  isCanceled: boolean;
  isBlocked: boolean;
  services: ServiceItem[];
  statusHistory?: StatusHistoryEntry[];
  photos?: Photo[];
  reworks?: Rework[];
  interventions?: OwnerIntervention[];
  valueGross: number;
  valueFinal: number;
  isLate: boolean;
}
