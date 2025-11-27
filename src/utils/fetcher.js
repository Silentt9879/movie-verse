import axios from 'axios';

// Generic fetcher function for SWR
// The URL should be relative (e.g., /trending/movie/week)
const fetcher = async (url) => {
    const apiKey = process.env.REACT_APP_TMDB_KEY;
    const baseUrl = "https://api.themoviedb.org/3";
    
    // Check if the URL already has parameters (like for discover endpoint)
    const connector = url.includes('?') ? '&' : '?';

    try {
        const response = await axios.get(`${baseUrl}${url}${connector}api_key=${apiKey}`);
        // Only return the data payload
        return response.data;
    } catch (error) {
        console.error("SWR Fetcher Error:", error);
        // Throw an error so SWR knows the request failed
        throw new Error("Failed to fetch data from TMDB API.");
    }
};

export default fetcher;