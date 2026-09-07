import { config, singleton, collection, fields } from "@keystatic/core";

const text = (label: string) => fields.text({ label });
const multiline = (label: string) => fields.text({ label, multiline: true });

export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "GrowUp Hackathon" },
  },
  collections: {
    partnerLogos: collection({
      label: "Partner logos",
      path: "src/content/partners/*",
      format: { data: "json" },
      slugField: "name",
      schema: {
        name: fields.slug({ name: { label: "Partner name" } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Partnerzy programu", value: "program" },
            { label: "Partnerzy społeczności", value: "community" },
            { label: "Patroni honorowi i medialni", value: "patron" },
          ],
          defaultValue: "program",
        }),
        order: fields.integer({
          label: "Sort order within category",
          defaultValue: 0,
        }),
        logo: fields.image({
          label: "Logo",
          directory: "public/images/partners",
          publicPath: "/images/partners/",
        }),
      },
    }),

    people: collection({
      label: "Mentors, experts & trainers",
      path: "src/content/people/*",
      format: { data: "json" },
      slugField: "name",
      schema: {
        name: fields.slug({ name: { label: "Full name" } }),
        group: fields.select({
          label: "Group",
          options: [
            { label: "Mentor", value: "mentors" },
            { label: "Expert", value: "experts" },
            { label: "Trainer", value: "trainers" },
          ],
          defaultValue: "mentors",
        }),
        order: fields.integer({
          label: "Sort order within group",
          defaultValue: 0,
        }),
        role: text("Role"),
        bio: multiline("Bio"),
        linkedin: text("LinkedIn URL (optional)"),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/people",
          publicPath: "/images/people/",
        }),
      },
    }),
  },
  singletons: {
    home: singleton({
      label: "Home Page",
      path: "src/content/pages/home",
      format: { data: "json" },
      schema: {
        seo: fields.object(
          {
            title: text("Page title"),
            description: multiline("Meta description"),
            ogImage: text("Open Graph image URL"),
          },
          { label: "SEO" },
        ),

        nav: fields.array(
          fields.object({
            label: text("Label"),
            href: text("Anchor / URL"),
          }),
          {
            label: "Navigation",
            itemLabel: (props) => props.fields.label.value,
          },
        ),

        teamCount: text(
          "Number of teams (single source — reference it elsewhere by writing {{teamCount}} in a stat value or paragraph, instead of typing the number again)",
        ),

        analytics: fields.object(
          {
            gaMeasurementId: text(
              "Google Analytics Measurement ID (G-XXXXXXXXXX). Leave empty to keep analytics fully disabled — no script is ever loaded without one, regardless of cookie consent.",
            ),
            cloudflareToken: text(
              "Cloudflare Web Analytics site token. Loads unconditionally (no cookies/localStorage used, so no consent gate) — leave empty to disable.",
            ),
          },
          { label: "Analytics" },
        ),

        links: fields.object(
          {
            waitlist: text("Waitlist form URL"),
            facebook: text("Facebook URL"),
            instagram: text("Instagram URL"),
            regulamin: text("Regulamin URL"),
            regulaminPdf: text("Regulamin PDF URL (Google Drive)"),
            privacy: text("Privacy policy URL"),
            contactEmail: text("Contact email"),
          },
          { label: "Global links" },
        ),

        hero: fields.object(
          {
            eyebrow: text("Eyebrow"),
            wordmarkLead: text("Wordmark (lead)"),
            wordmarkAccent: text("Wordmark (accent)"),
            taglinePurple: text("Tagline (purple)"),
            taglineLime: text("Tagline (lime)"),
            leadParagraph1: multiline("Lead paragraph 1"),
            leadParagraph2: multiline("Lead paragraph 2 (optional)"),
            ctaLabel: text("CTA label"),
            ctaEnabled: fields.checkbox({
              label: "CTA enabled",
              defaultValue: false,
            }),
            countdownTarget: text(
              "Countdown target (ISO, e.g. 2026-10-20T23:59:00+02:00)",
            ),
            countdownCaption: text("Countdown caption"),
          },
          { label: "Hero" },
        ),

        heroStats: fields.array(
          fields.object({
            value: text("Value"),
            label: text("Label"),
          }),
          {
            label: "Hero stats bar",
            itemLabel: (props) =>
              `${props.fields.value.value} ${props.fields.label.value}`,
          },
        ),

        about: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            paragraphs: fields.array(multiline("Paragraph"), {
              label: "Paragraphs",
              itemLabel: (props) => props.value.slice(0, 48),
            }),
            highlight: multiline("Highlight (callout)"),
          },
          { label: "About" },
        ),

        paths: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            intro: text("Intro"),
            items: fields.array(
              fields.object({
                title: text("Title"),
                icon: text("Phosphor icon class"),
                description: multiline("Description"),
              }),
              {
                label: "Paths",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
          },
          { label: "Thematic paths" },
        ),

        stages: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            intro: text("Intro"),
            items: fields.array(
              fields.object({
                step: text("Step number"),
                icon: text("Phosphor icon class"),
                title: text("Title"),
                date: text("Date range"),
                what: multiline("Description"),
                expect: fields.array(text("Checklist item"), {
                  label: "Checklist",
                  itemLabel: (props) => props.value,
                }),
              }),
              {
                label: "Stages",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
          },
          { label: "Programme stages" },
        ),

        benefits: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            items: fields.array(
              fields.object({
                bold: text("Bold lead"),
                rest: multiline("Rest"),
              }),
              {
                label: "Benefits",
                itemLabel: (props) => props.fields.bold.value,
              },
            ),
            awardsTitle: multiline("Awards title"),
            awardsNote: text("Awards note (disabled label)"),
            awards: fields.array(
              fields.object({
                icon: text("Phosphor icon class"),
                title: text("Title"),
                description: multiline("Description"),
              }),
              {
                label: "Awards",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
            ctaLabel: text("CTA label"),
          },
          { label: "Benefits and awards" },
        ),

        faq: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            intro: text("Intro"),
            items: fields.array(
              fields.object({
                question: text("Question"),
                answer: multiline("Answer"),
              }),
              {
                label: "FAQ",
                itemLabel: (props) => props.fields.question.value,
              },
            ),
          },
          { label: "FAQ" },
        ),

        organizers: fields.object(
          {
            title: text("Section title"),
            blocks: fields.array(
              fields.object({
                nameLead: text("Name (lead)"),
                nameAccent: text("Name (accent, lime)"),
                accentFirst: fields.checkbox({
                  label: "Accent word first",
                  defaultValue: false,
                }),
                subtitle: text("Subtitle"),
                paragraphs: fields.array(
                  fields.object({
                    text: multiline("Text"),
                    variant: fields.select({
                      label: "Variant",
                      options: [
                        { label: "Normal", value: "normal" },
                        { label: "Note (italic)", value: "note" },
                        { label: "Highlight (lime)", value: "highlight" },
                      ],
                      defaultValue: "normal",
                    }),
                  }),
                  {
                    label: "Paragraphs",
                    itemLabel: (props) => props.fields.text.value.slice(0, 48),
                  },
                ),
              }),
              {
                label: "Organizer blocks",
                itemLabel: (props) => props.fields.nameLead.value,
              },
            ),
          },
          { label: "Organizers" },
        ),

        partners: fields.object(
          {
            partnersTitleLead: text("Partners title (lead)"),
            partnersTitleAccent: text("Partners title (accent)"),
            becomeTitleLead: text("Become title (lead)"),
            becomeTitleAccent: text("Become title (accent)"),
            becomeIntro: multiline("Become intro"),
            stats: fields.array(
              fields.object({
                value: text("Value"),
                label: text("Label"),
              }),
              {
                label: "Stats",
                itemLabel: (props) => props.fields.value.value,
              },
            ),
            benefits: fields.array(
              fields.object({
                icon: text("Phosphor icon class"),
                title: text("Title"),
                description: multiline("Description"),
              }),
              {
                label: "Partner benefits",
                itemLabel: (props) => props.fields.title.value,
              },
            ),
            ctaLabel: text("CTA label"),
            ctaMailto: text("CTA mailto URL"),
          },
          { label: "Partners" },
        ),

        bottomCta: fields.object(
          {
            titleLead: text("Title (lead)"),
            titleAccent: text("Title (accent)"),
            text: text("Text"),
            ctaLabel: text("CTA label"),
          },
          { label: "Bottom CTA" },
        ),

        footer: fields.object(
          {
            brandName: text("Brand name"),
            brandDescription: multiline("Brand description"),
            navTitle: text("Nav column title"),
            navLinks: fields.array(
              fields.object({
                label: text("Label"),
                href: text("Anchor / URL"),
              }),
              {
                label: "Footer nav links",
                itemLabel: (props) => props.fields.label.value,
              },
            ),
            contactTitle: text("Contact column title"),
            partnerLabel: text("Partner CTA label"),
            partnerHref: text("Partner CTA URL"),
            copyright: text("Copyright"),
            tagline: text("Tagline"),
          },
          { label: "Footer" },
        ),

        cookie: fields.object(
          {
            text: multiline("Text"),
            accept: text("Accept label"),
            decline: text("Decline label"),
          },
          { label: "Cookie banner" },
        ),
      },
    }),
  },
});
