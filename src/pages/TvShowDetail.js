import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaArrowLeft, FaPlay, FaStar, FaClock, FaCalendar,
    FaHeart, FaRegHeart, FaPen, FaTrash, FaShareAlt,
    FaChevronLeft, FaChevronRight, FaTimes, FaPlus, FaCheck, FaTv
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import AnimatedPage from '../components/AnimatedPage';
import { GlobalContext } from '../App';

// --- FIREBASE IMPORTS ---
import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
// ------------------------

function TvShowDetail() {
    const { id } = useParams();
    const { setIsLoading } = useContext(GlobalContext);
    const [user, setUser] = useState(auth.currentUser);
    const navigate = useNavigate();

    const pathType = 'tv';

    const castRef = useRef(null);
    const similarRef = useRef(null);

    const [mediaData, setMediaData] = useState(null);
    const [cast, setCast] = useState([]);
    const [creator, setCreator] = useState("");
    const [similar, setSimilar] = useState([]);
    const [trailerKey, setTrailerKey] = useState("");
    const [providers, setProviders] = useState(null);

    // UI States
    const [viewPoster, setViewPoster] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showFullOverview, setShowFullOverview] = useState(false);

    // Review System States
    const [userReview, setUserReview] = useState("");
    const [userRating, setUserRating] = useState(0);
    const [savedReview, setSavedReview] = useState(null);
    const [allReviews, setAllReviews] = useState([]);
    const [isReviewsLoading, setIsReviewsLoading] = useState(true);

    // --- FIREBASE STATE ---
    const userId = user?.uid;
    const isAnonymous = user ? user.isAnonymous : true;

    // eslint-disable-next-line no-undef
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
    const POSTER_PATH = "https://image.tmdb.org/t/p/w500";
    const FALLBACK_POSTER = "https://placehold.co/350x525/1a1a1a/333333?text=No+Image";
    const FALLBACK_PROFILE = "https://placehold.co/150x150/1a1a1a/333333?text=N/A";
    const apiKey = process.env.REACT_APP_TMDB_KEY;

    const getProviderLink = (providerName) => {
        if (!mediaData || !providers) return "";
        const title = encodeURIComponent(mediaData.name);
        if (providerName.includes("Netflix")) return `https://www.netflix.com/search?q=${title}`;
        if (providerName.includes("Amazon")) return `https://www.amazon.com/s?k=${title}&i=instant-video`;
        if (providerName.includes("Disney")) return `https://www.disneyplus.com/search?q=${title}`;
        if (providerName.includes("HBO") || providerName.includes("Max")) return `https://www.max.com/search?q=${title}`;
        if (providerName.includes("Hulu")) return `https://www.hulu.com/search?q=${title}`;
        if (providerName.includes("Apple")) return `https://tv.apple.com/search?term=${title}`;
        return providers?.link || "";
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: mediaData.name,
                    text: `Check out ${mediaData.name} on MovieVerse!`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const scrollRow = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // --- AUTH LISTENER ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // --- FIREBASE REVIEW FUNCTIONS ---
    const getPrivateReviewDocRef = (mediaId) => {
        if (!db) return null;
        const currentUserId = userId || 'anonymous';
        return doc(db, `artifacts/${appId}/users/${currentUserId}/reviews`, mediaId);
    };

    const getPublicReviewsCollection = () => {
        if (!db) return null;
        return collection(db, `artifacts/${appId}/public_reviews`);
    };

    // NEW: Get reference to tvReviews collection for MyReviews page
    const getTvReviewDocRef = (mediaId) => {
        if (!db || !userId) return null;
        return doc(db, 'tvReviews', `${mediaId}_${userId}`);
    };

    const setupUserReviewListener = () => {
        if (!db || isAnonymous) return;
        const docRef = getPrivateReviewDocRef(id);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const reviewData = docSnap.data();
                setSavedReview(reviewData);
                setUserReview(reviewData.text);
                setUserRating(reviewData.rating);
            } else {
                setSavedReview(null);
                setUserReview("");
                setUserRating(0);
            }
        }, (error) => {
            console.error("Error setting up user review listener:", error);
        });
        return unsubscribe;
    };

    const fetchCommunityReviews = () => {
        const reviewsCollection = getPublicReviewsCollection();
        if (!reviewsCollection) return;
        setIsReviewsLoading(true);
        const q = query(reviewsCollection, where("mediaId", "==", id));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reviews = [];
            querySnapshot.forEach((doc) => {
                const reviewData = doc.data();
                if (reviewData.userId !== userId) {
                    reviews.push(reviewData);
                }
            });
            reviews.sort((a, b) => b.timestamp - a.timestamp);
            setAllReviews(reviews);
            setIsReviewsLoading(false);
        }, (error) => {
            console.error("Error fetching community reviews:", error);
            setIsReviewsLoading(false);
        });
        return unsubscribe;
    };

    const handleSaveReview = async () => {
        if (!db) {
            toast.error("Firebase database failed to load.");
            return;
        }
        if (!userId || isAnonymous) {
            toast.error("Please sign in to post a review.");
            return;
        }
        if (userRating === 0) {
            toast.error("Please select a star rating.");
            return;
        }
        if (!userReview || userReview.trim() === '') {
            toast.error("Please write a review.");
            return;
        }
        if (!mediaData) {
            toast.error("TV show data unavailable.");
            return;
        }

        const privateDocRef = getPrivateReviewDocRef(id);
        const publicDocRef = doc(getPublicReviewsCollection(), `${id}_${userId}`);
        const tvReviewDocRef = getTvReviewDocRef(id);
        
        const reviewData = {
            mediaId: id,
            mediaTitle: mediaData.name,
            mediaType: pathType,
            text: userReview,
            rating: userRating,
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            userEmail: user.email,
            userId: userId
        };

        // Data for MyReviews page (includes poster path)
        const myReviewsData = {
            ...reviewData,
            posterPath: mediaData.poster_path,
            createdAt: serverTimestamp()
        };

        try {
            // Save to existing collections
            await setDoc(privateDocRef, reviewData);
            await setDoc(publicDocRef, reviewData);
            
            // NEW: Also save to tvReviews collection for MyReviews page
            if (tvReviewDocRef) {
                await setDoc(tvReviewDocRef, myReviewsData);
            }
            
            toast.success("Review posted!");
        } catch (e) {
            console.error("Error saving review:", e);
            toast.error("Failed to save review.");
        }
    };

    const handleDeleteReview = async () => {
        if (!db || !userId) return;
        const privateDocRef = getPrivateReviewDocRef(id);
        const publicDocRef = doc(getPublicReviewsCollection(), `${id}_${userId}`);
        const tvReviewDocRef = getTvReviewDocRef(id);
        
        try {
            await deleteDoc(privateDocRef);
            try {
                await deleteDoc(publicDocRef);
            } catch (publicErr) {
                console.warn("Public delete skipped:", publicErr);
            }
            
            // NEW: Also delete from tvReviews collection
            if (tvReviewDocRef) {
                try {
                    await deleteDoc(tvReviewDocRef);
                } catch (tvErr) {
                    console.warn("tvReviews delete skipped:", tvErr);
                }
            }
            
            toast.info("Review deleted");
        } catch (e) {
            console.error("Error deleting review:", e);
            toast.error("Failed to delete review.");
        }
    };

    const checkIfSaved = (showId) => {
        const savedShows = JSON.parse(localStorage.getItem('react-movie-app-favourites')) || [];
        setIsSaved(savedShows.some(show => show.id === showId));
    };

    const toggleSave = () => {
        const savedShows = JSON.parse(localStorage.getItem('react-movie-app-favourites')) || [];
        if (isSaved) {
            const newList = savedShows.filter(fav => fav.id !== mediaData.id);
            localStorage.setItem('react-movie-app-favourites', JSON.stringify(newList));
            setIsSaved(false);
            toast.info("Removed from My List");
        } else {
            const newList = [...savedShows, mediaData];
            localStorage.setItem('react-movie-app-favourites', JSON.stringify(newList));
            setIsSaved(true);
            toast.success("Added to My List");
        }
    };

    // --- FIREBASE DATA LISTENERS ---
    useEffect(() => {
        let unsubscribeUserReview;
        if (userId && !isAnonymous) {
            unsubscribeUserReview = setupUserReviewListener();
        } else {
            setSavedReview(null);
        }
        const unsubscribeCommunity = fetchCommunityReviews();
        return () => {
            if (unsubscribeUserReview) unsubscribeUserReview();
            if (unsubscribeCommunity) unsubscribeCommunity();
        };
    }, [userId, id, isAnonymous]);

    // --- PRIMARY DATA FETCH ---
    useEffect(() => {
        window.scrollTo(0, 0);
        setIsLoading(true);
        setMediaData(null);

        const fetchData = async () => {
            let data = null;
            try {
                const mediaReq = await axios.get(`https://api.themoviedb.org/3/${pathType}/${id}?api_key=${apiKey}&language=en-US`);
                data = { ...mediaReq.data, media_type: pathType };
                setMediaData(data);
                document.title = `${data.name} | TV Show | MovieVerse`;
                checkIfSaved(data.id);
            } catch (error) {
                console.error("API Error:", error);
                setIsLoading(false);
                toast.error("Could not load TV show details.");
                navigate('/');
                return;
            }

            try {
                const [castRes, similarRes, videoRes, providerRes] = await Promise.allSettled([
                    axios.get(`https://api.themoviedb.org/3/${pathType}/${id}/credits?api_key=${apiKey}`),
                    axios.get(`https://api.themoviedb.org/3/${pathType}/${id}/similar?api_key=${apiKey}&language=en-US`),
                    axios.get(`https://api.themoviedb.org/3/${pathType}/${id}/videos?api_key=${apiKey}`),
                    axios.get(`https://api.themoviedb.org/3/${pathType}/${id}/watch/providers?api_key=${apiKey}`)
                ]);

                if (castRes.status === 'fulfilled') {
                    setCast(castRes.value.data.cast?.slice(0, 15) || []);
                    const mainCreator = data.created_by?.[0]?.name || castRes.value.data.crew?.find(p => p.job === 'Creator')?.name;
                    setCreator(mainCreator || "Unknown");
                }
                if (similarRes.status === 'fulfilled') setSimilar(similarRes.value.data.results?.slice(0, 10) || []);
                if (videoRes.status === 'fulfilled') {
                    const trailer = videoRes.value.data.results?.find(v => v.type === "Trailer" && v.site === "YouTube");
                    if (trailer) setTrailerKey(trailer.key);
                }
                if (providerRes.status === 'fulfilled' && providerRes.value.data.results?.US) {
                    setProviders(providerRes.value.data.results.US);
                }
            } catch (e) { console.warn("Secondary fetch error", e); }

            setIsLoading(false);
        };

        fetchData();
    }, [id, apiKey, setIsLoading, navigate]);

    if (!mediaData) return null;

    const mediaTitle = mediaData.name;
    const releaseYear = mediaData.first_air_date?.split('-')[0];
    const ratingPercent = Math.round(mediaData.vote_average * 10);
    const statusColor = mediaData.status === 'Returning Series' ? 'text-green-400' :
        mediaData.status === 'Ended' ? 'text-red-400' : 'text-yellow-400';

    return (
        <AnimatedPage>
            <div className="min-h-screen bg-[#0a0a0a] text-white">

                {/* ===== HERO SECTION WITH BACKDROP ===== */}
                <div className="relative w-full h-[85vh] min-h-[600px]">
                    {/* Backdrop Image */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${IMAGE_PATH}${mediaData.backdrop_path})` }}
                    >
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/30" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                    </div>

                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white 
                                   bg-black/30 hover:bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full 
                                   transition-all duration-300 group"
                    >
                        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    {/* Hero Content */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 px-6 md:px-16 pb-16">
                        <div className="max-w-3xl">
                            {/* TV Show Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/80 backdrop-blur-sm 
                                            rounded-full text-sm font-medium mb-4">
                                <FaTv size={12} />
                                TV Series
                            </div>

                            {/* Title */}
                            <h1 className="text-5xl md:text-7xl font-black mb-4 leading-none tracking-tight drop-shadow-2xl">
                                {mediaTitle}
                            </h1>

                            {/* Tagline */}
                            {mediaData.tagline && (
                                <p className="text-lg md:text-xl text-white/70 italic mb-4 font-light">
                                    "{mediaData.tagline}"
                                </p>
                            )}

                            {/* Meta Info Pills */}
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                {/* Match Score */}
                                <span className={`font-bold ${ratingPercent >= 70 ? 'text-green-400' : ratingPercent >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {ratingPercent}% Match
                                </span>
                                <span className="text-white/50">•</span>
                                <span className="text-white/80">{releaseYear}</span>
                                <span className="text-white/50">•</span>
                                <span className="text-white/80">{mediaData.number_of_seasons} Season{mediaData.number_of_seasons !== 1 ? 's' : ''}</span>
                                <span className="text-white/50">•</span>
                                <span className={`${statusColor} font-medium`}>{mediaData.status}</span>
                                <span className="px-2 py-0.5 border border-white/40 text-xs text-white/80 rounded">HD</span>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {mediaData.genres?.slice(0, 4).map(genre => (
                                    <span
                                        key={genre.id}
                                        className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90
                                                   hover:bg-white/20 transition-colors cursor-default"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            {/* Overview */}
                            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                                {showFullOverview
                                    ? mediaData.overview
                                    : mediaData.overview?.length > 200
                                        ? mediaData.overview.substring(0, 200) + '...'
                                        : mediaData.overview
                                }
                                {mediaData.overview?.length > 200 && (
                                    <button
                                        onClick={() => setShowFullOverview(!showFullOverview)}
                                        className="text-white/60 hover:text-white ml-2 underline text-sm"
                                    >
                                        {showFullOverview ? 'Less' : 'More'}
                                    </button>
                                )}
                            </p>

                            {/* Creator */}
                            <p className="text-white/60 text-sm mb-8">
                                Created by <span className="text-white">{creator}</span>
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Play Button */}
                                <button
                                    onClick={() => trailerKey && setShowTrailer(true)}
                                    disabled={!trailerKey}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300
                                        ${trailerKey
                                            ? 'bg-white text-black hover:bg-white/90 hover:scale-105 shadow-xl'
                                            : 'bg-white/20 text-white/50 cursor-not-allowed'
                                        }`}
                                >
                                    <FaPlay className={trailerKey ? 'text-black' : ''} />
                                    {trailerKey ? 'Play Trailer' : 'No Trailer'}
                                </button>

                                {/* My List Button */}
                                <button
                                    onClick={toggleSave}
                                    className={`flex items-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all duration-300
                                        ${isSaved
                                            ? 'bg-white/20 text-white hover:bg-white/30'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                        } backdrop-blur-sm`}
                                >
                                    {isSaved ? <FaCheck /> : <FaPlus />}
                                    {isSaved ? 'In My List' : 'My List'}
                                </button>

                                {/* Share Button */}
                                <button
                                    onClick={handleShare}
                                    className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm 
                                               transition-all duration-300 hover:scale-110"
                                    title="Share"
                                >
                                    <FaShareAlt />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="relative z-10 px-6 md:px-16 -mt-8">

                    {/* Additional Info Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Rating</p>
                            <div className="flex items-center gap-2">
                                <FaStar className="text-yellow-400" />
                                <span className="text-xl font-bold">{mediaData.vote_average.toFixed(1)}</span>
                                <span className="text-white/50 text-sm">/ 10</span>
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Seasons</p>
                            <p className="text-xl font-bold">{mediaData.number_of_seasons || 'N/A'}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Episodes</p>
                            <p className="text-xl font-bold">{mediaData.number_of_episodes || 'N/A'}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">First Aired</p>
                            <p className="text-xl font-bold">{releaseYear}</p>
                        </div>
                    </div>

                    {/* Watch Providers */}
                    {providers && (providers.flatrate || providers.rent || providers.buy) && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full" />
                                Where to Watch
                            </h2>
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <div className="space-y-6">
                                    {providers.flatrate && (
                                        <div>
                                            <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Stream</p>
                                            <div className="flex gap-3 flex-wrap">
                                                {providers.flatrate.map(prov => (
                                                    <a
                                                        key={prov.provider_id}
                                                        href={getProviderLink(prov.provider_name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative"
                                                    >
                                                        <img
                                                            src={`${POSTER_PATH}${prov.logo_path}`}
                                                            alt={prov.provider_name}
                                                            className="w-14 h-14 rounded-xl shadow-lg transition-all duration-300 
                                                                       group-hover:scale-110 group-hover:shadow-2xl"
                                                            onError={(e) => { e.target.src = FALLBACK_PROFILE; }}
                                                        />
                                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 
                                                                        transition-opacity whitespace-nowrap text-xs bg-black/90 px-2 py-1 rounded">
                                                            {prov.provider_name}
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {providers.rent && (
                                        <div>
                                            <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Rent</p>
                                            <div className="flex gap-3 flex-wrap">
                                                {providers.rent.map(prov => (
                                                    <a
                                                        key={prov.provider_id}
                                                        href={getProviderLink(prov.provider_name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative"
                                                    >
                                                        <img
                                                            src={`${POSTER_PATH}${prov.logo_path}`}
                                                            alt={prov.provider_name}
                                                            className="w-14 h-14 rounded-xl shadow-lg transition-all duration-300 
                                                                       group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                                            onError={(e) => { e.target.src = FALLBACK_PROFILE; }}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {providers.buy && (
                                        <div>
                                            <p className="text-white/50 text-sm uppercase tracking-wider mb-3">Buy</p>
                                            <div className="flex gap-3 flex-wrap">
                                                {providers.buy.map(prov => (
                                                    <a
                                                        key={prov.provider_id}
                                                        href={getProviderLink(prov.provider_name)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative"
                                                    >
                                                        <img
                                                            src={`${POSTER_PATH}${prov.logo_path}`}
                                                            alt={prov.provider_name}
                                                            className="w-14 h-14 rounded-xl shadow-lg transition-all duration-300 
                                                                       group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                                            onError={(e) => { e.target.src = FALLBACK_PROFILE; }}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-white/30 text-xs mt-6">Streaming info from JustWatch</p>
                            </div>
                        </div>
                    )}

                    {/* Cast Section */}
                    {cast.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full" />
                                Top Cast
                            </h2>
                            <div className="relative group">
                                <div
                                    ref={castRef}
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                                >
                                    {cast.map(actor => (
                                        <Link
                                            to={`/person/${actor.id}`}
                                            key={actor.id}
                                            className="flex-shrink-0 w-36 group/card"
                                        >
                                            <div className="relative overflow-hidden rounded-xl mb-3 aspect-[3/4] bg-white/5">
                                                <img
                                                    src={actor.profile_path ? `${POSTER_PATH}${actor.profile_path}` : FALLBACK_PROFILE}
                                                    alt={actor.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 
                                                               group-hover/card:scale-110"
                                                    onError={(e) => { e.target.src = FALLBACK_PROFILE; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
                                                                opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                            </div>
                                            <p className="font-semibold text-sm truncate group-hover/card:text-blue-400 transition-colors">
                                                {actor.name}
                                            </p>
                                            <p className="text-white/50 text-xs truncate">{actor.character}</p>
                                        </Link>
                                    ))}
                                </div>
                                {/* Scroll Buttons */}
                                <button
                                    onClick={() => scrollRow(castRef, 'left')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10
                                               w-12 h-12 bg-black/80 hover:bg-black rounded-full 
                                               flex items-center justify-center opacity-0 group-hover:opacity-100 
                                               transition-all duration-300 hover:scale-110 shadow-xl"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    onClick={() => scrollRow(castRef, 'right')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10
                                               w-12 h-12 bg-black/80 hover:bg-black rounded-full 
                                               flex items-center justify-center opacity-0 group-hover:opacity-100 
                                               transition-all duration-300 hover:scale-110 shadow-xl"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-1 h-8 bg-gradient-to-b from-pink-500 to-pink-700 rounded-full" />
                            Reviews
                        </h2>

                        {/* Your Review */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 
                                                flex items-center justify-center text-sm font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || 'Y'}
                                </div>
                                Your Review
                            </h3>

                            {savedReview ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={`text-lg ${i < savedReview.rating ? 'text-yellow-400' : 'text-white/20'}`}
                                            />
                                        ))}
                                        <span className="text-white/50 text-sm ml-2">{savedReview.date}</span>
                                    </div>
                                    <p className="text-white/80 italic">"{savedReview.text}"</p>
                                    <button
                                        onClick={handleDeleteReview}
                                        className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                                    >
                                        <FaTrash size={12} /> Delete Review
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Star Rating */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-white/50 text-sm">Your rating:</span>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setUserRating(star)}
                                                className="transition-transform hover:scale-125"
                                            >
                                                <FaStar
                                                    className={`text-2xl transition-colors ${star <= userRating ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400/50'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {!isAnonymous ? (
                                        <>
                                            <textarea
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white 
                                                           placeholder-white/30 focus:outline-none focus:border-white/30 
                                                           transition-colors resize-none"
                                                rows="3"
                                                placeholder="Share your thoughts about this show..."
                                                value={userReview}
                                                onChange={(e) => setUserReview(e.target.value)}
                                            />
                                            <button
                                                onClick={handleSaveReview}
                                                className="mt-4 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                                                           hover:from-blue-500 hover:to-blue-600 rounded-lg font-semibold 
                                                           transition-all duration-300 hover:scale-105"
                                            >
                                                <FaPen size={14} /> Post Review
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 border border-dashed border-white/20 rounded-xl">
                                            <p className="text-white/50 mb-4">Sign in to share your review</p>
                                            <Link
                                                to="/login"
                                                state={{ from: `/tv/${id}` }}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                                                           hover:from-blue-500 hover:to-blue-600 rounded-lg font-semibold transition-all"
                                            >
                                                Sign In
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Community Reviews */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white/70">
                                Community Reviews ({allReviews.length})
                            </h3>

                            {isReviewsLoading && allReviews.length === 0 ? (
                                <div className="flex justify-center py-12">
                                    <div className="w-10 h-10 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            ) : allReviews.length > 0 ? (
                                <div className="grid gap-4">
                                    {allReviews.map((review, index) => (
                                        <div
                                            key={index}
                                            className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10
                                                       hover:bg-white/[0.07] transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-500 
                                                                    flex items-center justify-center font-bold">
                                                        {(review.userEmail || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">
                                                            {review.userEmail ? review.userEmail.split('@')[0] : "User"}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <FaStar
                                                                        key={i}
                                                                        className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-white/20'}`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-white/40 text-xs">{review.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-white/70 leading-relaxed">"{review.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-white/40">
                                    <p>No reviews yet. Be the first to share your thoughts!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Similar Shows */}
                    {similar.length > 0 && (
                        <div className="mb-16">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-700 rounded-full" />
                                More Like This
                            </h2>
                            <div className="relative group">
                                <div
                                    ref={similarRef}
                                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                                >
                                    {similar.map(sim => (
                                        <Link
                                            to={`/${sim.media_type || pathType}/${sim.id}`}
                                            key={sim.id}
                                            className="flex-shrink-0 w-44 group/card"
                                        >
                                            <div className="relative overflow-hidden rounded-xl mb-3 aspect-[2/3] bg-white/5">
                                                <img
                                                    src={sim.poster_path ? `${POSTER_PATH}${sim.poster_path}` : FALLBACK_POSTER}
                                                    alt={sim.title || sim.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 
                                                               group-hover/card:scale-110"
                                                    onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent 
                                                                opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full 
                                                                group-hover/card:translate-y-0 transition-transform">
                                                    <div className="flex items-center gap-1 text-yellow-400">
                                                        <FaStar size={12} />
                                                        <span className="text-sm font-semibold">{sim.vote_average.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-sm truncate group-hover/card:text-blue-400 transition-colors">
                                                {sim.title || sim.name}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                                {/* Scroll Buttons */}
                                <button
                                    onClick={() => scrollRow(similarRef, 'left')}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10
                                               w-12 h-12 bg-black/80 hover:bg-black rounded-full 
                                               flex items-center justify-center opacity-0 group-hover:opacity-100 
                                               transition-all duration-300 hover:scale-110 shadow-xl"
                                >
                                    <FaChevronLeft />
                                </button>
                                <button
                                    onClick={() => scrollRow(similarRef, 'right')}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10
                                               w-12 h-12 bg-black/80 hover:bg-black rounded-full 
                                               flex items-center justify-center opacity-0 group-hover:opacity-100 
                                               transition-all duration-300 hover:scale-110 shadow-xl"
                                >
                                    <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ===== MODALS ===== */}

                {/* Poster Modal */}
                {viewPoster && (
                    <div
                        className="fixed inset-0 bg-black/95 z-50 flex justify-center items-center p-4 cursor-zoom-out backdrop-blur-sm"
                        onClick={() => setViewPoster(false)}
                    >
                        <img
                            src={`${IMAGE_PATH}${mediaData.poster_path}`}
                            alt={mediaTitle}
                            className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
                            onError={(e) => { e.target.src = FALLBACK_POSTER; }}
                        />
                    </div>
                )}

                {/* Trailer Modal */}
                {showTrailer && trailerKey && (
                    <div
                        className="fixed inset-0 bg-black/95 z-50 flex justify-center items-center p-4 backdrop-blur-sm"
                        onClick={() => setShowTrailer(false)}
                    >
                        <div className="w-full max-w-6xl aspect-video relative" onClick={e => e.stopPropagation()}>
                            <button
                                className="absolute -top-12 right-0 flex items-center gap-2 text-white/80 hover:text-white 
                                           transition-colors group"
                                onClick={() => setShowTrailer(false)}
                            >
                                <span className="text-sm">Close</span>
                                <FaTimes className="group-hover:rotate-90 transition-transform" />
                            </button>
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                                title="Trailer"
                                frameBorder="0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                                className="rounded-xl shadow-2xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </AnimatedPage>
    );
}

export default TvShowDetail;