import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import Alerts from "./pages/Alerts";
import Cases from "./pages/Cases";
import Reports from "./pages/Reports";
import CustomReports from "./pages/CustomReports";
import BehavioralAnalytics from "./pages/BehavioralAnalytics";
import RulesEngine from "./pages/RulesEngine";
import UserManagement from "./pages/UserManagement";
import ProfileSettings from "./pages/ProfileSettings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes - All authenticated users */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator", "Viewer"]}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator", "Viewer"]}>
                <Transactions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions/:id" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator", "Viewer"]}>
                <TransactionDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator", "Viewer"]}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Admin, Analyst, Investigator, Viewer */}
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Investigator", "Viewer"]}>
                <Alerts />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Admin, Analyst, Investigator */}
          <Route 
            path="/cases" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator"]}>
                <Cases />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Admin, Analyst */}
          <Route 
            path="/custom-reports" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst"]}>
                <CustomReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/behavioral-analytics" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst"]}>
                <BehavioralAnalytics />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected routes - Admin only */}
          <Route 
            path="/rules-engine" 
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <RulesEngine />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-management" 
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Profile settings - All authenticated users */}
          <Route 
            path="/profile-settings" 
            element={
              <ProtectedRoute allowedRoles={["Admin", "Analyst", "Investigator", "Viewer"]}>
                <ProfileSettings />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
