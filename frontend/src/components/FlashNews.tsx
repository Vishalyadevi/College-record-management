import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'; // icons
import './FlashNews.css';

const FlashNewsBar: React.FC = () => {
  const newsItems = [
    {
      title: 'DST iTBI, NEC supported by NIDHI',
      link: 'https://nidhi.dst.gov.in/',
    },
    {
      title: 'DST-iTBI Tender (15-02-2025)',
      link: 'https://nec.edu.in/wp-content/uploads/2025/02/Tender-Document-K-R-Innovation-Centre-fourth-Call-14-2-2025.pdf',
    },
    {
      title: '41 Annual Day',
      link: 'https://nec.edu.in',
    },
  ];

  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setPaused(!paused);
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += direction === 'left' ? -200 : 200;
    }
  };

  return (
    <div className="mt-4 w-full px-4 md:px-8">
  <div className="bg-[#000080] text-white px-6 py-1 shadow-md rounded-md">
      <div className="flex items-center">
        <div className="bg-[#000080] font-bold px-4 py-1 whitespace-nowrap">Flash News</div>

        <div className="bg-white text-blue-800 px-4 py-1 flex-1 border border-blue-900 overflow-hidden relative">
          <div
            ref={scrollRef}
            className={`flex whitespace-nowrap gap-12 transition-all duration-300 overflow-x-auto scroll-smooth ${paused ? '' : 'marquee'}`}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {newsItems.map((item, index) => (
              <a
                key={index}
                href={item.link}
                className="inline-block hover:underline font-medium text-blue-800"
                
                rel="noopener noreferrer"
              >
                {item.title}
                <img
                  src="https://nec.edu.in/wp-content/uploads/2025/04/newimg.png"
                  height="16"
                  width="46"
                  alt="new"
                  className="inline ml-2"
                />
              </a>
            ))}
          </div>
        </div>

        {/* Navigation Buttons with Icons */}
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => handleScroll('left')}
            className="bg-[#000080] hover:bg-blue-900 text-white p-2 rounded"
            title="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleToggle}
            className="bg-[#000080] hover:bg-blue-900 text-white p-2 rounded"
            title={paused ? 'Play' : 'Pause'}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="bg-[#000080] hover:bg-blue-900 text-white p-2 rounded"
            title="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default FlashNewsBar;
