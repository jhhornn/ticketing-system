import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { type Advertisement, AdvertisementsService } from '../services/advertisements';

interface AdBannerProps {
  ad: Advertisement;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ ad, className = '' }) => {
  useEffect(() => {
    // Track impression when ad is displayed
    AdvertisementsService.trackImpression(ad.id);
  }, [ad.id]);

  const handleClick = () => {
    // Track click when ad is clicked
    AdvertisementsService.trackClick(ad.id);
  };

  return (
    <a
      href={ad.targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`group relative block overflow-hidden rounded-2xl shadow-soft hover:shadow-hard transition-all duration-300 hover:-translate-y-1 ${className}`}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-xl md:text-2xl font-bold mb-2 truncate group-hover:text-blue-300 transition-colors">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-white/90 text-sm md:text-base line-clamp-2">
                {ad.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold group-hover:bg-white/30 transition-colors">
              <span className="text-sm">Learn More</span>
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Sponsored Badge */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
        Sponsored
      </div>
    </a>
  );
};
