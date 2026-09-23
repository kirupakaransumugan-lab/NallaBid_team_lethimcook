import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import CreateRFQ from './pages/buyer/CreateRFQ';
import RFQDetails from './pages/buyer/RFQDetails';
import RFQList from './pages/buyer/RFQList';
import Comparison from './pages/buyer/Comparison';
import BuyerAwardResult from './pages/buyer/AwardResult';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierRFQDetails from './pages/supplier/SupplierRFQDetails';
import QuotationForm from './pages/supplier/QuotationForm';
import MyQuotations from './pages/supplier/MyQuotations';
import SupplierAwardResult from './pages/supplier/AwardResult';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/buyer/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/buyer/rfqs" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><RFQList /></ProtectedRoute>} />
        <Route path="/buyer/rfqs/new" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><CreateRFQ /></ProtectedRoute>} />
        <Route path="/buyer/rfqs/:id" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><RFQDetails /></ProtectedRoute>} />
        <Route path="/buyer/rfqs/:id/comparison" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><Comparison /></ProtectedRoute>} />
        <Route path="/buyer/rfqs/:id/award" element={<ProtectedRoute allowedRoles={[ROLES.BUYER]}><BuyerAwardResult /></ProtectedRoute>} />

        <Route path="/supplier/dashboard" element={<ProtectedRoute allowedRoles={[ROLES.SUPPLIER]}><SupplierDashboard /></ProtectedRoute>} />
        <Route path="/supplier/rfqs/:id" element={<ProtectedRoute allowedRoles={[ROLES.SUPPLIER]}><SupplierRFQDetails /></ProtectedRoute>} />
        <Route path="/supplier/rfqs/:id/quote" element={<ProtectedRoute allowedRoles={[ROLES.SUPPLIER]}><QuotationForm /></ProtectedRoute>} />
        <Route path="/supplier/quotations" element={<ProtectedRoute allowedRoles={[ROLES.SUPPLIER]}><MyQuotations /></ProtectedRoute>} />
        <Route path="/supplier/rfqs/:id/award" element={<ProtectedRoute allowedRoles={[ROLES.SUPPLIER]}><SupplierAwardResult /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
