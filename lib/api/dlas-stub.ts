import { Interface } from '@/types/interfaces';

const mockInterfaces: Interface[] = [
  {
    id: 'INT001',
    name: 'Customer Data Sync',
    senderAppId: 'CRM001',
    senderAppName: 'Customer Relationship Manager',
    receiverAppId: 'BIL001',
    receiverAppName: 'Billing System',
    transferType: 'REST API',
    frequency: 'Real-time',
    productType: 'Customer Data',
    entity: 'Customer',
    sla: '99.9%',
    impact: 'High',
    status: 'active'
  },
  {
    id: 'INT002',
    name: 'Order Processing',
    senderAppId: 'ERP001',
    senderAppName: 'Enterprise Resource Planning',
    receiverAppId: 'WMS001',
    receiverAppName: 'Warehouse Management System',
    transferType: 'Message Queue',
    frequency: 'Every 5 minutes',
    productType: 'Order Data',
    entity: 'Order',
    sla: '99.5%',
    impact: 'Medium',
    status: 'active'
  }
];

export async function mockDLASResponse(appId: string): Promise<Interface[]> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  // Filter interfaces based on appId (either as sender or receiver)
  return mockInterfaces.filter(iface => 
    iface.senderAppId === appId || iface.receiverAppId === appId
  );
}