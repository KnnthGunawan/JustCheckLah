import clsx from "clsx";

const STEPS = [
  { number: 1, label: "Personal" },
  { number: 2, label: "Household" },
  { number: 3, label: "Financial" },
];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
              step.number < currentStep  && "bg-gov-blue border-gov-blue text-white",
              step.number === currentStep && "bg-white border-gov-blue text-gov-blue shadow-md ring-4 ring-gov-lightblue",
              step.number > currentStep  && "bg-white border-gov-gray-300 text-gov-gray-500"
            )}>
              {step.number < currentStep ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : step.number}
            </div>
            <span className={clsx(
              "text-xs font-medium",
              step.number === currentStep ? "text-gov-blue" : "text-gov-gray-500"
            )}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={clsx(
              "h-0.5 w-16 sm:w-24 mb-5 mx-2 transition-all duration-500",
              step.number < currentStep ? "bg-gov-blue" : "bg-gov-gray-300"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
