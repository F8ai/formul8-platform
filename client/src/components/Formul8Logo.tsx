import React from 'react';
import logoImage from '@assets/Formul8 Logo_1754237672124.png';

interface Formul8LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Formul8Logo: React.FC<Formul8LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showText = true 
}) => {
  const sizeMap = {
    sm: { logo: 24, text: 'text-base' },
    md: { logo: 32, text: 'text-xl' },
    lg: { logo: 48, text: 'text-2xl' },
    xl: { logo: 64, text: 'text-3xl' }
  };

  const { logo, text } = sizeMap[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Official Formul8.ai Logo */}
      <img 
        src={logoImage}
        alt="Formul8.ai Logo"
        width={logo}
        height={logo}
        className="drop-shadow-lg"
        style={{ filter: 'brightness(1.1) contrast(1.1)' }}
      />
      
      {/* Formul8.ai Text */}
      {showText && (
        <div>
          <h1 className={`font-bold formul8-logo-gradient ${text} leading-tight`}>
            FORMUL8.AI
          </h1>
        </div>
      )}
    </div>
  );
};

export default Formul8Logo;