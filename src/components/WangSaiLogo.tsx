import React from 'react';

interface WangSaiLogoProps {
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const WangSaiLogo: React.FC<WangSaiLogoProps> = ({
  customLogoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  // If a custom logo URL is provided and not empty
  if (customLogoUrl && customLogoUrl.trim() !== '') {
    return (
      <img
        src={customLogoUrl}
        alt="ตราสัญลักษณ์ องค์การบริหารส่วนตำบลวังซ้าย อำเภอวังเหนือ จังหวัดลำปาง"
        className={`${sizeMap[size]} object-contain rounded-full shadow-xs bg-white shrink-0 ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Official Seal of Wang Sai Sub-district Administrative Organization (อบต.วังซ้าย อ.วังเหนือ จ.ลำปาง)
  // Faithfully matching the uploaded official seal emblem
  return (
    <div
      className={`${sizeMap[size]} relative flex items-center justify-center shrink-0 rounded-full bg-white shadow-md p-0.5 border border-slate-200 overflow-hidden ${className}`}
      title="ตราสัญลักษณ์ องค์การบริหารส่วนตำบลวังซ้าย อำเภอวังเหนือ จังหวัดลำปาง"
    >
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top text arc path */}
          <path
            id="topTextArc"
            d="M 40,150 A 110,110 0 0,1 260,150"
            fill="none"
          />
          {/* Bottom text arc path */}
          <path
            id="bottomTextArc"
            d="M 40,150 A 110,110 0 0,0 260,150"
            fill="none"
          />

          {/* Sun rays clip path */}
          <clipPath id="innerSunClip">
            <circle cx="150" cy="150" r="76" />
          </clipPath>

          {/* Tree shadow filter */}
          <filter id="treeGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Circular Borders (Reddish-Coral) */}
        <circle cx="150" cy="150" r="146" fill="#ffffff" stroke="#e07171" strokeWidth="2.5" />
        <circle cx="150" cy="150" r="141" fill="none" stroke="#f1a5a5" strokeWidth="1.2" />
        <circle cx="150" cy="150" r="82" fill="none" stroke="#e07171" strokeWidth="1.5" />
        <circle cx="150" cy="150" r="76" fill="#fffef0" stroke="#d05555" strokeWidth="2" />

        {/* Central Sun Rays emanating behind the tree */}
        <g clipPath="url(#innerSunClip)">
          {/* Ray sectors */}
          {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((deg) => (
            <polygon
              key={deg}
              points="150,150 142,0 158,0"
              transform={`rotate(${deg} 150 150)`}
              fill="#fde047"
              opacity="0.85"
            />
          ))}
          {/* Subtle sun gradient ring */}
          <circle cx="150" cy="150" r="76" fill="none" stroke="#fef08a" strokeWidth="6" opacity="0.4" />
        </g>

        {/* Center Great Green Tree (ต้นไม้ใหญ่ สัญลักษณ์ อบต.วังซ้าย) */}
        <g filter="url(#treeGlow)">
          {/* Dense Green Foliage background base */}
          <path
            d="M 150,82 C 168,78 190,88 198,102 C 208,104 220,116 220,130 C 220,144 208,154 196,156 C 188,162 176,162 165,160 C 158,162 142,162 135,160 C 124,162 112,162 104,156 C 92,154 80,144 80,130 C 80,116 92,104 102,102 C 110,88 132,78 150,82 Z"
            fill="#15803d"
          />
          {/* Additional Leafy Clusters */}
          <circle cx="150" cy="94" r="22" fill="#22c55e" />
          <circle cx="130" cy="106" r="20" fill="#16a34a" />
          <circle cx="170" cy="106" r="20" fill="#16a34a" />
          <circle cx="112" cy="124" r="19" fill="#22c55e" />
          <circle cx="188" cy="124" r="19" fill="#22c55e" />
          <circle cx="135" cy="132" r="18" fill="#15803d" />
          <circle cx="165" cy="132" r="18" fill="#15803d" />
          <circle cx="95" cy="138" r="16" fill="#16a34a" />
          <circle cx="205" cy="138" r="16" fill="#16a34a" />

          {/* Leaf highlights */}
          <circle cx="145" cy="90" r="12" fill="#4ade80" opacity="0.6" />
          <circle cx="168" cy="100" r="11" fill="#4ade80" opacity="0.6" />
          <circle cx="118" cy="118" r="10" fill="#4ade80" opacity="0.6" />
          <circle cx="182" cy="118" r="10" fill="#4ade80" opacity="0.6" />

          {/* Red-Orange Tree Trunk and Spreading Branches (ลำต้นและกิ่งก้านสีส้มแดง) */}
          {/* Main trunk */}
          <path
            d="M 143,115 L 140,165 C 135,178 118,190 105,195 C 122,192 138,188 144,180 L 146,192 C 148,196 152,196 154,192 L 156,180 C 162,188 178,192 195,195 C 182,190 165,178 160,165 L 157,115 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Left branches */}
          <path
            d="M 142,130 C 130,132 115,130 102,125 C 114,132 128,137 141,138 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1"
          />
          <path
            d="M 142,145 C 125,148 108,154 98,145 C 110,154 128,152 141,149 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1"
          />
          {/* Right branches */}
          <path
            d="M 158,130 C 170,132 185,130 198,125 C 186,132 172,137 159,138 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1"
          />
          <path
            d="M 158,145 C 175,148 192,154 202,145 C 190,154 172,152 159,149 Z"
            fill="#ea580c"
            stroke="#c2410c"
            strokeWidth="1"
          />
          {/* Central top branch */}
          <path
            d="M 148,115 L 150,96 L 152,115 Z"
            fill="#ea580c"
          />
        </g>

        {/* Flanking Floral Badges on Left and Right (ดอกไม้แปดแฉกสีเขียว) */}
        {/* Left Star Badge */}
        <g transform="translate(32, 140)">
          <path
            d="M 10,0 L 13,7 L 20,10 L 13,13 L 10,20 L 7,13 L 0,10 L 7,7 Z"
            fill="#15803d"
          />
          <circle cx="10" cy="10" r="3" fill="#86efac" />
          <line x1="2" y1="2" x2="18" y2="18" stroke="#16a34a" strokeWidth="1" />
          <line x1="2" y1="18" x2="18" y2="2" stroke="#16a34a" strokeWidth="1" />
        </g>
        {/* Right Star Badge */}
        <g transform="translate(248, 140)">
          <path
            d="M 10,0 L 13,7 L 20,10 L 13,13 L 10,20 L 7,13 L 0,10 L 7,7 Z"
            fill="#15803d"
          />
          <circle cx="10" cy="10" r="3" fill="#86efac" />
          <line x1="2" y1="2" x2="18" y2="18" stroke="#16a34a" strokeWidth="1" />
          <line x1="2" y1="18" x2="18" y2="2" stroke="#16a34a" strokeWidth="1" />
        </g>

        {/* Top Arc Text: องค์การบริหารส่วนตำบลวังซ้าย */}
        <text
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontSize="18.5"
          fontWeight="bold"
          fontFamily="'Sarabun', 'TH Sarabun New', sans-serif"
          letterSpacing="1.2"
        >
          <textPath
            href="#topTextArc"
            startOffset="50%"
            textAnchor="middle"
          >
            องค์การบริหารส่วนตำบลวังซ้าย
          </textPath>
        </text>

        {/* Bottom Arc Text: อำเภอวังเหนือ จังหวัดลำปาง */}
        <text
          fill="#dc2626"
          stroke="#ffffff"
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontSize="18"
          fontWeight="bold"
          fontFamily="'Sarabun', 'TH Sarabun New', sans-serif"
          letterSpacing="1.2"
        >
          <textPath
            href="#bottomTextArc"
            startOffset="50%"
            textAnchor="middle"
          >
            อำเภอวังเหนือ   จังหวัดลำปาง
          </textPath>
        </text>
      </svg>
    </div>
  );
};
