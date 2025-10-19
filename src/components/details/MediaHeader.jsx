import React from 'react';

const MediaHeader = ({ backdropPath, title, onImageError, children }) => {
  return (
    <div className="relative w-full min-h-screen mt-0 overflow-visible" style={{ minHeight: '100svh' }}>
      <img
        src={backdropPath}
        alt={`${title} backdrop`}
        className="hidden md:block w-full h-full object-cover object-center"
        onError={onImageError}
      />
      {children && (
        <>
          <div className="hidden md:block">
            <div className="container mx-auto px-4 md:px-8 lg:px-12 relative md:-mt-[380px] lg:-mt-[520px] xl:-mt-[580px] 2xl:-mt-[640px] pb-1">
              {children}
            </div>
          </div>
          <div className="block md:hidden">
            <div className="container mx-auto px-4">
              <div className="mt-16">
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaHeader;