import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Alerts from './pages/Alerts';
import Auth from './pages/Auth';
import BehavioralAnalytics from './pages/BehavioralAnalytics';
import Cases from './pages/Cases';
import CustomReports from './pages/CustomReports';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProfileSettings from './pages/ProfileSettings';
import Reports from './pages/Reports';
import RulesEngine from './pages/RulesEngine';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import TransactionDetails from './pages/TransactionDetails';
import Transactions from './pages/Transactions';
import UserManagement from './pages/UserManagement';

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<Routes>
					<Route
						path='/'
						element={<Auth />}
					/>
					<Route
						path='/dashboard'
						element={<Dashboard />}
					/>
					<Route
						path='/transactions'
						element={<Transactions />}
					/>
					<Route
						path='/transactions/:id'
						element={<TransactionDetails />}
					/>
					<Route
						path='/alerts'
						element={<Alerts />}
					/>
					<Route
						path='/cases'
						element={<Cases />}
					/>
					<Route
						path='/reports'
						element={<Reports />}
					/>
					<Route
						path='/custom-reports'
						element={<CustomReports />}
					/>
					<Route
						path='/behavioral-analytics'
						element={<BehavioralAnalytics />}
					/>
					<Route
						path='/rules-engine'
						element={<RulesEngine />}
					/>
					<Route
						path='/user-management'
						element={<UserManagement />}
					/>
					<Route
						path='/profile-settings'
						element={<ProfileSettings />}
					/>
					<Route
						path='*'
						element={<NotFound />}
					/>
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
