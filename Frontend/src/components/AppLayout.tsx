import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Notification, User as UserType, notificationsApi } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, User } from 'lucide-react';
import { ReactNode, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
	children: ReactNode;
}

export function AppLayout({ children }: Readonly<AppLayoutProps>) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

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

	// Fetch notifications
	const { data: notifications = [] } = useQuery({
		queryKey: ['notifications'],
		queryFn: () => notificationsApi.getList(),
		refetchInterval: 30000, // Refetch every 30 seconds
	});

	// Get unread notifications count
	const unreadCount = notifications.filter(n => !n.markedAsRead).length;

	// Mark notification as read mutation
	const markAsReadMutation = useMutation({
		mutationFn: (id: string) => notificationsApi.markAsRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});

	const handleNotificationClick = (notification: Notification) => {
		if (!notification.markedAsRead) {
			markAsReadMutation.mutate(notification.id);
		}
		// You can add navigation logic here based on notification type
	};

	return (
		<SidebarProvider>
			<div className='flex w-full min-h-screen'>
				<AppSidebar />
				<div className='flex flex-col flex-1'>
					<header className='top-0 z-10 sticky flex justify-between items-center bg-background px-6 border-b h-14'>
						<SidebarTrigger />
						<div className='flex items-center gap-4'>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='relative'>
										<Bell className='w-5 h-5' />
										{unreadCount > 0 && (
											<span className='top-1 right-1 absolute flex justify-center items-center bg-destructive rounded-full w-4 h-4 text-[10px] text-destructive-foreground'>
												{unreadCount > 9 ? '9+' : unreadCount}
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									className='w-80'>
									<DropdownMenuLabel>Notifications</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<ScrollArea className='h-[400px]'>
										{notifications.length === 0 ? (
											<div className='p-4 text-muted-foreground text-sm text-center'>
												No notifications
											</div>
										) : (
											notifications.map(notification => (
												<DropdownMenuItem
													key={notification.id}
													className='flex flex-col items-start p-3 cursor-pointer'
													onClick={() => handleNotificationClick(notification)}>
													<div className='flex justify-between items-start gap-2 w-full'>
														<div className='flex-1'>
															<p
																className={`text-sm ${
																	!notification.markedAsRead
																		? 'font-semibold'
																		: 'text-muted-foreground'
																}`}>
																{notification.message}
															</p>
															<p className='mt-1 text-muted-foreground text-xs'>
																{format(
																	new Date(notification.createdAt),
																	'MMM dd, yyyy HH:mm'
																)}
															</p>
														</div>
														{!notification.markedAsRead && (
															<div className='bg-primary rounded-full w-2 h-2' />
														)}
													</div>
												</DropdownMenuItem>
											))
										)}
									</ScrollArea>
									{notifications.length > 0 && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												className='justify-center text-center'
												onClick={() => {
													// Mark all as read
													notifications
														.filter(n => !n.markedAsRead)
														.forEach(n => markAsReadMutation.mutate(n.id));
												}}>
												Mark all as read
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'>
										<Avatar className='w-8 h-8'>
											<AvatarFallback className='bg-primary text-primary-foreground'>
												{userInitials}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuLabel>
										<div className='flex flex-col'>
											<span>{currentUser?.fullName || 'User'}</span>
											<span className='font-normal text-muted-foreground text-xs'>
												{currentUser?.role || 'Unknown'}
											</span>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={() => navigate('/profile-settings')}>
										<User className='mr-2 w-4 h-4' />
										Profile & Settings
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											localStorage.removeItem('token');
											localStorage.removeItem('user');
											navigate('/');
										}}>
										Logout
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</header>
					<main className='flex-1 p-6'>{children}</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
