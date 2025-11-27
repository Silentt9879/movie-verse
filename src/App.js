import React, { useState, useEffect } from 'react'; 
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// 👇 FIX: Use local import paths (./) since these files are likely in the same root src/ directory as App.js
import MovieDetail from './pages/MovieDetail'; 
import TvShowDetail from './pages/TvShowDetail'; 

import Home from './pages/Home';
import Watchlist from './Watchlist';
import PersonDetail from './PersonDetail';
import Login from './pages/Login'; 
import Register from './pages/Register';
import ProfileScreen from './pages/ProfileScreen';
import MyReviews from './pages/MyReviews';

import MobileNav from './components/MobileNav';
import BackToTop from './components/BackToTop';
import LoadingBar from './components/LoadingBar';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- FIREBASE AUTH IMPORTS ---
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; 
// -----------------------------

// Define Global Context to share states across the application
export const GlobalContext = React.createContext(); 
export const AuthContext = React.createContext(); 

function App() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [mediaType, setMediaType] = useState('movie'); 
  
  // --- AUTH STATES ---
  const [user, setUser] = useState(null); 
  const [authInitialized, setAuthInitialized] = useState(false); 
  
  // --- 1. SETUP AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
            setUser(currentUser); 
        } else {
            setUser(null);
        }
        setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  // Helper functions 
  const getFavoriteGenre = (currentMediaType) => { 
      return { favoriteGenreId: null, favoriteGenreName: "" }; 
  };

  function Footer() {
    return (
        <footer className="text-center text-gray-500 py-10 pb-24 md:pb-10" style={{backgroundColor: 'var(--color-card-bg)'}}>
            <p>MovieVerse &copy; 2025</p>
        </footer>
    );
  }

  return (
    <AuthContext.Provider value={{ user, auth, authInitialized }}> 
    <GlobalContext.Provider value={{ isLoading, setIsLoading, mediaType, setMediaType, getFavoriteGenre }}> 
      <div className="app-container">
        
        <LoadingBar isLoading={isLoading} /> 
        
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            {/* These paths assume MovieDetail.js and TvShowDetail.js are at the root of src/ */}
            <Route path="/movie/:id" element={<MovieDetail />} /> 
            <Route path="/tv/:id" element={<TvShowDetail />} /> 
            
            <Route path="/mylist" element={<Watchlist />} />
            <Route path="/person/:id" element={<PersonDetail />} />
            <Route path="/login" element={<Login />} /> 
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<ProfileScreen />} /> 
            <Route path="/myreviews" element={<MyReviews />} />

            <Route path="*" element={
              <div className="h-screen flex flex-col items-center justify-center text-white bg-black">
                <h1 className="text-9xl font-bold text-red-600">404</h1>
                <p className="text-2xl mt-4">Page Not Found</p>
                <Link to="/" className="mt-8 px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">
                  Go Home
                </Link>
              </div>
            } />
          </Routes>
        </AnimatePresence>
        
        <MobileNav />
        <BackToTop />
        <Footer />

        <ToastContainer 
          position="bottom-right" 
          autoClose={3000} 
          hideProgressBar={false} 
          newestOnTop={false} 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
          theme={"dark"}
        />
      </div>
    </GlobalContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;