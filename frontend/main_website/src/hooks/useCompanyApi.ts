/**
 * Hook to get company-filtered API instances
 * All API calls are automatically filtered by the user's company_id
 */

import { useAuth } from "@/contexts/AuthContext";
import {
  createRoutesApi,
  createBusesApi,
  createBookingsApi,
  createTripsApi,
  createEmployeesApi,
  createDriversApi,
  createTerminalsApi,
  createMaintenanceApi,
  createExpensesApi,
  createIncomeApi,
  createAttendanceApi,
  createPayrollApi,
  createLeaveApi,
  createFuelLogsApi,
  createNotificationsApi,
  createInvoicesApi,
  createRefundsApi,
  createDriverShiftsApi,
  createInspectionsApi,
  createJobPostingsApi,
  createJobApplicationsApi,
  createPerformanceApi,
  createIncidentsApi,
  createSparePartsApi,
  createPaymentsApi,
  createRouteFrequenciesApi,
  createSchedulesApi,
  createCitiesApi,
  createPassengersApi,
  createGpsTrackingApi,
  createBankAccountsApi,
} from "@/lib/company-api";

export function useCompanyApi() {
  const { companyId } = useAuth();

  return {
    companyId,
    routes: createRoutesApi(companyId),
    buses: createBusesApi(companyId),
    bookings: createBookingsApi(companyId),
    trips: createTripsApi(companyId),
    employees: createEmployeesApi(companyId),
    drivers: createDriversApi(companyId),
    terminals: createTerminalsApi(companyId),
    maintenance: createMaintenanceApi(companyId),
    expenses: createExpensesApi(companyId),
    income: createIncomeApi(companyId),
    attendance: createAttendanceApi(companyId),
    payroll: createPayrollApi(companyId),
    leave: createLeaveApi(companyId),
    fuelLogs: createFuelLogsApi(companyId),
    notifications: createNotificationsApi(companyId),
    invoices: createInvoicesApi(companyId),
    refunds: createRefundsApi(companyId),
    driverShifts: createDriverShiftsApi(companyId),
    inspections: createInspectionsApi(companyId),
    jobPostings: createJobPostingsApi(companyId),
    jobApplications: createJobApplicationsApi(companyId),
    performance: createPerformanceApi(companyId),
    incidents: createIncidentsApi(companyId),
    spareParts: createSparePartsApi(companyId),
    payments: createPaymentsApi(companyId),
    routeFrequencies: createRouteFrequenciesApi(companyId),
    schedules: createSchedulesApi(companyId),
    cities: createCitiesApi(companyId),
    passengers: createPassengersApi(companyId),
    gpsTracking: createGpsTrackingApi(companyId),
    bankAccounts: createBankAccountsApi(companyId),
  };
}

export default useCompanyApi;
