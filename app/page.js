"use client";
import { useState, useEffect } from 'react';
import { getNEOData } from './services/nasaAPI';

export default function Home() {
  const [asteroids, setAsteroids] = useState([]);
  const [error, setError] = useState(null);
  const [loadedImages, setLoadedImages] = useState({}); // Track loaded images
  const [loadedCount, setLoadedCount] = useState(0); // Count loaded images
  const [showContent, setShowContent] = useState(false); // Control visibility of content
  const [hoveredAsteroid, setHoveredAsteroid] = useState(null); // Track which asteroid is hovered

  useEffect(() => {
    async function fetchAsteroids() {
      try {
        console.log("Fetching NEO data...");
        const data = await getNEOData('2024-08-22', '2024-08-29');
        console.log("Fetched NEO data:", data);

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
        console.error("Error fetching NEO data:", error);
        setError("Failed to fetch NEO data");
      }
    }

    fetchAsteroids();
  }, []);

  useEffect(() => {
    // Check if all images are loaded and then show content
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

  // Calculate the orbit distance based on index
  const getOrbitDistance = (index) => {
    const minDistance = 150; // Minimum distance from Earth
    const maxDistance = 400; // Maximum distance from Earth
    const range = maxDistance - minDistance;
    const step = range / (asteroids.length - 1);
    return minDistance + step * index;
  };

  // Calculate the orbit speed based on velocity
  const getOrbitSpeed = (velocity) => {
    // Normalize velocity to determine duration
    const maxVelocity = 100000; // Example maximum velocity
    const minDuration = 5; // Minimum duration of orbit in seconds
    const maxDuration = 30; // Maximum duration of orbit in seconds
    const duration = minDuration + (1 - (velocity / maxVelocity)) * (maxDuration - minDuration);
    return `${duration}s`; // Convert to seconds
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
        <p>These are the 5 closest asteroids to Planet Earth. See how close we are to oblivion!</p>

        <p className='minor'>*Data pulled in from NASA and updated daily</p>
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
                transform: `translate(-50%, -50%)`, // Center the wrapper
              }}
              onMouseEnter={() => setHoveredAsteroid(asteroid)} // Set hovered asteroid
              onMouseLeave={() => setHoveredAsteroid(null)} // Reset hovered asteroid
            >
              <img
                src={`/assets/a${index + 2}.png`}
                alt={`Asteroid ${index + 2}`}
                className='asteroid-image'
                style={{
                  animationDelay: `${index * 2}s`, // Stagger animation delay
                  '--orbit-distance': `${getOrbitDistance(index)}px`, // Set orbit distance
                  '--orbit-speed': getOrbitSpeed(asteroid.close_approach_data[0].relative_velocity.miles_per_hour), // Set orbit speed
                  display: loadedImages[index] ? 'block' : 'none', // Hide until loaded
                }}
                onLoad={() => handleImageLoad(index)}
              />
            </div>
          ))}
          {hoveredAsteroid && (
            <div className='asteroid-info'>
              <h3>ASTEROID NAME: {hoveredAsteroid.name}</h3>
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
