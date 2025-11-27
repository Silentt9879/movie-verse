import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaArrowLeft, FaBirthdayCake, FaMapMarkerAlt, FaStar,
    FaInstagram, FaTwitter, FaFacebook, FaImdb, FaGlobe,
    FaPlay, FaFilm, FaUser, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import AnimatedPage from './components/AnimatedPage';
import { GlobalContext } from './App';

function PersonDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setIsLoading } = useContext(GlobalContext);
    const [person, setPerson] = useState(null);
    const [movies, setMovies] = useState([]);
    const [externalIds, setExternalIds] = useState(null);
    const [showFullBio, setShowFullBio] = useState(false);
    const [sortBy, setSortBy] = useState("popularity");
    const [visibleMovies, setVisibleMovies] = useState(12);

    const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
    const POSTER_PATH = "https://image.tmdb.org/t/p/w500";

    const FALLBACK_POSTER = "https://placehold.co/200x300/1a1a1a/333333?text=No+Poster";
    const FALLBACK_PROFILE = "https://placehold.co/300x450/1a1a1a/333333?text=No+Image";

    useEffect(() => {
        const apiKey = process.env.REACT_APP_TMDB_KEY;
        window.scrollTo(0, 0);

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const personReq = await axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=en-US`);
                setPerson(personReq.data);
                document.title = `${personReq.data.name} | MovieVerse`;

                const creditsReq = await axios.get(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${apiKey}&language=en-US`);
                const sortedMovies = creditsReq.data.cast.sort((a, b) => b.popularity - a.popularity);
                setMovies(sortedMovies);

                const externalReq = await axios.get(`https://api.themoviedb.org/3/person/${id}/external_ids?api_key=${apiKey}`);
                setExternalIds(externalReq.data);

            } catch (error) {
                console.error("Error fetching person data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, setIsLoading]);

    const handleSort = (type) => {
        setSortBy(type);
        let sorted = [...movies];

        if (type === "popularity") {
            sorted.sort((a, b) => b.popularity - a.popularity);
        } else if (type === "newest") {
            sorted.sort((a, b) => new Date(b.release_date || "0000-01-01") - new Date(a.release_date || "0000-01-01"));
        } else if (type === "rating") {
            sorted.sort((a, b) => b.vote_average - a.vote_average);
        }
        setMovies(sorted);
    };

    const loadMoreMovies = () => {
        setVisibleMovies(prev => prev + 12);
    };

    const calculateAge = (birthday, deathday = null) => {
        if (!birthday) return null;
        const endDate = deathday ? new Date(deathday) : new Date();
        const birthDate = new Date(birthday);
        let age = endDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = endDate.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    if (!person) return null;

    const age = calculateAge(person.birthday, person.deathday);
    const topMovie = movies[0];

    return (
        <AnimatedPage>
            <div className="min-h-screen bg-[#0a0a0a] text-white">

                {/* ===== HERO SECTION WITH BACKDROP ===== */}
                <div className="relative w-full h-[60vh] min-h-[500px]">
                    {/* Backdrop - Use top movie's backdrop or gradient */}
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: topMovie?.backdrop_path
                                ? `url(${IMAGE_PATH}${topMovie.backdrop_path})`
                                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f0f 100%)'
                        }}
                    >
                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
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
                    <div className="absolute bottom-0 left-0 right-0 z-20 px-6 md:px-16 pb-8">
                        <div className="flex flex-col md:flex-row items-end gap-8">
                            {/* Profile Image */}
                            <div className="relative group">
                                <div className="w-48 md:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl 
                                                border-4 border-white/10 bg-white/5 backdrop-blur-sm
                                                group-hover:border-white/30 transition-all duration-300">
                                    <img
                                        src={person.profile_path ? `${POSTER_PATH}${person.profile_path}` : FALLBACK_PROFILE}
                                        alt={person.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PROFILE; }}
                                    />
                                </div>
                                {/* Department Badge */}
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 
                                                bg-gradient-to-r from-blue-600 to-blue-700 rounded-full 
                                                text-xs font-bold shadow-lg flex items-center gap-1.5">
                                    <FaUser size={10} />
                                    {person.known_for_department}
                                </div>
                            </div>

                            {/* Person Info */}
                            <div className="flex-1 pb-4">
                                <h1 className="text-4xl md:text-6xl font-black mb-3 leading-tight tracking-tight">
                                    {person.name}
                                </h1>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                    {person.birthday && (
                                        <div className="flex items-center gap-2 text-white/70">
                                            <FaBirthdayCake className="text-pink-500" />
                                            <span>
                                                {person.deathday 
                                                    ? `${age} years (1${new Date(person.birthday).getFullYear()}-${new Date(person.deathday).getFullYear()})`
                                                    : `${age} years old`
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {person.place_of_birth && (
                                        <div className="flex items-center gap-2 text-white/70">
                                            <FaMapMarkerAlt className="text-red-500" />
                                            <span>{person.place_of_birth.split(',').slice(-1)[0].trim()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-white/70">
                                        <FaFilm className="text-yellow-500" />
                                        <span>{movies.length} Credits</span>
                                    </div>
                                </div>

                                {/* Social Links */}
                                {externalIds && (
                                    <div className="flex items-center gap-3">
                                        {externalIds.imdb_id && (
                                            <a
                                                href={`https://www.imdb.com/name/${externalIds.imdb_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-yellow-500 
                                                           flex items-center justify-center transition-all duration-300
                                                           hover:scale-110 group"
                                            >
                                                <FaImdb className="text-white/70 group-hover:text-black text-lg" />
                                            </a>
                                        )}
                                        {externalIds.instagram_id && (
                                            <a
                                                href={`https://instagram.com/${externalIds.instagram_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-br 
                                                           hover:from-purple-600 hover:via-pink-500 hover:to-orange-400
                                                           flex items-center justify-center transition-all duration-300
                                                           hover:scale-110"
                                            >
                                                <FaInstagram className="text-white/70 hover:text-white text-lg" />
                                            </a>
                                        )}
                                        {externalIds.twitter_id && (
                                            <a
                                                href={`https://twitter.com/${externalIds.twitter_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-500 
                                                           flex items-center justify-center transition-all duration-300
                                                           hover:scale-110"
                                            >
                                                <FaTwitter className="text-white/70 hover:text-white text-lg" />
                                            </a>
                                        )}
                                        {externalIds.facebook_id && (
                                            <a
                                                href={`https://facebook.com/${externalIds.facebook_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-600 
                                                           flex items-center justify-center transition-all duration-300
                                                           hover:scale-110"
                                            >
                                                <FaFacebook className="text-white/70 hover:text-white text-lg" />
                                            </a>
                                        )}
                                        {person.homepage && (
                                            <a
                                                href={person.homepage}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500 
                                                           flex items-center justify-center transition-all duration-300
                                                           hover:scale-110"
                                            >
                                                <FaGlobe className="text-white/70 hover:text-white text-lg" />
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="relative z-10 px-6 md:px-16 py-12">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* Left Column - Personal Info */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Personal Info Card */}
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                                    Personal Info
                                </h3>

                                <div className="space-y-5">
                                    <div>
                                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Known For</p>
                                        <p className="font-semibold">{person.known_for_department}</p>
                                    </div>

                                    <div>
                                        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Gender</p>
                                        <p className="font-semibold">
                                            {person.gender === 1 ? "Female" : person.gender === 2 ? "Male" : "Non-binary"}
                                        </p>
                                    </div>

                                    {person.birthday && (
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Birthday</p>
                                            <p className="font-semibold">
                                                {new Date(person.birthday).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            {!person.deathday && (
                                                <p className="text-white/50 text-sm">{age} years old</p>
                                            )}
                                        </div>
                                    )}

                                    {person.deathday && (
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Died</p>
                                            <p className="font-semibold">
                                                {new Date(person.deathday).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-white/50 text-sm">Aged {age}</p>
                                        </div>
                                    )}

                                    {person.place_of_birth && (
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Place of Birth</p>
                                            <p className="font-semibold">{person.place_of_birth}</p>
                                        </div>
                                    )}

                                    {person.also_known_as && person.also_known_as.length > 0 && (
                                        <div>
                                            <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Also Known As</p>
                                            <div className="flex flex-wrap gap-2">
                                                {person.also_known_as.slice(0, 3).map((name, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/70"
                                                    >
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="bg-gradient-to-br from-red-600/20 to-purple-600/20 backdrop-blur-sm 
                                            rounded-2xl p-6 border border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-white">{movies.length}</p>
                                        <p className="text-white/50 text-sm">Movies</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-white">
                                            {movies.filter(m => m.vote_average >= 7).length}
                                        </p>
                                        <p className="text-white/50 text-sm">Hits</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Biography & Filmography */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* Biography Section */}
                            <div>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <span className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-700 rounded-full" />
                                    Biography
                                </h2>

                                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                                    {person.biography ? (
                                        <>
                                            <p className="text-white/80 leading-relaxed text-lg whitespace-pre-line">
                                                {showFullBio
                                                    ? person.biography
                                                    : person.biography.length > 600
                                                        ? person.biography.slice(0, 600) + "..."
                                                        : person.biography
                                                }
                                            </p>
                                            {person.biography.length > 600 && (
                                                <button
                                                    onClick={() => setShowFullBio(!showFullBio)}
                                                    className="mt-4 flex items-center gap-2 text-red-500 hover:text-red-400 
                                                               font-semibold transition-colors"
                                                >
                                                    {showFullBio ? (
                                                        <>
                                                            <FaChevronUp size={12} />
                                                            Show Less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaChevronDown size={12} />
                                                            Read More
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-white/50 italic">
                                            We don't have a biography for {person.name} yet.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Filmography Section */}
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <span className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full" />
                                        Filmography
                                        <span className="text-white/40 text-lg font-normal">({movies.length})</span>
                                    </h2>

                                    {/* Sort Controls */}
                                    <div className="flex items-center bg-white/5 backdrop-blur-sm p-1 rounded-xl border border-white/10">
                                        {[
                                            { id: 'popularity', label: 'Popular' },
                                            { id: 'newest', label: 'Newest' },
                                            { id: 'rating', label: 'Top Rated' }
                                        ].map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleSort(option.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                                    sortBy === option.id
                                                        ? 'bg-white text-black shadow-lg'
                                                        : 'text-white/60 hover:text-white'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Movies Grid */}
                                {movies.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {movies.slice(0, visibleMovies).map(movie => (
                                                <Link
                                                    to={`/movie/${movie.id}`}
                                                    key={movie.id}
                                                    className="group relative"
                                                >
                                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5
                                                                    group-hover:ring-2 group-hover:ring-white/50 
                                                                    transition-all duration-300 group-hover:scale-105">
                                                        <img
                                                            src={movie.poster_path
                                                                ? `${POSTER_PATH}${movie.poster_path}`
                                                                : FALLBACK_POSTER}
                                                            alt={movie.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_POSTER; }}
                                                        />

                                                        {/* Hover Overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent 
                                                                        opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center
                                                                                    group-hover:scale-110 transition-transform">
                                                                        <FaPlay className="text-black text-sm ml-0.5" />
                                                                    </div>
                                                                    <span className="text-sm font-medium">View Details</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Rating Badge */}
                                                        {movie.vote_average > 0 && (
                                                            <div className="absolute top-2 right-2 flex items-center gap-1 
                                                                            bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                                                                <FaStar className="text-yellow-400 text-xs" />
                                                                <span className="text-xs font-bold">{movie.vote_average.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-3">
                                                        <h3 className="font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
                                                            {movie.title}
                                                        </h3>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <p className="text-white/40 text-xs">
                                                                {movie.release_date?.split('-')[0] || "TBA"}
                                                            </p>
                                                            {movie.character && (
                                                                <p className="text-white/30 text-xs truncate max-w-[100px]">
                                                                    {movie.character}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Load More Button */}
                                        {visibleMovies < movies.length && (
                                            <div className="flex justify-center mt-8">
                                                <button
                                                    onClick={loadMoreMovies}
                                                    className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 
                                                               backdrop-blur-sm rounded-full font-semibold transition-all duration-300
                                                               hover:scale-105 border border-white/10"
                                                >
                                                    <FaChevronDown />
                                                    Load More ({movies.length - visibleMovies} remaining)
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                        <FaFilm className="text-white/20 text-5xl mx-auto mb-4" />
                                        <p className="text-white/50">No movie credits found for {person.name}.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}

export default PersonDetail;