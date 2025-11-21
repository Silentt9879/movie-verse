import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

const Row = ({ title, fetchURL }) => {
  const [movies, setMovies] = useState([]);
  const [like, setLike] = useState(false);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    const base_url = "https://api.themoviedb.org/3";
    
    async function fetchData() {
      const request = await axios.get(`${base_url}${fetchURL}&api_key=${apiKey}`);
      setMovies(request.data.results);
      return request;
    }
    fetchData();
  }, [fetchURL]);

  const slide = (direction) => {
    var slider = document.getElementById('slider' + title);
    slider.scrollLeft = slider.scrollLeft + (direction === 'left' ? -500 : 500);
  };

  return (
    <div className="text-white p-4">
      <h2 className="text-2xl font-bold md:text-3xl p-4">{title}</h2>
      
      <div className="relative flex items-center group">
        {/* Left Arrow */}
        <div 
            onClick={() => slide('left')}
            className="bg-white left-0 rounded-full absolute opacity-50 hover:opacity-100 cursor-pointer z-10 hidden group-hover:block p-2 text-black"
        >
            ◀
        </div>

        {/* THE SLIDER CONTAINER */}
        <div 
            id={'slider' + title} 
            className="w-full h-full overflow-x-scroll whitespace-nowrap scroll-smooth scrollbar-hide relative"
        >
          {movies.map((item) => (
            <Link to={`/movie/${item.id}`} key={item.id} className="inline-block relative p-2 cursor-pointer hover:scale-105 ease-in-out duration-300">
                {/* FORCE IMAGE SIZE */}
                <div className="w-[160px] sm:w-[200px] md:w-[240px] inline-block relative">
                    <img
                    className="w-full h-auto block rounded-lg"
                    src={`https://image.tmdb.org/t/p/w500/${item?.poster_path}`}
                    alt={item?.title}
                    />
                    
                    {/* HOVER OVERLAY */}
                    <div className="absolute top-0 left-0 w-full h-full hover:bg-black/80 opacity-0 hover:opacity-100 text-white transition-opacity duration-300">
                        <p className="white-space-normal text-xs md:text-sm font-bold flex justify-center items-center h-full text-center">
                            {item?.title}
                        </p>
                        <p onClick={() => setLike(!like)} className="absolute top-4 left-4 text-gray-300">
                            {like ? <FaHeart className="text-red-500"/> : <FaRegHeart />}
                        </p>
                    </div>
                </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        <div 
            onClick={() => slide('right')}
            className="bg-white right-0 rounded-full absolute opacity-50 hover:opacity-100 cursor-pointer z-10 hidden group-hover:block p-2 text-black"
        >
            ▶
        </div>
      </div>
    </div>
  );
};

export default Row;