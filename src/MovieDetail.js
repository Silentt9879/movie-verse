import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlay, FaStar, FaClock, FaCalendar } from 'react-icons/fa';

function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [similar, setSimilar] = useState([]); // 👈 NEW: Similar Movies State
  const [trailer, setTrailer] = useState("");

  const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
  const POSTER_PATH = "https://image.tmdb.org/t/p/w500";

  useEffect(() => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    
    // 👈 SCROLL TO TOP when ID changes (so you don't load the next movie at the bottom)
    window.scrollTo(0, 0);

    const fetchData = async () => {
      try {
        const movieReq = await axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`);
        setMovie(movieReq.data);

        const castReq = await axios.get(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`);
        setCast(castReq.data.cast.slice(0, 15));

        // 👈 NEW: Fetch Similar Movies
        const similarReq = await axios.get(`https://api.themoviedb.org/3/movie/${id}/similar?api_key=${apiKey}&language=en-US`);
        setSimilar(similarReq.data.results.slice(0, 10));

        const videoReq = await axios.get(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${apiKey}`);
        const trailerData = videoReq.data.results.find(vid => vid.type === "Trailer" && vid.site === "YouTube");
        if (trailerData) setTrailer(`https://www.youtube.com/watch?v=${trailerData.key}`);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [id]);

  if (!movie) return (
    <div className="h-screen bg-black text-white flex items-center justify-center">
        <h2 className="text-3xl animate-pulse">Loading...</h2>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-black text-white font-sans">
      
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-40 fixed"
        style={{ backgroundImage: `url(${IMAGE_PATH}${movie.backdrop_path})` }}
      ></div>
      
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black via-black/80 to-transparent"></div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <Link to="/" className="flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors w-fit">
            <FaArrowLeft /> Back to Home
        </Link>

        <div className="flex flex-col md:flex-row gap-12 items-start">
            
            <div className="w-full md:w-[350px] shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-red-600/20 border border-gray-800">
                <img 
                    src={movie.poster_path ? `${POSTER_PATH}${movie.poster_path}` : "placeholder.jpg"} 
                    alt={movie.title} 
                    className="w-full h-auto object-cover"
                />
            </div>

            <div className="flex-1 min-w-0"> 
                <h1 className="text-4xl md:text-6xl font-extrabold mb-2 drop-shadow-lg">
                    {movie.title}
                </h1>
                <p className="text-xl text-gray-400 italic mb-6">{movie.tagline}</p>

                <div className="flex flex-wrap gap-6 text-sm md:text-base font-medium mb-8 text-gray-300">
                    <span className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                        <FaCalendar className="text-red-500"/> {movie.release_date?.split('-')[0]}
                    </span>
                    <span className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                        <FaStar className="text-yellow-400"/> {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                        <FaClock className="text-blue-400"/> {movie.runtime} min
                    </span>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                    {movie.genres.map(g => (
                        <span key={g.id} className="text-sm border border-gray-600 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors cursor-default">
                            {g.name}
                        </span>
                    ))}
                </div>

                <div className="flex gap-4 mb-10">
                    {trailer && (
                        <a 
                            href={trailer} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-red-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-3 hover:bg-red-700 transition-transform hover:scale-105"
                        >
                            <FaPlay /> Watch Trailer
                        </a>
                    )}
                </div>

                <div className="mb-10">
                    <h3 className="text-2xl font-bold mb-3 border-l-4 border-red-600 pl-4">Overview</h3>
                    <p className="text-gray-300 leading-relaxed text-lg max-w-3xl">
                        {movie.overview}
                    </p>
                </div>

                {/* CAST SECTION */}
                {cast.length > 0 && (
                    <div className="mb-10">
                        <h3 className="text-2xl font-bold mb-4">Top Cast</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {cast.map(actor => (
                                <div key={actor.id} className="w-28 shrink-0 text-center">
                                    <img 
                                        src={actor.profile_path ? `${POSTER_PATH}${actor.profile_path}` : "https://via.placeholder.com/150"} 
                                        alt={actor.name}
                                        className="w-24 h-24 rounded-full object-cover mx-auto mb-2 border-2 border-gray-700 hover:border-red-500 transition-colors"
                                    />
                                    <p className="text-sm font-bold truncate">{actor.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{actor.character}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⬇️ NEW: SIMILAR MOVIES SECTION */}
                {similar.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold mb-4">You Might Also Like</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {similar.map(sim => (
                                <Link to={`/movie/${sim.id}`} key={sim.id} className="w-36 shrink-0 cursor-pointer hover:scale-105 transition-transform">
                                    <img 
                                        src={sim.poster_path ? `${POSTER_PATH}${sim.poster_path}` : "placeholder.jpg"} 
                                        alt={sim.title}
                                        className="w-full rounded-lg shadow-md mb-2"
                                    />
                                    <p className="text-sm font-bold truncate text-gray-300 hover:text-white">{sim.title}</p>
                                    <p className="text-xs text-gray-500">⭐ {sim.vote_average.toFixed(1)}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;