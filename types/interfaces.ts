export interface Interface {
  id: string;
  status: string;
  direction: 'IN' | 'OUT';
  eimInterfaceId: string | null;
  interfaceName: string;
  sendAppId: string;
  sendAppName: string;
  receivedAppId: string;
  receivedAppName: string;
  transferType: string;
  frequency: string;
  technology: string;
  pattern: string;
  sla: string;
  priority: 'High' | 'Medium' | 'Low';
  interfaceStatus: 'active' | 'inactive';
  remarks: string | null;
  updatedAt: Date;
}

export interface InterfaceUpdatePayload {
  sla?: string;
  priority?: Interface['priority'];
  interfaceStatus?: Interface['interfaceStatus'];
  remarks?: string;
}

export interface DLASResponse {
  appid: string;
  dataDate: string;
  interface: {
    interface_dlas_logged: DLASInterface[];
    interface_only_in_eim: DLASInterface[];
  };
}

export interface DLASInterface {
  Status: string;
  Direction: string;
  EIMInterfaceID: string | null;
  InterfaceName: string;
  SendAppID: string;
  SendAppName: string;
  ReceivedAppID: string;
  ReceivedAppName: string;
  TransferType: string;
  Frequency: string;
  Technology: string;
  Pattern: string;
}