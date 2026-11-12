import React from 'react';

/** Guardian Campus shield mark, shared across the app shell and login screen. */
export function BrandMark({ size = 36 }) {
  return (
    <img
      src="/brand/guardian-campus-shield.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable="false"
      style={{ width: size, height: size, flexShrink: 0, objectFit: 'contain' }}
    />
  );
}
