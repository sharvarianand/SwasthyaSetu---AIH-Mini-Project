"use client";

import { Joyride, Step, EventData } from "react-joyride";

interface AppTourProps {
  run: boolean;
  steps: Step[];
  onFinish: () => void;
}

export default function AppTour({ run, steps, onFinish }: AppTourProps) {
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={(data: EventData) => {
        if (data.status === "finished" || data.status === "skipped") {
          onFinish();
        }
      }}
      options={{ primaryColor: "#2b5a50" }}
    />
  );
}
