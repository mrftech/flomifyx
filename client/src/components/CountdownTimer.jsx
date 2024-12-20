import React, { useState, useEffect } from 'react';

function CountdownTimer({ seconds, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  return (
    <span>
      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </span>
  );
}

export default CountdownTimer; 