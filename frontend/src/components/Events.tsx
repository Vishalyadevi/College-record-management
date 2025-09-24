import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Import navigate hook
import EventCard from './EventCard';

const Events = () => {
  const navigate = useNavigate(); // ✅ Initialize navigate

  const events = [
    {
      date: '12',
      month: 'Apr',
      title: '41st Annual Day Celebrations',
      eventDate: '12/04/2025',
      imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/41stAnnualDayCelebrations-1024x1024.jpg',
    },
    {
      date: '07',
      month: 'Apr',
      title: '41st Annual Sports Day',
      eventDate: '07/04/2025',
      imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/04/IMG-20250407-WA0000-1024x1024.jpg',
    },
    {
      date: '25',
      month: 'Mar',
      title: 'Career Guidance Conclave',
      eventDate: '25/03/2025',
      imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/03/IMG-20250314-WA0119-1024x1024.jpg',
    },
    {
      date: '24',
      month: 'Mar',
      title: 'Two-days Faculty Development Program (FDP)',
      eventDate: '24/03/2025',
      imageUrl: 'https://nec.edu.in/wp-content/uploads/2025/03/WhatsApp-Image-2025-03-19-at-7.53.14-PM-1024x1024.jpeg',
    },
  ];

  return (
    <div className="min-h-screen px-4 py-10 bg-gradient-to-r from-white via-sky-100 to-white">
      <h2 className="text-1xl lg:text-5xl font-bold text-blue-900 font-serif mb-12 text-center">
        Events
      </h2>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => navigate("/all-events")} // ✅ This now works
          className="bg-blue-900 text-white px-5 py-2 rounded-lg hover:bg-blue-950 text-sm"
        >
          View More Events
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
  {events.map((event, index) => (
    <EventCard key={index} {...event} />
  ))}
</div>

    </div>
  );
};

export default Events;
