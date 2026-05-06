import React, { useEffect, useRef, useState } from "react";
import { Text, TextProps } from "react-native";

interface Props extends Omit<TextProps, "children"> {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}

const CountUp: React.FC<Props> = ({
  value,
  duration = 600,
  format,
  ...rest
}) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (value - from) * eased;
      setDisplay(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    tick();
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <Text {...rest}>
      {format ? format(display) : Math.round(display).toString()}
    </Text>
  );
};

export default CountUp;
