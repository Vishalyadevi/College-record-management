import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

// Image and name data
const images = [
  "https://nec.edu.in/wp-content/uploads/2025/02/founder510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Correspondent510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Director510x480.webp",
  "https://nec.edu.in/wp-content/uploads/2025/02/Principal-510x480-1-768x722.webp",
];

const names = [
  { name: "Thiru. K. Ramasamy", title: "FOUNDER" },
  { name: "Thiru. K.R. Arunachalam", title: "CORRESPONDENT" },
  { name: "Dr. S. Shanmugavel", title: "DIRECTOR" },
  { name: "Dr. K. Kalidasa Murugavel", title: "PRINCIPAL" },
];

const OrangeTickIcon = () => (
  <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center mt-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
    </svg>
  </div>
);

const VisionMissionSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-between px-8 py-12 gap-10 font-[Poppins] bg-gradient-to-br from-white via-blue-100 to-blue-120">
      {/* Left: Vision & Mission from Top */}
      <motion.div
        className="md:w-1/2 space-y-6"
        initial={{ opacity: 0, y: -80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        viewport={{ once: false, amount: 0.4 }}
      >
        <h2 className="text-7xl lg:text-4xl font-bold text-blue-900 font-serif mb-4">Vision</h2>
        <p className="text-lg text-gray-700">
          Transforming lives through quality education and research with human values.
        </p>

        <h2 className="text-7xl lg:text-4xl font-bold text-blue-900 font-serif mb-4">Mission</h2>
        <ul className="space-y-4 text-gray-800 text-base">
          <li className="flex items-start gap-3">
            <OrangeTickIcon />
            <span>To maintain excellent infrastructure and highly qualified and dedicated faculty.</span>
          </li>
          <li className="flex items-start gap-3">
            <OrangeTickIcon />
            <span>To provide a conducive environment with an ambiance of humanity, wisdom, creativity, and team spirit.</span>
          </li>
          <li className="flex items-start gap-3">
            <OrangeTickIcon />
            <span>To promote the values of ethical behavior and commitment to the society.</span>
          </li>
          <li className="flex items-start gap-3">
            <OrangeTickIcon />
            <span>To partner with academic, industrial, and government entities to attain collaborative research.</span>
          </li>
        </ul>
      </motion.div>

      {/* Right: Carousel from Bottom */}
      <motion.div
        className="md:w-1/2 mt-10 md:mt-0 relative flex flex-col items-center"
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        viewport={{ once: false, amount: 0.4 }}
        
      >
        <div className="relative w-[450px] h-[450px] overflow-hidden rounded-lg shadow-xl">
          <img
            src={images[current]}
            alt="College Leadership"
            className="w-full h-full object-cover transition-all duration-700 ease-in-out"
          />

          <div className="absolute bottom-0 left-1/4 w-90px bg-[#0043d0] text-white text-center py-2">
            <div className="text-lg md:text-xl font-bold font-serif">{names[current].name}</div>
            <div className="text-sm md:text-base font-semibold tracking-wider">
              {names[current].title}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute top-1/2 left-3 transform -translate-y-1/2 p-2 rounded-full shadow hover:bg-gray-200"
          >
            <FaChevronLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 p-2 rounded-full shadow hover:bg-gray-200"
          >
            <FaChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VisionMissionSection;
