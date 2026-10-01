import { MinusIcon, PlusIcon } from "./Icons";

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    label: string;
    min?: number;
}

export function QuantityStepper({ value, onChange, label, min = 1 }: QuantityStepperProps) {
    return (
        <div role="group" aria-label={label} className="inline-flex items-center rounded-full border border-seam">
            <button
                type="button"
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                aria-label="Decrease quantity"
                className="grid h-11 w-11 place-items-center rounded-full text-bone transition-colors hover:text-gold disabled:cursor-not-allowed disabled:text-seam"
            >
                <MinusIcon />
            </button>
            <span className="w-8 text-center font-semibold" aria-live="polite">
                {value}
            </span>
            <button
                type="button"
                onClick={() => onChange(value + 1)}
                aria-label="Increase quantity"
                className="grid h-11 w-11 place-items-center rounded-full text-bone transition-colors hover:text-gold"
            >
                <PlusIcon />
            </button>
        </div>
    );
}
