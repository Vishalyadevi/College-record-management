import React, { useState, useEffect } from "react";

// Campus Life Data
const campusLifeData = [
  {
    title: "HOSTEL",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/HOSTEL500x600-r1ym3qm9ybig7m7vytr8f20ykw1fvj1znidyje77n4.webp",
  },
  {
    title: "Club",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/clubs1500x600-r25qgo5q7r82leoihkzn9o14i5t6eo9vihbzegdd9s.webp",
  },
  {
    title: "Sports",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/Sports500x600-r25qjhoapv31fal20svcqyewnrwthzgvwfsf8c6uls.webp",
  },
  {
    title: "Smart Class Room",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/10.-Smart-class-room500x600-r25zie6chz43svjthvmisz0f3yd4qsdcmnq99bf33k.webp",
  },
  {
    title: "Library",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/library1500x600-r1ylosyld32fqnwv6dcmstpashnhknrixl8814cei8.webp",
  },
  {
    title: "Fine Arts",
    imgSrc:
      "https://nec.edu.in/wp-content/uploads/elementor/thumbs/FineArts2500x600-r25qdxgoa5gyqcnvhwbthuxq4pbmyge24wu00efpf4.webp",
  },
  
];

const CampusLife: React.FC = () => {
  const [startIndex, setStartIndex] = useState(0);
  const total = campusLifeData.length;
  const itemsToShow = 4;

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prevIndex) => (prevIndex + 1) % total);
    }, 4000);
    return () => clearInterval(interval);
  }, [total]);

  const getVisibleItems = () => {
    const items = [];
    for (let i = 0; i < itemsToShow; i++) {
      items.push(campusLifeData[(startIndex + i) % total]);
    }
    return items;
  };

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-12">
      <h2 className="text-4xl font-bold text-center text-blue-900 mb-10">
        CAMPUS LIFE
      </h2>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-6 md:px-12">
        {getVisibleItems().map((item, index) => (
          <div
            key={index}
            className="overflow-hidden transform transition-transform duration-700 animate-zoomIn hover:scale-105"
          >
            <div className="h-85 w-full">
              <img
                src={item.imgSrc}
                alt={item.title}
                className="w-full h-full object-cover rounded-md shadow-md"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="text-xl font-semibold text-blue-700 italic">
                {item.title}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: total }).map((_, index) => (
          <button
            key={index}
            onClick={() => setStartIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              startIndex === index
                ? "bg-blue-600"
                : "bg-gray-400 hover:bg-blue-600"
            }`}
          ></button>
        ))}
      </div>
    </section>
  );
};

export default CampusLife;
