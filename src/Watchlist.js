import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaStar, FaPlay } from 'react-icons/fa'; // Added FaStar, FaPlay
import AnimatedPage from './components/AnimatedPage'; // For smooth transitions

const Watchlist = () => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    // 1. Load movies from Local Storage when page opens
    document.title = "My List | MovieVerse";
    // Ensure we parse the list correctly
    const savedMovies = JSON.parse(localStorage.getItem('react-movie-app-favourites')) || [];
    setMovies(savedMovies);
  }, []);

  const removeMovie = (id) => {
    // 2. Filter out the movie we want to delete
    const updatedList = movies.filter((movie) => movie.id !== id);
    setMovies(updatedList);
    // 3. Update Local Storage
    localStorage.setItem('react-movie-app-favourites', JSON.stringify(updatedList));
  };

  const POSTER_PATH = "https://image.tmdb.org/t/p/w500";
  const FALLBACK_POSTER = "https://placehold.co/350x525/333333/999999?text=NO+IMAGE";

  return (
    <AnimatedPage>
    {/* 👇 FIX: Changed pt-24 to pt-8 to move header elements higher up the page */}
    <div className="min-h-screen bg-black text-white pt-8 px-8 pb-20"> 
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        
        {/* Back Link Styled for High Contrast */}
        <Link to="/" className="inline-flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors font-bold text-lg">
          <FaArrowLeft /> Back to Home
        </Link>
        
        <h1 className="text-3xl font-black">My Watchlist ({movies.length})</h1>
      </div>

      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
            <div className="text-6xl mb-4 opacity-30">😭</div>
            <h2 className="text-2xl mb-4 text-gray-400">Your list is empty</h2>
            <p>Go back and click the ❤️ on movies or TV shows you want to save!</p>
            <Link to="/" className="mt-6 bg-red-600 text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-colors">
              Start Browsing
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => {
            // Determine type and keys dynamically
            const isMovie = !!movie.release_date;
            const mediaType = isMovie ? 'movie' : 'tv';
            const title = movie.title || movie.name;
            const year = (movie.release_date || movie.first_air_date)?.split('-')[0] || "N/A";

            return (
              <div key={movie.id} className="relative group bg-[#181818] rounded-xl overflow-hidden hover:ring-2 hover:ring-red-500 transition-all duration-300 shadow-lg">
                  
                  <Link to={`/${mediaType}/${movie.id}`} className="block">
                      <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
                          <img 
                              src={movie.poster_path ? `${POSTER_PATH}${movie.poster_path}` : FALLBACK_POSTER} 
                              alt={title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {/* Play Icon on Hover */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FaPlay className="text-white text-3xl" />
                          </div>
                      </div>
                  </Link>

                  {/* 🗑️ REMOVE BUTTON (High contrast, positioned over the image) */}
                  <button 
                      onClick={() => removeMovie(movie.id)}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full cursor-pointer hover:bg-red-600 transition-colors z-20 opacity-0 group-hover:opacity-100"
                      title="Remove from list"
                  >
                      <FaTrash size={16} />
                  </button>

                  {/* Movie Metadata */}
                  <div className="p-3">
                      <Link to={`/${mediaType}/${movie.id}`} className="block hover:text-red-500 transition-colors">
                          <h3 className="text-sm font-bold truncate mb-1" title={title}>{title}</h3>
                      </Link>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400">
                          <span className="font-semibold text-white/70">
                              {year}
                          </span>
                          <span className="text-yellow-400 flex items-center gap-1 font-bold">
                              <FaStar size={10} /> {movie.vote_average?.toFixed(1) || 'N/A'}
                          </span>
                      </div>
                  </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Watchlist;