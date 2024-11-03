export interface Interface {
  id: string;
  name: string;
  senderAppId: string;
  senderAppName: string;
  receiverAppId: string;
  receiverAppName: string;
  transferType: string;
  frequency: string;
  productType: string;
  entity: string;
  sla: string;
  impact: 'High' | 'Medium' | 'Low';
  status: 'active' | 'demised';
  updatedAt: Date;
}

export interface InterfaceUpdatePayload {
  sla?: string;
  impact?: Interface['impact'];
}

export interface DLASInterfaceResponse {
  data: {
    id: string;
    name: string;
  }[];
  links: {
    source: string;
    target: string;
  }[];
}

export interface DLASInterfaceDetailsResponse {
  interface: {
    interface_id: string;
    interface_name: string;
    senderappid: string;
    senderappname: string;
    receiverappid: string;
    receiverappname: string;
    transfertype: string;
    frequency: string;
  };
  gdc: {
    primary_collibra_gdc: string;
    secondary_collibra_gdc: string[];
  }[];
  business_context: {
    le: string;
    lob: string;
    country: string;
  }[];
  product_type: {
    primaryProductType: string[];
    secondaryProductType: string[];
  }[];
}