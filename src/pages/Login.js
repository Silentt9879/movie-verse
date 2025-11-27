import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { FaSignInAlt, FaArrowLeft, FaGoogle, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import AnimatedPage from '../components/AnimatedPage';
import { toast } from 'react-toastify';
import { auth } from '../firebase';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false); 

    const navigate = useNavigate();
    const location = useLocation(); // Get location state

    // Get the redirect path from state, or default to home
    const from = location.state?.from || '/';

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful!");
            navigate(from, { replace: true }); // Navigate back to original page
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-email' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else {
                setError('Failed to log in. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success("Welcome! Signed in with Google.");
            navigate(from, { replace: true }); // Navigate back to original page
        } catch (err) {
            console.error("Google Sign-In Error:", err);
            setError("Failed to sign in with Google.");
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset link sent! Check your inbox.");
            setIsResetting(false); 
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/user-not-found') {
                setError("No account found with this email.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Invalid email format.");
            } else {
                setError("Failed to send reset email. Try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center bg-[#141414] py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-10 bg-[#181818] rounded-xl shadow-2xl border border-gray-800">
                
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-extrabold text-white">
                        {isResetting ? 'Reset Password' : 'Sign in to Review'}
                    </h2>
                    <button 
                        onClick={() => isResetting ? setIsResetting(false) : navigate(from)} // Go back to original page
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm"
                    >
                        <FaArrowLeft /> {isResetting ? 'Cancel' : 'Back'}
                    </button>
                </div>

                {!isResetting ? (
                    <>
                        <div className="mt-8 space-y-4">
                            <button
                                onClick={handleGoogleSignIn}
                                type="button"
                                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-600 rounded-md text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#252525] hover:border-gray-500 transition-all shadow-sm"
                            >
                                <FaGoogle className="text-red-500 text-lg" />
                                Sign in with Google
                            </button>

                            <div className="relative flex items-center justify-center">
                                <div className="absolute w-full border-t border-gray-700"></div>
                                <span className="relative bg-[#181818] px-3 text-sm text-gray-500 uppercase">Or with email</span>
                            </div>
                        </div>

                        <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                            {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md text-sm">{error}</div>}
                            
                            <div className="rounded-md shadow-sm space-y-4">
                                <input
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-[#111] focus:outline-none focus:ring-red-500 focus:border-red-500 transition-all"
                                />
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"} 
                                            required
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-[#111] focus:outline-none focus:ring-red-500 focus:border-red-500 transition-all pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none"
                                        >
                                            {showPassword ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>

                                    <div className="text-right mt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setIsResetting(true)}
                                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaSignInAlt className="mr-2 h-5 w-5" />
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                            
                            <div className="text-center text-sm text-gray-400">
                                Don't have an account? 
                                <Link to="/register" state={{ from: from }} className="font-medium text-red-500 hover:text-red-400 ml-1">
                                    Register Here
                                </Link>
                            </div>
                        </form>
                    </>
                ) : (
                    <form className="mt-6 space-y-6" onSubmit={handlePasswordReset}>
                        <div className="text-gray-400 text-sm mb-4">
                            Enter your email address and we'll send you a link to reset your password.
                        </div>

                        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded-md text-sm">{error}</div>}
                        
                        <div className="rounded-md shadow-sm">
                            <input
                                type="email"
                                required
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-[#111] focus:outline-none focus:ring-red-500 focus:border-red-500 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaKey className="mr-2 h-4 w-4" />
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
        </AnimatedPage>
    );
}

export default Login;