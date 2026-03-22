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

// Profile (extended with new fields)
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
  // New fields
  pan_number?: string;
  user_prefix?: string;
  consol_agent_id?: string;
  user_email?: string;
  agent_name?: string;
  address1?: string;
  address2?: string;
  gstin?: string;
  billing_company?: string;
  billing_state?: string;
  gst_rate?: number;
  pan_for_invoice?: string;
  air_igm_rate?: number;
  sea_consol_lcl_rate?: number;
  sea_consol_fcl_rate?: number;
  air_manifest_rate?: number;
  air_manifest_min_bill?: number;
  location_code?: string;
  created_at: string;
}

// Location
export interface Location {
  id: string;
  iata_code: string;
  city_name: string;
  customs_house_code?: string;
  country?: string;
  is_active: boolean;
}

// MAWB (simplified – removed airline_code, shipment_type, uld_number, special_handling_code)
export interface Mawb {
  id: string;
  mawb_no: string;
  mawb_date?: string;
  origin: string;
  destination: string;
  flight_no?: string;
  flight_origin_date?: string;
  igm_no?: string;
  igm_date?: string;
  total_packages: number;
  gross_weight: number;
  item_description?: string;    // always 'CONSOL'
  customs_house_code?: string;
  profile_id?: string;
  profile_code?: string;
  company_name?: string;
  transmission_date?: string;
  status: 'draft' | 'transmitted' | 'acknowledged' | 'error';
  message_type?: string;        // F / A / D
  parent_mawb_id?: string;
  amendment_seq?: number;
  hawb_count?: number;
  created_at: string;
  hawbs?: Hawb[];
}

export interface MawbForm {
  mawb_no: string;
  mawb_date: string;
  origin: string;
  destination: string;
  total_packages: number | string;
  gross_weight: number | string;
  customs_house_code: string;
  profile_id: string;
  // Flight details (shown in edit/part/amend/delete-copy)
  flight_no: string;
  flight_origin_date: string;
  igm_no: string;
  igm_date: string;
}

// HAWB (simplified – removed consignee/shipper, date, shipment_type)
export interface Hawb {
  id: string;
  mawb_id: string;
  mawb_no?: string;
  mawb_message_type?: string;
  mawb_origin?: string;
  mawb_destination?: string;
  hawb_no: string;
  origin: string;
  destination: string;
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  message_type?: string;        // F / A / D (same as MAWB type)
  parent_hawb_id?: string;
  status: string;
  created_at: string;
}

export interface HawbForm {
  mawb_id: string;
  hawb_no: string;
  origin: string;
  destination: string;
  total_packages: number | string;
  gross_weight: number | string;
  item_description: string;
}

// Transmission
export interface Transmission {
  id: string;
  transmission_type: string;
  file_name: string;
  file_content?: string;
  mawb_id?: string;
  mawb_no?: string;
  sent_at: string;
  status: string;
  username?: string;
  hawb_count?: number;
  location?: string;
  pan_number?: string;
}

export interface CgmPreview {
  file_name: string;
  content: string;
  hawb_count: number;
}

// IGM
export interface IgmFlight {
  id: string;
  message_type: string;
  customs_house_code?: string;
  flight_no: string;
  flight_origin_date: string;
  expected_arrival?: string;
  port_of_origin: string;
  port_of_destination: string;
  registration_no?: string;
  nil_cargo?: string;
  igm_no?: string;
  igm_date?: string;
  profile_id?: string;
  profile_code?: string;
  status: string;
  transmitted_at?: string;
  mawb_count?: number;
  created_at: string;
}

export interface IgmFlightForm {
  message_type: string;
  customs_house_code: string;
  flight_no: string;
  flight_origin_date: string;
  expected_arrival: string;
  port_of_origin: string;
  port_of_destination: string;
  registration_no: string;
  nil_cargo: string;
  igm_no: string;
  igm_date: string;
  profile_id: string;
}

export interface IgmMawb {
  id: string;
  igm_flight_id: string;
  message_type: string;
  customs_house_code?: string;
  flight_no?: string;
  flight_origin_date?: string;
  uld_number?: string;
  mawb_no: string;
  mawb_date?: string;
  port_of_origin: string;
  port_of_destination: string;
  shipment_type: string;
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  special_handling_code?: string;
  igm_no?: string;
  igm_date?: string;
  status: string;
  created_at: string;
}

export interface IgmMawbForm {
  igm_flight_id: string;
  message_type: string;
  customs_house_code: string;
  flight_no: string;
  flight_origin_date: string;
  uld_number: string;
  mawb_no: string;
  mawb_date: string;
  port_of_origin: string;
  port_of_destination: string;
  shipment_type: string;
  total_packages: number | string;
  gross_weight: number | string;
  item_description: string;
  special_handling_code: string;
  igm_no: string;
  igm_date: string;
}

// EGM
export interface EgmFlight {
  id: string;
  message_type: string;
  customs_house_code?: string;
  egm_no?: string;
  egm_date?: string;
  flight_no: string;
  flight_departure_date: string;
  port_of_origin: string;
  port_of_destination: string;
  registration_no?: string;
  nil_cargo?: string;
  profile_id?: string;
  profile_code?: string;
  status: string;
  transmitted_at?: string;
  mawb_count?: number;
  created_at: string;
}

export interface EgmFlightForm {
  message_type: string;
  customs_house_code: string;
  egm_no: string;
  egm_date: string;
  flight_no: string;
  flight_departure_date: string;
  port_of_origin: string;
  port_of_destination: string;
  registration_no: string;
  nil_cargo: string;
  profile_id: string;
}

export interface EgmMawb {
  id: string;
  egm_flight_id: string;
  message_type: string;
  customs_house_code?: string;
  mawb_no: string;
  mawb_date?: string;
  port_of_loading?: string;
  port_of_destination?: string;
  shipment_type: string;
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  hawb_count?: number;
  status: string;
  created_at: string;
}

export interface EgmMawbForm {
  egm_flight_id: string;
  message_type: string;
  customs_house_code: string;
  mawb_no: string;
  mawb_date: string;
  port_of_loading: string;
  port_of_destination: string;
  shipment_type: string;
  total_packages: number | string;
  gross_weight: number | string;
  item_description: string;
}

export interface EgmHawb {
  id: string;
  egm_mawb_id: string;
  message_type: string;
  hawb_no: string;
  hawb_date?: string;
  mawb_no?: string;
  port_of_origin?: string;
  port_of_destination?: string;
  shipment_type: string;
  total_packages: number;
  gross_weight: number;
  item_description?: string;
  status: string;
  created_at: string;
}

// CAN/DO
export interface CanDo {
  id: string;
  type: 'CAN' | 'DO';
  reference_no?: string;
  mawb_no?: string;
  hawb_no?: string;
  consignee_name?: string;
  consignee_address?: string;
  issue_date?: string;
  valid_till?: string;
  customs_house_code?: string;
  remarks?: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}

// Invoice
export interface Invoice {
  id: string;
  invoice_no: string;
  invoice_date: string;
  mawb_no?: string;
  hawb_no?: string;
  consignee_name?: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}
