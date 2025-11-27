import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Link, useNavigate } from 'react-router-dom';
import Row from '../Row';
import SkeletonCard from '../components/SkeletonCard';
import AnimatedPage from '../components/AnimatedPage';
import { 
    FaHistory, FaTimes, FaUser, FaSignOutAlt, FaChevronLeft, FaChevronRight, 
    FaPlay, FaInfoCircle, FaSearch, FaStar, FaFilm, FaTv, FaList
} from 'react-icons/fa';
import { GlobalContext, AuthContext } from '../App';
import fetcher from '../utils/fetcher';
import { signOut } from 'firebase/auth';
import { toast } from 'react-toastify';
import { auth } from '../firebase';

function Home() {
    const { mediaType, setMediaType, getFavoriteGenre } = useContext(GlobalContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [movies, setMovies] = useState([]);
    const [heroMovies, setHeroMovies] = useState([]);
    const [heroMovie, setHeroMovie] = useState(null);
    const [heroIndex, setHeroIndex] = useState(0);
    const [searchKey, setSearchKey] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [trailerKey, setTrailerKey] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [isNetworkError, setIsNetworkError] = useState(false);
    const [favoriteGenreData, setFavoriteGenreData] = useState(null);

    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    // 🔥 OPTIMIZATION: State to store the best image path for the Hero based on device size
    const [heroImagePath, setHeroImagePath] = useState('');

    const observerTarget = useRef(null);
    const timerRef = useRef(null);

    const IMAGE_PATH_ORIGINAL = "https://image.tmdb.org/t/p/original";
    const POSTER_PATH = "https://image.tmdb.org/t/p/w500";

    // --- TV GENRE ID MAPPING ---
    const TV_ID_MAP = {
        'Action': 10759,
        'Horror': 10764,
        'Sci-Fi': 10765,
        'Comedy': 35,
        'Romance': 10749,
        'Drama': 18
    };

    const movieActionGenreId = 28;

    const requests = {
        requestPopular: `/${mediaType}/popular?language=en-US&page=1`,
        requestTopRated: `/${mediaType}/top_rated?language=en-US&page=1`,
        requestTrending: `/trending/${mediaType}/week?language=en-US`,
        requestUpcoming: `/movie/upcoming?language=en-US&page=1`,
        requestAction: `/discover/${mediaType}?with_genres=${mediaType === 'movie' ? movieActionGenreId : TV_ID_MAP['Action']}`,
        requestHorror: `/discover/${mediaType}?with_genres=${mediaType === 'movie' ? 27 : TV_ID_MAP['Horror']}`,
        requestComedy: `/discover/${mediaType}?with_genres=35`,
        requestSciFi: `/discover/${mediaType}?with_genres=${mediaType === 'movie' ? 878 : TV_ID_MAP['Sci-Fi']}`,
    };

    const genres = [
        { id: 28, name: "Action" },
        { id: 35, name: "Comedy" },
        { id: 27, name: "Horror" },
        { id: 10749, name: "Romance" },
        { id: 878, name: "Sci-Fi" },
        { id: 18, name: "Drama" },
    ];

    // --- MOBILE OPTIMIZATION EFFECTS ---
    // 1. Scroll listener for header background
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 2. Hero Image Path Optimization for Mobile
    useEffect(() => {
        const setResponsiveImagePath = () => {
            // Use w1280 for tablets/small desktops, w780 for phones
            const pathPrefix = window.innerWidth >= 768 ? 'w1280' : 'w780';
            setHeroImagePath(`https://image.tmdb.org/t/p/${pathPrefix}`);
        };
        
        setResponsiveImagePath();
        window.addEventListener('resize', setResponsiveImagePath);
        return () => window.removeEventListener('resize', setResponsiveImagePath);
    }, [mediaType]); // Re-evaluate path when mediaType changes


    const truncate = (str, n) => {
        return str?.length > n ? str.substr(0, n - 1) + "..." : str;
    };

    const smartSort = (results, term) => {
        if (!term) return results;
        const lowerTerm = term.toLowerCase();
        const key = mediaType === 'movie' ? 'title' : 'name';

        return results.sort((a, b) => {
            const titleA = (a[key] || '').toLowerCase();
            const titleB = (b[key] || '').toLowerCase();
            const startsA = titleA.startsWith(lowerTerm);
            const startsB = titleB.startsWith(lowerTerm);
            if (startsA && !startsB) return -1;
            if (!startsA && startsB) return 1;
            return 0;
        });
    };

    const heroUrl = requests.requestPopular;
    const { data: heroData, error: heroError } = useSWR(heroUrl, fetcher);

    const startCarousel = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setHeroIndex(prevIndex => {
                const newIndex = (prevIndex + 1) % heroMovies.length;
                const nextHero = heroMovies[newIndex];

                setHeroMovie(nextHero);
                fetchTrailer(nextHero.id, mediaType);

                return newIndex;
            });
        }, 6000);
    };

    useEffect(() => {
        if (heroError) {
            setIsNetworkError(true);
        } else if (heroData && heroData.results.length > 0) {
            setIsNetworkError(false);

            setHeroMovies(heroData.results.slice(0, 10));

            const initialHero = heroData.results[0];
            setHeroMovie(initialHero);
            fetchTrailer(initialHero.id, mediaType);

            fetchPersonalizedData();
        }
    }, [heroData, heroError, mediaType]);

    useEffect(() => {
        if (heroMovies.length > 1) {
            startCarousel();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [heroMovies, mediaType]);

    const handleHeroChange = (direction) => {
        if (heroMovies.length <= 1) return;

        if (timerRef.current) clearInterval(timerRef.current);

        setHeroIndex(prevIndex => {
            let newIndex;
            if (direction === 'next') {
                newIndex = (prevIndex + 1) % heroMovies.length;
            } else {
                newIndex = (prevIndex - 1 + heroMovies.length) % heroMovies.length;
            }

            const nextHero = heroMovies[newIndex];
            setHeroMovie(nextHero);
            fetchTrailer(nextHero.id, mediaType);

            return newIndex;
        });

        startCarousel();
    };

    const fetchPersonalizedData = async () => {
        const { favoriteGenreId, favoriteGenreName } = getFavoriteGenre(mediaType);

        if (favoriteGenreId) {
            try {
                const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
                const apiKey = process.env.REACT_APP_TMDB_KEY;

                const { data } = await axios.get(`https://api.themoviedb.org/3/discover/${endpoint}`, {
                    params: {
                        api_key: apiKey,
                        with_genres: favoriteGenreId,
                        sort_by: 'popularity.desc',
                        page: 1
                    }
                });

                setFavoriteGenreData({
                    name: `Because You Like ${favoriteGenreName}`,
                    items: data.results.slice(0, 10),
                    id: favoriteGenreId
                });

            } catch (error) {
                console.error("Error fetching personalized data:", error);
                setFavoriteGenreData(null);
            }
        } else {
            setFavoriteGenreData(null);
        }
    };

    const fetchSearch = async (searchTerm, pageNum, append = false, genreId = null) => {
        if (!searchTerm && !genreId) return;
        setIsSearching(true);
        const apiKey = process.env.REACT_APP_TMDB_KEY;

        try {
            let url, params;
            const endpoint = mediaType === 'movie' ? 'movie' : 'tv';

            if (genreId) {
                url = `https://api.themoviedb.org/3/discover/${endpoint}`;
                params = {
                    api_key: apiKey,
                    with_genres: genreId,
                    page: pageNum,
                    sort_by: 'popularity.desc'
                };
            } else {
                url = `https://api.themoviedb.org/3/search/${endpoint}`;
                params = {
                    api_key: apiKey,
                    query: searchTerm,
                    page: pageNum
                };
            }

            const { data } = await axios.get(url, { params });
            setIsNetworkError(false);

            const results = genreId ? data.results : smartSort(data.results, searchTerm);

            if (append) {
                setMovies(prev => [...prev, ...results]);
            } else {
                setMovies(results);
            }
        } catch (error) {
            console.error("Search error:", error);
            setIsNetworkError(true);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchTrailer = async (id, type) => {
        const apiKey = process.env.REACT_APP_TMDB_KEY;
        try {
            const { data } = await axios.get(`https://api.themoviedb.org/3/${type}/${id}/videos`, {
                params: { api_key: apiKey }
            });
            const trailer = data.results.find(vid => vid.name.includes("Official Trailer") || vid.type === "Trailer");
            if (trailer) setTrailerKey(trailer.key);
            setIsNetworkError(false);
        } catch (error) {
            setIsNetworkError(true);
        }
    };

    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('movie-verse-search-history')) || [];
        setSearchHistory(savedHistory);
        document.title = "Home - MovieVerse";
    }, []);

    const addToHistory = (term) => {
        if (!term || !term.trim()) return;
        const cleanTerm = term.trim();
        const newHistory = [cleanTerm, ...searchHistory.filter(h => h !== cleanTerm)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('movie-verse-search-history', JSON.stringify(newHistory));
    };

    const removeFromHistory = (term, e) => {
        e.stopPropagation();
        const newHistory = searchHistory.filter(h => h !== term);
        setSearchHistory(newHistory);
        localStorage.setItem('movie-verse-search-history', JSON.stringify(newHistory));
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchKey.trim().length > 0 && !selectedGenre) {
                setPage(1);
                fetchSearch(searchKey, 1, false);
            } else if (searchKey.trim().length === 0) {
                setMovies([]);
                setSelectedGenre(null);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchKey]);

    useEffect(() => {
        if (page > 1) {
            fetchSearch(selectedGenre ? null : searchKey, page, true, selectedGenre);
        }
    }, [page]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isSearching && movies.length > 0) {
                    setPage((prev) => prev + 1);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) observer.unobserve(observerTarget.current);
        };
    }, [isSearching, movies.length]);

    const handleSearch = (e) => {
        e.preventDefault();
        addToHistory(searchKey);
        setShowHistory(false);
    };

    const clearSearch = () => {
        setSearchKey("");
        setSelectedGenre(null);
        setMovies([]);
    };

    const handleGenreClick = (genre) => {
        if (selectedGenre === genre.id) {
            clearSearch();
        } else {
            setSelectedGenre(genre.id);
            setSearchKey(genre.name);
            setPage(1);

            const genreIdToFetch = mediaType === 'movie'
                ? genre.id
                : TV_ID_MAP[genre.name] || genre.id;

            fetchSearch(null, 1, false, genreIdToFetch);
        }
    };

    const toggleMedia = (type) => {
        if (mediaType !== type) {
            setMediaType(type);
            clearSearch();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleLogout = async () => {
        if (auth) {
            try {
                await signOut(auth);
                navigate('/');
                toast.success("Signed out successfully!");
            } catch (error) {
                console.error("Error signing out:", error);
                toast.error("Failed to sign out.");
            }
        }
    };

    const ratingPercent = heroMovie ? Math.round(heroMovie.vote_average * 10) : 0;

    return (
        <AnimatedPage>
            <div className="min-h-screen bg-[#0a0a0a] text-white">

                {/* Network Error Banner */}
                {isNetworkError && (
                    <div className="fixed top-0 left-0 w-full bg-gradient-to-r from-red-700 to-red-900 text-white text-sm font-medium py-3 px-8 z-[100] text-center shadow-2xl flex items-center justify-center gap-2">
                        <span className="animate-pulse">⚠️</span>
                        Network Error: Could not connect to the database. Please check your connection.
                    </div>
                )}

                {/* ===== HEADER / NAVBAR ===== */}
                <header
                    className={`fixed w-full z-50 transition-all duration-500 ${
                        isNetworkError ? 'top-12' : 'top-0'
                    } ${
                        isScrolled || searchKey
                            ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-xl border-b border-white/5'
                            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
                    }`}
                >
                    <div className="px-4 md:px-12 py-4">
                        <div className="flex items-center justify-between gap-4">
                            
                            {/* Left Section - Logo & Nav */}
                            <div className="flex items-center gap-8">
                                {/* Logo */}
                                <div
                                    className="cursor-pointer flex items-center gap-1 group"
                                    onClick={() => {
                                        clearSearch();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <span className="text-2xl md:text-3xl font-black tracking-tighter">
                                        <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
                                            {mediaType === 'movie' ? 'MOVIE' : 'TV'}
                                        </span>
                                        <span className="text-white">VERSE</span>
                                    </span>
                                </div>

                                {/* Desktop Navigation */}
                                <nav className="hidden lg:flex items-center gap-6">
                                    {user && user.email && (
                                        <Link
                                            to="/mylist"
                                            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            <FaList size={14} />
                                            My List
                                        </Link>
                                    )}
                                </nav>
                            </div>

                            {/* Center Section - Media Toggle */}
                            <div className="hidden md:flex items-center">
                                <div className="flex items-center bg-white/5 backdrop-blur-sm p-1 rounded-full border border-white/10">
                                    <button
                                        onClick={() => toggleMedia('movie')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            mediaType === 'movie'
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <FaFilm size={14} />
                                        Movies
                                    </button>
                                    <button
                                        onClick={() => toggleMedia('tv')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                                            mediaType === 'tv'
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                                : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        <FaTv size={14} />
                                        TV Shows
                                    </button>
                                </div>
                            </div>

                            {/* Right Section - Search & User */}
                            <div className="flex items-center gap-3">
                                {user && user.email ? (
                                    <>
                                        {/* Search Bar */}
                                        <form onSubmit={handleSearch} className="relative">
                                            {/* FIX: Reduced focused width on mobile to prevent overflow */}
                                            <div className={`flex items-center transition-all duration-300 ${
                                                searchFocused 
                                                    ? 'w-40 md:w-80' 
                                                    : 'w-10 md:w-56'
                                            }`}>
                                                <div className={`relative w-full flex items-center ${
                                                    searchFocused || searchKey
                                                        ? 'bg-[#1a1a1a] border border-white/20'
                                                        : 'bg-transparent md:bg-white/5 border border-transparent md:border-white/10'
                                                } rounded-full overflow-hidden transition-all duration-300`}>
                                                    <FaSearch className={`absolute left-3 transition-colors ${
                                                        searchFocused ? 'text-red-500' : 'text-white/50'
                                                    }`} />
                                                    <input
                                                        type="text"
                                                        placeholder={`Search ${mediaType === 'movie' ? 'movies' : 'TV shows'}...`}
                                                        value={searchKey}
                                                        onChange={(e) => {
                                                            setSearchKey(e.target.value);
                                                            setSelectedGenre(null);
                                                        }}
                                                        onFocus={() => {
                                                            setSearchFocused(true);
                                                            setShowHistory(true);
                                                        }}
                                                        onBlur={() => {
                                                            setSearchFocused(false);
                                                            // Keep a small delay to allow clicking history links
                                                            setTimeout(() => setShowHistory(false), 200); 
                                                        }}
                                                        autoComplete="off"
                                                        id="searchInput"
                                                        className="w-full bg-transparent text-white placeholder-white/40 pl-10 pr-10 py-2.5 focus:outline-none text-sm"
                                                    />
                                                    {searchKey && (
                                                        <button
                                                            type="button"
                                                            onClick={clearSearch}
                                                            className="absolute right-3 text-white/50 hover:text-white transition-colors"
                                                        >
                                                            <FaTimes size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Search History Dropdown */}
                                            {showHistory && searchHistory.length > 0 && (
                                                <div className="absolute top-full right-0 w-80 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fadeIn">
                                                    <div className="px-4 py-3 border-b border-white/10">
                                                        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                                                            Recent Searches
                                                        </p>
                                                    </div>
                                                    {searchHistory.map((term, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => {
                                                                setSearchKey(term);
                                                                addToHistory(term);
                                                                setShowHistory(false);
                                                            }}
                                                            className="flex items-center justify-between px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <FaHistory className="text-white/30 group-hover:text-red-500 transition-colors" />
                                                                <span className="text-sm text-white/80">{term}</span>
                                                            </div>
                                                            <button
                                                                onClick={(e) => removeFromHistory(term, e)}
                                                                className="text-white/30 hover:text-red-500 p-1 transition-colors"
                                                            >
                                                                <FaTimes size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </form>

                                        {/* User Profile */}
                                        <Link
                                            to="/profile"
                                            className="relative group"
                                            title="My Profile"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 
                                                flex items-center justify-center text-white font-bold text-sm
                                                group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full 
                                                border-2 border-[#0a0a0a]" />
                                        </Link>

                                        {/* Logout Button */}
                                        <button
                                            onClick={handleLogout}
                                            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 
                                                hover:text-white transition-all duration-300"
                                            title="Sign Out"
                                        >
                                            <FaSignOutAlt size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Link
                                            to="/login"
                                            className="text-white/80 hover:text-white font-medium text-sm transition-colors"
                                        >
                                            Sign In
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 
                                                hover:from-red-500 hover:to-red-600 text-white px-5 py-2.5 
                                                rounded-lg font-semibold text-sm transition-all duration-300 
                                                hover:scale-105 shadow-lg"
                                        >
                                            <FaUser size={12} />
                                            Get Started
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Genre Pills */}
                        <div className="flex gap-2 overflow-x-auto pb-2 pt-4 scrollbar-hide">
                            {genres.map(genre => (
                                <button
                                    key={genre.id}
                                    onClick={() => handleGenreClick(genre)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap 
                                            transition-all duration-300 ${
                                        selectedGenre === genre.id
                                            ? 'bg-white text-black shadow-lg scale-105'
                                            : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                                >
                                    {mediaType === 'tv' && genre.name === 'Horror' ? 'Reality' : genre.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* ===== SEARCH RESULTS VIEW ===== */}
                {searchKey ? (
                    <div
                        className="px-4 md:px-12 pb-20 min-h-screen"
                        style={{ paddingTop: isNetworkError ? '220px' : '180px' }}
                    >
                        {/* Results Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {selectedGenre === 27 && mediaType === 'tv'
                                    ? 'Reality Shows'
                                    : selectedGenre
                                        ? `${searchKey} ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`
                                        : `Search Results`}
                            </h1>
                            {!selectedGenre && (
                                <p className="text-white/50">
                                    Showing results for "<span className="text-white">{searchKey}</span>"
                                </p>
                            )}
                        </div>

                        {isSearching && page === 1 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {[...Array(12)].map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : (
                            <>
                                {movies.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {movies.map((item) => (
                                                <Link
                                                    to={`/${mediaType}/${item.id}`}
                                                    key={item.id}
                                                    className="group relative"
                                                >
                                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5
                                                        group-hover:ring-2 group-hover:ring-white/50 
                                                        transition-all duration-300 group-hover:scale-105">
                                                        <img
                                                            src={item.poster_path
                                                                ? `${POSTER_PATH}${item.poster_path}`
                                                                : "https://placehold.co/300x450/1a1a1a/333333?text=No+Image"}
                                                            alt={item.title || item.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {/* Hover Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent 
                                                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                                                        <FaPlay className="text-black text-xs ml-0.5" />
                                                                    </div>
                                                                    <span className="text-xs font-medium">Watch Now</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Rating Badge */}
                                                        {item.vote_average > 0 && (
                                                            <div className="absolute top-2 right-2 flex items-center gap-1 
                                                                    bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                                                                <FaStar className="text-yellow-400 text-xs" />
                                                                <span className="text-xs font-semibold">{item.vote_average.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3">
                                                        <h3 className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
                                                            {item.title || item.name}
                                                        </h3>
                                                        <p className="text-white/40 text-xs mt-1">
                                                            {mediaType === 'movie'
                                                                ? (item.release_date?.split('-')[0] || "N/A")
                                                                : (item.first_air_date?.split('-')[0] || "N/A")}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Infinite Scroll Loader */}
                                        <div ref={observerTarget} className="h-20 w-full flex justify-center items-center mt-8">
                                            {isSearching && (
                                                <div className="w-8 h-8 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    !isSearching && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                                <FaSearch className="text-white/20 text-4xl" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                            <p className="text-white/50 max-w-md">
                                                We couldn't find any {mediaType === 'movie' ? 'movies' : 'TV shows'} matching your search.
                                                Try different keywords.
                                            </p>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ===== HERO SECTION ===== */}
                        {heroMovie && (
                            <div className="relative w-full h-[90vh] min-h-[700px] overflow-hidden">
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                                    // 🔥 OPTIMIZATION: Use the responsive image path
                                    style={{ backgroundImage: `url(${heroImagePath}${heroMovie.backdrop_path})` }}
                                >
                                    {/* Gradient Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/40" />
                                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                                </div>

                                {/* Hero Navigation Arrows */}
                                <button
                                    onClick={() => handleHeroChange('prev')}
                                    className="absolute top-1/2 left-4 -translate-y-1/2 z-30 w-12 h-12 
                                        bg-black/30 hover:bg-black/60 backdrop-blur-sm rounded-full 
                                        flex items-center justify-center text-white/70 hover:text-white 
                                        transition-all duration-300 opacity-0 hover:opacity-100 
                                        group-hover:opacity-100 hidden md:flex"
                                >
                                    <FaChevronLeft size={20} />
                                </button>

                                <button
                                    onClick={() => handleHeroChange('next')}
                                    className="absolute top-1/2 right-4 -translate-y-1/2 z-30 w-12 h-12 
                                        bg-black/30 hover:bg-black/60 backdrop-blur-sm rounded-full 
                                        flex items-center justify-center text-white/70 hover:text-white 
                                        transition-all duration-300 opacity-0 hover:opacity-100 
                                        group-hover:opacity-100 hidden md:flex"
                                >
                                    <FaChevronRight size={20} />
                                </button>

                                {/* Hero Content */}
                                {/* FIX: Reduced mobile padding-bottom (pb-32 -> pb-28) to pull content up */}
                                <div className="absolute bottom-0 left-0 right-0 z-20 px-4 md:px-12 pb-28 md:pb-32">
                                    <div className="max-w-2xl">
                                        {/* Media Type Badge */}
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4
                                            ${mediaType === 'movie' 
                                                ? 'bg-red-600/80 backdrop-blur-sm' 
                                                : 'bg-blue-600/80 backdrop-blur-sm'
                                            }`}>
                                            {mediaType === 'movie' ? <FaFilm size={12} /> : <FaTv size={12} />}
                                            {mediaType === 'movie' ? 'Featured Movie' : 'Featured Series'}
                                        </div>

                                        {/* Title */}
                                        <Link to={`/${mediaType}/${heroMovie.id}`}>
                                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-none 
                                                            tracking-tight hover:text-white/80 transition-colors cursor-pointer
                                                            drop-shadow-2xl"
                                                style={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: '2',
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                {heroMovie.title || heroMovie.name}
                                            </h1>
                                        </Link>

                                        {/* Meta Info */}
                                        <div className="flex flex-wrap items-center gap-3 mb-4">
                                            <span className={`font-bold ${
                                                ratingPercent >= 70 ? 'text-green-400' : 
                                                ratingPercent >= 50 ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                                {ratingPercent}% Match
                                            </span>
                                            <span className="text-white/50">•</span>
                                            <span className="text-white/70">
                                                {mediaType === 'movie'
                                                    ? heroMovie.release_date?.split('-')[0]
                                                    : heroMovie.first_air_date?.split('-')[0]}
                                            </span>
                                            <span className="px-2 py-0.5 border border-white/30 text-xs rounded">HD</span>
                                        </div>

                                        {/* Overview */}
                                        <p className="hidden md:block text-white/70 text-lg leading-relaxed mb-6 max-w-xl">
                                            {truncate(heroMovie.overview, 180)}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            {trailerKey && (
                                                <button
                                                    onClick={() => setPlaying(true)}
                                                    // FIX: Reduced padding (py-3) and font size (text-base) for better mobile button size
                                                    className="flex items-center gap-3 bg-white text-black px-6 py-3 md:px-8 md:py-4 
                                                            rounded-lg font-bold text-base md:text-lg hover:bg-white/90 
                                                            transition-all duration-300 hover:scale-105 shadow-xl"
                                                >
                                                    <FaPlay />
                                                    Play
                                                </button>
                                            )}
                                            <Link
                                                to={`/${mediaType}/${heroMovie.id}`}
                                                // FIX: Reduced padding (py-3) and font size (text-base) for better mobile button size
                                                className="flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white 
                                                            px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg hover:bg-white/30 
                                                            transition-all duration-300"
                                            >
                                                <FaInfoCircle />
                                                More Info
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Hero Pagination Dots */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                                    {heroMovies.slice(0, 10).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (timerRef.current) clearInterval(timerRef.current);
                                                setHeroIndex(index);
                                                setHeroMovie(heroMovies[index]);
                                                fetchTrailer(heroMovies[index].id, mediaType);
                                                startCarousel();
                                            }}
                                            className={`transition-all duration-300 rounded-full ${
                                                index === heroIndex
                                                    ? 'w-8 h-2 bg-white'
                                                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ===== CONTENT ROWS ===== */}
                        {!isNetworkError && (
                            <div className="relative z-10 -mt-20 md:-mt-32 px-4 md:px-12 pb-20 space-y-8">
                                {/* FIX: Reduced aggressive negative margin from -mt-32 to -mt-20 on mobile */}
                                {favoriteGenreData && favoriteGenreData.items.length > 0 && (
                                    <Row
                                        title={favoriteGenreData.name}
                                        initialItems={favoriteGenreData.items}
                                        fetchURL={null}
                                    />
                                )}

                                <Row
                                    title={`Trending ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`}
                                    fetchURL={requests.requestTrending}
                                />
                                <Row
                                    title={`Top Rated ${mediaType === 'movie' ? 'Movies' : 'TV Shows'}`}
                                    fetchURL={requests.requestTopRated}
                                />
                                <Row
                                    title={mediaType === 'movie' ? 'Action Thrillers' : 'Action & Adventure'}
                                    fetchURL={requests.requestAction}
                                />
                                <Row
                                    title={mediaType === 'movie' ? 'Comedy Movies' : 'Comedies'}
                                    fetchURL={requests.requestComedy}
                                />
                                {mediaType === 'movie' && (
                                    <Row
                                        title="Coming Soon"
                                        fetchURL={requests.requestUpcoming}
                                    />
                                )}
                            </div>
                        )}

                        {/* Network Error State */}
                        {isNetworkError && (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                                <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                                    <span className="text-5xl">📡</span>
                                </div>
                                <h2 className="text-3xl font-bold text-red-500 mb-3">Connection Lost</h2>
                                <p className="text-white/50 max-w-md mb-6">
                                    We're having trouble connecting to our servers. Please check your internet connection and try again.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ===== TRAILER MODAL ===== */}
                {playing && trailerKey && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[100] flex justify-center items-center p-4 backdrop-blur-sm"
                        onClick={() => setPlaying(false)}
                    >
                        <div className="w-full max-w-6xl aspect-video relative" onClick={e => e.stopPropagation()}>
                            <button
                                className="absolute -top-12 right-0 flex items-center gap-2 text-white/70 hover:text-white 
                                        transition-colors group"
                                onClick={() => setPlaying(false)}
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

export default Home;