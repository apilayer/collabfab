import type { IFaqItem } from "@/interfaces/faq.interface";

/**
 * Shared by the modal and by the JSON-LD block in the page, so the answers a
 * reader sees and the ones search engines index can never drift apart.
 */
export const FAQ_DATA: IFaqItem[] = [
  {
    id: "faq-1",
    question: "What is CollabFab?",
    answer:
      "CollabFab is a place to find people to build with. Everyone who has the page open right now appears on a shared 3D globe, placed by their IP address — no sign-up, no location permission. Say what you are working on and what you want from a collaborator, and CollabFab ranks everyone else by a Handshake Score: how worthwhile it would actually be for the two of you to talk, given your overlapping working hours, shared language, common interests, distance and network. Open anyone's pin to read their profile, see that score broken down line by line, and get in touch.",
  },
  {
    id: "faq-2",
    question: "What is the data source for CollabFab?",
    answer:
      "CollabFab is powered by ipstack, an IP geolocation API from APILayer. ipstack resolves each visitor's IP address into the coordinates used to place their pin, along with city, region, country, timezone, languages, currency, ISP, ASN and connection details. Map tiles come from OpenStreetMap; ipstack supplies every piece of location data shown in the app.",
  },
  {
    id: "faq-3",
    question: "How does CollabFab know where I am?",
    answer:
      "CollabFab never asks for GPS or browser location permission. It reads the public IP address your connection presents and sends it to the ipstack API, which returns the approximate location registered to that address. This is the same technique sites use to pick a default currency or language, and it works without any prompt or permission from you.",
  },
  {
    id: "faq-4",
    question: "How accurate is IP-based location?",
    answer:
      "IP geolocation is approximate, not exact. It typically resolves to the city or region your internet provider routes traffic through, which may be some distance from where you actually are. Mobile networks, corporate VPNs and datacenter connections can place you in an entirely different city or country. CollabFab flags datacenter and proxy connections on each visitor's card so you can see when a pin should be treated with suspicion. Never treat an IP-derived position as a precise physical address.",
  },
  {
    id: "faq-5",
    question: "What is the Handshake Score?",
    answer:
      "The Handshake Score is how CollabFab decides who to put in front of you. It estimates how worthwhile a conversation between you and another person would be, out of 100, combining how many working hours your two timezones share, whether you have a language in common, any interest or skill tags you have both entered, how far apart you are, and whether you are on a related network. Working-hour overlap carries the most weight, because two people who are never awake at the same time will struggle to build anything together. Every point is attributed to a named line with the evidence behind it, so you can see exactly how the number was reached rather than trusting a black box.",
  },
  {
    id: "faq-6",
    question: "What happens to the profile details I enter?",
    answer:
      "Your profile — what you are building, what you want from a collaborator, your tags and contact details — is stored against a session cookie and shown to everyone else on the globe. Because the cookie has no expiry, closing your browser or clearing cookies deletes your identity permanently: you return as a brand-new stranger with a new name and avatar, and the old profile is gone. Anything you type, including an email address, is public to other visitors, so only share what you would put on a public profile.",
  },
  {
    id: "faq-7",
    question: "What is ipstack?",
    answer:
      "ipstack is an IP geolocation API that turns an IPv4 or IPv6 address into structured location and network information. Depending on the plan, it can return country, region, city, ZIP or postal code, latitude and longitude, timezone, currency, spoken languages, ISP, ASN, connection type and security signals such as proxy, VPN and Tor detection. It is designed for applications that need to understand where their users are connecting from.",
  },
  {
    id: "faq-8",
    question: "What can I build with an IP geolocation API?",
    answer:
      "An IP geolocation API such as ipstack can be used for content localization, automatic currency and language selection, regional pricing, analytics and traffic analysis, fraud prevention and risk scoring, compliance and geo-restriction, and personalising an experience before a visitor has told you anything about themselves. CollabFab itself is one example: a real-time map of an audience built entirely from IP addresses.",
  },
];
