import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import AnimatedPage from '../components/AnimatedPage';
import { 
    FaUser, FaSignOutAlt, FaChevronRight, FaFilm, FaStar, FaArrowLeft,
    FaShieldAlt, FaBell, FaHeart, FaBookmark, FaEdit, FaTv
} from 'react-icons/fa';

function ProfileScreen() {
    const { user, auth } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // Stats state
    const [reviewStats, setReviewStats] = useState({
        total: 0,
        movies: 0,
        tvShows: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Fetch review stats from Firebase
    useEffect(() => {
        const fetchReviewStats = async () => {
            if (!user || user.isAnonymous) {
                setLoadingStats(false);
                return;
            }

            try {
                let movieCount = 0;
                let tvCount = 0;

                // Method 1: Try fetching from new movieReviews/tvReviews collections
                try {
                    const movieReviewsQuery = query(
                        collection(db, 'movieReviews'),
                        where('userId', '==', user.uid)
                    );
                    const movieSnapshot = await getDocs(movieReviewsQuery);
                    movieCount = movieSnapshot.size;

                    const tvReviewsQuery = query(
                        collection(db, 'tvReviews'),
                        where('userId', '==', user.uid)
                    );
                    const tvSnapshot = await getDocs(tvReviewsQuery);
                    tvCount = tvSnapshot.size;
                } catch (e) {
                    console.log("New collections not found, trying legacy structure");
                }

                // Method 2: Also fetch from existing artifacts structure (legacy)
                try {
                    const legacyReviewsRef = collection(db, `artifacts/${appId}/users/${user.uid}/reviews`);
                    const legacySnapshot = await getDocs(legacyReviewsRef);
                    
                    // Count legacy reviews by type (avoid duplicates)
                    const legacyReviews = [];
                    legacySnapshot.forEach((doc) => {
                        legacyReviews.push(doc.data());
                    });

                    // If we didn't get any from new collections, use legacy counts
                    if (movieCount === 0 && tvCount === 0) {
                        movieCount = legacyReviews.filter(r => r.mediaType === 'movie').length;
                        tvCount = legacyReviews.filter(r => r.mediaType === 'tv').length;
                    }
                } catch (e) {
                    console.log("Legacy reviews structure error:", e);
                }

                setReviewStats({
                    total: movieCount + tvCount,
                    movies: movieCount,
                    tvShows: tvCount
                });
            } catch (error) {
                console.error("Error fetching review stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchReviewStats();
    }, [user]);

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                navigate('/');
                toast.success("Signed out successfully");
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (!user) return null;

    const emailChar = user.email ? user.email.charAt(0).toUpperCase() : "U";
    const memberSince = user.metadata?.creationTime 
        ? new Date(user.metadata.creationTime).getFullYear() 
        : "2025";

    return (
        <AnimatedPage>
            <div className="min-h-screen bg-[#0a0a0a] text-white">

                {/* ===== HERO HEADER ===== */}
                <div className="relative h-[35vh] min-h-[280px] overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-purple-900/30 to-[#0a0a0a]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                    
                    {/* Animated Circles */}
                    <div className="absolute top-20 right-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-40 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl" />

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white 
                                   bg-black/30 hover:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full 
                                   transition-all duration-300 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    {/* Profile Header Content */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-8">
                        <div className="flex items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 
                                                flex items-center justify-center text-5xl md:text-6xl font-black 
                                                shadow-2xl shadow-red-500/30 border-4 border-white/10
                                                group-hover:border-white/30 transition-all duration-300">
                                    {emailChar}
                                </div>
                                {/* Reviewer Badge */}
                                <div className="absolute -bottom-2 -right-2 px-3 py-1.5 rounded-full 
                                                bg-gradient-to-r from-yellow-500 to-orange-500
                                                flex items-center gap-1.5 shadow-lg">
                                    <FaStar size={10} className="text-black" />
                                    <span className="text-xs font-bold text-black">Reviewer</span>
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="pb-2">
                                <h1 className="text-3xl md:text-4xl font-black mb-1">
                                    {user.email?.split('@')[0]}
                                </h1>
                                <p className="text-white/50">{user.email}</p>
                                <p className="text-white/30 text-sm mt-1">Member since {memberSince}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="px-6 md:px-16 py-10">
                    <div className="max-w-4xl mx-auto">

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            {[
                                { 
                                    icon: FaStar, 
                                    label: 'Reviews', 
                                    value: loadingStats ? '...' : reviewStats.total, 
                                    color: 'from-yellow-500 to-orange-500' 
                                },
                                { 
                                    icon: FaFilm, 
                                    label: 'Movies', 
                                    value: loadingStats ? '...' : reviewStats.movies, 
                                    color: 'from-red-500 to-red-700' 
                                },
                                { 
                                    icon: FaTv, 
                                    label: 'TV Shows', 
                                    value: loadingStats ? '...' : reviewStats.tvShows, 
                                    color: 'from-blue-500 to-blue-700' 
                                },
                            ].map((stat, index) => (
                                <div 
                                    key={index}
                                    onClick={() => navigate('/myreviews')}
                                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10
                                               hover:border-white/20 transition-all duration-300 group cursor-pointer
                                               text-center"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} 
                                                    flex items-center justify-center mb-3 mx-auto
                                                    group-hover:scale-110 transition-transform duration-300
                                                    shadow-lg`}>
                                        <stat.icon className="text-white text-lg" />
                                    </div>
                                    <p className="text-2xl font-black">{stat.value}</p>
                                    <p className="text-white/40 text-sm">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Activity Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <span className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full" />
                                My Activity
                            </h2>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                                {/* My Reviews - Links to MyReviews page */}
                                <div 
                                    onClick={() => navigate('/myreviews')}
                                    className="p-5 flex items-center justify-between border-b border-white/5
                                               hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 
                                                        flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                            <FaEdit className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">My Reviews</p>
                                            <p className="text-white/40 text-sm">
                                                {loadingStats 
                                                    ? 'Loading...' 
                                                    : `${reviewStats.total} review${reviewStats.total !== 1 ? 's' : ''} posted`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* Movie Ratings */}
                                <div 
                                    onClick={() => navigate('/myreviews')}
                                    className="p-5 flex items-center justify-between border-b border-white/5
                                               hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 
                                                        flex items-center justify-center shadow-lg shadow-red-500/20">
                                            <FaFilm className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Movie Reviews</p>
                                            <p className="text-white/40 text-sm">
                                                {loadingStats 
                                                    ? 'Loading...' 
                                                    : `${reviewStats.movies} movie${reviewStats.movies !== 1 ? 's' : ''} reviewed`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* TV Show Ratings */}
                                <div 
                                    onClick={() => navigate('/myreviews')}
                                    className="p-5 flex items-center justify-between
                                               hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                                                        flex items-center justify-center shadow-lg shadow-blue-500/20">
                                            <FaTv className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">TV Show Reviews</p>
                                            <p className="text-white/40 text-sm">
                                                {loadingStats 
                                                    ? 'Loading...' 
                                                    : `${reviewStats.tvShows} show${reviewStats.tvShows !== 1 ? 's' : ''} reviewed`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* My List Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full" />
                                Saved Content
                            </h2>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                                {/* My List */}
                                <div 
                                    onClick={() => navigate('/mylist')}
                                    className="p-5 flex items-center justify-between
                                               hover:bg-white/5 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 
                                                        flex items-center justify-center shadow-lg shadow-purple-500/20">
                                            <FaBookmark className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">My List</p>
                                            <p className="text-white/40 text-sm">Saved movies & shows to review later</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Account Section */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                                <span className="w-1 h-6 bg-gradient-to-b from-white/50 to-white/20 rounded-full" />
                                Account Settings
                            </h2>

                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                                {/* Email */}
                                <div className="p-5 flex items-center justify-between border-b border-white/5
                                                hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                            <FaUser className="text-white/70" />
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider">Email Address</p>
                                            <p className="font-semibold">{user.email}</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* Security */}
                                <div className="p-5 flex items-center justify-between border-b border-white/5
                                                hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                            <FaShieldAlt className="text-white/70" />
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider">Security</p>
                                            <p className="font-semibold">Password & Authentication</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>

                                {/* Notifications */}
                                <div className="p-5 flex items-center justify-between
                                                hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                            <FaBell className="text-white/70" />
                                        </div>
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider">Notifications</p>
                                            <p className="font-semibold">Manage Preferences</p>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-white/30 group-hover:text-white/60 
                                                               group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>

                        {/* Sign Out Section */}
                        <div className="mt-10">
                            <button
                                onClick={handleLogout}
                                className="w-full py-4 bg-white/5 hover:bg-red-600/20 backdrop-blur-sm 
                                           border border-white/10 hover:border-red-500/50
                                           rounded-2xl font-bold text-white/70 hover:text-red-500
                                           transition-all duration-300 flex items-center justify-center gap-3
                                           group"
                            >
                                <FaSignOutAlt className="group-hover:rotate-180 transition-transform duration-500" />
                                Sign Out
                            </button>

                            <p className="text-center text-white/20 text-sm mt-6">
                                MovieVerse v1.0 • Rate & Review Your Favorites
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}

export default ProfileScreen;