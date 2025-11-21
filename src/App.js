import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Routes, Route, Link } from 'react-router-dom';
import MovieDetail from './MovieDetail';
import Row from './Row'; 
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
      <Footer />
    </div>
  );
}

function Home() {
  const [movies, setMovies] = useState([]); 
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchKey, setSearchKey] = useState("");
  const [trailerKey, setTrailerKey] = useState(null);
  const [playing, setPlaying] = useState(false);

  const IMAGE_PATH = "https://image.tmdb.org/t/p/original";

  const requests = {
    requestPopular: `/movie/popular?language=en-US&page=1`,
    requestTopRated: `/movie/top_rated?language=en-US&page=1`,
    requestTrending: `/trending/movie/week?language=en-US`,
    requestHorror: `/discover/movie?with_genres=27`,
    requestAction: `/discover/movie?with_genres=28`,
    requestComedy: `/discover/movie?with_genres=35`,
  };

  const fetchHero = async () => {
    try {
        const apiKey = process.env.REACT_APP_TMDB_KEY;
        const { data } = await axios.get(`https://api.themoviedb.org/3${requests.requestPopular}&api_key=${apiKey}`);
        const randomHero = data.results[Math.floor(Math.random() * data.results.length)];
        console.log("Hero Movie Found:", randomHero.title); // 👈 Check Console if this prints!
        setHeroMovie(randomHero);
        fetchTrailer(randomHero.id);
    } catch (error) {
        console.error("Error fetching hero:", error);
    }
  };

  const fetchSearch = async () => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    const { data } = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
        params: { api_key: apiKey, query: searchKey }
    });
    setMovies(data.results);
  };

  const fetchTrailer = async (id) => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${id}/videos`, {
        params: { api_key: apiKey }
    });
    const trailer = data.results.find(vid => vid.name.includes("Official Trailer") || vid.type === "Trailer");
    if (trailer) setTrailerKey(trailer.key);
  };

  useEffect(() => {
    fetchHero();
    // eslint-disable-next-line
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if(searchKey) fetchSearch();
  };

  return (
    <div className="home-container bg-black min-h-screen"> 
      
      {/* HEADER */}
      <header className={`header ${heroMovie ? 'transparent' : 'solid'}`}>
        <div className="logo" onClick={() => window.location.reload()}>MOVIE<span className="verse">VERSE</span></div>
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text"
            placeholder="Search movies..."
            onChange={(e) => setSearchKey(e.target.value)}
            autoComplete="off"
          />
          <button type="submit">🔍</button>
        </form>
      </header>

      {searchKey ? (
         <div className="content-container pt-32">
            <h2 className="text-white text-2xl font-bold mb-4 px-8">Results for "{searchKey}"</h2>
            <div className="movie-grid">
                {movies.map((movie) => (
                <Link to={`/movie/${movie.id}`} key={movie.id}>
                    <div className="movie-card relative hover:scale-105 duration-300">
                        <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "placeholder.jpg"} alt={movie.title} className="rounded-md"/>
                    </div>
                </Link>
                ))}
            </div>
         </div>
      ) : (
        <>
            {/* HERO */}
            {heroMovie && (
                <div className="hero-container relative h-[85vh] w-full">
                    
                    {/* BACKGROUND IMAGE (Z-0) */}
                    <div 
                        className="hero-background absolute top-0 left-0 w-full h-full bg-cover bg-center z-0" 
                        style={{ backgroundImage: `url(${IMAGE_PATH}${heroMovie.backdrop_path})` }}
                    >
                        {/* Dark Overlay so text pops */}
                        <div className="w-full h-full bg-black/40" />
                    </div>
                    
                    {/* CONTENT (Z-10) */}
                    <div className="hero-content absolute top-[30%] left-10 md:left-20 text-white z-10">
                        <h1 className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-lg">{heroMovie.title}</h1>
                        <p className="max-w-[600px] text-gray-200 text-lg mb-8 drop-shadow-md">{heroMovie.overview?.slice(0,150)}...</p>
                        <div className="hero-buttons flex gap-4">
                            {trailerKey && (
                                <button 
                                    className="bg-white text-black py-3 px-8 rounded font-bold hover:bg-gray-200 flex items-center gap-2"
                                    onClick={() => setPlaying(true)}
                                >
                                    ▶ Play
                                </button>
                            )}
                            <Link to={`/movie/${heroMovie.id}`} className="bg-gray-500/70 text-white py-3 px-8 rounded font-bold hover:bg-gray-500/50">
                                ℹ More Info
                            </Link>
                        </div>
                    </div>
                    
                    {/* FADE BOTTOM */}
                    <div className="absolute bottom-0 w-full h-[7.4rem] bg-gradient-to-t from-black to-transparent z-10" />
                </div>
            )}

            {/* ROWS */}
            <div className="-mt-32 relative z-20 pl-4 md:pl-10 pb-20">
                <Row title="Trending Now" fetchURL={requests.requestTrending} />
                <Row title="Top Rated" fetchURL={requests.requestTopRated} />
                <Row title="Action Thrillers" fetchURL={requests.requestAction} />
                <Row title="Comedy Movies" fetchURL={requests.requestComedy} />
                <Row title="Horror Movies" fetchURL={requests.requestHorror} />
            </div>
        </>
      )}

      {/* VIDEO PLAYER */}
      {playing && trailerKey && (
        <div className="video-modal-overlay fixed inset-0 bg-black/90 z-50 flex justify-center items-center" onClick={() => setPlaying(false)}>
            <div className="w-full max-w-4xl aspect-video relative bg-black">
                <iframe 
                    width="100%" height="100%" 
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} 
                    title="Trailer" frameBorder="0" allowFullScreen
                ></iframe>
                <button className="absolute -top-10 right-0 text-white hover:text-red-500" onClick={() => setPlaying(false)}>Close X</button>
            </div>
        </div>
      )}
    </div>
  );
}

function Footer() {
    return <footer className="text-center text-gray-500 py-10 bg-[#111]">MovieVerse &copy; 2025</footer>
}

export default App;