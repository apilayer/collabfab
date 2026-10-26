import { Stage } from "./components/Stage";
import { SeoContent } from "./components/SeoContent";
import { StructuredData } from "./components/StructuredData";

export default function Home() {
  return (
    <>
      <StructuredData />
      {/* The globe keeps the viewport to itself; the readable content sits
          below it in normal flow so it is in the HTML and reachable. */}
      <div className="h-screen w-full">
        <Stage />
      </div>
      <SeoContent />
    </>
  );
}
