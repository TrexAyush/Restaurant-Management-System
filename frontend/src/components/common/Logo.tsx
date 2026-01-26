import React from 'react';
import { Box } from '@mui/material';

interface LogoProps {
  variant?: 'full' | 'short';
  size?: 'small' | 'medium' | 'large';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', size = 'medium' }) => {
  const getImageSize = () => {
    // Logo is landscape (approximately 4:1 ratio based on actual image)
    switch (size) {
      case 'small':
        return { width: 120, height: 40 };
      case 'large':
        return { width: 280, height: 80 };
      default:
        return { width: 180, height: 50 };
    }
  };

  const getLogoSrc = () => {
    // Use transparent logo for better integration
    return '/images/logo/LogoTrans2.png';
  };

  const imageSize = getImageSize();

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%'
      }}
    >
      <img
        src={getLogoSrc()}
        alt="Restaurant Management System Logo"
        style={{
          width: imageSize.width,
          height: imageSize.height,
          objectFit: 'contain',
          maxWidth: '100%'
        }}
      />
    </Box>
  );
};