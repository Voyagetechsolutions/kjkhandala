import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Navbar from "./components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import OurCoaches from "./pages/OurCoaches";
import BookingOffices from "./pages/BookingOffices";
import Contact from "./pages/Contact";
import SeatSelection from "./pages/SeatSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingConfirmationNew from "./pages/BookingConfirmationNew";
import MyBookings from "./pages/MyBookings";
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
import AdminDashboard from "./pages/admin/SuperAdminDashboard";
import CommandCenter from "./pages/admin/operations/CommandCenter";
import AdminRoutes from "./pages/admin/Routes";
import CitiesManagement from "./pages/admin/CitiesManagement";
import AdminSchedules from "./pages/admin/Schedules";
import AdminBookings from "./pages/admin/Bookings";
import AdminOffices from "./pages/admin/OfficesAdmin";
import FleetManagement from "./pages/admin/FleetManagement";
import DriverManagement from "./pages/admin/DriverManagement";
import RouteManagement from "./pages/admin/RouteManagement";
import TripScheduling from "./pages/admin/TripScheduling";
import FinanceManagement from "./pages/admin/FinanceManagement";
import HRManagement from "./pages/admin/HRManagement";
import MaintenanceManagement from "./pages/admin/MaintenanceManagement";
import LiveTracking from "./pages/admin/LiveTracking";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import PassengerManifest from "./pages/admin/PassengerManifest";
import AssignBus from "./pages/admin/AssignBus";
import OperationsDashboard from "./pages/operations/OperationsDashboard";
import OperationsAssignBus from "./pages/operations/AssignBus";
import OperationsManifest from "./pages/operations/PassengerManifest";
import OperationsTripScheduling from "./pages/operations/TripScheduling";
import TripManagement from "./pages/operations/TripManagement";
import AutomatedTripManagement from "./pages/operations/AutomatedTripManagement";
import ShiftCalendar from "./pages/operations/ShiftCalendar";
import AdminShiftCalendar from "./pages/admin/ShiftCalendar";
import AdminAutomatedTripManagement from "./pages/admin/AutomatedTripManagement";
import AdminSupport from "./pages/admin/Support";
import AdminRecruitment from "./pages/admin/Recruitment";
import FleetOperations from "./pages/operations/FleetOperations";
import OperationsFleetManagement from "./pages/operations/FleetManagement";
import DriverOperations from "./pages/operations/DriverOperations";
import OperationsDriverManagement from "./pages/operations/DriverManagement";
import IncidentManagement from "./pages/operations/IncidentManagement";
import DelayManagement from "./pages/operations/DelayManagement";
import OperationsReports from "./pages/operations/OperationsReports";
import TerminalOperations from "./pages/operations/TerminalOperations";
import TerminalManagement from "./pages/admin/TerminalManagement";
import AdminTerminalOperations from "./pages/admin/TerminalOperations";
import TerminalScreen from "./pages/ticketing/TerminalScreen";
import OperationsSettings from "./pages/operations/OperationsSettings";
import RoutingTest from "./pages/operations/RoutingTest";
import OperationsLiveTracking from "./pages/operations/LiveTracking";
import TicketingDashboard from "./pages/ticketing/TicketingDashboard";
import SellTicket from "./pages/ticketing/SellTicket";
import CheckIn from "./pages/ticketing/CheckIn";
import FindTicket from "./pages/ticketing/FindTicket";
import Payments from "./pages/ticketing/Payments";
import TicketingReports from "./pages/ticketing/Reports";
import TicketingSettings from "./pages/ticketing/Settings";
import TicketingManifest from "./pages/ticketing/PassengerManifest";
// New Ticketing System Pages
import SearchTrips from "./pages/ticketing/SearchTrips";
import TicketingSeatSelection from "./pages/ticketing/TicketingSeatSelection";
import TicketingPassengerDetails from "./pages/ticketing/PassengerDetails";
import TicketingPayment from "./pages/ticketing/TicketingPayment";
import BookingSummary from "./pages/ticketing/BookingSummary";
import IssueTicket from "./pages/ticketing/IssueTicket";
import ModifyBooking from "./pages/ticketing/ModifyBooking";
import CancelRefund from "./pages/ticketing/CancelRefund";
import CustomerLookup from "./pages/ticketing/CustomerLookup";
import TicketingTripManagement from "./pages/ticketing/TripManagement";
import OfficeAdmin from "./pages/ticketing/OfficeAdmin";
import ReservedTickets from "./pages/ticketing/ReservedTickets";
import DriverHome from "./pages/driver/DriverHome";
import TripDetails from "./pages/driver/TripDetails";
import Manifest from "./pages/driver/Manifest";
import StartTrip from "./pages/driver/StartTrip";
import LiveTrip from "./pages/driver/LiveTrip";
import LogStop from "./pages/driver/LogStop";
import BorderControl from "./pages/driver/BorderControl";
import ReportIssue from "./pages/driver/ReportIssue";
import EndTrip from "./pages/driver/EndTrip";
import Profile from "./pages/driver/Profile";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import Income from "./pages/finance/Income";
import Expense from "./pages/finance/Expense";
import PayrollManagement from "./pages/finance/PayrollManagement";
import Fuel from "./pages/finance/Fuel";
import Invoice from "./pages/finance/Invoice";
import Refund from "./pages/finance/Refund";
import FinanceReports from "./pages/finance/FinanceReports";
import RevenueAnalysis from "./pages/finance/RevenueAnalysis";
import BankAccounts from "./pages/finance/BankAccounts";
import FinanceSettings from "./pages/finance/Settings";
import MaintenanceDashboard from "./pages/maintenance/MaintenanceDashboard";
import WorkOrders from "./pages/maintenance/WorkOrders";
import Schedule from "./pages/maintenance/Schedule";
import Inspections from "./pages/maintenance/Inspections";
import Repairs from "./pages/maintenance/Repairs";
import Inventory from "./pages/maintenance/Inventory";
import Costs from "./pages/maintenance/Costs";
import MaintenanceReports from "./pages/maintenance/MaintenanceReports";
import MaintenanceSettings from "./pages/maintenance/MaintenanceSettings";
import HRDashboard from "./pages/hr/HRDashboard";
import Employees from "./pages/hr/Employees";
import Attendance from "./pages/hr/Attendance";
import Leave from "./pages/hr/Leave";
import Compliance from "./pages/hr/Compliance";
import Recruitment from "./pages/hr/Recruitment";
import Performance from "./pages/hr/Performance";
import HRPayroll from "./pages/hr/HRPayroll";
import HRReports from "./pages/hr/HRReports";
import HRSettings from "./pages/hr/HRSettings";
import Documents from "./pages/hr/Documents";
import Shifts from "./pages/hr/Shifts";
import Breakdowns from "./pages/maintenance/Breakdowns";
import Parts from "./pages/maintenance/Parts";
import Preventive from "./pages/maintenance/Preventive";
import UpcomingMaintenance from "./pages/maintenance/UpcomingMaintenance";
import ServiceSchedule from "./pages/maintenance/ServiceSchedule";
// Driver imports moved to line 57-65
import TripSearch from "./pages/TripSearch";
import PassengerDetails from "./pages/PassengerDetails";
import Payment from "./pages/Payment";
import PaymentNew from "./pages/PaymentNew";
import ETicket from "./pages/ETicket";
// New Booking Flow Pages
import PassengerDetailsPage from "./pages/booking/PassengerDetailsPage";
import SeatSelectionPage from "./pages/booking/SeatSelectionPage";
import PaymentPage from "./pages/booking/PaymentPage";
import ConfirmationPage from "./pages/booking/ConfirmationPage";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CurrencyProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* New Booking Flow - Widget Based */}
            <Route path="/book/passenger-details" element={<PassengerDetailsPage />} />
            <Route path="/book/seat-selection" element={<SeatSelectionPage />} />
            <Route path="/book/payment-method" element={<PaymentPage />} />
            <Route path="/book/confirmation" element={<ConfirmationPage />} />
            
            {/* Old Booking Routes (Legacy) */}
            <Route path="/book" element={<TripSearch />} />
            <Route path="/book/passengers" element={<PassengerDetails />} />
            <Route path="/book/seats" element={<SeatSelection />} />
            <Route path="/book/payment" element={<PaymentNew />} />
            <Route path="/our-coaches" element={<OurCoaches />} />
            <Route path="/booking-offices" element={<BookingOffices />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/about" element={<About/>} />
            <Route path="/charters" element={<Charters />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/ticket-rules" element={<TicketRules />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/service-advisories" element={<ServiceAdvisories />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/risk" element={<AcceptanceOfRisk />} />
            <Route path="/seat-selection/:scheduleId" element={<SeatSelection />} />
            <Route path="/booking-confirmation/:bookingId?" element={<BookingConfirmationNew />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<CommandCenter />} />
            <Route path="/admin/dashboard" element={<CommandCenter />} />
            <Route path="/admin/old-dashboard" element={<AdminDashboard />} />
            <Route path="/admin/fleet" element={<FleetManagement />} />
            <Route path="/admin/drivers" element={<DriverManagement />} />
            <Route path="/admin/route-management" element={<RouteManagement />} />
            <Route path="/admin/trips" element={<TripScheduling />} />
            <Route path="/admin/trip-management" element={<AdminAutomatedTripManagement />} />
            <Route path="/admin/driver-shifts" element={<AdminShiftCalendar />} />
            <Route path="/admin/manifest" element={<PassengerManifest />} />
            <Route path="/admin/finance" element={<FinanceManagement />} />
            <Route path="/admin/hr" element={<HRManagement />} />
            <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
            <Route path="/admin/tracking" element={<LiveTracking />} />
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/routes" element={<AdminRoutes />} />
            <Route path="/admin/cities" element={<CitiesManagement />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/offices" element={<AdminOffices />} />
            <Route path="/admin/incidents" element={<IncidentManagement />} />
            <Route path="/admin/delays" element={<DelayManagement />} />
            <Route path="/admin/passenger-manifest" element={<PassengerManifest />} />
            <Route path="/admin/assign-bus" element={<AssignBus />} />
            <Route path="/admin/terminal" element={<AdminTerminalOperations />} />
            <Route path="/admin/terminal-management" element={<TerminalManagement />} />
            <Route path="/book" element={<TripSearch />} />
            <Route path="/book/passengers" element={<PassengerDetails />} />
            <Route path="/book/seats" element={<SeatSelection />} />
            <Route path="/book/payment" element={<PaymentNew />} />
            <Route path="/book/eticket" element={<ETicket />} />
            <Route path="/operations" element={<OperationsDashboard />} />
            <Route path="/operations/test" element={<RoutingTest />} />
            <Route path="/operations/trips" element={<OperationsTripScheduling />} />
            <Route path="/operations/trip-management" element={<AutomatedTripManagement />} />
            <Route path="/operations/driver-shifts" element={<ShiftCalendar />} />
            <Route path="/operations/fleet" element={<FleetManagement />} />
            <Route path="/operations/drivers" element={<DriverManagement />} />
            <Route path="/operations/tracking" element={<OperationsLiveTracking />} />
            <Route path="/operations/cities" element={<CitiesManagement />} />
            <Route path="/operations/routes" element={<RouteManagement />} />
            <Route path="/operations/incidents" element={<IncidentManagement />} />
            <Route path="/operations/delays" element={<DelayManagement />} />
            <Route path="/operations/passenger-manifest" element={<OperationsManifest />} />
            <Route path="/operations/assign-bus" element={<OperationsAssignBus />} />
            <Route path="/operations/reports" element={<ReportsAnalytics />} />
            <Route path="/operations/terminal" element={<TerminalOperations />} />
            <Route path="/operations/settings" element={<OperationsSettings />} />
            <Route path="/admin/delays" element={<DelayManagement />} />
            <Route path="/admin/terminal" element={<AdminTerminalOperations />} />
            <Route path="/operations/manifest" element={<OperationsManifest />} />
            <Route path="/operations/live-tracking" element={<OperationsLiveTracking />} />
            {/* Admin Ticketing Routes */}
            <Route path="/admin/ticketing" element={<TicketingDashboard />} />
            <Route path="/admin/ticketing/search-trips" element={<SearchTrips />} />
            <Route path="/admin/ticketing/seat-selection" element={<TicketingSeatSelection />} />
            <Route path="/admin/ticketing/passenger-details" element={<TicketingPassengerDetails />} />
            <Route path="/admin/ticketing/payment" element={<TicketingPayment />} />
            <Route path="/admin/ticketing/booking-summary" element={<BookingSummary />} />
            <Route path="/admin/ticketing/issue-ticket" element={<IssueTicket />} />
            <Route path="/admin/ticketing/modify-booking" element={<ModifyBooking />} />
            <Route path="/admin/ticketing/cancel-refund" element={<CancelRefund />} />
            <Route path="/admin/ticketing/customer-lookup" element={<CustomerLookup />} />
            <Route path="/admin/ticketing/trip-management" element={<TicketingTripManagement />} />
            <Route path="/admin/ticketing/office-admin" element={<OfficeAdmin />} />
            <Route path="/admin/ticketing/reserved" element={<ReservedTickets />} />
            <Route path="/admin/ticketing/sell" element={<SellTicket />} />
            <Route path="/admin/ticketing/check-in" element={<CheckIn />} />
            <Route path="/admin/ticketing/find" element={<FindTicket />} />
            <Route path="/admin/ticketing/payments" element={<Payments />} />
            <Route path="/admin/ticketing/reports" element={<TicketingReports />} />
            <Route path="/admin/ticketing/settings" element={<TicketingSettings />} />
            {/* Ticketing Routes */}
            <Route path="/ticketing" element={<TicketingDashboard />} />
            <Route path="/ticketing/search-trips" element={<SearchTrips />} />
            <Route path="/ticketing/seat-selection" element={<TicketingSeatSelection />} />
            <Route path="/ticketing/passenger-details" element={<TicketingPassengerDetails />} />
            <Route path="/ticketing/payment" element={<TicketingPayment />} />
            <Route path="/ticketing/booking-summary" element={<BookingSummary />} />
            <Route path="/ticketing/issue-ticket" element={<IssueTicket />} />
            <Route path="/ticketing/modify-booking" element={<ModifyBooking />} />
            <Route path="/ticketing/cancel-refund" element={<CancelRefund />} />
            <Route path="/ticketing/customer-lookup" element={<CustomerLookup />} />
            <Route path="/ticketing/passenger-manifest" element={<TicketingManifest />} />
            <Route path="/ticketing/trip-management" element={<TicketingTripManagement />} />
            <Route path="/ticketing/office-admin" element={<OfficeAdmin />} />
            <Route path="/ticketing/reserved" element={<ReservedTickets />} />
            <Route path="/ticketing/terminal-screen" element={<TerminalScreen />} />
            {/* Legacy Ticketing Routes */}
            <Route path="/ticketing/sell" element={<SellTicket />} />
            <Route path="/ticketing/check-in" element={<CheckIn />} />
            <Route path="/ticketing/find" element={<FindTicket />} />
            <Route path="/ticketing/payments" element={<Payments />} />
            <Route path="/ticketing/manifest" element={<TicketingManifest />} />
            <Route path="/ticketing/reports" element={<TicketingReports />} />
            <Route path="/ticketing/settings" element={<TicketingSettings />} />
            <Route path="/admin/finance" element={<FinanceDashboard />} />
            <Route path="/admin/finance/income" element={<Income />} />
            <Route path="/admin/finance/expenses" element={<Expense />} />
            <Route path="/admin/finance/revenue-analysis" element={<RevenueAnalysis />} />
            <Route path="/admin/finance/payroll" element={<PayrollManagement />} />
            <Route path="/admin/finance/fuel-allowance" element={<Fuel />} />
            <Route path="/admin/finance/invoices" element={<Invoice />} />
            <Route path="/admin/finance/refunds" element={<Refund />} />
            <Route path="/admin/finance/reports" element={<FinanceReports />} />
            <Route path="/admin/finance/accounts" element={<BankAccounts />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/income" element={<Income />} />
            <Route path="/finance/expenses" element={<Expense />} />
            <Route path="/finance/payroll" element={<PayrollManagement />} />
            <Route path="/finance/fuel-allowance" element={<Fuel />} />
            <Route path="/finance/invoices" element={<Invoice />} />
            <Route path="/finance/refunds" element={<Refund />} />
            <Route path="/finance/reports" element={<FinanceReports />} />
            <Route path="/finance/accounts" element={<BankAccounts />} />
            <Route path="/finance/settings" element={<FinanceSettings />} />
            <Route path="/maintenance" element={<MaintenanceDashboard />} />
            <Route path="/maintenance/work-orders" element={<WorkOrders />} />
            <Route path="/maintenance/schedule" element={<Schedule />} />
            <Route path="/maintenance/inspections" element={<Inspections />} />
            <Route path="/maintenance/repairs" element={<Repairs />} />
            <Route path="/maintenance/inventory" element={<Inventory />} />
            <Route path="/maintenance/costs" element={<Costs />} />
            <Route path="/maintenance/reports" element={<MaintenanceReports />} />
            <Route path="/maintenance/settings" element={<MaintenanceSettings />} />
            <Route path="/maintenance/breakdowns" element={<Breakdowns />} />
            <Route path="/maintenance/parts" element={<Parts />} />
            <Route path="/maintenance/preventive" element={<Preventive />} />
            <Route path="/maintenance/upcoming" element={<UpcomingMaintenance />} />
            <Route path="/maintenance/service-schedule" element={<ServiceSchedule />} />
            {/* Admin Maintenance Routes */}
            <Route path="/admin/maintenance" element={<MaintenanceDashboard />} />
            <Route path="/admin/maintenance/work-orders" element={<WorkOrders />} />
            <Route path="/admin/maintenance/schedule" element={<Schedule />} />
            <Route path="/admin/maintenance/inspections" element={<Inspections />} />
            <Route path="/admin/maintenance/repairs" element={<Repairs />} />
            <Route path="/admin/maintenance/inventory" element={<Inventory />} />
            <Route path="/admin/maintenance/costs" element={<Costs />} />
            <Route path="/admin/maintenance/reports" element={<MaintenanceReports />} />
            <Route path="/admin/maintenance/settings" element={<MaintenanceSettings />} />
            <Route path="/admin/maintenance/breakdowns" element={<Breakdowns />} />
            <Route path="/admin/maintenance/parts" element={<Parts />} />
            <Route path="/admin/maintenance/preventive" element={<Preventive />} />
            <Route path="/admin/maintenance/upcoming" element={<UpcomingMaintenance />} />
            <Route path="/admin/maintenance/service-schedule" element={<ServiceSchedule />} />
            <Route path="/hr" element={<HRDashboard />} />
            <Route path="/hr/employees" element={<Employees />} />
            <Route path="/hr/attendance" element={<Attendance />} />
            <Route path="/hr/leave" element={<Leave />} />
            <Route path="/hr/compliance" element={<Compliance />} />
            <Route path="/hr/recruitment" element={<Recruitment />} />
            <Route path="/hr/performance" element={<Performance />} />
            <Route path="/hr/payroll" element={<HRPayroll />} />
            <Route path="/hr/reports" element={<HRReports />} />
            <Route path="/hr/settings" element={<HRSettings />} />
            <Route path="/hr/documents" element={<Documents />} />
            <Route path="/hr/shifts" element={<Shifts />} />
            {/* Admin HR Routes */}
            <Route path="/admin/hr" element={<HRDashboard />} />
            <Route path="/admin/hr/employees" element={<Employees />} />
            <Route path="/admin/hr/attendance" element={<Attendance />} />
            <Route path="/admin/hr/leave" element={<Leave />} />
            <Route path="/admin/hr/compliance" element={<Compliance />} />
            <Route path="/admin/hr/recruitment" element={<AdminRecruitment />} />
            <Route path="/admin/hr/performance" element={<Performance />} />
            <Route path="/admin/hr/payroll" element={<HRPayroll />} />
            <Route path="/admin/hr/support" element={<AdminSupport />} />
            <Route path="/admin/hr/reports" element={<HRReports />} />
            <Route path="/admin/hr/settings" element={<HRSettings />} />
            <Route path="/admin/hr/documents" element={<Documents />} />
            <Route path="/admin/hr/shifts" element={<Shifts />} />
            <Route path="/driver" element={<DriverHome />} />
            <Route path="/driver/trip-details" element={<TripDetails />} />
            <Route path="/driver/manifest" element={<Manifest />} />
            <Route path="/driver/start-trip" element={<StartTrip />} />
            <Route path="/driver/live" element={<LiveTrip />} />
            <Route path="/driver/stops" element={<LogStop />} />
            <Route path="/driver/border-control" element={<BorderControl />} />
            <Route path="/driver/report" element={<ReportIssue />} />
            <Route path="/driver/end-trip" element={<EndTrip />} />
            <Route path="/driver/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </CurrencyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
