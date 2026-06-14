import React from 'react';
import type { SeatGroup } from '../../utils/seatRecommendations';
import './RecommendedSeatsBanner.css';

interface RecommendedSeatsBannerProps {
  recommendations: SeatGroup[];
  desiredSeatCount: number;
  onSelectRecommendation?: (group: SeatGroup) => void;
  onDismiss?: () => void;
}

/**
 * RecommendedSeatsBanner Component
 * 
 * Displays a lightweight banner suggesting optimal seat arrangements
 * based on contiguity, price, and proximity scoring.
 * 
 * Features:
 * - Shows top recommendation with quick info
 * - Expandable to see all recommendations
 * - Non-intrusive design
 * - Dismissible
 */
export const RecommendedSeatsBanner: React.FC<RecommendedSeatsBannerProps> = ({
  recommendations,
  desiredSeatCount,
  onSelectRecommendation,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (recommendations.length === 0) return null;

  const topRecommendation = recommendations[0];
  const hasMultiple = recommendations.length > 1;

  const getQualityLabel = (score: number): { text: string; color: string } => {
    if (score >= 0.8) return { text: 'Excellent', color: 'green' };
    if (score >= 0.6) return { text: 'Good', color: 'blue' };
    if (score >= 0.4) return { text: 'Fair', color: 'orange' };
    return { text: 'Available', color: 'gray' };
  };

  const renderRecommendation = (group: SeatGroup, rank: number) => {
    const quality = getQualityLabel(group.score);
    const seatNumbers = group.seats.map(s => s.seatNumber);
    const priceRange = group.seats.length > 1
      ? `$${Math.min(...group.seats.map(s => s.price)).toFixed(2)} - $${Math.max(...group.seats.map(s => s.price)).toFixed(2)}`
      : `$${group.averagePrice.toFixed(2)}`;

    return (
      <div key={rank} className="recommendation-item">
        <div className="recommendation-header">
          <span className={`quality-badge quality-${quality.color}`}>
            {rank === 1 && '⭐ '}
            {quality.text}
          </span>
          <span className="recommendation-score">
            {Math.round(group.score * 100)}% match
          </span>
        </div>
        
        <div className="recommendation-details">
          <div className="detail-row">
            <span className="detail-label">Section:</span>
            <span className="detail-value">{group.section}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Seats:</span>
            <span className="detail-value seat-list">
              {seatNumbers.join(', ')}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Price:</span>
            <span className="detail-value">{priceRange}</span>
          </div>
          
          {group.isContiguous && (
            <div className="feature-badge">
              <span className="badge-icon">🎯</span>
              All seats together
            </div>
          )}
        </div>
        
        {onSelectRecommendation && (
          <button
            className="btn-view-seats"
            onClick={() => onSelectRecommendation(group)}
          >
            View These Seats
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="recommended-seats-banner">
      <div className="banner-header">
        <div className="banner-title">
          <span className="title-icon">✨</span>
          <h3>Best available seats for your group</h3>
        </div>
        {onDismiss && (
          <button
            className="btn-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss recommendations"
          >
            ×
          </button>
        )}
      </div>

      <div className="banner-content">
        {!isExpanded ? (
          // Collapsed view - show only top recommendation
          <div className="collapsed-view">
            <div className="quick-info">
              <span className={`quality-badge quality-${getQualityLabel(topRecommendation.score).color}`}>
                ⭐ {getQualityLabel(topRecommendation.score).text}
              </span>
              <span className="section-name">{topRecommendation.section}</span>
              <span className="seat-count">
                {desiredSeatCount} {desiredSeatCount === 1 ? 'seat' : 'seats'}
              </span>
              {topRecommendation.isContiguous && (
                <span className="contiguous-badge">🎯 Together</span>
              )}
              <span className="price-info">
                ${topRecommendation.averagePrice.toFixed(2)}/seat
              </span>
            </div>
            
            {hasMultiple && (
              <button
                className="btn-show-more"
                onClick={() => setIsExpanded(true)}
              >
                {recommendations.length - 1} more option{recommendations.length > 2 ? 's' : ''}
              </button>
            )}
          </div>
        ) : (
          // Expanded view - show all recommendations
          <div className="expanded-view">
            <div className="recommendations-list">
              {recommendations.map((group, index) =>
                renderRecommendation(group, index + 1)
              )}
            </div>
            
            <button
              className="btn-show-less"
              onClick={() => setIsExpanded(false)}
            >
              Show less
            </button>
          </div>
        )}
      </div>

      <div className="banner-footer">
        <p className="recommendation-note">
          💡 Recommended based on seat proximity, price, and availability. 
          Seats highlighted in green on the map.
        </p>
      </div>
    </div>
  );
};
