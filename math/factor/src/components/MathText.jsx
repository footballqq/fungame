import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MathText = ({ content, block = false, style = {} }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(content, containerRef.current, {
          displayMode: block,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        console.error('KaTeX rendering error:', e);
        containerRef.current.innerText = content;
      }
    }
  }, [content, block]);

  return <span ref={containerRef} style={style} />;
};

export default MathText;
