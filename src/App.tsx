import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MyCourses from "./pages/MyCourses";
import PurchaseHistory from "./pages/PurchaseHistory";
import Pricing from "./pages/Pricing";
import Practice from "./pages/Practice";
import Exams from "./pages/Exams";
import ExamList from "./pages/ExamList";
import ExamPreview from "./pages/ExamPreview";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import MyDocuments from "./pages/MyDocuments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/lessons/:id" element={<LessonDetail />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route path="/my-documents" element={<MyDocuments />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:gradeId/:subjectId" element={<ExamList />} />
              <Route path="/exams/preview/:examId" element={<ExamPreview />} />
              <Route path="/purchase" element={<Checkout />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/purchase-history" element={<PurchaseHistory />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/games" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
