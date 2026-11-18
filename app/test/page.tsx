"use client";
import { useCalculator } from "@/hooks/useCalculator";

export default function CalculatorPage() {
  const { display, inputNumber, setOperator, calculate, clear } = useCalculator();

  return (
    <div style={{ padding: 20, maxWidth: 200 }}>
      <h2>Calculator</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10,
          textAlign: "right",
        }}
      >
        {display}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
        {[1, 2, 3].map((n) => (
          <button className="border-2" key={n} onClick={() => inputNumber(n)}>
            {n}
          </button>
        ))}
        <button className="border-2" onClick={() => setOperator("+")}>
          +
        </button>
        {[4, 5, 6].map((n) => (
          <button className="border-2" key={n} onClick={() => inputNumber(n)}>
            {n}
          </button>
        ))}
        <button className="border-2" onClick={() => setOperator("-")}>
          -
        </button>

        {[7, 8, 9].map((n) => (
          <button className="border-2" key={n} onClick={() => inputNumber(n)}>
            {n}
          </button>
        ))}
        <button className="border-2" onClick={() => setOperator("*")}>
          *
        </button>
        <button className="border-2" onClick={clear}>
          C
        </button>
        <button className="border-2" onClick={() => inputNumber(0)}>
          0
        </button>
        <button className="border-2" onClick={calculate}>
          =
        </button>
        <button className="border-2" onClick={() => setOperator("/")}>
          /
        </button>
      </div>
    </div>
  );
}
