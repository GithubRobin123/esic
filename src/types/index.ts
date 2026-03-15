// Auth
export interface User {
  id: string;
  username: string;
  full_name: string;
  email?: string;
  role: 'master_admin' | 'admin' | 'user';
  profile_id: string;
  profile_code?: string;
  company_name?: string;
  customs_house_code?: string;
  carn_number?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Profile
export interface Profile {
  id: string;
  profile_code: string;
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  carn_number?: string;
  customs_house_code?: string;
  icegate_code?: string;
  created_at: string;
}

// Location
export interface Location {
  id: string;
  iata_code: string;
  city_name: string;
  country?: string;
  is_active: boolean;
}

// MAWB
export interface Mawb {
  id: string;
  mawb_no: string;
  mawb_date?: string;
  airline_code?: string;
  origin: string;
  destination: string;
  flight_no?: string;
  flight_origin_date?: string;
  igm_no?: string;
  igm_date?: string;
  shipment_type: 'T' | 'P' | 'S';
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  special_handling_code?: string;
  uld_number?: string;
  customs_house_code?: string;
  profile_id?: string;
  profile_code?: string;
  company_name?: string;
  transmission_date?: string;
  status: 'draft' | 'transmitted' | 'acknowledged' | 'error';
  hawb_count?: number;
  created_at: string;
  hawbs?: Hawb[];
}

export interface MawbForm {
  mawb_no: string;
  mawb_date: string;
  airline_code: string;
  origin: string;
  destination: string;
  flight_no: string;
  flight_origin_date: string;
  igm_no: string;
  igm_date: string;
  shipment_type: string;
  total_packages: number | string;
  gross_weight: number | string;
  item_description: string;
  special_handling_code: string;
  uld_number: string;
  customs_house_code: string;
  profile_id: string;
}

// HAWB
export interface Hawb {
  id: string;
  mawb_id: string;
  mawb_no?: string;
  hawb_no: string;
  hawb_date?: string;
  origin: string;
  destination: string;
  shipment_type: 'T' | 'P' | 'S';
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  consignee_name?: string;
  consignee_address?: string;
  shipper_name?: string;
  shipper_address?: string;
  status: string;
  created_at: string;
}

export interface HawbForm {
  mawb_id: string;
  hawb_no: string;
  hawb_date: string;
  origin: string;
  destination: string;
  shipment_type: string;
  total_packages: number | string;
  gross_weight: number | string;
  item_description: string;
  consignee_name: string;
  consignee_address: string;
  shipper_name: string;
  shipper_address: string;
  profile_id: string;
}

// Transmission
export interface Transmission {
  id: string;
  transmission_type: string;
  file_name: string;
  mawb_id?: string;
  mawb_no?: string;
  sent_at: string;
  status: string;
  username?: string;
}

export interface CgmPreview {
  file_name: string;
  content: string;
  hawb_count: number;
}
