import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const WhyNEC = () => {
  const videoRef = useRef(null);
  const textRef = useRef(null);
  const isVideoInView = useInView(videoRef, { threshold: 0.3 });
  const isTextInView = useInView(textRef, { threshold: 0.3 });

  return (
    <section className="w-full bg-gradient-to-r from-white via-sky-100 to-white py-10 px-6 lg:px-16 font-sans">
      <div className="flex flex-col lg:flex-row items-stretch gap-12">
        {/* Left: Video */}
        <motion.div
          ref={videoRef}
          className="w-full lg:w-1/2 h-[410px]"
          animate={isVideoInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
          transition={{ duration: 1 }}
        >
          <video
            className="w-full h-full object-cover rounded-0xl shadow-0xl"
            controls
            controlsList="nodownload"
            preload="auto"
            playsInline
            poster="/fallback.jpg"
          >
            <source
              src="https://nec.edu.in/wp-content/uploads/2025/04/WhatsApp-Video-2023-08-28-at-2.28.24-PM.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </motion.div>

        {/* Right: Text */}
        <motion.div
          ref={textRef}
          className="w-full lg:w-1/2 h-[400px] flex flex-col justify-center text-gray-800"
          animate={isTextInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-7xl lg:text-4xl font-bold text-blue-900 font-serif mb-4">
            WHY NEC ?
          </h2>
          <p className="text-10xl text-justify text-base leading-relaxed overflow-y-auto pr-2">
            National Engineering College (NEC), established in 1984 and accredited by the NBA,
            offers seven undergraduate, five postgraduate, and numerous Ph.D. research programs.
            The college boasts centers of excellence and state-of-the-art laboratories for all
            engineering branches. NEC collaborates with research organizations and industries
            through MoUs to drive technological advancements, enhance student training, update
            curricula, and establish advanced research centers.
            Strong ties with leading industries and IT firms provide students with invaluable
            training and project opportunities. NEC’s robust academic environment ensures
            excellent campus placement prospects for both UG and PG students.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyNEC;
