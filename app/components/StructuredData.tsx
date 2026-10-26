import { FAQ_DATA } from "@/app/lib/faq";
import { SITE, SITE_URL } from "@/app/lib/site";

/**
 * One JSON-LD `@graph` rather than a lone FAQPage, so a parser sees what this
 * page is as well as what it answers. The FAQ entries come from the same
 * source the visible section renders, so the markup cannot describe questions
 * the HTML does not contain.
 */
export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE.name,
        url: SITE_URL,
        description: SITE.description,
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and WebGL",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@id": `${SITE.origin}/#org` },
        featureList: [
          "Live 3D globe of everyone currently on the page",
          "Real-time IP geolocation of each visitor",
          "Explainable Handshake Score for collaborator matching",
          "Matching on working hours, language, interests and distance",
          "Shareable profile with contact details",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE.name,
        description: SITE.description,
        publisher: { "@id": `${SITE.origin}/#org` },
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#org`,
        name: "APILayer",
        url: "https://apilayer.com/",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_DATA.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
