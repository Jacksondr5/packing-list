"use client";

import { useState, type ReactNode, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface WizardShellProps {
  steps: string[];
  children: (currentStep: number) => ReactNode;
  onComplete: () => void;
  canProceed: (step: number) => boolean;
}

export default function WizardShell({
  steps,
  children,
  onComplete,
  canProceed,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, i) => (
          <Fragment key={step}>
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors duration-300",
                  i <= currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                i === currentStep
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : i < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i + 1}
            </div>
          </Fragment>
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-sm text-muted-foreground">
        {steps[currentStep]}
      </p>

      {/* Step content */}
      <div>{children(currentStep)}</div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          className="gap-1.5"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed(currentStep)}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={onComplete}
            disabled={!canProceed(currentStep)}
            className="gap-1.5"
          >
            <Sparkles className="size-4" />
            Generate List
          </Button>
        )}
      </div>
    </div>
  );
}
