import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { User as UserType, alertsApi, casesApi } from '@/lib/api';
import { motionConfig } from '@/lib/motionConfig';
import {
	filterMenuItemsByRole,
	getCurrentUserRole,
	type MenuItem,
} from '@/lib/permissions';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
	Activity,
	AlertTriangle,
	BarChart3,
	CreditCard,
	FileText,
	FolderKanban,
	LayoutDashboard,
	LogOut,
	Settings,
	Shield,
	User as UserIcon,
	Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const menuItems: MenuItem[] = [
	{
		title: 'Dashboard',
		url: '/dashboard',
		icon: LayoutDashboard,
		roles: ['Admin', 'Analyst', 'Investigator', 'Viewer'],
	},
	{
		title: 'Transaction Monitoring',
		url: '/transactions',
		icon: CreditCard,
		roles: ['Admin', 'Analyst', 'Investigator', 'Viewer'],
	},
	{
		title: 'Alerts',
		url: '/alerts',
		icon: AlertTriangle,
		roles: ['Admin', 'Investigator', 'Viewer'],
	},
	{
		title: 'Case Management',
		url: '/cases',
		icon: FolderKanban,
		roles: ['Admin', 'Analyst', 'Investigator'],
	},
	{
		title: 'Reports & Analytics',
		url: '/reports',
		icon: BarChart3,
		roles: ['Admin', 'Analyst', 'Investigator', 'Viewer'],
	},
	{
		title: 'Custom Reports',
		url: '/custom-reports',
		icon: FileText,
		roles: ['Admin', 'Analyst'],
	},
	{
		title: 'Behavioral Analytics',
		url: '/behavioral-analytics',
		icon: Activity,
		roles: ['Admin', 'Analyst'],
	},
	{
		title: 'Rules Engine',
		url: '/rules-engine',
		icon: Settings,
		roles: ['Admin'],
	},
	{
		title: 'User & Role Management',
		url: '/user-management',
		icon: Users,
		roles: ['Admin'],
	},
];

export function AppSidebar() {
	const navigate = useNavigate();
	const location = useLocation();

	// Get logged-in user from localStorage
	const currentUser = useMemo(() => {
		try {
			const userStr = localStorage.getItem('user');
			if (userStr) {
				return JSON.parse(userStr) as UserType;
			}
		} catch (error) {
			console.error('Error parsing user from localStorage:', error);
		}
		return null;
	}, []);

	// Get user role and filter menu items based on role
	const userRole = useMemo(() => getCurrentUserRole(), []);
	const visibleMenuItems = useMemo(() => {
		return filterMenuItemsByRole(menuItems, userRole);
	}, [userRole]);

	// Get user initials for avatar
	const userInitials = useMemo(() => {
		if (currentUser?.fullName) {
			return currentUser.fullName
				.split(' ')
				.map(n => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2);
		}
		return 'U';
	}, [currentUser]);

	// Fetch alerts and cases to calculate count of alerts without cases
	const { data: alertsData } = useQuery({
		queryKey: ['sidebar-alerts'],
		queryFn: () => alertsApi.getList({ page: 1, pageSize: 10000 }),
		refetchInterval: 30000, // Refetch every 30 seconds
	});

	const { data: casesData } = useQuery({
		queryKey: ['sidebar-cases'],
		queryFn: () => casesApi.getList({ page: 1, pageSize: 10000 }),
		refetchInterval: 30000, // Refetch every 30 seconds
	});

	// Calculate count of transactions with alerts but no case
	const alertsWithoutCaseCount = useMemo(() => {
		const alerts = alertsData?.items || [];
		const cases = casesData?.items || [];
		const caseTransactionIds = new Set(cases.map(c => c.transactionId));
		return alerts.filter(alert => !caseTransactionIds.has(alert.id)).length;
	}, [alertsData, casesData]);

	return (
		<Sidebar className='border-r-0'>
			<SidebarHeader className='p-4 border-sidebar-border border-b'>
				<div className='flex items-center gap-2'>
					<div className='flex justify-center items-center bg-yellow-500 rounded-md w-8 h-8'>
						<Shield className='w-5 h-5 text-white' />
					</div>
					<div>
						<h2 className='font-bold text-sidebar-foreground text-lg'>
							FirstGuard
						</h2>
						<p className='text-sidebar-foreground/70 text-xs'>
							Fraud Detection
						</p>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{visibleMenuItems.map(item => {
								const isActive =
									item.url === '/'
										? location.pathname === '/'
										: location.pathname.startsWith(item.url);

								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<NavLink
												to={item.url}
												end={item.url === '/'}
												className={`relative flex items-center gap-2 transition-colors ${
													isActive
														? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border-l-4 border-blue-600 dark:border-blue-400'
														: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
												}`}>
												<motion.div
													whileHover={{ scale: 1.1 }}
													transition={motionConfig.hoverTransition}
													className={
														isActive ? 'text-blue-700 dark:text-blue-300' : ''
													}>
													<item.icon className='w-4 h-4' />
												</motion.div>
												<span className='flex-1'>{item.title}</span>
												{item.title === 'Alerts' &&
													alertsWithoutCaseCount > 0 && (
														<motion.div
															animate={{ scale: [1, 1.1, 1] }}
															transition={{
																duration: 2,
																repeat: Infinity,
																ease: 'easeInOut',
															}}>
															<Badge
																variant='destructive'
																className='px-1.5 min-w-5 h-5 text-xs animate-pulse'>
																{alertsWithoutCaseCount > 99
																	? '99+'
																	: alertsWithoutCaseCount}
															</Badge>
														</motion.div>
													)}
											</NavLink>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='p-4 border-sidebar-border border-t'>
				<div className='flex items-center gap-3 mb-3'>
					<Avatar className='w-10 h-10'>
						<AvatarFallback className='bg-primary text-primary-foreground text-sm'>
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className='flex-1'>
						<p className='font-semibold text-sidebar-foreground text-sm'>
							{currentUser?.fullName || 'User'}
						</p>
						<p className='text-sidebar-foreground/70 text-xs'>
							{currentUser?.role || 'Unknown'}
						</p>
					</div>
				</div>
				<Separator className='mb-2' />
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<NavLink
								to='/profile-settings'
								className={`relative flex items-center gap-2 transition-colors ${
									location.pathname === '/profile-settings'
										? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border-l-4 border-blue-600 dark:border-blue-400'
										: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
								}`}>
								<UserIcon
									className={`h-4 w-4 ${
										location.pathname === '/profile-settings'
											? 'text-blue-700 dark:text-blue-300'
											: ''
									}`}
								/>
								<span>Profile & Settings</span>
							</NavLink>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => {
								localStorage.removeItem('token');
								localStorage.removeItem('user');
								navigate('/');
							}}>
							<LogOut className='w-4 h-4' />
							<span>Logout</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
