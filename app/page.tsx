import { Stage } from "./components/Stage";
import { FAQ_DATA } from "./lib/faq";

/**
 * Rendered server-side and always present in the HTML — search engines index
 * the FAQ regardless of whether a visitor ever opens the modal.
 */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_DATA.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Stage />
    </>
  );
}
