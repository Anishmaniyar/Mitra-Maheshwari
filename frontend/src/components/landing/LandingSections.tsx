import { Link } from "react-router-dom";
import { useRevealOnce } from "../../hooks/useRevealOnce";
import { LP_PATHS, LpIcon } from "../common/LpIcon";
import type { LpIconName } from "../common/LpIcon";

const IMPACT = [
  { value: "27+", suffix: "Years", label: "Of community service" },
  { value: "300+", suffix: "Units", label: "Of blood collected annually" },
  { value: "3,000+", suffix: "Warkaris", label: "Supported every year" },
  { value: "500+", suffix: "Students", label: "Supported through education" },
];

const INITIATIVES: { icon: LpIconName; title: string; text: string }[] = [
  {
    icon: "drop",
    title: "Blood Donation",
    text: "Supporting patients and families through blood donation drives.",
  },
  {
    icon: "users",
    title: "Wari Seva",
    text: "Providing medical kits and support to Warkaris.",
  },
  {
    icon: "heart",
    title: "Medical Assistance",
    text: "Helping individuals and families access healthcare.",
  },
  {
    icon: "book",
    title: "Educational Support",
    text: "Supporting deserving students in their education.",
  },
  {
    icon: "calendar",
    title: "Cultural Events",
    text: "Celebrating traditions and strengthening community bonds.",
  },
  {
    icon: "activity",
    title: "Sports & Youth Activities",
    text: "Encouraging fitness, participation and teamwork.",
  },
  {
    icon: "briefcase",
    title: "CSR Partnerships",
    text: "Working together to expand our social impact.",
  },
];

const PLATFORM = [
  { icon: "home", title: "Family Records", description: "View and manage your household and family records." },
  { icon: "users", title: "Member Directory", description: "Find and connect with community members." },
  { icon: "heart", title: "Matrimony", description: "Explore matrimonial profiles within the community." },
  { icon: "drop", title: "Blood Donors", description: "Locate blood donors when they are needed most." },
  { icon: "briefcase", title: "Community Services", description: "Access services and support offered by the trust." },
  { icon: "bell", title: "Events & Updates", description: "Stay updated with events and announcements." },
  { icon: "card", title: "Membership", description: "Manage your membership and contributions." },
] satisfies { icon: LpIconName; title: string; description: string }[];

const STEPS = [
  { title: "Create your account", text: "Sign up with your mobile number to get started." },
  { title: "Find your family record", text: "Search for your household by name and mobile number." },
  { title: "Verify and submit", text: "Confirm your details and send your registration for approval." },
];

interface MediaFrameProps {
  label: string;
  className?: string;
}

/** Reserved image space — intentionally blank until real photography is added. */
export function MediaFrame({ label, className = "" }: MediaFrameProps) {
  return (
    <div className={`lp-media ${className}`.trim()} aria-hidden="true">
      <span className="lp-media__icon">
        <LpIcon d={LP_PATHS.image} />
      </span>
      <span className="lp-media__label">{label}</span>
    </div>
  );
}

function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={`lp-section-head${center ? " lp-section-head--center" : ""}`}>
      <span className="type-eyebrow">{eyebrow}</span>
      <h2 className="type-h2">{title}</h2>
      {lead && <p className="type-sub">{lead}</p>}
    </div>
  );
}

export function ImpactSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.15);
  const on = visible ? " is-on" : "";

  return (
    <section id="impact" ref={ref} className="lp-section lp-section--tight">
      <div className="lp-shell">
        <div className={`lp-rv${on}`}>
          <span className="type-eyebrow">Our Impact</span>
        </div>
        <div className="lp-impact__grid">
          {IMPACT.map((stat, i) => (
            <article
              key={stat.suffix}
              className={`lp-stat lp-rv lp-rv--card lp-delay-${i + 1}${on}`}
            >
              <p className="lp-stat__value">
                {stat.value}
                <span className="lp-stat__suffix">{stat.suffix}</span>
              </p>
              <p className="lp-stat__label">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.12);
  const on = visible ? " is-on" : "";

  return (
    <section id="about" ref={ref} className="lp-section lp-section--tint">
      <div className="lp-shell lp-about">
        <div className={`lp-rv lp-rv--left${on}`}>
          <SectionHead
            eyebrow="About Us"
            title="A legacy of service. A commitment to society."
            lead="Mitra Maheshwari Seva Pratishthan is a Pune-based charitable trust dedicated to social welfare, healthcare, education and cultural unity."
          />
          <p className="lp-about__note">
            For over 27 years, we have worked to bring people together and make a
            meaningful difference.
          </p>
          <div className="lp-values">
            <article className="lp-value">
              <h3>Our Vision</h3>
              <p>A compassionate, united and supportive society.</p>
            </article>
            <article className="lp-value">
              <h3>Our Mission</h3>
              <p>Serving people through meaningful community initiatives.</p>
            </article>
          </div>
        </div>
        <div className={`lp-rv lp-rv--right lp-delay-1${on}`}>
          <MediaFrame label="Community gathering" className="lp-media--tall" />
        </div>
      </div>
    </section>
  );
}

export function InitiativesSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.08);
  const on = visible ? " is-on" : "";

  return (
    <section id="initiatives" ref={ref} className="lp-section">
      <div className="lp-shell">
        <SectionHead
          eyebrow="Our Initiatives"
          title="Making a difference, together."
          lead="Discover the initiatives through which we serve society."
        />
        <div className="lp-initiatives">
          {INITIATIVES.map((initiative, i) => (
            <article
              key={initiative.title}
              className={`lp-init lp-rv lp-rv--card lp-delay-${(i % 3) + 1}${on}${
                i === INITIATIVES.length - 1 ? " lp-init--wide" : ""
              }`}
            >
              <MediaFrame
                label={`${initiative.title} photo`}
                className="lp-init__media"
              />
              <div className="lp-init__body">
                <span className="kpi-icon-box" aria-hidden="true">
                  <LpIcon d={LP_PATHS[initiative.icon]} />
                </span>
                <div>
                  <h3 className="section-title">{initiative.title}</h3>
                  <p className="lp-init__text">{initiative.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PlatformSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id="community" ref={ref} className="lp-section lp-section--tint">
      <div className="lp-shell lp-platform">
        <div className="lp-rv lp-rv--left${on}">
          <SectionHead
            eyebrow="Our Community Platform"
            title="One community. Everything connected."
            lead="Stay connected with your family, discover members and access essential community services through our digital platform."
          />
          <div className="lp-bento-grid">
            {PLATFORM.map((item, i) => (
              <article
                key={item.title}
                className={`lp-bento-card lp-rv lp-rv--card lp-delay-${i + 1}${on}`}
              >
                <div className="lp-bento__header">
                  <span className="kpi-icon-box" aria-hidden="true">
                    <LpIcon d={LP_PATHS[item.icon]} />
                  </span>
                  <h3 className="lp-bento__title">{item.title}</h3>
                </div>
                <p className="lp-bento__text">{item.description}</p>
                <a
                  href="#"
                  className="lp-bento__link"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  Learn more →
                </a>
              </article>
            ))}
          </div>
        </div>
        <div className="lp-platform__actions lp-rv lp-delay-1${on}" style={{ textAlign: 'center' }}>
          <Link to="/register" className="btn btn--primary">
            Join the Community <span aria-hidden="true">→</span>
          </Link>
          <p className="muted">
            Already a member? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export function MembershipSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.12);
  const on = visible ? " is-on" : "";

  return (
    <section id="join" ref={ref} className={`lp-section${on}`}>
      <div className="lp-shell">
        <SectionHead
          eyebrow="Become a Member"
          title="Your community is just a few steps away."
          lead="Our platform brings your family records, members and community services together. Join in three simple steps."
          center
        />
        <ol className="lp-timeline lp-membership-steps">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className={`lp-rv lp-rv--card lp-step lp-delay-${i + 1}${on}`}
            >
              <h3 className="section-title">{step.title}</h3>
              <p className="lp-step__text">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const CONTACT = [
  { icon: "phone", label: "Call us", value: "9823340332", href: "tel:+919823340332" },
  {
    icon: "mail",
    label: "Email us",
    value: "info.mitramaheshwari@gmail.com",
    href: "mailto:info.mitramaheshwari@gmail.com",
  },
  {
    icon: "pin",
    label: "Visit us",
    value: "Anandnagar, Sinhgad Road, Pune, Maharashtra.",
  },
] satisfies { icon: LpIconName; label: string; value: string; href?: string }[];

export function ContactSection() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.12);
  const on = visible ? " is-on" : "";

  return (
    <section id="contact" ref={ref} className="lp-section lp-section--tint">
      <div className="lp-shell">
        <SectionHead eyebrow="Contact" title="Let's stay connected." />
        <div className="lp-contact">
          <div className="lp-contact__cards">
            {CONTACT.map((item, i) => (
              <article
                key={item.label}
                className={`lp-contact__card lp-rv lp-rv--card lp-delay-${i + 1}${on}`}
              >
                <span className="kpi-icon-box" aria-hidden="true">
                  <LpIcon d={LP_PATHS[item.icon]} />
                </span>
                <div>
                  <h3>{item.label}</h3>
                  {item.href ? (
                    <a href={item.href}>{item.value}</a>
                  ) : (
                    <p>{item.value}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className={`lp-rv lp-rv--right lp-delay-1${on}`}>
            <MediaFrame label="Pune community office" className="lp-contact__media" />
          </div>
        </div>
      </div>
    </section>
  );
}
