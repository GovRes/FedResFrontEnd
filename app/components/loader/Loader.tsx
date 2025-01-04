import { motion, useAnimate } from "framer-motion";
import styles from "./loader.module.css";
import { useEffect } from "react";

export function TextSpinnerLoader({text}: {text: string}) {
  const characters = text.split("");

  const radius = 300;
  const fontSize = "18px";
  const letterSpacing = 12.5;

  const [scope, animate] = useAnimate();

  useEffect(() => {
    const animateLoader = async () => {
      const letterAnimation: Array<[string, { opacity: number }, { duration: number, at: string }]> = [];
      characters.forEach((_, i) => {
        letterAnimation.push([
          `.letter-${i}`,
          { opacity: 0 },
          { duration: 0.3, at: i === 0 ? "+0.8" : "-0.28" }
        ]);
      });
      characters.forEach((_, i) => {
        letterAnimation.push([
          `.letter-${i}`,
          { opacity: 1 },
          { duration: 0.3, at: i === 0 ? "+0.8" : "-0.28" }
        ]);
      });
      animate(letterAnimation, {
        repeat: Infinity
      });
      animate(
        scope.current,
        { rotate: -360 },
        { duration: 10, ease: "linear", repeat: Infinity }
      );
    };
    animateLoader();
  }, []);

  return (
    <motion.div ref={scope} className={styles.circle} style={{ width: radius * 2 }}>
      <p aria-label={text} />
      <p aria-hidden="true" className="text">
        {characters.map((ch, i) => (
          <motion.span
            key={i}
            className={`${styles.letter} ${styles.letter}-${i}`}
            style={{
              transformOrigin: `0 ${radius}px`,
              transform: `rotate(${i * letterSpacing}deg)`,
              fontSize
            }}
          >
            {ch}
          </motion.span>
        ))}
      </p>
    </motion.div>
  );
}

export function TextBlinkLoader({text}: {text: string}) {
  return (
    <div className={styles.blink}>
      {text}
    </div>
  )
}
