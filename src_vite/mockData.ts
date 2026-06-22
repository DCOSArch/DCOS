import { User, Case, TimelineEvent, LabProfile, InventoryItem, DoctorInventoryItem, OrderChat } from '@/src/types';
export const mockUsers: User[] = [
  { id: 'u1', name: 'Dr. Maneesh Vishnoi', role: 'DENTIST', avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
  { id: 'u2', name: 'Advance Dental Export', role: 'LAB_ADMIN', labId: 'lab1', avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
];

export const mockCases: Case[] = [
  {
    id: 'c1',
    patientName: 'Rahul Sharma',
    dentistId: 'u1',
    labId: 'lab1',
    status: 'IN_PROGRESS',
    urgency: 'HIGH',
    requestedTreatment: 'Zirconia Crown (Tooth 14)',
    material: 'Zirconia HT',
    createdAt: '2026-06-10T10:00:00Z',
    dueDate: '2026-06-20T10:00:00Z',
  },
  {
    id: 'c2',
    patientName: 'Priya Singh',
    dentistId: 'u1',
    labId: 'lab1',
    status: 'QUALITY_CHECK',
    urgency: 'NORMAL',
    requestedTreatment: 'Lower Arch Nightguard',
    material: 'Acrylic Resin',
    createdAt: '2026-06-08T09:30:00Z',
    dueDate: '2026-06-18T10:00:00Z',
  },
  {
    id: 'c3',
    patientName: 'Amit Patel',
    dentistId: 'u1',
    labId: 'lab1',
    status: 'PENDING',
    urgency: 'URGENT',
    requestedTreatment: 'Porcelain Veneers (Teeth 8,9)',
    material: 'E.max CAD Shade A1',
    createdAt: '2026-06-14T08:00:00Z',
    dueDate: '2026-06-28T10:00:00Z',
  },
  {
    id: 'c4',
    patientName: 'Neha Gupta',
    dentistId: 'u1',
    labId: 'lab1',
    status: 'DELIVERED',
    urgency: 'LOW',
    requestedTreatment: 'Implant Abutment (Tooth 30)',
    material: 'Titanium',
    createdAt: '2026-05-25T14:20:00Z',
    dueDate: '2026-06-05T10:00:00Z',
  }
];

export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: 't1',
    caseId: 'c1',
    statusUpdate: 'Pending review',
    notes: 'Case submitted with digital impressions',
    timestamp: '2026-06-10T10:00:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't2',
    caseId: 'c1',
    statusUpdate: 'In Progress',
    notes: 'Case accepted and is taking form.',
    timestamp: '2026-06-11T14:30:00Z',
    visibility: 'EXTERNAL'
  },
  {
    id: 't2-int',
    caseId: 'c1',
    statusUpdate: 'Milling Started',
    notes: 'Assigned to Designer: John. Exocad design approved. Started milling.',
    timestamp: '2026-06-11T14:30:00Z',
    visibility: 'INTERNAL'
  },
  {
    id: 't3',
    caseId: 'c2',
    statusUpdate: 'Pending review',
    notes: 'Case submitted',
    timestamp: '2026-06-08T09:30:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't4',
    caseId: 'c2',
    statusUpdate: 'In Progress',
    notes: 'Fabricating model and vacuforming nightguard.',
    timestamp: '2026-06-09T11:00:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't5',
    caseId: 'c2',
    statusUpdate: 'QUALITY CHECK',
    notes: 'Evaluating fit and margins on articulator.',
    timestamp: '2026-06-13T16:15:00Z',
    visibility: 'INTERNAL'
  },
  {
    id: 't6',
    caseId: 'c4',
    statusUpdate: 'PENDING',
    notes: 'Case submitted with intraoral scans.',
    timestamp: '2026-05-25T14:20:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't7-ext',
    caseId: 'c4',
    statusUpdate: 'In Progress',
    notes: 'Work has begun on the implant abutment.',
    timestamp: '2026-05-27T09:15:00Z',
    visibility: 'EXTERNAL'
  },
  {
    id: 't7-int',
    caseId: 'c4',
    statusUpdate: 'Ceramics Completed',
    notes: 'Custom abutment design and milling complete. Ceramics applied.',
    timestamp: '2026-05-27T09:15:00Z',
    visibility: 'INTERNAL'
  },
  {
    id: 't8',
    caseId: 'c4',
    statusUpdate: 'Dispatched',
    notes: 'Shipped via overnight courier. Tracking #123456789',
    timestamp: '2026-06-03T16:45:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't9',
    caseId: 'c4',
    statusUpdate: 'Delivered',
    notes: 'Case delivered to clinic and signed by receptionist.',
    timestamp: '2026-06-04T10:30:00Z',
    visibility: 'BOTH'
  },
  {
    id: 't10',
    caseId: 'c3',
    statusUpdate: 'PENDING',
    notes: 'Case submitted with digital impressions',
    timestamp: '2026-06-14T08:00:00Z',
    visibility: 'BOTH'
  }
];

export const mockLabProfiles: LabProfile[] = [
  {
    id: 'lab1',
    name: 'Advance Dental Export',
    rating: 4.8,
    reviewsCount: 124,
    services: ['Crown & Bridge', 'Implants', 'Removables', 'Orthodontics'],
    pricing: '$$',
    turnaroundTime: '5-7 Business Days',
    contactEmail: 'info@precisiondental.com',
    contactPhone: '(555) 123-4567'
  },
  {
    id: 'lab2',
    name: 'Kanpur Dental Lab',
    rating: 4.9,
    reviewsCount: 89,
    services: ['High-End Ceramics', 'Veneers', 'Digital Smile Design'],
    pricing: '$$$',
    turnaroundTime: '7-10 Business Days',
    contactEmail: 'hello@apexaesthetics.com',
    contactPhone: '(555) 987-6543'
  },
  {
    id: 'lab3',
    name: 'Vaishali Dental Lab',
    rating: 4.5,
    reviewsCount: 210,
    services: ['Zirconia Copings', 'Custom Abutments', 'Surgical Guides'],
    pricing: '$',
    turnaroundTime: '2-3 Business Days',
    contactEmail: 'milling@swiftdental.com',
    contactPhone: '(555) 246-8101'
  }
];

export const mockInventory: InventoryItem[] = [
  { id: 'inv1', labId: 'lab1', name: 'Zirconia HT Disc 98mm', category: 'Milling Discs', quantity: 15, threshold: 5, unit: 'discs' },
  { id: 'inv2', labId: 'lab1', name: 'E.max CAD Shade A1', category: 'Blocks', quantity: 2, threshold: 10, unit: 'blocks' },
  { id: 'inv3', labId: 'lab1', name: 'Clear Aligner Resin 1kg', category: '3D Printing', quantity: 8, threshold: 3, unit: 'bottles' },
  { id: 'inv4', labId: 'lab1', name: 'Alginate Impression Material', category: 'Supplies', quantity: 24, threshold: 10, unit: 'bags' },
];

export const mockDoctorInventory: DoctorInventoryItem[] = [
  {
    id: 'di1',
    dentistId: 'u1',
    labId: 'lab1',
    materialName: 'Zirconia HT',
    totalUnits: 100,
    remainingUnits: 96,
    lockedPrice: '$45.00'
  }
];

export const mockOrderChats: OrderChat[] = [
  {
    id: 'chat1',
    caseId: 'c1',
    messages: [
      {
        id: 'm1',
        chatId: 'chat1',
        senderId: 'u1',
        content: 'Hi, can we ensure the margins on tooth 14 are slightly chamfered?',
        timestamp: '2026-06-11T09:00:00Z'
      },
      {
        id: 'm2',
        chatId: 'chat1',
        senderId: 'u2',
        content: 'Absolutely. We will make a note for the designer. The digital scan looks good.',
        timestamp: '2026-06-11T09:15:00Z'
      }
    ]
  }
];

