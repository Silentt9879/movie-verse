import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AuthContext } from '../App';
import { toast } from 'react-toastify';
import axios from 'axios';
import AnimatedPage from '../components/AnimatedPage';
import {
    FaArrowLeft, FaStar, FaFilm, FaTv, FaTrash, FaEdit,
    FaCalendarAlt, FaFilter, FaSortAmountDown
} from 'react-icons/fa';

function MyReviews() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'movies', 'tvshows'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const POSTER_PATH = "https://image.tmdb.org/t/p/w500";
    const FALLBACK_POSTER = "https://placehold.co/200x300/1a1a1a/333333?text=No+Poster";
    const apiKey = process.env.REACT_APP_TMDB_KEY;

    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    useEffect(() => {
        if (user && !user.isAnonymous) {
            fetchReviews();
        } else {
            setLoading(false);
        }
    }, [user]);

    // Fetch poster from TMDB API
    const fetchPosterFromTMDB = async (mediaId, mediaType) => {
        try {
            const type = mediaType === 'tv' ? 'tv' : 'movie';
            const response = await axios.get(
                `https://api.themoviedb.org/3/${type}/${mediaId}?api_key=${apiKey}`
            );
            return response.data.poster_path || null;
        } catch (error) {
            console.log(`Failed to fetch poster for ${mediaType} ${mediaId}`);
            return null;
        }
    };

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const allReviews = [];

            // Method 1: Try fetching from the new movieReviews/tvReviews collections
            try {
                const movieReviewsQuery = query(
                    collection(db, 'movieReviews'),
                    where('userId', '==', user.uid)
                );
                const movieSnapshot = await getDocs(movieReviewsQuery);
                movieSnapshot.forEach((doc) => {
                    allReviews.push({
                        id: doc.id,
                        ...doc.data(),
                        type: 'movie'
                    });
                });

                const tvReviewsQuery = query(
                    collection(db, 'tvReviews'),
                    where('userId', '==', user.uid)
                );
                const tvSnapshot = await getDocs(tvReviewsQuery);
                tvSnapshot.forEach((doc) => {
                    allReviews.push({
                        id: doc.id,
                        ...doc.data(),
                        type: 'tv'
                    });
                });
            } catch (e) {
                console.log("New collections not found, trying legacy structure");
            }

            // Method 2: Also fetch from the existing artifacts structure (legacy)
            try {
                const legacyReviewsRef = collection(db, `artifacts/${appId}/users/${user.uid}/reviews`);
                const legacySnapshot = await getDocs(legacyReviewsRef);
                legacySnapshot.forEach((doc) => {
                    const reviewData = doc.data();
                    // Check if this review already exists (avoid duplicates)
                    const exists = allReviews.some(r => 
                        r.mediaId === reviewData.mediaId && r.userId === reviewData.userId
                    );
                    if (!exists) {
                        allReviews.push({
                            id: doc.id,
                            ...reviewData,
                            type: reviewData.mediaType || 'movie'
                        });
                    }
                });
            } catch (e) {
                console.log("Legacy reviews structure error:", e);
            }

            // Fetch missing posters from TMDB API
            const reviewsWithPosters = await Promise.all(
                allReviews.map(async (review) => {
                    if (!review.posterPath && review.mediaId) {
                        const posterPath = await fetchPosterFromTMDB(review.mediaId, review.type);
                        return { ...review, posterPath };
                    }
                    return review;
                })
            );

            setReviews(reviewsWithPosters);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Failed to load reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (review) => {
        try {
            // Delete from new collections (movieReviews/tvReviews)
            const collectionName = review.type === 'movie' ? 'movieReviews' : 'tvReviews';
            try {
                await deleteDoc(doc(db, collectionName, review.id));
            } catch (e) {
                console.log("New collection delete skipped:", e);
            }

            // Also delete from legacy artifacts structure
            try {
                // Delete from private reviews
                const privateDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/reviews`, review.mediaId);
                await deleteDoc(privateDocRef);
            } catch (e) {
                console.log("Legacy private delete skipped:", e);
            }

            try {
                // Delete from public reviews
                const publicDocRef = doc(db, `artifacts/${appId}/public_reviews`, `${review.mediaId}_${user.uid}`);
                await deleteDoc(publicDocRef);
            } catch (e) {
                console.log("Legacy public delete skipped:", e);
            }

            setReviews(reviews.filter(r => r.id !== review.id));
            toast.success("Review deleted successfully");
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting review:", error);
            toast.error("Failed to delete review");
        }
    };

    // Filter reviews
    const filteredReviews = reviews.filter(review => {
        if (filter === 'all') return true;
        if (filter === 'movies') return review.type === 'movie';
        if (filter === 'tvshows') return review.type === 'tv';
        return true;
    });

    // Sort reviews
    const sortedReviews = [...filteredReviews].sort((a, b) => {
        // Helper to get comparable date value
        const getDateValue = (review) => {
            if (review.createdAt?.toDate) return review.createdAt.toDate().getTime();
            if (review.createdAt) return new Date(review.createdAt).getTime();
            if (review.timestamp) return review.timestamp;
            return 0;
        };
        
        const dateA = getDateValue(a);
        const dateB = getDateValue(b);
        
        switch (sortBy) {
            case 'newest':
                return dateB - dateA;
            case 'oldest':
                return dateA - dateB;
            case 'highest':
                return (b.rating || 0) - (a.rating || 0);
            case 'lowest':
                return (a.rating || 0) - (b.rating || 0);
            default:
                return 0;
        }
    });

    const formatDate = (review) => {
        // First check if there's a date string
        if (review.date) return review.date;
        
        // Then check for createdAt timestamp
        if (review.createdAt) {
            const date = review.createdAt.toDate ? review.createdAt.toDate() : new Date(review.createdAt);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Finally check timestamp
        if (review.timestamp) {
            const date = new Date(review.timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        return 'Unknown date';
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <FaStar
                key={index}
                className={index < rating ? 'text-yellow-400' : 'text-white/20'}
                size={14}
            />
        ));
    };

    if (!user || user.isAnonymous) {
        return (
            <AnimatedPage>
                <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
                    <div className="text-center">
                        <FaStar className="text-6xl text-white/20 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Sign in to view your reviews</h2>
                        <p className="text-white/50 mb-6">You need to be logged in to see your reviews.</p>
                        <Link
                            to="/login"
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 rounded-full font-semibold
                                       hover:from-red-500 hover:to-red-600 transition-all"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </AnimatedPage>
        );
    }

    return (
        <AnimatedPage>
            <div className="min-h-screen bg-[#0a0a0a] text-white">

                {/* ===== HERO HEADER ===== */}
                <div className="relative h-[30vh] min-h-[200px] overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-[#0a0a0a]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                    {/* Animated Circles */}
                    <div className="absolute top-10 right-20 w-64 h-64 bg-yellow-600/20 rounded-full blur-3xl" />
                    <div className="absolute top-20 right-40 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl" />

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/profile')}
                        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white 
                                   bg-black/30 hover:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full 
                                   transition-all duration-300 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Profile</span>
                    </button>

                    {/* Header Content */}
                    <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 
                                            flex items-center justify-center shadow-2xl shadow-yellow-500/30">
                                <FaStar className="text-white text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black">My Reviews</h1>
                                <p className="text-white/50">{reviews.length} review{reviews.length !== 1 ? 's' : ''} posted</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="px-6 md:px-16 py-8">
                    <div className="max-w-6xl mx-auto">

                        {/* Filter & Sort Controls */}
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                            {/* Filter Tabs */}
                            <div className="flex items-center bg-white/5 backdrop-blur-sm p-1 rounded-xl border border-white/10">
                                {[
                                    { id: 'all', label: 'All', icon: null },
                                    { id: 'movies', label: 'Movies', icon: FaFilm },
                                    { id: 'tvshows', label: 'TV Shows', icon: FaTv }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setFilter(option.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                                                    transition-all duration-300 ${
                                            filter === option.id
                                                ? 'bg-white text-black shadow-lg'
                                                : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        {option.icon && <option.icon size={14} />}
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <FaSortAmountDown className="text-white/40" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm
                                               focus:outline-none focus:border-white/30 cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="highest">Highest Rated</option>
                                    <option value="lowest">Lowest Rated</option>
                                </select>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden animate-pulse">
                                        <div className="flex h-full">
                                            {/* Poster Skeleton */}
                                            <div className="w-32 md:w-40 aspect-[2/3] bg-white/10" />
                                            {/* Content Skeleton */}
                                            <div className="flex-1 p-5 flex flex-col">
                                                <div className="h-6 bg-white/10 rounded-lg w-3/4 mb-3" />
                                                <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-white/5 rounded w-full" />
                                                    <div className="h-3 bg-white/5 rounded w-full" />
                                                    <div className="h-3 bg-white/5 rounded w-2/3" />
                                                </div>
                                                <div className="flex justify-between items-center pt-3 mt-4 border-t border-white/5">
                                                    <div className="h-3 bg-white/10 rounded w-24" />
                                                    <div className="flex gap-2">
                                                        <div className="w-9 h-9 bg-white/10 rounded-xl" />
                                                        <div className="w-9 h-9 bg-white/10 rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : sortedReviews.length === 0 ? (
                            /* Empty State */
                            <div className="text-center py-20">
                                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                                    <FaStar className="text-white/20 text-4xl" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">No reviews yet</h2>
                                <p className="text-white/50 mb-6 max-w-md mx-auto">
                                    {filter === 'all' 
                                        ? "You haven't posted any reviews yet. Start exploring movies and TV shows to share your thoughts!"
                                        : filter === 'movies'
                                        ? "You haven't reviewed any movies yet."
                                        : "You haven't reviewed any TV shows yet."
                                    }
                                </p>
                                <Link
                                    to="/"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 
                                               rounded-full font-semibold hover:from-red-500 hover:to-red-600 transition-all"
                                >
                                    <FaFilm /> Browse Content
                                </Link>
                            </div>
                        ) : (
                            /* Reviews Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sortedReviews.map((review) => (
                                    <div
                                        key={review.id}
                                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 
                                                   overflow-hidden hover:border-white/20 transition-all duration-300 group
                                                   hover:shadow-xl hover:shadow-black/20"
                                    >
                                        <div className="flex h-full">
                                            {/* Poster */}
                                            <Link
                                                to={review.type === 'movie' ? `/movie/${review.mediaId}` : `/tv/${review.mediaId}`}
                                                className="flex-shrink-0 w-32 md:w-40 relative"
                                            >
                                                <div className="aspect-[2/3] relative overflow-hidden bg-white/5">
                                                    <img
                                                        src={review.posterPath ? `${POSTER_PATH}${review.posterPath}` : FALLBACK_POSTER}
                                                        alt={review.mediaTitle}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_POSTER; }}
                                                    />
                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                                                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    
                                                    {/* Type Badge */}
                                                    <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg text-xs font-bold
                                                                    flex items-center gap-1.5 backdrop-blur-md shadow-lg ${
                                                        review.type === 'movie'
                                                            ? 'bg-red-600/90 text-white'
                                                            : 'bg-blue-600/90 text-white'
                                                    }`}>
                                                        {review.type === 'movie' ? <FaFilm size={10} /> : <FaTv size={10} />}
                                                        {review.type === 'movie' ? 'Movie' : 'TV'}
                                                    </div>

                                                    {/* Rating Badge on Poster */}
                                                    <div className="absolute bottom-2 left-2 flex items-center gap-1 
                                                                    bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                        <FaStar className="text-yellow-400" size={12} />
                                                        <span className="text-white text-xs font-bold">{review.rating}</span>
                                                    </div>
                                                </div>
                                            </Link>

                                            {/* Content */}
                                            <div className="flex-1 p-5 flex flex-col min-w-0">
                                                {/* Title & Rating */}
                                                <div className="mb-3">
                                                    <Link
                                                        to={review.type === 'movie' ? `/movie/${review.mediaId}` : `/tv/${review.mediaId}`}
                                                        className="font-bold text-lg hover:text-red-400 transition-colors line-clamp-1 block"
                                                    >
                                                        {review.mediaTitle || 'Unknown Title'}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex items-center gap-0.5">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <span className="text-white/40 text-sm">({review.rating}/5)</span>
                                                    </div>
                                                </div>

                                                {/* Review Text */}
                                                <p className="text-white/70 text-sm flex-1 line-clamp-3 mb-4 leading-relaxed">
                                                    "{review.text || review.reviewText || 'No review text provided.'}"
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                    <div className="flex items-center gap-2 text-white/40 text-xs">
                                                        <FaCalendarAlt size={12} />
                                                        {formatDate(review)}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            to={review.type === 'movie' ? `/movie/${review.mediaId}` : `/tv/${review.mediaId}`}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 
                                                                       transition-all duration-300 text-white/50 hover:text-white
                                                                       hover:scale-110"
                                                            title="Edit Review"
                                                        >
                                                            <FaEdit size={14} />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteConfirm(review)}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-600/20 
                                                                       transition-all duration-300 text-white/50 hover:text-red-500
                                                                       hover:scale-110"
                                                            title="Delete Review"
                                                        >
                                                            <FaTrash size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Stats Summary */}
                        {!loading && reviews.length > 0 && (
                            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { 
                                        label: 'Total Reviews', 
                                        value: reviews.length,
                                        color: 'from-yellow-500 to-orange-500'
                                    },
                                    { 
                                        label: 'Movie Reviews', 
                                        value: reviews.filter(r => r.type === 'movie').length,
                                        color: 'from-red-500 to-red-700'
                                    },
                                    { 
                                        label: 'TV Reviews', 
                                        value: reviews.filter(r => r.type === 'tv').length,
                                        color: 'from-blue-500 to-blue-700'
                                    },
                                    { 
                                        label: 'Avg Rating', 
                                        value: reviews.length > 0 
                                            ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
                                            : '0',
                                        color: 'from-purple-500 to-purple-700'
                                    },
                                ].map((stat, index) => (
                                    <div 
                                        key={index}
                                        className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-center"
                                    >
                                        <p className={`text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                            {stat.value}
                                        </p>
                                        <p className="text-white/40 text-sm mt-1">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
                            <h3 className="text-xl font-bold mb-2">Delete Review?</h3>
                            <p className="text-white/60 mb-6">
                                Are you sure you want to delete your review for "{deleteConfirm.mediaTitle}"? 
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold
                                               transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteReview(deleteConfirm)}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold
                                               transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatedPage>
    );
}

export default MyReviews;