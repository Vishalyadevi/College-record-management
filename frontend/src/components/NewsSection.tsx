import React from 'react';
import Marquee from './Marquee';

const NewsSection = () => {
  const news = [
    {
      title: 'New Research Breakthrough',
      date: 'March 15, 2024',
      category: 'Research',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'Student Achievement Awards',
      date: 'March 14, 2024',
      category: 'Campus Life',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      title: 'International Conference 2024',
      date: 'March 13, 2024',
      category: 'Events',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Latest News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((item, index) => (
            <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300">
              <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="text-sm text-[#8C1515] font-semibold mb-2">{item.category}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
        <Marquee />
      </div>
    </div>
  );
};

export default NewsSection;
