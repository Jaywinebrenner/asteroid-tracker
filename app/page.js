"use client";
import { useState, useEffect } from 'react';
import { getNEOData } from './services/nasaAPI';

export default function Home() {
  const [asteroids, setAsteroids] = useState([]);
  const [error, setError] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const [loadedCount, setLoadedCount] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [hoveredAsteroid, setHoveredAsteroid] = useState(null);

  useEffect(() => {
    async function fetchAsteroids() {
      try {
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        
        const oneWeekLater = new Date(today);
        oneWeekLater.setDate(today.getDate() + 7);
        const endDate = oneWeekLater.toISOString().split('T')[0];
        
        const data = await getNEOData(startDate, endDate);

        if (data && data.near_earth_objects) {
          const allAsteroids = [];
          Object.keys(data.near_earth_objects).forEach(date => {
            allAsteroids.push(...data.near_earth_objects[date]);
          });

          const sortedAsteroids = allAsteroids.sort((a, b) => {
            const distanceA = parseFloat(a.close_approach_data[0].miss_distance.miles);
            const distanceB = parseFloat(b.close_approach_data[0].miss_distance.miles);
            return distanceA - distanceB;
          });

          const top5Asteroids = sortedAsteroids.slice(0, 5);
          
          setAsteroids(top5Asteroids);
        } else {
          console.warn("No 'near_earth_objects' found in data:", data);
        }
      } catch (error) {
        setError("Failed to fetch NEO data");
      }
    }

    fetchAsteroids();
  }, []);

  useEffect(() => {
    if (loadedCount === asteroids.length) {
      setShowContent(true);
    }
  }, [loadedCount, asteroids.length]);

  const kmToMiles = (km) => km * 0.621371;
  const kmToFeet = (km) => km * 3280.84;

  const roundUpDistance = (distance) => Math.ceil(parseFloat(distance));
  const roundUpVelocity = (velocity) => Math.ceil(parseFloat(velocity));

  const formatNumberWithCommas = (number) => {
    return number.toLocaleString();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const removeParentheses = (name) => {
    return name.replace(/[()]/g, ""); // Removes both opening and closing parentheses
  };

  const getOrbitDistance = (index) => {
    const minDistance = 150;
    const maxDistance = 400;
    const range = maxDistance - minDistance;
    const step = range / (asteroids.length - 1);
    return minDistance + step * index;
  };

  const getOrbitSpeed = (velocity) => {
    const maxVelocity = 100000;
    const minDuration = 5;
    const maxDuration = 30;
    const duration = minDuration + (1 - (velocity / maxVelocity)) * (maxDuration - minDuration);
    return `${duration}s`;
  };

  const handleImageLoad = (index) => {
    setLoadedImages(prevState => {
      const newState = { ...prevState, [index]: true };
      setLoadedCount(prevCount => prevCount + 1);
      return newState;
    });
  };

  return (
    <div className='home'>
      <div className='site-info-wrapper'>
        <h1>Asteroid Tracker</h1>
        <p>These are the 5 closest asteroids to Planet Earth. See how close we are to interstellar annihilation!</p>
        <p className='minor'>*Data pulled in from the NASA API and updated weekly</p>
      </div>
      {!showContent && (
        <div className='loading-message'>Load Asteroids...</div>
      )}
      {showContent && (
        <>
          <img src='/assets/earth.png' alt='Earth' className='earth-image' />
          {asteroids.map((asteroid, index) => (
            <div
              key={index}
              className='asteroid-wrapper'
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%)`,
              }}
              onMouseEnter={() => setHoveredAsteroid(asteroid)}
              onMouseLeave={() => setHoveredAsteroid(null)}
            >
              <img
                src={`/assets/a${index + 2}.png`}
                alt={`Asteroid ${index + 2}`}
                className='asteroid-image'
                style={{
                  animationDelay: `${index * 2}s`,
                  '--orbit-distance': `${getOrbitDistance(index)}px`,
                  '--orbit-speed': getOrbitSpeed(asteroid.close_approach_data[0].relative_velocity.miles_per_hour),
                  display: loadedImages[index] ? 'block' : 'none',
                }}
                onLoad={() => handleImageLoad(index)}
              />
            </div>
          ))}
          {hoveredAsteroid && (
            <div className='asteroid-info'>
              <h3>ASTEROID NAME: {removeParentheses(hoveredAsteroid.name)}</h3>
              <p>Date of Closest Approach: {formatDate(hoveredAsteroid.close_approach_data[0].close_approach_date)}</p>
              <p>Miss Distance: {formatNumberWithCommas(roundUpDistance(hoveredAsteroid.close_approach_data[0].miss_distance.miles))} miles</p>
              <p>Velocity: {formatNumberWithCommas(roundUpVelocity(hoveredAsteroid.close_approach_data[0].relative_velocity.miles_per_hour))} miles/h</p>
              <p>Estimated Diameter: {formatNumberWithCommas(kmToFeet(hoveredAsteroid.estimated_diameter.meters.estimated_diameter_max))} ft</p>
            </div>
          )}
        </>
      )}
      {error && <p>{error}</p>}
      {asteroids.length === 0 && !error && !showContent && <p>Loading...</p>}
    </div>
  );
}
