import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminRoutes from "./pages/admin/Routes";
import AdminBuses from "./pages/admin/Buses";
import AdminSchedules from "./pages/admin/Schedules";
import AdminBookings from "./pages/admin/Bookings";
import AdminOffices from "./pages/admin/OfficesAdmin";
import TripSearch from "./pages/TripSearch";
import PassengerDetails from "./pages/PassengerDetails";
import Payment from "./pages/Payment";
import ETicket from "./pages/ETicket";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/admin/routes" element={<AdminRoutes />} />
            <Route path="/admin/buses" element={<AdminBuses />} />
            <Route path="/admin/schedules" element={<AdminSchedules />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/offices" element={<AdminOffices />} />
            <Route path="/book" element={<TripSearch />} />
            <Route path="/book/passengers" element={<PassengerDetails />} />
            <Route path="/book/seats" element={<SeatSelection />} />
            <Route path="/book/payment" element={<Payment />} />
            <Route path="/book/eticket" element={<ETicket />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
