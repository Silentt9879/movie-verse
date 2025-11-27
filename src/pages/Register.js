import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { FaUserPlus, FaArrowLeft, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import AnimatedPage from '../components/AnimatedPage';
import { toast } from 'react-toastify';
import { auth } from '../firebase';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation(); // Get location state

    // Get the redirect path from state, or default to home
    const from = location.state?.from || '/';

    const getPasswordStrength = (pw) => {
        let strength = 0;
        const checks = {
            length: pw.length >= 8,
            upper: /[A-Z]/.test(pw),
            lower: /[a-z]/.test(pw),
            number: /[0-9]/.test(pw),
            symbol: /[^A-Za-z0-9]/.test(pw),
        };

        Object.values(checks).forEach(check => {
            if (check) strength += 1;
        });

        if (strength <= 1) return { text: "Weak", color: "text-red-500", width: "w-1/4" };
        if (strength <= 3) return { text: "Medium", color: "text-yellow-500", width: "w-2/4" };
        if (strength >= 4) return { text: "Strong", color: "text-green-500", width: "w-full" };
        
        return { text: "", color: "text-gray-500", width: "w-0" };
    };
    
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

    const validateFields = (pw, confPw) => {
        if (pw !== confPw) {
            return 'Passwords do not match.';
        }
        if (pw.length < 6) {
            return 'Password must be at least 6 characters long.';
        }
        if (passwordStrength.text !== "Strong" && passwordStrength.text !== "Medium") {
             return 'Password must be Medium strength (requires a mix of letters, numbers, etc.).';
        }
        return null;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        
        const validationError = validateFields(password, confirmPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            toast.success("Registration successful! You are now logged in.");
            navigate(from, { replace: true }); // Navigate back to original page
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already registered.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please choose a stronger one.');
            } else {
                setError('Registration failed. Please try a different email or password.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success("Account created/linked with Google!");
            navigate(from, { replace: true }); // Navigate back to original page
        } catch (err) {
            console.error("Google Sign-Up Error:", err);
            setError("Failed to sign up with Google.");
        }
    };

    return (
        <AnimatedPage>
        <div className="min-h-screen flex items-center justify-center bg-[#141414] py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 p-10 bg-[#181818] rounded-xl shadow-2xl border border-gray-800">
                
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-extrabold text-white">
                        Create Account
                    </h2>
                    <button onClick={() => navigate(from)} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm">
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleGoogleSignUp}
                        type="button"
                        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-600 rounded-md text-sm font-medium text-white bg-[#1a1a1a] hover:bg-[#252525] hover:border-gray-500 transition-all shadow-sm"
                    >
                        <FaGoogle className="text-red-500 text-lg" />
                        Sign up with Google
                    </button>

                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-full border-t border-gray-700"></div>
                        <span className="relative bg-[#181818] px-3 text-sm text-gray-500 uppercase">Or with email</span>
                    </div>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleRegister}>
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
                        
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Password (min 6 characters)"
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

                        {password && (
                            <div className="flex items-center pt-1 text-xs">
                                <span className={`w-1/4 uppercase font-bold text-left ${passwordStrength.color}`}>{passwordStrength.text}</span>
                                <div className="flex-grow bg-gray-700 rounded-full h-1.5 ml-2">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.width} ${passwordStrength.text === 'Weak' ? 'bg-red-500' : passwordStrength.text === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-[#111] focus:outline-none focus:ring-red-500 focus:border-red-500 transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none"
                            >
                                {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaUserPlus className="mr-2 h-5 w-5" />
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    
                    <div className="text-center text-sm text-gray-400">
                        Already have an account? 
                        <Link to="/login" state={{ from: from }} className="font-medium text-red-500 hover:text-red-400 ml-1">
                            Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
        </AnimatedPage>
    );
}

export default Register;