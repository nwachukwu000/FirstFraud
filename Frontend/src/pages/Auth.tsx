import { Eye, EyeOff, Loader2, Lock, Shield, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
	}>({});
	const navigate = useNavigate();
	const { toast } = useToast();

	const validate = () => {
		const errors: { email?: string; password?: string } = {};

		if (!email.trim()) {
			errors.email = 'Please enter your email address.';
		}

		if (!password.trim()) {
			errors.password = 'Please enter your password.';
		}

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setErrorMessage(null);
		setFieldErrors({});

		if (!validate()) {
			setErrorMessage('We need both your email and password to sign you in.');
			return;
		}

		setIsLoading(true);

		try {
			const response = await authApi.login(email.trim(), password);
			localStorage.setItem('token', response.token);
			localStorage.setItem('user', JSON.stringify(response.user));

			toast({
				title: 'Welcome back',
				description: `Signed in as ${response.user.fullName}`,
			});

			navigate('/dashboard');
		} catch (error) {
			let message =
				'We could not sign you in. Please check your credentials and try again.';

			if (isAxiosError(error)) {
				const status = error.response?.status;
				const backendMessage = (
					error.response?.data as { message?: string } | undefined
				)?.message;

				if (status === 401) {
					message = 'Invalid credential please provide the correct credentials';
				} else if (backendMessage) {
					message = backendMessage;
				} else if (status === 0 || !status) {
					message =
						"We couldn't reach the server. Please confirm the backend is running.";
				}
			}

			setErrorMessage(message);
		} finally {
			setIsLoading(false);
		}
	};

	const emailInputHasError = Boolean(fieldErrors.email);
	const passwordInputHasError = Boolean(fieldErrors.password);

	return (
		<div className='flex min-h-screen'>
			{/* Left Side - Branding */}
			<div className='hidden lg:flex flex-col justify-between bg-primary p-12 w-1/2 text-primary-foreground'>
				<div className='flex items-center gap-3'>
					<div className='flex justify-center items-center bg-yellow-500 rounded-lg w-12 h-12'>
						<Shield className='w-7 h-7 text-white' />
					</div>
					<h1 className='font-bold text-2xl'>FirstGuard</h1>
				</div>

				<div className='space-y-6'>
					<h2 className='font-bold text-5xl leading-tight'>
						Secure, Real-Time Fraud Detection
					</h2>
					<p className='text-primary-foreground/80 text-lg'>
						Our advanced, rules-based system provides low-latency detection to
						protect your financial activities around the clock.
					</p>
				</div>

				<div className='text-primary-foreground/60 text-sm'>
					© 2025 FirstGuard. All rights reserved.
				</div>
			</div>

			{/* Right Side - Login Form */}
			<div className='flex justify-center items-center bg-background p-8 w-full lg:w-1/2'>
				<div className='space-y-8 w-full max-w-md'>
					<div className='space-y-2 text-center'>
						<h1 className='font-bold text-3xl tracking-tight'>Welcome Back</h1>
						<p className='text-muted-foreground'>
							Please enter your details to sign in.
						</p>
					</div>

					<form
						onSubmit={handleLogin}
						className='space-y-6'>
						<div className='space-y-2'>
							<Label htmlFor='email'>Username or Email</Label>
							<div className='relative'>
								<User className='top-3 left-3 absolute w-4 h-4 text-muted-foreground' />
								<Input
									id='email'
									type='text'
									placeholder='admin@fraudguard.com'
									value={email}
									onChange={event => {
										setEmail(event.target.value);
										if (errorMessage) {
											setErrorMessage(null);
										}
										if (fieldErrors.email) {
											setFieldErrors(prev => ({ ...prev, email: undefined }));
										}
									}}
									autoComplete='username'
									className={`pl-10 ${
										emailInputHasError
											? 'border-destructive focus-visible:ring-destructive'
											: ''
									}`}
									disabled={isLoading}
									aria-invalid={emailInputHasError}
									aria-describedby={
										emailInputHasError ? 'email-error' : undefined
									}
								/>
							</div>
							{fieldErrors.email ? (
								<p
									id='email-error'
									className='text-destructive text-sm'>
									{fieldErrors.email}
								</p>
							) : null}
						</div>

						<div className='space-y-2'>
							<div className='flex justify-between items-center'></div>
							<div className='relative'>
								<Lock className='top-3 left-3 absolute w-4 h-4 text-muted-foreground' />
								<Input
									id='password'
									type={showPassword ? 'text' : 'password'}
									placeholder='••••••••'
									value={password}
									onChange={event => {
										setPassword(event.target.value);
										if (errorMessage) {
											setErrorMessage(null);
										}
										if (fieldErrors.password) {
											setFieldErrors(prev => ({
												...prev,
												password: undefined,
											}));
										}
									}}
									autoComplete='current-password'
									className={`pl-10 pr-10 ${
										passwordInputHasError
											? 'border-destructive focus-visible:ring-destructive'
											: ''
									}`}
									disabled={isLoading}
									aria-invalid={passwordInputHasError}
									aria-describedby={
										passwordInputHasError ? 'password-error' : undefined
									}
								/>
								<button
									type='button'
									onClick={() => setShowPassword(!showPassword)}
									className='top-3 right-3 absolute text-muted-foreground hover:text-foreground'
									disabled={isLoading}>
									{showPassword ? (
										<EyeOff className='w-4 h-4' />
									) : (
										<Eye className='w-4 h-4' />
									)}
								</button>
							</div>
							{fieldErrors.password ? (
								<p
									id='password-error'
									className='text-destructive text-sm'>
									{fieldErrors.password}
								</p>
							) : null}
						</div>

						{errorMessage ? (
							<div className='bg-destructive/10 p-3 border border-destructive/50 rounded-md text-destructive text-sm'>
								{errorMessage}
							</div>
						) : null}

						<Button
							type='submit'
							className='w-full'
							size='lg'
							disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className='mr-2 w-4 h-4 animate-spin' />
									Signing In
								</>
							) : (
								'Sign In'
							)}
						</Button>
					</form>

					<div className='text-muted-foreground text-xs text-center'>
						© 2025 FirstGuard. All rights reserved.{' '}
						<a
							href='#'
							className='text-primary hover:underline'>
							Terms of Service
						</a>{' '}
						&{' '}
						<a
							href='#'
							className='text-primary hover:underline'>
							Privacy Policy
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
