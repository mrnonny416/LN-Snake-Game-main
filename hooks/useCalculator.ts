import { useEffect, useRef, useState, useCallback } from "react";

type Operator = "+" | "-" | "*" | "/" | null;

export function useCalculator() {
  // =========================
  // 🧠 Logic (ไม่ render)
  // =========================
  const currentValueRef = useRef<number>(0);
  const operatorRef = useRef<Operator>(null);
  const previousValueRef = useRef<number | null>(null);

  // =========================
  // 🎮 UI State (render)
  // =========================
  const [display, setDisplay] = useState("0");

  // =========================
  // 🔁 Sync ref → UI
  // =========================
  useEffect(() => {
    setDisplay(currentValueRef.current.toString());
  }, []);

  // =========================
  // 🎯 Actions
  // =========================

  const inputNumber = useCallback(
    (num: number) => {
      currentValueRef.current = display === "0" ? num : Number(display + num.toString());

      setDisplay(currentValueRef.current.toString());
    },
    [display]
  );

  const setOperator = useCallback((op: Operator) => {
    previousValueRef.current = currentValueRef.current;
    operatorRef.current = op;
    currentValueRef.current = 0;
    setDisplay("0");
  }, []);

  const calculate = useCallback(() => {
    if (previousValueRef.current === null || operatorRef.current === null) {
      return;
    }

    const a = previousValueRef.current;
    const b = currentValueRef.current;
    let result = 0;

    switch (operatorRef.current) {
      case "+":
        result = a + b;
        break;
      case "-":
        result = a - b;
        break;
      case "*":
        result = a * b;
        break;
      case "/":
        result = b === 0 ? 0 : a / b;
        break;
    }

    currentValueRef.current = result;
    previousValueRef.current = null;
    operatorRef.current = null;

    setDisplay(result.toString());
  }, []);

  const clear = useCallback(() => {
    currentValueRef.current = 0;
    previousValueRef.current = null;
    operatorRef.current = null;
    setDisplay("0");
  }, []);

  return {
    display,
    inputNumber,
    setOperator,
    calculate,
    clear,
  };
}
