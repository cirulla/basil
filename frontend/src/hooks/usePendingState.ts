import { useEffect, useRef, useState } from 'react';
import { useIsFetching } from 'react-query';

export const usePendingState = () => {
  const pending = useIsFetching();
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (!pending) {
      timerRef.current = window.setTimeout(() => {
        setShowLoadingIndicator(false);
      }, 1000);
    } else {
      clearTimeout(timerRef.current);
      setShowLoadingIndicator(true);
    }
  }, [pending]);

  return { pending, showLoadingIndicator };
};
