export const templates = [
  {
    id: "blank",
    label: "Start with a blank pool",
    title: "",
    summary: "",
    rules: "",
    verification: "self_attested",
  },
  {
    id: "practice",
    label: "Seven rounds of focused practice",
    title: "Seven rounds of focused practice",
    summary:
      "A small cohort committing to one focused practice session in each scheduled round.",
    rules:
      "Complete at least 20 uninterrupted minutes practicing one skill in every round. State the skill, date, duration and one concrete thing learned. A complete self-attested statement passes; an incomplete statement or a missed deadline fails. This policy does not independently verify real-world activity.",
    verification: "self_attested",
  },
  {
    id: "public-log",
    label: "Publish a daily learning note",
    title: "Publish a daily learning note",
    summary:
      "Publish an original, dated learning note on a stable public page for each round.",
    rules:
      "For each round, publish a dated note containing at least 100 words, one concrete lesson and one example. The public HTTPS page must be accessible without login and remain unchanged through verification. Capture the full page and submit its digest. Missing content or a missed deadline fails. Replace this template with the cohort's exact topic and evidence expectations before publishing.",
    verification: "source_verified",
  },
];
