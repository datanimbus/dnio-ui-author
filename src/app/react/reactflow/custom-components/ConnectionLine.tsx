import * as React from 'react'

export default ({ fromX, fromY, toX, toY }) => {
  // Calculate control point coordinates for the smooth step curve
  const controlX = fromX + (toX - fromX) / 2;
  const controlY = fromY;

  return (
    <g>
      {/* Horizontal Line */}
      <line
        x1={fromX}
        y1={fromY}
        x2={controlX}
        y2={controlY}
        stroke="#666"
        strokeWidth={1}
        className="animated"
      />
      
      {/* Vertical Line */}
      <line
        x1={controlX}
        y1={controlY}
        x2={controlX}
        y2={toY}
        stroke="#666"
        strokeWidth={1}
        className="animated"
      />
      
      {/* Final Horizontal Line */}
      <line
        x1={controlX}
        y1={toY}
        x2={toX}
        y2={toY}
        stroke="#666"
        strokeWidth={1}
        className="animated"
      />
      
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        strokeWidth={1.5}
      />
    </g>
  );
};
