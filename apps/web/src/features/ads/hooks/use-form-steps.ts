import { useState } from 'react';

export function useFormSteps(count: number) {
  const [step, setStep] = useState(0);

  function next() {
    setStep((s) => Math.min(s + 1, count - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return { step, next, back };
}
