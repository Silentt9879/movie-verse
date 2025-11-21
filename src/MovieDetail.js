import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Hooks to get the Movie ID
import axios from 'axios';
import './App.css';

function MovieDetail() {
  const { id } = useParams(); // Grabs the ID from the URL (e.g., /movie/123)
  const [movie, setMovie] = useState(null);

  const IMAGE_PATH = "https://image.tmdb.org/t/p/original"; // High Quality Image

  useEffect(() => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    // Fetch specific movie details
    axios.get(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=en-US`)
      .then((response) => setMovie(response.data))
      .catch((error) => console.error("Error:", error));
  }, [id]);

  if (!movie) return <h2 style={{textAlign: 'center', marginTop: '50px'}}>Loading...</h2>;

  return (
    <div className="movie-detail-container" 
         style={{ backgroundImage: `url(${IMAGE_PATH}${movie.backdrop_path})` }}>
      
      <div className="overlay">
        <Link to="/" className="back-button">← Back to Home</Link>
        
        <div className="detail-content">
          <img 
            src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ""} 
            alt={movie.title} 
            className="detail-poster"
          />
          
          <div className="detail-text">
            <h1>{movie.title}</h1>
            <p className="tagline">{movie.tagline}</p>
            
            <div className="stats">
              <span>📅 {movie.release_date}</span>
              <span>⭐ {movie.vote_average.toFixed(1)} / 10</span>
              <span>⏱️ {movie.runtime} min</span>
            </div>

            <h3>Overview</h3>
            <p className="overview">{movie.overview}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;