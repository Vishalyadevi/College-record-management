import React from 'react';
import { Calendar } from 'lucide-react';

interface EventCardProps {
  date: string;
  month: string;
  title: string;
  eventDate: string;
  imageUrl: string;
}

const EventCard: React.FC<EventCardProps> = ({ date, month, title, eventDate, imageUrl }) => {
  return (
    
    <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-xl shadow-md w-[350px] h-auto overflow-hidden text-white flex flex-col items-center p-4 text-center ">
{/* Events badge */}
   
      <div className="bg-blue-600 text-white text-sm px-4 py-1 rounded-md mb-6 self-start">
        Events
      </div>
   

      {/* Event image */}
      <div className="relative w-35 h-55 mb-6 rounded-0lg overflow-hidden group">
  <img 
    src={imageUrl} 
    alt={title} 
    className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 group-hover:rotate-3"
  />

        {/* Date badge */}
        {/* Date badge (styled like Elementor/NEC) */}
 <div className="absolute -left-4 top-4 z-10">
    <div className="relative bg-pink-600 text-white w-14 h-14 flex flex-col items-center justify-center font-bold text-sm shadow-md">
      <span className="text-xl leading-none">{date}</span>
      <span className="text-xs">{month}</span>

      {/* Triangle Tail */}
      <div className="absolute -top-2 left-0 w-0 h-0 border-l-[12px] border-l-transparent border-b-[12px] border-b-pink-800"></div>
    </div>
  </div>

      </div>

      {/* Event title */}
      <h3 className="text-1.5xl font-bold mb-4 px-4">{title}</h3>

      {/* Event date */}
      <div className="flex items-center justify-center text-sm text-gray-300 mb-6">
        <Calendar className="w-4 h-4 mr-2" />
        <span>{eventDate}</span>
      </div>

      {/* Learn more button */}
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition">
        Learn more
      </button>
    </div>
  );
};

export default EventCard;