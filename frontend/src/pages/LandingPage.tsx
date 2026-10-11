import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";
import { useCommunityStats } from "../hooks/useCommunityStats";

/* ------------------------------------------------------------------ */
/* Content — real capabilities from the app, grouped the way members   */
/* actually use them. No invented features, figures or testimonials.   */
/* ------------------------------------------------------------------ */

type IconName = keyof typeof LP_PATHS;

interface Capability {
  icon: IconName;
  name: string;
  description: string;
}

interface CapabilityGroup {
  icon: IconName;
  title: string;
  summary: string;
  items: Capability[];
}

/** Three meaningful groups. Family connections lead; community support follows. */
const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    icon: "users",
    title: "Family & Community",
    summary: "Your family record, and the members around it.",
    items: [
      {
        icon: "home",
        name: "Family records",
        description: "Keep your family's details together, verified and up to date.",
      },
      {
        icon: "search",
        name: "Member discovery",
        description: "Find members and families across the community.",
      },
      {
        icon: "heart",
        name: "Matrimony",
        description: "Explore suitable matrimonial profiles within the community.",
      },
    ],
  },
  {
    icon: "drop",
    title: "Support & Services",
    summary: "Help close by, exactly when it is needed.",
    items: [
      {
        icon: "drop",
        name: "Blood donors",
        description: "Find matching blood donors when someone needs help.",
      },
      {
        icon: "briefcase",
        name: "Community services",
        description: "Discover businesses, professionals and services offered by members.",
      },
    ],
  },
  {
    icon: "bell",
    title: "Stay Connected",
    summary: "What is happening, and where you stand.",
    items: [
      {
        icon: "bell",
        name: "Events & announcements",
        description: "Follow community gatherings, activities and updates.",
      },
      {
        icon: "card",
        name: "Membership & payments",
        description: "Manage your annual membership and review your payment history.",
      },
    ],
  },
];

/** What members can do from the family records screen. */
const ACTION_BADGES = [
  { icon: "home", label: "Family summary" },
  { icon: "card", label: "Membership status" },
  { icon: "user", label: "Member details" },
] as const;

/** Registration order, kept short — no technical detail. */
const JOINING_STEPS = [
  {
    title: "Enter your details",
    description: "Add your name and details, then verify your mobile number.",
  },
  {
    title: "Complete your family profile",
    description: "Add your family members and keep their details accurate.",
  },
  {
    title: "Submit for approval",
    description: "Your registration is reviewed before your family record goes live.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Live community counters — real data, never invented figures.        */
/* ------------------------------------------------------------------ */

const STAT_ORDER = [
  { key: "families", label: "Families" },
  { key: "members", label: "Members" },
  { key: "bloodGroupsRecorded", label: "Blood groups recorded" },
] as const;

const numberFormat = new Intl.NumberFormat("en-IN");

/**
 * The hero's "at a glance" panel. Figures come from GET /api/stats and are
 * shown as they arrive; on failure the panel simply drops the figure rows and
 * keeps its heading and link, so nothing breaks and nothing is faked.
 */
function CommunityGlance() {
  const state = useCommunityStats();

  return (
    <aside className="landing-glance">
      <span className="landing-glance__label">Community at a glance</span>
      <h2 className="landing-glance__title">Our community today</h2>

      {state.status !== "error" && (
        <dl className="landing-glance__figures">
          {STAT_ORDER.map((stat) => (
            <div key={stat.key} className="landing-glance__figure" data-stat={stat.key}>
              <dt>{stat.label}</dt>
              <dd>
                {state.status === "ready" ? (
                  numberFormat.format(state.stats[stat.key])
                ) : (
                  <span className="landing-glance__skeleton" aria-hidden="true" />
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <p className="landing-glance__note">
        Counts are read live from the community register.
      </p>
      <Link to="/community" className="landing-glance__link">
        Explore the community <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Page — five purposeful sections                                     */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home landing">
        {/* ============ 1 · HERO — what is Mitra Maheshwari? ============ */}
        <section className="landing-hero">
          <div className="container landing-hero__grid">
            <Reveal className="landing-hero__copy">
              <span className="home-eyebrow">Mitra Maheshwari Seva Pratishthan</span>
              <h1 className="home-display">
                Closer families. A <em>stronger community.</em>
              </h1>
              <p className="home-lead">
                Mitra Maheshwari brings family connections, community support and essential
                community services together in one place — a member-verified home for our
                community.
              </p>
              <div className="home-cta landing-hero__cta">
                <Link to="/register" className="btn btn--primary btn--lg">
                  Join the Community <span aria-hidden="true">→</span>
                </Link>
                <Link to="/login" className="btn btn--secondary btn--lg">
                  Member Login
                </Link>
              </div>
              <ul className="landing-assure">
                <li>
                  <LpIcon d={LP_PATHS.check} label="" />
                  Records reviewed before they go live
                </li>
                <li>
                  <LpIcon d={LP_PATHS.check} label="" />
                  Family details stay members-only
                </li>
              </ul>
            </Reveal>

            <Reveal className="landing-hero__aside" delay={120}>
              <CommunityGlance />
            </Reveal>
          </div>
        </section>

        {/* ============ 2 · WHAT YOU CAN DO HERE ============ */}
        <section className="landing-band landing-band--tint">
          <div className="container">
            <Reveal className="landing-head">
              <span className="home-eyebrow">What you can do here</span>
              <h2 className="home-h2">
                One platform for <em>community life.</em>
              </h2>
              <p className="home-sub">
                The essentials members rely on, grouped simply: your family, the support our
                community offers, and the updates that keep everyone connected.
              </p>
            </Reveal>

            <div className="landing-cards">
              {CAPABILITY_GROUPS.map((group, index) => (
                <Reveal key={group.title} delay={index * 90}>
                  <article className="landing-card">
                    <span className="landing-card__icon" aria-hidden="true">
                      <LpIcon d={LP_PATHS[group.icon]} label="" />
                    </span>
                    <h3 className="landing-card__title">{group.title}</h3>
                    <p className="landing-card__summary">{group.summary}</p>
                    <ul className="landing-card__items">
                      {group.items.map((item) => (
                        <li key={item.name} className="landing-card__item">
                          <LpIcon d={LP_PATHS[item.icon]} label="" />
                          <span>
                            <span className="landing-card__name">{item.name}</span>
                            <span className="landing-card__text">{item.description}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ 3 · SEE THE PLATFORM IN ACTION ============ */}
        <section className="landing-band">
          <div className="container">
            <Reveal className="landing-action">
              <div className="landing-action__copy">
                <span className="home-eyebrow">See the platform in action</span>
                <h2 className="home-h2">
                  Your family, <em>in your hands.</em>
                </h2>
                <p className="home-sub">
                  Members manage their family information in one place — adding family members,
                  keeping details current, and reaching every other community feature from the
                  same member area.
                </p>
                <ul className="landing-badges">
                  {ACTION_BADGES.map((badge) => (
                    <li key={badge.label} className="landing-badge">
                      <LpIcon d={LP_PATHS[badge.icon]} label="" />
                      {badge.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="landing-stack">
                <figure className="landing-stack__frame landing-stack__frame--main">
                  <img
                    src="/images/hero-dashboard.png"
                    alt="The Mitra Maheshwari member area, showing the family summary, membership status and quick actions"
                    width={1422}
                    height={904}
                    loading="lazy"
                  />
                </figure>
                <figure className="landing-stack__frame landing-stack__frame--inset">
                  <img
                    src="/images/hero-family.png"
                    alt="Family records inside the Mitra Maheshwari member area, listing the head of the family and its members"
                    width={1422}
                    height={804}
                    loading="lazy"
                  />
                </figure>
                <p className="landing-stack__caption">
                  Family records and membership status in the live member area.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ 4 · HOW TO BECOME A MEMBER ============ */}
        <section className="landing-band landing-band--tint">
          <div className="container">
            <Reveal className="landing-head">
              <span className="home-eyebrow">How to become a member</span>
              <h2 className="home-h2">
                Joining takes <em>three steps.</em>
              </h2>
              <p className="home-sub">
                Registration takes only a few minutes. Every family record is reviewed before
                it joins the community.
              </p>
            </Reveal>

            <ol className="landing-steps">
              {JOINING_STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 90}>
                  <li className="landing-step">
                    <span className="landing-step__n" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="landing-step__title">{step.title}</h3>
                    <p className="landing-step__text">{step.description}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* ============ 5 · FINAL INVITATION ============ */}
        <section className="landing-invite">
          <div className="container landing-invite__inner">
            <Reveal>
              <h2>
                Stay connected with <em>your community.</em>
              </h2>
              <p>
                Join the platform and keep your family close to the people, support and services
                around you.
              </p>
            </Reveal>
            <Reveal className="landing-invite__actions" delay={90}>
              <Link to="/register" className="btn btn--light btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
              <Link to="/login" className="btn btn--outline btn--lg">
                Member Login
              </Link>
              <Link to="/contact" className="landing-invite__contact">
                Questions about joining? Contact the community team
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
