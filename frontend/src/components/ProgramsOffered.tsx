import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const images = [
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_UG.webp',
    label: 'UG',
  },
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_PG.webp',
    label: 'PG',
  },
  {
    src: 'https://nec.edu.in/wp-content/uploads/2025/02/NEC_Research.webp',
    label: 'Research',
  },
];

const AcademicsSection: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [countStarted, setCountStarted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  const { ref: programsRef, inView: programsInView } = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRotate, images.length]);

  const goToNext = () => {
    setAutoRotate(false); // Stop auto-rotation when user manually navigates
    setIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = () => {
    setAutoRotate(false); // Stop auto-rotation when user manually navigates
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Start counting when in view
  useEffect(() => {
    if (programsInView && !countStarted) {
      setCountStarted(true);
    }
  }, [programsInView, countStarted]);

  return (
    <section className="bg-gradient-to-r from-white via-sky-200 py-8 text-center">
      <h2 className="text-7xl lg:text-4xl font-bold text-blue-900 font-serif mb-4">
        ACADEMICS
      </h2>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6 py-16 text-left">
        {/* Programs Offered Text */}
        <div className="space-y-6">
          <h3 className="text-3xl lg:text-4xl font-bold text-blue-900 font-serif mb-4">
            Programs Offered
          </h3>
          <p className="text-lg leading-relaxed mb-8 font-serif">
            The college offers 7 undergraduate programmes and 5 postgraduate programmes covering Engineering and Technology.
            The National Board of Accreditation has accredited 5 programmes up to June 2023.
          </p>

          {/* CountUp Section */}
          <div ref={programsRef} className="flex flex-col items-center gap-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={programsInView ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
              className="text-center"
            >
              <p className="text-[80px] font-semibold  text-blue-900 leading-none">
                {countStarted && <CountUp end={7} duration={1.5} />}
              </p>
              <p className="text-xl text-gray-600 mt-2">UG Programmes</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={programsInView ? { scale: 1 } : { scale: 0 }}
              transition={{ 
                duration: 0.4, 
                type: 'spring', 
                stiffness: 100,
                delay: 1.5
              }}
              className="text-center"
            >
              <p className="text-[80px] font-semibold  text-blue-900 leading-none">
                {countStarted && <CountUp end={5} duration={1.5} delay={1.5} />}
              </p>
              <p className="text-xl text-gray-600 mt-2">PG Programmes</p>
            </motion.div>
          </div>
        </div>

        {/* Image Carousel Section */}
        <div className="w-[450px] h-[450px] mx-auto relative rounded-md shadow-md overflow-hidden group">
          <motion.img
            key={index}
            src={images[index].src}
            alt={images[index].label}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white text-4xl font-bold">{images[index].label}</h3>
            <button className="mt-4 px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full font-semibold">
              View More
            </button>
          </div>

          <button
            onClick={goToPrev}
            className="absolute top-1/2 left-3 transform -translate-y-1/2 p-2 rounded-full shadow hover:bg-gray-200"
          >
            <FaChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 p-2 rounded-full shadow hover:bg-gray-200"
          >
            <FaChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* New Statistics Section */}
      <div ref={statsRef} className="max-w-7xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8"
        >
          {[
            { value: 2200, label: "Students", suffix: "+" },
            { value: 170, label: "Faculty Members", suffix: "+" },
            { value: 10, label: "Industry Experts", suffix: "+" },
            { value: 200, label: "Ph.D Awarded", suffix: "+" },
            { value: 260, label: "Staff", suffix: "+" },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">
                {statsInView && (
                  <CountUp 
                    end={stat.value} 
                    duration={2} 
                    delay={index * 0.2}
                    suffix={stat.suffix}
                  />
                )}
              </p>
              <p className="text-lg text-gray-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AcademicsSection;