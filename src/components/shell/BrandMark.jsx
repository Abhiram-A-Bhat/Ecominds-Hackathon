import React from 'react';

/** RNSIT 25th anniversary mark, shared across the app shell and login screen. */
export function BrandMark({ size = 36 }) {
  return (
    <img
      src="/brand/rnsit-25th-anniversary.png"
      alt="RNSIT 25th anniversary"
      width={size}
      height={size}
      draggable="false"
      style={{ width: size, height: size, flexShrink: 0, objectFit: 'contain', borderRadius: Math.max(6, Math.round(size * 0.14)) }}
    />
  );
}
