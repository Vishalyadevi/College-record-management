import React, { useState, useEffect, useRef } from 'react';
import './image-slider.css';

const ImageSlider: React.FC = () => {
  const images: { src: string; showButtons?: boolean }[] = [
    { src: '/images/11.jpg' },
    { src: '/images/12.jpg',showButtons: true },
    { src: '/images/13.jpg', showButtons: true },
    { src: '/images/4.jpg', showButtons: true },
    { src: '/images/5.jpg', showButtons: true },
    { src: '/images/6.jpg', showButtons: true },
  ];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  const handleVideoEnded = () => {
    setShowSlider(true);
    setCurrentIndex(0);
  };

  const startVideo = () => {
    setShowSlider(false);
    setCurrentIndex(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const nextSlide = () => {
    setAnimate(false);
    setTimeout(() => {
      if (!showSlider) {
        setShowSlider(true);
        setCurrentIndex(0);
      } else if (currentIndex === images.length - 1) {
        startVideo();
      } else {
        setCurrentIndex(currentIndex + 1);
      }
      setAnimate(true);
    }, 10);
  };

  const prevSlide = () => {
    setAnimate(false);
    setTimeout(() => {
      if (!showSlider) return;

      if (currentIndex === 0) {
        startVideo();
      } else {
        setCurrentIndex(currentIndex - 1);
      }
      setAnimate(true);
    }, 10);
  };

  useEffect(() => {
    if (showSlider && currentIndex !== images.length - 1) {
      const interval = setInterval(nextSlide, 25000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, showSlider]);

  const handleDotClick = (index: number) => {
    if (index === 0) {
      startVideo();
    } else {
      setShowSlider(true);
      setCurrentIndex(index - 1);
    }
  };

  return (
    <div className="slider">
      {/* 🔹 Video */}
      {!showSlider && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          className="background-video"
        >
          <source
            src="https://nec.edu.in/wp-content/uploads/2024/11/Nec-Campus-2024-NATIONAL-ENGINEERING-COLLEGE-KOVILPATTI-720p-h264-youtube.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      )}

      {/* 🔹 Image */}
      {showSlider && (
        <div className={`slide ${animate ? 'animate-slide' : ''}`}>
          <img
            src={images[currentIndex].src}
            alt="slider"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />

          {/* 🔹 Placement Buttons */}
          {images[currentIndex].showButtons && (
            <div className="placement-button-row">
              <button className="placement-button">Placement Details 2024-25</button>
              <button className="placement-button">Placement Details 2023-24</button>
              <button className="placement-button">Placement Details 2022-23</button>
              <button className="placement-button">Placement Details 2021-22</button>
            </div>
          )}
        </div>
      )}

      {/* 🔹 Arrows */}
      {showSlider && (
        <button className="left-arrow" onClick={prevSlide}>
          ❰
        </button>
      )}
      {(!showSlider || currentIndex !== images.length - 1) && (
        <button className="right-arrow" onClick={nextSlide}>
          ❱
        </button>
      )}

      {/* 🔹 Dots */}
      <div className="dots-container">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const isActive =
            (!showSlider && i === 0) || (showSlider && currentIndex === i - 1);
          return (
            <div
              key={i}
              className={`dot ${isActive ? 'active-dot' : ''}`}
              onClick={() => handleDotClick(i)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ImageSlider;
