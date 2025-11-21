import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Routes, Route, Link } from 'react-router-dom';
import MovieDetail from './MovieDetail';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
      <Footer /> {/* 👈 Added Footer Here */}
    </div>
  );
}

function Home() {
  const [movies, setMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchKey, setSearchKey] = useState("");
  const [trailerKey, setTrailerKey] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null); // 👈 NEW: Track active genre

  const IMAGE_PATH = "https://image.tmdb.org/t/p/original";
  const POSTER_PATH = "https://image.tmdb.org/t/p/w500";

  // 👈 NEW: List of Genres with their TMDB IDs
  const genres = [
    { id: 28, name: "Action" },
    { id: 35, name: "Comedy" },
    { id: 27, name: "Horror" },
    { id: 18, name: "Drama" },
    { id: 878, name: "Sci-Fi" },
    { id: 16, name: "Animation" },
    { id: 53, name: "Thriller" },
    { id: 10749, name: "Romance" },
  ];

  const fetchMovies = async (searchTerm = "", genreId = null) => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;

    // 👈 UPDATED LOGIC: Handle Search, Genre, or Default (Popular)
    let type = "movie/popular";
    let params = { api_key: apiKey };

    if (searchTerm) {
      type = "search/movie";
      params.query = searchTerm;
    } else if (genreId) {
      type = "discover/movie";
      params.with_genres = genreId;
    }

    const { data } = await axios.get(`https://api.themoviedb.org/3/${type}`, { params });

    // If it's the initial load (no search, no genre), set the Hero
    if (!searchTerm && !genreId && data.results.length > 0) {
      const randomHero = data.results[Math.floor(Math.random() * 5)];
      setHeroMovie(randomHero);
      setMovies(data.results);
      fetchTrailer(randomHero.id);
    } else {
      // Don't change the hero if just filtering grid
      setMovies(data.results);
    }
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
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setHeroMovie(null); // Hide hero on search
    setSelectedGenre(null); // Reset genre
    fetchMovies(searchKey);
  };

  // 👈 NEW: Handle Genre Click
  const handleGenreClick = (genreId) => {
    setSearchKey(""); // Clear search
    setSelectedGenre(genreId); // Activate button
    setHeroMovie(null); // Hide hero to focus on grid
    fetchMovies("", genreId);
  };

  return (
    <div className="home-container">
      <header className={`header ${heroMovie ? 'transparent' : 'solid'}`}>
        <div className="logo" onClick={() => window.location.reload()}>MOVIE<span className="verse">VERSE</span></div>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Titles, people, genres"
            onChange={(e) => setSearchKey(e.target.value)}
            autoComplete="off"
            value={searchKey} // Controlled input
          />
          <button type="submit">🔍</button>
        </form>
      </header>

      {heroMovie && (
        <div className="hero-container">
          <div className="hero-background" style={{ backgroundImage: `url(${IMAGE_PATH}${heroMovie.backdrop_path})` }}></div>
          <div className="hero-content">
            <h1 className="hero-title">{heroMovie.title}</h1>
            <p className="hero-overview">{heroMovie.overview ? heroMovie.overview.substring(0, 150) + "..." : ""}</p>
            <div className="hero-buttons">
              {trailerKey && <button className="btn btn-play" onClick={() => setPlaying(true)}>▶ Watch Trailer</button>}
              <Link to={`/movie/${heroMovie.id}`} className="btn btn-more">ℹ More Info</Link>
            </div>
          </div>
          <div className="hero-fade-bottom"></div>
        </div>
      )}

      {playing && trailerKey && (
        <div className="video-modal-overlay" onClick={() => setPlaying(false)}>
          <div className="video-modal-content">
            <iframe
              width="100%" height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            ></iframe>
            <button className="close-video" onClick={() => setPlaying(false)}>Close X</button>
          </div>
        </div>
      )}

      <div className="content-container">

        {/* ⬇️ NEW: GENRE FILTER BUTTONS */}
        <div className="genre-container">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className={`genre-btn ${selectedGenre === genre.id ? 'active' : ''}`}
              onClick={() => handleGenreClick(genre.id)}
            >
              {genre.name}
            </button>
          ))}
        </div>

        <h2 className="section-title">
          {searchKey ? `Results for "${searchKey}"` : selectedGenre ? `Category: ${genres.find(g => g.id === selectedGenre)?.name}` : "Trending Now"}
        </h2>

        <div className="movie-grid">
          {movies.map((movie) => (
            <Link to={`/movie/${movie.id}`} key={movie.id}>
              <div className="movie-card">
                <img src={movie.poster_path ? `${POSTER_PATH}${movie.poster_path}` : "placeholder.jpg"} alt={movie.title} />
                <div className="movie-overlay">
                  <h3>{movie.title}</h3>
                  <span className="rating">⭐ {movie.vote_average.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ⬇️ NEW FOOTER COMPONENT
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>MOVIE<span className="verse">VERSE</span></h3>
          <p>The best place to discover your next favorite movie.</p>
        </div>
        <div className="footer-links">
          <h4>Explore</h4>
          <Link to="/">Home</Link> {/* Use Link instead of <a> for internal pages */}
          <a href="#!">Trending</a>
          <a href="#!">Top Rated</a>
        </div>
        <div className="footer-social">
          <h4>Connect</h4>
          {/* For external links, just ensure they are real URLs or use #! */}
          <a href="https://github.com/Silentt9879" target="_blank" rel="noreferrer">GitHub</a>
          <a href="#!">Twitter</a>
          <a href="#!">Instagram</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 MovieVerse. All rights reserved.</p>
        <p>Powered by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" style={{ color: '#01b4e4' }}>TMDB</a></p>
      </div>
    </footer>
  );
}

export default App;