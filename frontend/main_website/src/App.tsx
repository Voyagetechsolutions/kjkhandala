import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { queryClient } from './lib/queryClient';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { AuthProvider } from './contexts/AuthContext';

// Public Pages
import Index from "./pages/Index";
import OurCoaches from "./pages/OurCoaches";
import BookingOffices from "./pages/BookingOffices";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import About from "./pages/About";
import Charters from "./pages/Charters";
import NotFound from "./pages/NotFound";
import FAQs from "./pages/FAQs";
import TicketRules from "./pages/TicketRules";
import Terms from "./pages/Terms";
import ServiceAdvisories from "./pages/ServiceAdvisories";
import Privacy from "./pages/Privacy";
import AcceptanceOfRisk from "./pages/AcceptanceOfRisk";
import Login from "./pages/Login";

// Booking Flow Pages
import TripSearch from "./pages/TripSearch";
import SeatSelection from "./pages/SeatSelection";
import PassengerDetails from "./pages/PassengerDetails";
import Payment from "./pages/Payment";
import BookingConfirmation from "./pages/BookingConfirmation";
import ETicket from "./pages/ETicket";
import MyBookings from "./pages/MyBookings";
import BookingFlow from "./pages/booking/BookingFlow";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import PassengerDetailsPage from "./pages/booking/PassengerDetailsPage";
import PaymentPage from "./pages/booking/PaymentPage";
import ConfirmationPage from "./pages/booking/ConfirmationPage";
import PaymentSuccess from "./pages/booking/PaymentSuccess";
import PaymentCancel from "./pages/booking/PaymentCancel";

// Admin Dashboard Pages (lazy loaded)
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminRoutes = lazy(() => import("./pages/admin/Routes"));
const AdminBuses = lazy(() => import("./pages/admin/Buses"));
const AdminBookings = lazy(() => import("./pages/admin/Bookings"));
const TripScheduling = lazy(() => import("./pages/admin/TripScheduling"));
const ShiftCalendar = lazy(() => import("./pages/admin/ShiftCalendar"));
const DriverManagement = lazy(() => import("./pages/admin/DriverManagement"));
const FleetManagement = lazy(() => import("./pages/admin/FleetManagement"));
const RouteManagement = lazy(() => import("./pages/admin/RouteManagement"));
const TerminalManagement = lazy(() => import("./pages/admin/TerminalManagement"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const SystemSettings = lazy(() => import("./pages/admin/SystemSettings"));
const ReportsAnalytics = lazy(() => import("./pages/admin/ReportsAnalytics"));
const FinanceManagement = lazy(() => import("./pages/admin/FinanceManagement"));
const HRManagement = lazy(() => import("./pages/admin/HRManagement"));
const MaintenanceManagement = lazy(() => import("./pages/admin/MaintenanceManagement"));
const LiveTracking = lazy(() => import("./pages/admin/LiveTracking"));
const PassengerManifest = lazy(() => import("./pages/admin/PassengerManifest"));
const CitiesManagement = lazy(() => import("./pages/admin/CitiesManagement"));
const FuelStations = lazy(() => import("./pages/admin/FuelStations"));
const Support = lazy(() => import("./pages/admin/Support"));
const TerminalOperations = lazy(() => import("./pages/admin/TerminalOperations"));
const AssignBus = lazy(() => import("./pages/admin/AssignBus"));
const Recruitment = lazy(() => import("./pages/admin/Recruitment"));
const OfficesAdmin = lazy(() => import("./pages/admin/OfficesAdmin"));
const ApiIntegration = lazy(() => import("./pages/admin/ApiIntegration"));
const AutomatedTripManagement = lazy(() => import("./pages/admin/AutomatedTripManagement"));
const SuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));

// Operations Dashboard
const OperationsDashboard = lazy(() => import("./pages/operations/OperationsDashboard"));
const OperationsTripManagement = lazy(() => import("./pages/operations/TripManagement"));
const OperationsFleetManagement = lazy(() => import("./pages/operations/FleetManagement"));
const OperationsDriverManagement = lazy(() => import("./pages/operations/DriverManagement"));
const OperationsShiftCalendar = lazy(() => import("./pages/operations/ShiftCalendar"));
const OperationsLiveTracking = lazy(() => import("./pages/operations/LiveTracking"));
const OperationsPassengerManifest = lazy(() => import("./pages/operations/PassengerManifest"));
const OperationsTerminalOperations = lazy(() => import("./pages/operations/TerminalOperations"));
const OperationsDelayManagement = lazy(() => import("./pages/operations/DelayManagement"));
const OperationsIncidentManagement = lazy(() => import("./pages/operations/IncidentManagement"));
const OperationsReports = lazy(() => import("./pages/operations/OperationsReports"));
const OperationsSettings = lazy(() => import("./pages/operations/OperationsSettings"));
const OperationsAssignBus = lazy(() => import("./pages/operations/AssignBus"));
const OperationsTripScheduling = lazy(() => import("./pages/operations/TripScheduling"));
const OperationsDriverOperations = lazy(() => import("./pages/operations/DriverOperations"));
const OperationsFleetOperations = lazy(() => import("./pages/operations/FleetOperations"));
const AutomatedDelayManagement = lazy(() => import("./pages/operations/AutomatedDelayManagement"));
const AutomatedTerminalOperations = lazy(() => import("./pages/operations/AutomatedTerminalOperations"));
const OperationsAutomatedTripManagement = lazy(() => import("./pages/operations/AutomatedTripManagement"));

// Finance Dashboard
const FinanceDashboard = lazy(() => import("./pages/finance/FinanceDashboard"));
const FinanceIncome = lazy(() => import("./pages/finance/Income"));
const FinanceExpenses = lazy(() => import("./pages/finance/Expenses"));
const FinancePayroll = lazy(() => import("./pages/finance/PayrollManagement"));
const FinanceInvoices = lazy(() => import("./pages/finance/Invoices"));
const FinanceRefunds = lazy(() => import("./pages/finance/Refunds"));
const FinanceFuel = lazy(() => import("./pages/finance/Fuel"));
const FinanceReports = lazy(() => import("./pages/finance/FinanceReports"));
const FinanceSettings = lazy(() => import("./pages/finance/Settings"));
const FinanceAccounts = lazy(() => import("./pages/finance/Accounts"));
const FinanceBankAccounts = lazy(() => import("./pages/finance/BankAccounts"));
const FinanceCollections = lazy(() => import("./pages/finance/Collections"));
const FinanceReconciliation = lazy(() => import("./pages/finance/Reconciliation"));
const FinanceRevenueAnalysis = lazy(() => import("./pages/finance/RevenueAnalysis"));

// HR Dashboard
const HRDashboard = lazy(() => import("./pages/hr/HRDashboard"));
const HREmployees = lazy(() => import("./pages/hr/Employees"));
const HRAttendance = lazy(() => import("./pages/hr/Attendance"));
const HRLeave = lazy(() => import("./pages/hr/Leave"));
const HRPayroll = lazy(() => import("./pages/hr/HRPayroll"));
const HRRecruitment = lazy(() => import("./pages/hr/Recruitment"));
const HRPerformance = lazy(() => import("./pages/hr/Performance"));
const HRDocuments = lazy(() => import("./pages/hr/Documents"));
const HRCompliance = lazy(() => import("./pages/hr/Compliance"));
const HRReports = lazy(() => import("./pages/hr/HRReports"));
const HRSettings = lazy(() => import("./pages/hr/HRSettings"));
const HRShifts = lazy(() => import("./pages/hr/Shifts"));

// Maintenance Dashboard
const MaintenanceDashboard = lazy(() => import("./pages/maintenance/MaintenanceDashboard"));
const MaintenanceSchedule = lazy(() => import("./pages/maintenance/Schedule"));
const MaintenanceWorkOrders = lazy(() => import("./pages/maintenance/WorkOrders"));
const MaintenanceInventory = lazy(() => import("./pages/maintenance/Inventory"));
const MaintenanceParts = lazy(() => import("./pages/maintenance/Parts"));
const MaintenanceInspections = lazy(() => import("./pages/maintenance/Inspections"));
const MaintenanceBreakdowns = lazy(() => import("./pages/maintenance/Breakdowns"));
const MaintenancePreventive = lazy(() => import("./pages/maintenance/Preventive"));
const MaintenanceReports = lazy(() => import("./pages/maintenance/MaintenanceReports"));
const MaintenanceSettings = lazy(() => import("./pages/maintenance/MaintenanceSettings"));
const MaintenanceCosts = lazy(() => import("./pages/maintenance/Costs"));
const MaintenanceRepairs = lazy(() => import("./pages/maintenance/Repairs"));
const MaintenanceServiceSchedule = lazy(() => import("./pages/maintenance/ServiceSchedule"));
const MaintenanceUpcoming = lazy(() => import("./pages/maintenance/UpcomingMaintenance"));

// Ticketing Dashboard
const TicketingDashboard = lazy(() => import("./pages/ticketing/TicketingDashboard"));
const TicketingSellTicket = lazy(() => import("./pages/ticketing/SellTicket"));
const TicketingSearchTrips = lazy(() => import("./pages/ticketing/SearchTrips"));
const TicketingFindTicket = lazy(() => import("./pages/ticketing/FindTicket"));
const TicketingCheckIn = lazy(() => import("./pages/ticketing/CheckIn"));
const TicketingModifyBooking = lazy(() => import("./pages/ticketing/ModifyBooking"));
const TicketingCancelRefund = lazy(() => import("./pages/ticketing/CancelRefund"));
const TicketingPassengerManifest = lazy(() => import("./pages/ticketing/PassengerManifest"));
const TicketingReports = lazy(() => import("./pages/ticketing/Reports"));
const TicketingSettings = lazy(() => import("./pages/ticketing/Settings"));
const TicketingPayments = lazy(() => import("./pages/ticketing/Payments"));
const TicketingCustomerLookup = lazy(() => import("./pages/ticketing/CustomerLookup"));
const TicketingReservedTickets = lazy(() => import("./pages/ticketing/ReservedTickets"));
const TicketingTripManagement = lazy(() => import("./pages/ticketing/TripManagement"));
const TicketingTerminalScreen = lazy(() => import("./pages/ticketing/TerminalScreen"));
const TicketingBookingSummary = lazy(() => import("./pages/ticketing/BookingSummary"));
const TicketingIssueTicket = lazy(() => import("./pages/ticketing/IssueTicket"));
const TicketingOfficeAdmin = lazy(() => import("./pages/ticketing/OfficeAdmin"));
const TicketingPassengerDetails = lazy(() => import("./pages/ticketing/PassengerDetails"));
const TicketingPayment = lazy(() => import("./pages/ticketing/TicketingPayment"));
const TicketingSeatSelection = lazy(() => import("./pages/ticketing/TicketingSeatSelection"));

// Driver Dashboard
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));
const DriverMyShifts = lazy(() => import("./pages/driver/MyShifts"));
const DriverMyTrips = lazy(() => import("./pages/driver/MyTrips"));
const DriverTripDetails = lazy(() => import("./pages/driver/TripDetails"));
const DriverStartTrip = lazy(() => import("./pages/driver/StartTrip"));
const DriverEndTrip = lazy(() => import("./pages/driver/EndTrip"));
const DriverManifest = lazy(() => import("./pages/driver/Manifest"));
const DriverFuelLogs = lazy(() => import("./pages/driver/FuelLogs"));
const DriverReportIssue = lazy(() => import("./pages/driver/ReportIssue"));
const DriverVehicleInspection = lazy(() => import("./pages/driver/VehicleInspection"));
const DriverProfile = lazy(() => import("./pages/driver/Profile"));
const DriverSettings = lazy(() => import("./pages/driver/Settings"));
const DriverTripHistory = lazy(() => import("./pages/driver/TripHistory"));
const DriverLiveTrip = lazy(() => import("./pages/driver/LiveTrip"));
const DriverBorderControl = lazy(() => import("./pages/driver/BorderControl"));

// Reports
const DailySales = lazy(() => import("./pages/reports/DailySales"));
const DriverPerformance = lazy(() => import("./pages/reports/DriverPerformance"));
const TripPerformance = lazy(() => import("./pages/reports/TripPerformance"));

// Settings
const CompanySettings = lazy(() => import("./pages/settings/Company"));
const ProfileSettings = lazy(() => import("./pages/settings/Profile"));
const NotificationSettings = lazy(() => import("./pages/settings/NotificationSettings"));

// Tracking
const LiveMap = lazy(() => import("./pages/tracking/LiveMap"));

// Auth Pages
const SetupAccount = lazy(() => import("./pages/auth/SetupAccount"));

// Platform Admin Pages
const CompanyOnboarding = lazy(() => import("./pages/platform/CompanyOnboarding"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
  </div>
);

/**
 * Main Website App - KJ Khandala Bus Company
 * Powered by Voyage Technology Solutions
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CurrencyProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/our-coaches" element={<OurCoaches />} />
                <Route path="/charters" element={<Charters />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/booking-offices" element={<BookingOffices />} />
                <Route path="/faqs" element={<FAQs />} />
                <Route path="/ticket-rules" element={<TicketRules />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/service-advisories" element={<ServiceAdvisories />} />
                <Route path="/risk" element={<AcceptanceOfRisk />} />
                
                {/* Staff Login */}
                <Route path="/login" element={<Login />} />
                <Route path="/staff" element={<Login />} />
                
                {/* Auth Pages */}
                <Route path="/auth/setup-account" element={<SetupAccount />} />
                
                {/* Developer Dashboard - Company Onboarding */}
                <Route path="/developer/onboarding" element={<CompanyOnboarding />} />
                <Route path="/developer/company-onboarding" element={<CompanyOnboarding />} />
                
                {/* Booking Flow */}
                <Route path="/search" element={<TripSearch />} />
                <Route path="/trips" element={<TripSearch />} />
                <Route path="/seat-selection" element={<SeatSelection />} />
                <Route path="/passenger-details" element={<PassengerDetails />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/e-ticket/:bookingId" element={<ETicket />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/booking" element={<BookingFlow />} />
                <Route path="/booking/seats" element={<SeatSelectionPage />} />
                <Route path="/booking/passengers" element={<PassengerDetailsPage />} />
                <Route path="/booking/payment" element={<PaymentPage />} />
                <Route path="/booking/confirmation" element={<ConfirmationPage />} />
                <Route path="/booking/success" element={<PaymentSuccess />} />
                <Route path="/booking/cancel" element={<PaymentCancel />} />
                
                {/* Admin Dashboard */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/routes" element={<AdminRoutes />} />
                <Route path="/admin/buses" element={<AdminBuses />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/trips" element={<TripScheduling />} />
                <Route path="/admin/trip-scheduling" element={<TripScheduling />} />
                <Route path="/admin/shifts" element={<ShiftCalendar />} />
                <Route path="/admin/shift-calendar" element={<ShiftCalendar />} />
                <Route path="/admin/drivers" element={<DriverManagement />} />
                <Route path="/admin/fleet" element={<FleetManagement />} />
                <Route path="/admin/route-management" element={<RouteManagement />} />
                <Route path="/admin/terminals" element={<TerminalManagement />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/settings" element={<SystemSettings />} />
                <Route path="/admin/reports" element={<ReportsAnalytics />} />
                <Route path="/admin/finance" element={<FinanceManagement />} />
                <Route path="/admin/hr" element={<HRManagement />} />
                <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
                <Route path="/admin/tracking" element={<LiveTracking />} />
                <Route path="/admin/manifest" element={<PassengerManifest />} />
                <Route path="/admin/cities" element={<CitiesManagement />} />
                <Route path="/admin/fuel-stations" element={<FuelStations />} />
                <Route path="/admin/support" element={<Support />} />
                <Route path="/admin/terminal-operations" element={<TerminalOperations />} />
                <Route path="/admin/assign-bus" element={<AssignBus />} />
                <Route path="/admin/recruitment" element={<Recruitment />} />
                <Route path="/admin/offices" element={<OfficesAdmin />} />
                <Route path="/admin/api-integration" element={<ApiIntegration />} />
                <Route path="/admin/automated-trips" element={<AutomatedTripManagement />} />
                <Route path="/admin/super" element={<SuperAdminDashboard />} />
                
                {/* Admin Finance Sub-routes (stay in AdminLayout) */}
                <Route path="/admin/finance" element={<FinanceDashboard />} />
                <Route path="/admin/finance/income" element={<FinanceIncome />} />
                <Route path="/admin/finance/expenses" element={<FinanceExpenses />} />
                <Route path="/admin/finance/revenue" element={<FinanceRevenueAnalysis />} />
                <Route path="/admin/finance/payroll" element={<FinancePayroll />} />
                <Route path="/admin/finance/fuel" element={<FinanceFuel />} />
                <Route path="/admin/finance/invoices" element={<FinanceInvoices />} />
                <Route path="/admin/finance/refunds" element={<FinanceRefunds />} />
                <Route path="/admin/finance/reports" element={<FinanceReports />} />
                <Route path="/admin/finance/reconciliation" element={<FinanceReconciliation />} />
                <Route path="/admin/finance/settings" element={<FinanceSettings />} />
                
                {/* Admin Ticketing Sub-routes (stay in AdminLayout) */}
                <Route path="/admin/ticketing" element={<TicketingDashboard />} />
                <Route path="/admin/ticketing/search" element={<TicketingSearchTrips />} />
                <Route path="/admin/ticketing/reserved" element={<TicketingReservedTickets />} />
                <Route path="/admin/ticketing/modify" element={<TicketingModifyBooking />} />
                <Route path="/admin/ticketing/refund" element={<TicketingCancelRefund />} />
                <Route path="/admin/ticketing/customers" element={<TicketingCustomerLookup />} />
                <Route path="/admin/ticketing/reports" element={<TicketingReports />} />
                
                {/* Admin HR Sub-routes (stay in AdminLayout) */}
                <Route path="/admin/hr" element={<HRDashboard />} />
                <Route path="/admin/hr/employees" element={<HREmployees />} />
                <Route path="/admin/hr/recruitment" element={<HRRecruitment />} />
                <Route path="/admin/hr/attendance" element={<HRAttendance />} />
                <Route path="/admin/hr/payroll" element={<HRPayroll />} />
                <Route path="/admin/hr/performance" element={<HRPerformance />} />
                <Route path="/admin/hr/compliance" element={<HRCompliance />} />
                <Route path="/admin/hr/leave" element={<HRLeave />} />
                <Route path="/admin/hr/documents" element={<HRDocuments />} />
                <Route path="/admin/hr/reports" element={<HRReports />} />
                <Route path="/admin/hr/settings" element={<HRSettings />} />
                
                {/* Admin Maintenance Sub-routes (stay in AdminLayout) */}
                <Route path="/admin/maintenance" element={<MaintenanceDashboard />} />
                <Route path="/admin/maintenance/work-orders" element={<MaintenanceWorkOrders />} />
                <Route path="/admin/maintenance/schedule" element={<MaintenanceSchedule />} />
                <Route path="/admin/maintenance/inspections" element={<MaintenanceInspections />} />
                <Route path="/admin/maintenance/repairs" element={<MaintenanceRepairs />} />
                <Route path="/admin/maintenance/inventory" element={<MaintenanceInventory />} />
                <Route path="/admin/maintenance/costs" element={<MaintenanceCosts />} />
                <Route path="/admin/maintenance/reports" element={<MaintenanceReports />} />
                <Route path="/admin/maintenance/settings" element={<MaintenanceSettings />} />
                <Route path="/admin/maintenance/breakdowns" element={<MaintenanceBreakdowns />} />
                <Route path="/admin/maintenance/parts" element={<MaintenanceParts />} />
                <Route path="/admin/maintenance/preventive" element={<MaintenancePreventive />} />
                
                {/* Operations Dashboard */}
                <Route path="/operations" element={<OperationsDashboard />} />
                <Route path="/operations/dashboard" element={<OperationsDashboard />} />
                <Route path="/operations/trips" element={<OperationsTripManagement />} />
                <Route path="/operations/fleet" element={<OperationsFleetManagement />} />
                <Route path="/operations/drivers" element={<OperationsDriverManagement />} />
                <Route path="/operations/shifts" element={<OperationsShiftCalendar />} />
                <Route path="/operations/tracking" element={<OperationsLiveTracking />} />
                <Route path="/operations/manifest" element={<OperationsPassengerManifest />} />
                <Route path="/operations/terminals" element={<OperationsTerminalOperations />} />
                <Route path="/operations/delays" element={<OperationsDelayManagement />} />
                <Route path="/operations/incidents" element={<OperationsIncidentManagement />} />
                <Route path="/operations/reports" element={<OperationsReports />} />
                <Route path="/operations/settings" element={<OperationsSettings />} />
                <Route path="/operations/assign-bus" element={<OperationsAssignBus />} />
                <Route path="/operations/trip-scheduling" element={<OperationsTripScheduling />} />
                <Route path="/operations/driver-operations" element={<OperationsDriverOperations />} />
                <Route path="/operations/fleet-operations" element={<OperationsFleetOperations />} />
                <Route path="/operations/automated-delays" element={<AutomatedDelayManagement />} />
                <Route path="/operations/automated-terminals" element={<AutomatedTerminalOperations />} />
                <Route path="/operations/automated-trips" element={<OperationsAutomatedTripManagement />} />
                
                {/* Finance Dashboard */}
                <Route path="/finance" element={<FinanceDashboard />} />
                <Route path="/finance/dashboard" element={<FinanceDashboard />} />
                <Route path="/finance/income" element={<FinanceIncome />} />
                <Route path="/finance/expenses" element={<FinanceExpenses />} />
                <Route path="/finance/payroll" element={<FinancePayroll />} />
                <Route path="/finance/invoices" element={<FinanceInvoices />} />
                <Route path="/finance/refunds" element={<FinanceRefunds />} />
                <Route path="/finance/fuel" element={<FinanceFuel />} />
                <Route path="/finance/reports" element={<FinanceReports />} />
                <Route path="/finance/settings" element={<FinanceSettings />} />
                <Route path="/finance/accounts" element={<FinanceAccounts />} />
                <Route path="/finance/bank-accounts" element={<FinanceBankAccounts />} />
                <Route path="/finance/collections" element={<FinanceCollections />} />
                <Route path="/finance/reconciliation" element={<FinanceReconciliation />} />
                <Route path="/finance/revenue" element={<FinanceRevenueAnalysis />} />
                
                {/* HR Dashboard */}
                <Route path="/hr" element={<HRDashboard />} />
                <Route path="/hr/dashboard" element={<HRDashboard />} />
                <Route path="/hr/employees" element={<HREmployees />} />
                <Route path="/hr/attendance" element={<HRAttendance />} />
                <Route path="/hr/leave" element={<HRLeave />} />
                <Route path="/hr/payroll" element={<HRPayroll />} />
                <Route path="/hr/recruitment" element={<HRRecruitment />} />
                <Route path="/hr/performance" element={<HRPerformance />} />
                <Route path="/hr/documents" element={<HRDocuments />} />
                <Route path="/hr/compliance" element={<HRCompliance />} />
                <Route path="/hr/reports" element={<HRReports />} />
                <Route path="/hr/settings" element={<HRSettings />} />
                <Route path="/hr/shifts" element={<HRShifts />} />
                
                {/* Maintenance Dashboard */}
                <Route path="/maintenance" element={<MaintenanceDashboard />} />
                <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
                <Route path="/maintenance/schedule" element={<MaintenanceSchedule />} />
                <Route path="/maintenance/work-orders" element={<MaintenanceWorkOrders />} />
                <Route path="/maintenance/inventory" element={<MaintenanceInventory />} />
                <Route path="/maintenance/parts" element={<MaintenanceParts />} />
                <Route path="/maintenance/inspections" element={<MaintenanceInspections />} />
                <Route path="/maintenance/breakdowns" element={<MaintenanceBreakdowns />} />
                <Route path="/maintenance/preventive" element={<MaintenancePreventive />} />
                <Route path="/maintenance/reports" element={<MaintenanceReports />} />
                <Route path="/maintenance/settings" element={<MaintenanceSettings />} />
                <Route path="/maintenance/costs" element={<MaintenanceCosts />} />
                <Route path="/maintenance/repairs" element={<MaintenanceRepairs />} />
                <Route path="/maintenance/service-schedule" element={<MaintenanceServiceSchedule />} />
                <Route path="/maintenance/upcoming" element={<MaintenanceUpcoming />} />
                
                {/* Ticketing Dashboard */}
                <Route path="/ticketing" element={<TicketingDashboard />} />
                <Route path="/ticketing/dashboard" element={<TicketingDashboard />} />
                <Route path="/ticketing/sell" element={<TicketingSellTicket />} />
                <Route path="/ticketing/search" element={<TicketingSearchTrips />} />
                <Route path="/ticketing/find" element={<TicketingFindTicket />} />
                <Route path="/ticketing/check-in" element={<TicketingCheckIn />} />
                <Route path="/ticketing/modify" element={<TicketingModifyBooking />} />
                <Route path="/ticketing/refund" element={<TicketingCancelRefund />} />
                <Route path="/ticketing/manifest" element={<TicketingPassengerManifest />} />
                <Route path="/ticketing/reports" element={<TicketingReports />} />
                <Route path="/ticketing/settings" element={<TicketingSettings />} />
                <Route path="/ticketing/payments" element={<TicketingPayments />} />
                <Route path="/ticketing/customers" element={<TicketingCustomerLookup />} />
                <Route path="/ticketing/reserved" element={<TicketingReservedTickets />} />
                <Route path="/ticketing/trips" element={<TicketingTripManagement />} />
                <Route path="/ticketing/terminal" element={<TicketingTerminalScreen />} />
                <Route path="/ticketing/booking-summary" element={<TicketingBookingSummary />} />
                <Route path="/ticketing/issue" element={<TicketingIssueTicket />} />
                <Route path="/ticketing/office-admin" element={<TicketingOfficeAdmin />} />
                <Route path="/ticketing/passenger-details" element={<TicketingPassengerDetails />} />
                <Route path="/ticketing/payment" element={<TicketingPayment />} />
                <Route path="/ticketing/seat-selection" element={<TicketingSeatSelection />} />
                
                {/* Driver Dashboard */}
                <Route path="/driver" element={<DriverDashboard />} />
                <Route path="/driver/dashboard" element={<DriverDashboard />} />
                <Route path="/driver/shifts" element={<DriverMyShifts />} />
                <Route path="/driver/trips" element={<DriverMyTrips />} />
                <Route path="/driver/trip/:id" element={<DriverTripDetails />} />
                <Route path="/driver/start-trip" element={<DriverStartTrip />} />
                <Route path="/driver/end-trip" element={<DriverEndTrip />} />
                <Route path="/driver/manifest" element={<DriverManifest />} />
                <Route path="/driver/fuel" element={<DriverFuelLogs />} />
                <Route path="/driver/report" element={<DriverReportIssue />} />
                <Route path="/driver/inspection" element={<DriverVehicleInspection />} />
                <Route path="/driver/profile" element={<DriverProfile />} />
                <Route path="/driver/settings" element={<DriverSettings />} />
                <Route path="/driver/history" element={<DriverTripHistory />} />
                <Route path="/driver/live" element={<DriverLiveTrip />} />
                <Route path="/driver/border" element={<DriverBorderControl />} />
                
                {/* Reports */}
                <Route path="/reports/daily-sales" element={<DailySales />} />
                <Route path="/reports/driver-performance" element={<DriverPerformance />} />
                <Route path="/reports/trip-performance" element={<TripPerformance />} />
                
                {/* Settings */}
                <Route path="/settings/company" element={<CompanySettings />} />
                <Route path="/settings/profile" element={<ProfileSettings />} />
                <Route path="/settings/notifications" element={<NotificationSettings />} />
                
                {/* Tracking */}
                <Route path="/tracking" element={<LiveMap />} />
                <Route path="/tracking/live" element={<LiveMap />} />
                
                {/* 404 - Must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </CurrencyProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
