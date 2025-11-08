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
import RoutesPage from "./pages/Routes";
import OurCoaches from "./pages/OurCoaches";
import BookingOffices from "./pages/BookingOffices";
import Contact from "./pages/Contact";
import SeatSelection from "./pages/SeatSelection";
import BookingConfirmation from "./pages/BookingConfirmation";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/SuperAdminDashboard";
import AdminRoutes from "./pages/admin/Routes";
import AdminBuses from "./pages/admin/Buses";
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
import OperationsDashboard from "./pages/operations/OperationsDashboard";
import OperationsManifest from "./pages/operations/PassengerManifest";
import TripManagement from "./pages/operations/TripManagement";
import FleetOperations from "./pages/operations/FleetOperations";
import DriverOperations from "./pages/operations/DriverOperations";
import IncidentManagement from "./pages/operations/IncidentManagement";
import DelayManagement from "./pages/operations/DelayManagement";
import OperationsReports from "./pages/operations/OperationsReports";
import TerminalOperations from "./pages/operations/TerminalOperations";
import OperationsSettings from "./pages/operations/OperationsSettings";
import RoutingTest from "./pages/operations/RoutingTest";
import TicketingDashboard from "./pages/ticketing/TicketingDashboard";
import SellTicket from "./pages/ticketing/SellTicket";
import CheckIn from "./pages/ticketing/CheckIn";
import FindTicket from "./pages/ticketing/FindTicket";
import Payments from "./pages/ticketing/Payments";
import TicketingReports from "./pages/ticketing/Reports";
import TicketingSettings from "./pages/ticketing/Settings";
import TicketingManifest from "./pages/ticketing/PassengerManifest";
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
import IncomeManagement from "./pages/finance/IncomeManagement";
import ExpenseManagement from "./pages/finance/ExpenseManagement";
import PayrollManagement from "./pages/finance/PayrollManagement";
import FuelAllowance from "./pages/finance/FuelAllowance";
import Invoices from "./pages/finance/Invoices";
import Refunds from "./pages/finance/Refunds";
import Reports from "./pages/finance/Reports";
import Accounts from "./pages/finance/Accounts";
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
// Driver imports moved to line 57-65
import TripSearch from "./pages/TripSearch";
import PassengerDetails from "./pages/PassengerDetails";
import Payment from "./pages/Payment";
import ETicket from "./pages/ETicket";

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
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/our-coaches" element={<OurCoaches />} />
            <Route path="/booking-offices" element={<BookingOffices />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/seat-selection/:scheduleId" element={<SeatSelection />} />
            <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/fleet" element={<FleetManagement />} />
            <Route path="/admin/drivers" element={<DriverManagement />} />
            <Route path="/admin/route-management" element={<RouteManagement />} />
            <Route path="/admin/trips" element={<TripScheduling />} />
            <Route path="/admin/manifest" element={<PassengerManifest />} />
            <Route path="/admin/finance" element={<FinanceManagement />} />
            <Route path="/admin/hr" element={<HRManagement />} />
            <Route path="/admin/maintenance" element={<MaintenanceManagement />} />
            <Route path="/admin/tracking" element={<LiveTracking />} />
            <Route path="/admin/reports" element={<ReportsAnalytics />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
            <Route path="/admin/routes" element={<AdminRoutes />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/offices" element={<AdminOffices />} />
            <Route path="/book" element={<TripSearch />} />
            <Route path="/book/passengers" element={<PassengerDetails />} />
            <Route path="/book/seats" element={<SeatSelection />} />
            <Route path="/book/payment" element={<Payment />} />
            <Route path="/book/eticket" element={<ETicket />} />
            <Route path="/operations" element={<OperationsDashboard />} />
            <Route path="/operations/test" element={<RoutingTest />} />
            <Route path="/operations/trips" element={<TripManagement />} />
            <Route path="/operations/fleet" element={<FleetOperations />} />
            <Route path="/operations/drivers" element={<DriverOperations />} />
            <Route path="/operations/incidents" element={<IncidentManagement />} />
            <Route path="/operations/delays" element={<DelayManagement />} />
            <Route path="/operations/reports" element={<OperationsReports />} />
            <Route path="/operations/terminal" element={<TerminalOperations />} />
            <Route path="/operations/settings" element={<OperationsSettings />} />
            <Route path="/operations/manifest" element={<OperationsManifest />} />
            <Route path="/ticketing" element={<TicketingDashboard />} />
            <Route path="/ticketing/sell" element={<SellTicket />} />
            <Route path="/ticketing/check-in" element={<CheckIn />} />
            <Route path="/ticketing/find" element={<FindTicket />} />
            <Route path="/ticketing/payments" element={<Payments />} />
            <Route path="/ticketing/manifest" element={<TicketingManifest />} />
            <Route path="/ticketing/reports" element={<TicketingReports />} />
            <Route path="/ticketing/settings" element={<TicketingSettings />} />
            <Route path="/finance" element={<FinanceDashboard />} />
            <Route path="/finance/income" element={<IncomeManagement />} />
            <Route path="/finance/expenses" element={<ExpenseManagement />} />
            <Route path="/finance/payroll" element={<PayrollManagement />} />
            <Route path="/finance/fuel-allowance" element={<FuelAllowance />} />
            <Route path="/finance/invoices" element={<Invoices />} />
            <Route path="/finance/refunds" element={<Refunds />} />
            <Route path="/finance/reports" element={<Reports />} />
            <Route path="/finance/accounts" element={<Accounts />} />
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
