import React, { useRef, useState } from "react";

const ImageZoom = ({ src, zoom = 2, width = 400, height = 400, alt = "" }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  // Responsive zoom window size
  const getZoomWindowSize = () => {
    if (typeof window !== "undefined" && window.innerWidth < 900) {
      return { width: 250, height: 200 };
    } else if (typeof window !== "undefined" && window.innerWidth < 1200) {
      return { width: 350, height: 300 };
    } else {
      return { width: 500, height: 400 };
    }
  };

  const { width: zoomWindowWidth, height: zoomWindowHeight } = getZoomWindowSize();

  const bgX = ((mousePos.x / width) * 100);
  const bgY = ((mousePos.y / height) * 100);

  // Hide zoom on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width, height, display: "inline-block" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          border: "1px solid #eee",
        }}
      />
      {isHovering && !isMobile && (
        <div
          style={{
            position: "absolute",
            left: width + 20,
            top: 0,
            width: zoomWindowWidth,
            height: zoomWindowHeight,
            border: "1px solid #eee",
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${zoom * 100}% ${zoom * 100}%`,
            backgroundPosition: `${bgX}% ${bgY}%`,
            pointerEvents: "none",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            backgroundColor: "#fff"
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom; 