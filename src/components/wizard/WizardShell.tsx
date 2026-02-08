"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-muted-foreground flex justify-between text-sm">
          <span>{steps[currentStep]}</span>
          <span>
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div>{children(currentStep)}</div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed(currentStep)}
          >
            Next
          </Button>
        ) : (
          <Button onClick={onComplete} disabled={!canProceed(currentStep)}>
            Generate List
          </Button>
        )}
      </div>
    </div>
  );
}
