export type CrewRole = 'CAPTAIN' | 'GUIDE' | 'DRIVER';
export type FleetType = 'BOAT' | 'SPEEDBOAT' | 'VEHICLE' | 'QUAD';
export type ExpenseCategory = 'FUEL' | 'CREW_PAYROLL' | 'CATERING' | 'PERMITS' | 'MISC';
export type ExpenseCurrency = 'USD' | 'EGP';

export interface TripDispatchPayload {
  tourId: string;
  departureDate: string;
  assignedCrewIds: string[];
  assignedAssetIds: string[];
  expenses: ExpenseRowInput[];
  force?: boolean;
}

export interface ExpenseRowInput {
  category: ExpenseCategory;
  amount: number;
  currency: ExpenseCurrency;
  notes?: string;
}

export interface TripDispatchResponse {
  success: boolean;
  crewCount: number;
  assetCount: number;
  expenseCount: number;
  totalExpenseUSD: number;
  warnings: SchedulingConflict[];
}

export interface SchedulingConflict {
  type: 'CREW' | 'FLEET';
  resourceId: string;
  resourceName: string;
  conflictingTourId: string;
  conflictingTourTitle: string;
}

export interface DispatchPreloadData {
  assignedCrew: CrewMemberSummary[];
  assignedFleet: FleetAssetSummary[];
  expenses: ExpenseRecord[];
  crewPool: CrewMemberSummary[];
  fleetPool: FleetAssetSummary[];
  computedTotalUSD: number;
}

export interface CrewMemberSummary {
  id: string;
  name: string;
  role: CrewRole;
}

export interface FleetAssetSummary {
  id: string;
  name: string;
  type: FleetType;
}

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  currency: ExpenseCurrency;
  notes: string | null;
}
