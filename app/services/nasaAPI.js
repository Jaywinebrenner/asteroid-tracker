import axios from 'axios';

export async function getNEOData(startDate, endDate) {
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${process.env.NEXT_PUBLIC_NASA_API_KEY}`;

  try {
    const response = await axios.get(url);
    console.log("API Response:", response.data); // Log API response
    return response.data;
  } catch (error) {
    console.error("Error fetching NEO data:", error);
    throw error;
  }
}
