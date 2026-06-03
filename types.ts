export interface PipeType {
  id: number;
  name: string;
  unit_price: number;
}

export interface ProductionRecord {
  id: number;
  date: string;
  pipe_type_id: number;
  quantity: number;
  batch_id: string | null;
}

export interface DistributionRecord {
  id: number;
  date: string;
  pipe_type_id: number;
  quantity: number;
  village: string;
  price: number;
  from_location: string | null;
  to_location: string | null;
  remark: string | null;
  batch_id: string | null;
}

export interface ReturnRecord {
  id: number;
  date: string;
  village: string;
  pipe_type_id: number;
  quantity: number;
  status: 'damaged' | 'production_grade';
  price: number;
  remark: string | null;
  batch_id: string | null;
}

export interface VillageFundingRecord {
  id: number;
  date: string;
  village: string;
  type: 'disbursement' | 'repayment';
  amount: number;
  remark: string | null;
}
