import { createFileRoute } from "@tanstack/react-router";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <div className="h-screen w-screen">
      <InfiniteCanvas className="h-full w-full" />
    </div>
  );
}
