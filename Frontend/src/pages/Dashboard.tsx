import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { alertsApi, casesApi, transactionsApi } from '@/lib/api';
import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	CreditCard,
	Loader2,
	TrendingUp,
} from 'lucide-react';

import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motionConfig } from '@/lib/motionConfig';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
	const navigate = useNavigate();
	const [timeRange, setTimeRange] = useState('24h');
	const [tab, setTab] = useState('all');

	// Fetch all transactions from transaction monitoring table for accurate totals
	// First, get total count without time filter to show actual total
	const { data: allTransactionsData } = useQuery({
		queryKey: ['dashboard-all-transactions'],
		queryFn: async () => {
			return transactionsApi.getList({ page: 1, pageSize: 10000 });
		},
	});

	// Fetch transactions with time range filter for display
	const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
		queryKey: ['dashboard-transactions', timeRange],
		queryFn: async () => {
			const params: { page: number; pageSize: number; from?: string } = {
				page: 1,
				pageSize: 10000, // Fetch all transactions for accurate totals
			};

			if (timeRange === '24h') {
				const yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				params.from = yesterday.toISOString();
			} else if (timeRange === '7d') {
				const weekAgo = new Date();
				weekAgo.setDate(weekAgo.getDate() - 7);
				params.from = weekAgo.toISOString();
			} else if (timeRange === '30d') {
				const monthAgo = new Date();
				monthAgo.setDate(monthAgo.getDate() - 30);
				params.from = monthAgo.toISOString();
			}

			return transactionsApi.getList(params);
		},
	});

	// Fetch alerts for stats
	const { data: alertsData, isLoading: alertsLoading } = useQuery({
		queryKey: ['dashboard-alerts'],
		queryFn: async () => {
			return alertsApi.getList({ page: 1, pageSize: 1000 });
		},
	});

	// Fetch cases to check resolved status
	const { data: casesData } = useQuery({
		queryKey: ['cases'],
		queryFn: () => casesApi.getList({ page: 1, pageSize: 1000 }),
	});

	const allTransactions = transactionsData?.items || [];
	const allAlerts = alertsData?.items || []; // These are transactions with risk score > 0
	const cases = casesData?.items || [];

	// Calculate KPIs based on real data from transaction monitoring table
	// Use ALL transactions (without time filter) for total count and amount
	const allTransactionsForTotal = allTransactionsData?.items || [];
	const totalTransactionsCount = allTransactionsData?.total || 0;
	const totalAmount = allTransactionsForTotal.reduce(
		(sum, t) => sum + Number(t.amount || 0),
		0
	);

	// For display, show only the first 10 transactions from the time-filtered results
	const transactions = allTransactions.slice(0, 10);

	// Flagged alerts: All transactions with risk score > 0 (which is what alerts API returns)
	const flaggedAlertsCount = allAlerts.length;

	// Resolved cases: Cases with status = Closed (2)
	const resolvedCases = cases.filter(c => {
		const status =
			typeof c.status === 'string' ? Number.parseInt(c.status, 10) : c.status;
		return status === 2; // Closed/Resolved
	});
	const resolvedCasesCount = resolvedCases.length;

	// Pending cases: Cases with status = Open (0) or UnderInvestigation (1)
	const pendingCases = cases.filter(c => {
		const status =
			typeof c.status === 'string' ? Number.parseInt(c.status, 10) : c.status;
		return status === 0 || status === 1; // Open or UnderInvestigation
	});
	const pendingCasesCount = pendingCases.length;

	// Total cases count
	const totalCasesCount = cases.length;

	// Filter transactions based on tab
	const filteredTransactions = transactions.filter(t => {
		if (tab === 'flagged') {
			// Flagged only: transactions with risk score > 0
			return (t.riskScore || 0) > 0;
		}
		if (tab === 'resolved') {
			// Resolved: transactions with cases that have status = Closed (2)
			const caseForTransaction = cases.find(c => c.transactionId === t.id);
			if (caseForTransaction) {
				const status =
					typeof caseForTransaction.status === 'string'
						? Number.parseInt(caseForTransaction.status, 10)
						: caseForTransaction.status;
				return status === 2; // Closed/Resolved
			}
			return false;
		}
		return true;
	});

	const getSeverityLabel = (riskScore: number) => {
		if (riskScore >= 80) return 'high';
		if (riskScore >= 50) return 'medium';
		return 'low';
	};
	return (
		<AppLayout>
			<div className='space-y-6'>
				<div>
					<h1 className='font-bold text-3xl tracking-tight'>Dashboard</h1>
					<p className='text-muted-foreground'>
						High-level summary of financial activities.
					</p>
				</div>

				<Tabs
					value={tab}
					onValueChange={setTab}
					className='space-y-4'>
					<div className='flex justify-between items-center'>
						<TabsList>
							<TabsTrigger value='all'>All Transactions</TabsTrigger>
							<TabsTrigger value='flagged'>Flagged Only</TabsTrigger>
							<TabsTrigger value='resolved'>Resolved</TabsTrigger>
						</TabsList>
						<Select
							value={timeRange}
							onValueChange={setTimeRange}>
							<SelectTrigger className='w-[180px]'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='24h'>Last 24 Hours</SelectItem>
								<SelectItem value='7d'>Last 7 Days</SelectItem>
								<SelectItem value='30d'>Last 30 Days</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='gap-4 grid md:grid-cols-2 lg:grid-cols-4'>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...motionConfig.cardTransition, delay: 0.1 }}>
							<Card>
								<CardHeader className='flex flex-row justify-between items-center space-y-0 pb-2'>
									<CardTitle className='font-medium text-sm'>
										Total Transactions
									</CardTitle>
									<CreditCard className='w-4 h-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='font-bold text-2xl'>
										{(() => {
											if (transactionsLoading) {
												return <Loader2 className='w-6 h-6 animate-spin' />;
											}
											if (totalAmount >= 1000000) {
												return (
													<>
														₦
														<CountUp
															end={totalAmount / 1000000}
															decimals={1}
															duration={1.5}
														/>
														M
													</>
												);
											} else if (totalAmount >= 1000) {
												return (
													<>
														₦
														<CountUp
															end={totalAmount / 1000}
															decimals={1}
															duration={1.5}
														/>
														K
													</>
												);
											} else {
												return (
													<>
														₦
														<CountUp
															end={totalAmount}
															duration={1.5}
															separator=','
														/>
													</>
												);
											}
										})()}
										`
									</div>
									<p className='text-success text-xs'>
										<TrendingUp className='inline mr-1 w-3 h-3' />
										<CountUp
											end={totalTransactionsCount}
											duration={1.5}
										/>{' '}
										transactions
									</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...motionConfig.cardTransition, delay: 0.2 }}>
							<Card>
								<CardHeader className='flex flex-row justify-between items-center space-y-0 pb-2'>
									<CardTitle className='font-medium text-sm'>
										Flagged Alerts
									</CardTitle>
									<AlertTriangle className='w-4 h-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='font-bold text-2xl'>
										{alertsLoading ? (
											<Loader2 className='w-6 h-6 animate-spin' />
										) : (
											<CountUp
												end={flaggedAlertsCount}
												duration={1.5}
											/>
										)}
									</div>
									<p className='text-destructive text-xs'>
										{totalTransactionsCount > 0 ? (
											<>
												<CountUp
													end={
														(flaggedAlertsCount / totalTransactionsCount) * 100
													}
													decimals={1}
													duration={1.5}
												/>
												% of transactions
											</>
										) : (
											'No transactions'
										)}
									</p>
									{totalTransactionsCount > 0 && (
										<motion.div
											className='bg-muted mt-2 rounded-full h-1 overflow-hidden'
											initial={{ width: 0 }}
											animate={{ width: '100%' }}
											transition={{ duration: 1.5, delay: 0.5 }}>
											<motion.div
												className='bg-destructive h-full'
												initial={{ width: 0 }}
												animate={{
													width: `${
														(flaggedAlertsCount / totalTransactionsCount) * 100
													}%`,
												}}
												transition={{ duration: 1.5, delay: 0.5 }}
											/>
										</motion.div>
									)}
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...motionConfig.cardTransition, delay: 0.3 }}>
							<Card>
								<CardHeader className='flex flex-row justify-between items-center space-y-0 pb-2'>
									<CardTitle className='font-medium text-sm'>
										Resolved Cases
									</CardTitle>
									<CheckCircle2 className='w-4 h-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='font-bold text-2xl'>
										{alertsLoading ? (
											<Loader2 className='w-6 h-6 animate-spin' />
										) : (
											<CountUp
												end={resolvedCasesCount}
												duration={1.5}
											/>
										)}
									</div>
									<p className='text-success text-xs'>
										{totalCasesCount > 0 ? (
											<>
												<CountUp
													end={(resolvedCasesCount / totalCasesCount) * 100}
													decimals={1}
													duration={1.5}
												/>
												% of cases
											</>
										) : flaggedAlertsCount > 0 ? (
											<>
												<CountUp
													end={(resolvedCasesCount / flaggedAlertsCount) * 100}
													decimals={1}
													duration={1.5}
												/>
												% of flagged alerts
											</>
										) : (
											'No cases'
										)}
									</p>
									{totalCasesCount > 0 && (
										<motion.div
											className='bg-muted mt-2 rounded-full h-1 overflow-hidden'
											initial={{ width: 0 }}
											animate={{ width: '100%' }}
											transition={{ duration: 1.5, delay: 0.6 }}>
											<motion.div
												className='bg-success h-full'
												initial={{ width: 0 }}
												animate={{
													width: `${
														(resolvedCasesCount / totalCasesCount) * 100
													}%`,
												}}
												transition={{ duration: 1.5, delay: 0.6 }}
											/>
										</motion.div>
									)}
								</CardContent>
							</Card>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ ...motionConfig.cardTransition, delay: 0.4 }}>
							<Card>
								<CardHeader className='flex flex-row justify-between items-center space-y-0 pb-2'>
									<CardTitle className='font-medium text-sm'>
										Pending Cases
									</CardTitle>
									<Clock className='w-4 h-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='font-bold text-2xl'>
										{alertsLoading ? (
											<Loader2 className='w-6 h-6 animate-spin' />
										) : (
											<CountUp
												end={pendingCasesCount}
												duration={1.5}
											/>
										)}
									</div>
									<p className='text-yellow-600 text-xs'>
										{totalCasesCount > 0 ? (
											<>
												<CountUp
													end={(pendingCasesCount / totalCasesCount) * 100}
													decimals={1}
													duration={1.5}
												/>
												% of cases
											</>
										) : flaggedAlertsCount > 0 ? (
											<>
												<CountUp
													end={(pendingCasesCount / flaggedAlertsCount) * 100}
													decimals={1}
													duration={1.5}
												/>
												% of flagged alerts
											</>
										) : (
											'No cases'
										)}
									</p>
									{totalCasesCount > 0 && (
										<motion.div
											className='bg-muted mt-2 rounded-full h-1 overflow-hidden'
											initial={{ width: 0 }}
											animate={{ width: '100%' }}
											transition={{ duration: 1.5, delay: 0.7 }}>
											<motion.div
												className='bg-yellow-600 h-full'
												initial={{ width: 0 }}
												animate={{
													width: `${
														(pendingCasesCount / totalCasesCount) * 100
													}%`,
												}}
												transition={{ duration: 1.5, delay: 0.7 }}
											/>
										</motion.div>
									)}
								</CardContent>
							</Card>
						</motion.div>
					</div>

					<TabsContent
						value='all'
						className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Recent Transactions</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Transaction ID</TableHead>
											<TableHead>User</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Severity</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactionsLoading ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className='py-8 text-center'>
													<Loader2 className='mx-auto w-6 h-6 animate-spin' />
												</TableCell>
											</TableRow>
										) : filteredTransactions.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className='py-8 text-muted-foreground text-center'>
													No transactions found
												</TableCell>
											</TableRow>
										) : (
											filteredTransactions.map((transaction, index) => {
												const severity = getSeverityLabel(
													transaction.riskScore || 0
												);
												const isHighSeverity = severity === 'high';
												return (
													<motion.tr
														key={transaction.id}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{
															...motionConfig.rowTransition,
															delay: index * 0.05,
														}}
														className={isHighSeverity ? 'relative' : ''}>
														{isHighSeverity && (
															<motion.div
																className='absolute inset-0 bg-red-50 dark:bg-red-950/20'
																initial={{ opacity: 0 }}
																animate={{ opacity: [0, 0.3, 0] }}
																transition={{
																	duration: 1,
																	repeat: 1,
																	delay: index * 0.05 + 0.3,
																}}
															/>
														)}
														<TableCell className='relative font-medium'>
															{transaction.id.substring(0, 8)}...
														</TableCell>
														<TableCell className='relative'>
															{transaction.senderAccountNumber}
														</TableCell>
														<TableCell className='relative'>
															₦{transaction.amount.toLocaleString()}
														</TableCell>
														<TableCell className='relative'>
															{format(
																new Date(transaction.createdAt),
																'MMM dd, yyyy HH:mm'
															)}
														</TableCell>
														<TableCell className='relative'>
															<Badge
																variant={
																	severity === 'high'
																		? 'destructive'
																		: severity === 'medium'
																		? 'default'
																		: 'secondary'
																}
																className={
																	severity === 'medium'
																		? 'bg-yellow-500 text-white hover:bg-yellow-600'
																		: ''
																}>
																{severity}
															</Badge>
														</TableCell>
														<TableCell className='relative'>
															<motion.div
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																transition={motionConfig.hoverTransition}>
																<Button
																	variant='link'
																	size='sm'
																	className='text-primary hover:text-primary/80 transition-colors'
																	onClick={() =>
																		navigate(`/transactions/${transaction.id}`)
																	}>
																	View Details
																</Button>
															</motion.div>
														</TableCell>
													</motion.tr>
												);
											})
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent
						value='flagged'
						className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Flagged Transactions (Risk Score &gt; 0)</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Transaction ID</TableHead>
											<TableHead>User</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Risk Score</TableHead>
											<TableHead>Severity</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactionsLoading ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className='py-8 text-center'>
													<Loader2 className='mx-auto w-6 h-6 animate-spin' />
												</TableCell>
											</TableRow>
										) : filteredTransactions.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className='py-8 text-muted-foreground text-center'>
													No flagged transactions found
												</TableCell>
											</TableRow>
										) : (
											filteredTransactions.map((transaction, index) => {
												const severity = getSeverityLabel(
													transaction.riskScore || 0
												);
												const isHighSeverity = severity === 'high';
												return (
													<motion.tr
														key={transaction.id}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{
															...motionConfig.rowTransition,
															delay: index * 0.05,
														}}
														className={isHighSeverity ? 'relative' : ''}>
														{isHighSeverity && (
															<motion.div
																className='absolute inset-0 bg-red-50 dark:bg-red-950/20'
																initial={{ opacity: 0 }}
																animate={{ opacity: [0, 0.3, 0] }}
																transition={{
																	duration: 1,
																	repeat: 1,
																	delay: index * 0.05 + 0.3,
																}}
															/>
														)}
														<TableCell className='relative font-medium'>
															{transaction.id.substring(0, 8)}...
														</TableCell>
														<TableCell className='relative'>
															{transaction.senderAccountNumber}
														</TableCell>
														<TableCell className='relative'>
															₦{transaction.amount.toLocaleString()}
														</TableCell>
														<TableCell className='relative'>
															{format(
																new Date(transaction.createdAt),
																'MMM dd, yyyy HH:mm'
															)}
														</TableCell>
														<TableCell className='relative'>
															<span className='font-medium'>
																{transaction.riskScore || 0}
															</span>
														</TableCell>
														<TableCell className='relative'>
															<Badge
																variant={
																	severity === 'high'
																		? 'destructive'
																		: severity === 'medium'
																		? 'default'
																		: 'secondary'
																}
																className={
																	severity === 'medium'
																		? 'bg-yellow-500 text-white hover:bg-yellow-600'
																		: ''
																}>
																{severity}
															</Badge>
														</TableCell>
														<TableCell className='relative'>
															<motion.div
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																transition={motionConfig.hoverTransition}>
																<Button
																	variant='link'
																	size='sm'
																	className='text-primary hover:text-primary/80 transition-colors'
																	onClick={() =>
																		navigate(`/transactions/${transaction.id}`)
																	}>
																	View Details
																</Button>
															</motion.div>
														</TableCell>
													</motion.tr>
												);
											})
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent
						value='resolved'
						className='space-y-4'>
						<Card>
							<CardHeader>
								<CardTitle>Resolved Transactions</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Transaction ID</TableHead>
											<TableHead>User</TableHead>
											<TableHead>Amount</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Risk Score</TableHead>
											<TableHead>Severity</TableHead>
											<TableHead>Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactionsLoading ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className='py-8 text-center'>
													<Loader2 className='mx-auto w-6 h-6 animate-spin' />
												</TableCell>
											</TableRow>
										) : filteredTransactions.length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={7}
													className='py-8 text-muted-foreground text-center'>
													No resolved transactions found
												</TableCell>
											</TableRow>
										) : (
											filteredTransactions.map((transaction, index) => {
												const severity = getSeverityLabel(
													transaction.riskScore || 0
												);
												const isHighSeverity = severity === 'high';
												return (
													<motion.tr
														key={transaction.id}
														initial={{ opacity: 0, x: -20 }}
														animate={{ opacity: 1, x: 0 }}
														transition={{
															...motionConfig.rowTransition,
															delay: index * 0.05,
														}}
														className={isHighSeverity ? 'relative' : ''}>
														{isHighSeverity && (
															<motion.div
																className='absolute inset-0 bg-red-50 dark:bg-red-950/20'
																initial={{ opacity: 0 }}
																animate={{ opacity: [0, 0.3, 0] }}
																transition={{
																	duration: 1,
																	repeat: 1,
																	delay: index * 0.05 + 0.3,
																}}
															/>
														)}
														<TableCell className='relative font-medium'>
															{transaction.id.substring(0, 8)}...
														</TableCell>
														<TableCell className='relative'>
															{transaction.senderAccountNumber}
														</TableCell>
														<TableCell className='relative'>
															₦{transaction.amount.toLocaleString()}
														</TableCell>
														<TableCell className='relative'>
															{format(
																new Date(transaction.createdAt),
																'MMM dd, yyyy HH:mm'
															)}
														</TableCell>
														<TableCell className='relative'>
															<span className='font-medium'>
																{transaction.riskScore || 0}
															</span>
														</TableCell>
														<TableCell className='relative'>
															<Badge
																variant={
																	severity === 'high'
																		? 'destructive'
																		: severity === 'medium'
																		? 'default'
																		: 'secondary'
																}
																className={
																	severity === 'medium'
																		? 'bg-yellow-500 text-white hover:bg-yellow-600'
																		: ''
																}>
																{severity}
															</Badge>
														</TableCell>
														<TableCell className='relative'>
															<motion.div
																whileHover={{ scale: 1.05 }}
																whileTap={{ scale: 0.95 }}
																transition={motionConfig.hoverTransition}>
																<Button
																	variant='link'
																	size='sm'
																	className='text-primary hover:text-primary/80 transition-colors'
																	onClick={() =>
																		navigate(`/transactions/${transaction.id}`)
																	}>
																	View Details
																</Button>
															</motion.div>
														</TableCell>
													</motion.tr>
												);
											})
										)}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</AppLayout>
	);
}
