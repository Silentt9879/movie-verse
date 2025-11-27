import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { GlobalContext } from './App'; // GlobalContext is correctly imported here

// Row now accepts optional initialItems
const Row = ({ title, fetchURL, initialItems }) => { 
  const { mediaType } = useContext(GlobalContext); 
  // Initialize with initialItems if provided, otherwise empty
  const [movies, setMovies] = useState(initialItems || []); 
  const [savedMovies, setSavedMovies] = useState([]);

  useEffect(() => {
    // Only fetch data if initialItems was NOT provided
    if (fetchURL && !initialItems) {
        const apiKey = process.env.REACT_APP_TMDB_KEY;
        const base_url = "https://api.themoviedb.org/3";
        
        async function fetchData() {
          const request = await axios.get(`${base_url}${fetchURL}&api_key=${apiKey}`);
          setMovies(request.data.results);
          return request;
        }
        fetchData();
    } else if (initialItems) {
      // If initialItems were provided (from Home.js personalized fetch), just set them
      setMovies(initialItems);
    }
  }, [fetchURL, initialItems, mediaType]); // mediaType dependency ensures re-fetch on toggle

  useEffect(() => {
    const movieFavourites = JSON.parse(
        localStorage.getItem('react-movie-app-favourites')
    ) || [];
    setSavedMovies(movieFavourites);
  }, []);

  const toggleSave = (movie) => {
    const movieFavourites = JSON.parse(
        localStorage.getItem('react-movie-app-favourites')
    ) || [];

    if (movieFavourites.some(fav => fav.id === movie.id)) {
        const newList = movieFavourites.filter(fav => fav.id !== movie.id);
        localStorage.setItem('react-movie-app-favourites', JSON.stringify(newList));
        setSavedMovies(newList);
    } else {
        const newList = [...movieFavourites, movie];
        localStorage.setItem('react-movie-app-favourites', JSON.stringify(newList));
        setSavedMovies(newList);
    }
  };

  const isSaved = (movieId) => savedMovies.some(fav => fav.id === movieId);

  const slide = (direction) => {
    var slider = document.getElementById('slider' + title);
    slider.scrollLeft = slider.scrollLeft + (direction === 'left' ? -500 : 500);
  };

  const itemKey = mediaType === 'movie' ? 'title' : 'name';
  const releaseKey = mediaType === 'movie' ? 'release_date' : 'first_air_date';

  return (
    <div className="text-white p-4 relative z-10 group"> 
      <h2 className="text-white text-xl md:text-2xl font-bold p-4 mb-2 border-l-4 border-red-600 ml-4 pl-4">{title}</h2>
      
      <div className="relative flex items-center">
        {/* Left Arrow - Upgraded */}
        <div 
            onClick={() => slide('left')} 
            className="bg-white left-2 rounded-full absolute opacity-50 hover:opacity-100 cursor-pointer z-50 hidden group-hover:grid place-items-center w-10 h-10 text-black shadow-lg transition-all duration-300 hover:scale-110 top-1/2 -translate-y-1/2"
        >
            <FaChevronLeft size={20} />
        </div>

        {/* Scroll Container */}
        <div 
            id={'slider' + title} 
            className="w-full h-full overflow-x-scroll whitespace-nowrap scroll-smooth scrollbar-hide relative px-4 py-4"
        >
          {movies.map((item) => (
            // Use item.media_type if available (from search), otherwise rely on global mediaType
            <div key={item.id} className="inline-block relative p-2 w-[160px] sm:w-[200px] md:w-[240px] align-top transition-transform duration-300 hover:z-30">
                
                {/* Poster Container */}
                <div className="relative group-card shadow-lg hover:shadow-black/50 rounded-lg overflow-hidden">
                    <Link to={`/${item.media_type || mediaType}/${item.id}`} className="block">
                        <img
                            className="w-full h-auto block rounded-lg transition-transform duration-300 hover:scale-105 cursor-pointer object-cover"
                            src={`https://image.tmdb.org/t/p/w500/${item?.poster_path}`}
                            alt={item[itemKey] || item.name}
                        />
                    </Link>

                    {/* Heart Icon */}
                    <div 
                        onClick={() => toggleSave(item)} 
                        className="absolute top-2 left-2 bg-black/60 rounded-full p-2 cursor-pointer hover:bg-white/20 transition-colors z-20"
                    >
                        {isSaved(item.id) ? <FaHeart className="text-red-500"/> : <FaRegHeart className="text-white"/>}
                    </div>
                </div>

                {/* Movie Title */}
                <div className="mt-2 px-1">
                    <Link to={`/${item.media_type || mediaType}/${item.id}`} className="block hover:text-red-500 transition-colors">
                        {/* Use dynamic key for title */}
                        <h3 className="text-sm font-bold truncate" title={item[itemKey] || item.name}>
                            {item[itemKey] || item.name}
                        </h3>
                    </Link>
                    <p className="text-xs text-gray-400 flex justify-between items-center mt-1">
                        {/* Use dynamic key for release date */}
                        <span>{item[releaseKey]?.split('-')[0] || (item.release_date || item.first_air_date)?.split('-')[0] || "N/A"}</span>
                        <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                            ★ {item?.vote_average?.toFixed(1)}
                        </span>
                    </p>
                </div>

            </div>
          ))}
        </div>

        {/* Right Arrow - Upgraded */}
        <div 
            onClick={() => slide('right')} 
            className="bg-white right-2 rounded-full absolute opacity-50 hover:opacity-100 cursor-pointer z-50 hidden group-hover:grid place-items-center w-10 h-10 text-black shadow-lg transition-all duration-300 hover:scale-110 top-1/2 -translate-y-1/2"
        >
            <FaChevronRight size={20} />
        </div>
      </div>
    </div>
  );
};

export default Row;