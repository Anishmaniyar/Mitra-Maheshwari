import type { ReactNode } from "react";
import { LpIcon, LP_PATHS } from "../common/LpIcon";

/* ============================================================
   Public-site product mockups (landing + inner pages).

   Pure markup + CSS — no photographs, no stock imagery and no
   invented features. Every screen below mirrors the real product
   as it is built today: the member shell (top header + grouped
   sidebar), the dashboard panels, family and directory lists,
   blood support, community services, membership & payments and
   the three-step onboarding.

   Sizes are expressed in `em` so a single font-size on
   `.hm-window` scales an entire mockup for smaller screens.
   ============================================================ */

interface WindowProps {
  url: string;
  label: string;
  className?: string;
  children: ReactNode;
}

function Window({ url, label, className = "", children }: WindowProps) {
  return (
    <div className={`hm-window${className ? ` ${className}` : ""}`} role="img" aria-label={label}>
      <div className="hm-bar">
        <span className="hm-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="hm-url">{url}</span>
        <span className="hm-bar-gap" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}

function Avatar({ tone = 0 }: { tone?: number }) {
  return <span className={`hm-avatar hm-avatar--${tone}`} aria-hidden="true" />;
}

/* Decorative mini screen used inside feature cards. */
function Mini({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hm-mini${className ? ` ${className}` : ""}`} aria-hidden="true">
      {children}
    </div>
  );
}

const FLOAT_SLOTS = ["member", "membership", "blood", "update"] as const;

/**
 * Shared hero composition: one large product screen with optional floating UI
 * cards layered around it. Used by the landing page and the public inner pages
 * so every hero reads the same way.
 */
export function HeroStage({ screen, floats = [] }: { screen: ReactNode; floats?: ReactNode[] }) {
  return (
    <div className="home-stage">
      <div className="home-stage__glow" aria-hidden="true" />
      <div className="home-stage__screen">{screen}</div>
      {floats.slice(0, FLOAT_SLOTS.length).map((float, i) => (
        <div key={FLOAT_SLOTS[i]} className={`home-float home-float--${FLOAT_SLOTS[i]}`}>
          {float}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Shared app chrome                                                */
/* ---------------------------------------------------------------- */

/** The portal's compact top header: brand, then notification + profile. */
function TopBar() {
  return (
    <div className="hm-topbar" aria-hidden="true">
      <span className="hm-topbar__brand">Mitra Maheshwari</span>
      <span className="hm-topbar__gap" />
      <span className="hm-topbar__icon">
        <LpIcon d={LP_PATHS.bell} label="" />
      </span>
      <span className="hm-topbar__user">
        <Avatar tone={1} />
      </span>
    </div>
  );
}

/** Sidebar navigation, grouped exactly like MemberShell. */
const NAV_GROUPS = [
  { label: "Overview", items: ["Dashboard"], active: "Dashboard" },
  {
    label: "My Community",
    items: ["My Family", "Discover", "Blood Support", "Services", "Matrimony"],
    active: "",
  },
  {
    label: "Account",
    items: ["Membership", "Payments", "Notifications", "Profile"],
    active: "",
  },
] as const;

function Sidebar() {
  return (
    <aside className="hm-sidebar">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="hm-nav-group">
          <span className="hm-nav-group__label">{group.label}</span>
          {group.items.map((item) => (
            <span key={item} className={`hm-nav${item === group.active ? " is-active" : ""}`}>
              {item}
            </span>
          ))}
        </div>
      ))}
      <div className="hm-sidebar__foot">
        <Avatar tone={1} />
        <span className="hm-sidebar__who">
          <strong>Member</strong>
          <em>Verified account</em>
        </span>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Large product screens                                               */
/* ------------------------------------------------------------------ */

const SUMMARY_TILES = [
  { icon: LP_PATHS.users, label: "My Family", value: "4 Members", sub: "Family #MM-014" },
  { icon: LP_PATHS.card, label: "Membership", value: "This year", sub: "Payment pending" },
  { icon: LP_PATHS.receipt, label: "Payments", value: "Community fee", sub: "Receipt in history" },
  { icon: LP_PATHS.user, label: "Profile", value: "Complete", sub: "Verified account" },
] as const;

export function DashboardMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/dashboard"
      className="hm-window--app"
      label="Preview of the Mitra Maheshwari community dashboard with navigation, family summary and membership status"
    >
      <TopBar />
      <div className="hm-app">
        <Sidebar />

        <div className="hm-content">
          <div className="hm-pagehead">
            <span className="hm-eyebrow">Member Dashboard</span>
            <span className="hm-h3">Namaste, Member!</span>
            <span className="hm-sub">
              Manage your family, membership and community activity from one place.
            </span>
          </div>

          <div className="hm-summary">
            {SUMMARY_TILES.map((tile) => (
              <div key={tile.label} className="hm-tile">
                <span className="hm-tile__icon">
                  <LpIcon d={tile.icon} label="" />
                </span>
                <span className="hm-label">{tile.label}</span>
                <strong className="hm-tile__value">{tile.value}</strong>
                <span className="hm-small">{tile.sub}</span>
              </div>
            ))}
          </div>

          <div className="hm-blocks">
            <div className="hm-block">
              <div className="hm-block__head">
                <strong>My Family</strong>
                <span className="hm-tile__link">View Family →</span>
              </div>
              <div className="hm-rows">
                {[
                  { name: "Head of family", meta: "Primary record · family head" },
                  { name: "Spouse", meta: "Linked to the head of family" },
                  { name: "Child", meta: "Linked to the head of family" },
                ].map((member, i) => (
                  <div key={member.name} className="hm-row">
                    <Avatar tone={i + 1} />
                    <span className="hm-row__main">
                      <strong>{member.name}</strong>
                      <span className="hm-small">{member.meta}</span>
                    </span>
                    {i === 0 && <span className="hm-chip hm-chip--flat">Head</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="hm-block">
              <div className="hm-block__head">
                <strong>Membership</strong>
                <span className="hm-chip hm-chip--ok">Active</span>
              </div>
              <div className="hm-kv">
                <span>
                  <em>Plan</em>
                  <strong>Annual membership</strong>
                </span>
                <span>
                  <em>Status</em>
                  <strong>Renewal reminder enabled</strong>
                </span>
              </div>
              <div className="hm-rows">
                <div className="hm-row">
                  <span className="hm-activity__dot" aria-hidden="true" />
                  <span className="hm-row__main">
                    <strong>Community update</strong>
                    <span className="hm-small">Membership renewals are now open</span>
                  </span>
                </div>
                <div className="hm-row">
                  <span className="hm-activity__dot hm-activity__dot--muted" aria-hidden="true" />
                  <span className="hm-row__main">
                    <strong>Blood support</strong>
                    <span className="hm-small">Requests reach verified community donors</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Window>
  );
}

export function FamilyMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/family"
      label="Preview of family management with the head of family, relationships and member details"
    >
      <div className="hm-panel">
        <div className="hm-panel__head">
          <span>
            <span className="hm-eyebrow">My Family</span>
            <span className="hm-h3">Manage Your Family</span>
            <span className="hm-sub">Keep your family information up to date.</span>
          </span>
          <span className="hm-btn">Add member</span>
        </div>

        <div className="hm-rows">
          <div className="hm-row">
            <Avatar tone={1} />
            <span className="hm-row__main">
              <strong>Head of family</strong>
              <span className="hm-small">Primary record for this family</span>
            </span>
            <span className="hm-chip hm-chip--ok">Verified</span>
          </div>

          {[
            { relation: "Spouse", detail: "Linked to the head of family" },
            { relation: "Child", detail: "Linked to the head of family" },
            { relation: "Child", detail: "Linked to the head of family" },
          ].map((row, i) => (
            <div key={`${row.relation}-${i}`} className="hm-row">
              <Avatar tone={i + 2} />
              <span className="hm-row__main">
                <strong>{row.relation}</strong>
                <span className="hm-small">{row.detail}</span>
              </span>
              <span className="hm-btn hm-btn--ghost">Edit</span>
            </div>
          ))}
        </div>

        <div className="hm-note">
          Family members are linked to one community record and stay in sync.
        </div>
      </div>
    </Window>
  );
}

export function DirectoryMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/discover"
      label="Preview of the community directory with member search, filters and member cards"
    >
      <div className="hm-panel">
        <div className="hm-search">
          <LpIcon d={LP_PATHS.search} label="" />
          <span className="hm-search__text">Search members by name, area or occupation</span>
          <span className="hm-btn">Search</span>
        </div>

        <div className="hm-chips">
          {["Area", "Occupation", "Family", "Verified members"].map((chip) => (
            <span key={chip} className="hm-chip hm-chip--flat">
              {chip}
            </span>
          ))}
        </div>

        <div className="hm-rows">
          {[
            "Business owner · community area",
            "Professional · community area",
            "Community service · community area",
          ].map((meta, i) => (
            <div key={meta} className="hm-row">
              <Avatar tone={i + 1} />
              <span className="hm-row__main">
                <strong>Verified community member</strong>
                <span className="hm-small">{meta}</span>
              </span>
              <span className="hm-btn hm-btn--ghost">View profile</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function BloodMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/blood"
      label="Preview of blood support with blood group filters, donor availability and requests"
    >
      <div className="hm-panel">
        <div className="hm-panel__head">
          <span>
            <span className="hm-eyebrow">Blood Support</span>
            <span className="hm-h3">Blood Donor Search</span>
            <span className="hm-sub">Find matching donors within the community.</span>
          </span>
          <span className="hm-chip hm-chip--ok">Donors available</span>
        </div>

        <div className="hm-chips">
          {["A+", "B+", "O+", "AB+"].map((group, i) => (
            <span key={group} className={`hm-group${i === 2 ? " is-active" : ""}`}>
              {group}
            </span>
          ))}
        </div>

        <div className="hm-rows">
          {[
            "Available to donate · contact shared on consent",
            "Available to donate · contact shared on consent",
            "Available to donate · contact shared on consent",
          ].map((meta, i) => (
            <div key={i} className="hm-row">
              <span className="hm-drop">O+</span>
              <span className="hm-row__main">
                <strong>Verified community donor</strong>
                <span className="hm-small">{meta}</span>
              </span>
              <span className="hm-btn hm-btn--ghost">Request</span>
            </div>
          ))}
        </div>

        <div className="hm-note">
          Requests notify the donor privately. Contact details are shared only on consent.
        </div>
      </div>
    </Window>
  );
}

export function ServicesMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/services"
      label="Preview of community services with business and professional listings"
    >
      <div className="hm-panel">
        <div className="hm-panel__head">
          <span>
            <span className="hm-eyebrow">Community Services</span>
            <span className="hm-h3">Businesses and Professionals</span>
            <span className="hm-sub">Offered by community members.</span>
          </span>
          <span className="hm-chip hm-chip--flat">All categories</span>
        </div>

        <div className="hm-grid-3">
          {[
            { category: "Business", title: "Community business listing" },
            { category: "Professional", title: "Professional service listing" },
            { category: "Community service", title: "Community service listing" },
          ].map((service) => (
            <div key={service.title} className="hm-card">
              <span className="hm-label">{service.category}</span>
              <strong>{service.title}</strong>
              <span className="hm-small">Offered by a community member</span>
              <span className="hm-btn hm-btn--ghost">View details</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function MembershipMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/membership"
      label="Preview of membership status, annual plan and payment history with receipts"
    >
      <div className="hm-panel">
        <div className="hm-panel__head">
          <span>
            <span className="hm-eyebrow">Membership</span>
            <span className="hm-h3">Current Membership Status</span>
            <span className="hm-sub">Your annual community membership at a glance.</span>
          </span>
          <span className="hm-chip hm-chip--ok">Active</span>
        </div>

        <div className="hm-kv">
          <span>
            <em>Plan</em>
            <strong>Annual membership</strong>
          </span>
          <span>
            <em>Amount</em>
            <strong>Community fee</strong>
          </span>
          <span>
            <em>Status</em>
            <strong>Renewal reminder enabled</strong>
          </span>
        </div>

        <div className="hm-rows">
          {[0, 1, 2].map((row) => (
            <div key={row} className="hm-row">
              <span className="hm-receipt" aria-hidden="true">
                <LpIcon d={LP_PATHS.receipt} label="" />
              </span>
              <span className="hm-row__main">
                <strong>Membership payment</strong>
                <span className="hm-small">Receipt available in payment history</span>
              </span>
              <span className="hm-chip hm-chip--flat">Paid</span>
            </div>
          ))}
        </div>
      </div>
    </Window>
  );
}

export function OnboardingMockup() {
  return (
    <Window
      url="app.mitramaheshwari.org/register"
      label="Preview of community registration: find your record, verify with OTP and access the platform"
    >
      <div className="hm-onb">
        <span className="hm-topbar__brand">Mitra Maheshwari</span>

        <div className="hm-onb__topbar">
          <span className="hm-back">← Back</span>
          <span className="hm-eyebrow">Join the Community</span>
        </div>

        <div className="hm-steps">
          {["Find Your Record", "Review Details", "Verify OTP"].map((label, i) => (
            <span key={label} className={`hm-step${i === 0 ? " is-active" : ""}`}>
              <span className="hm-step__bar" />
              <span className="hm-step__label">
                <b>{i + 1}</b>
                {label}
              </span>
            </span>
          ))}
        </div>

        <span className="hm-h3">Let&rsquo;s find your community record</span>
        <span className="hm-sub">
          Enter your details to check whether your community record already exists.
        </span>

        <div className="hm-fields">
          {["First name", "Last name"].map((label) => (
            <span key={label} className="hm-field">
              <span className="hm-field__label">{label}</span>
              <span className="hm-field__box" />
            </span>
          ))}
          <span className="hm-field hm-field--wide">
            <span className="hm-field__label">Mobile number</span>
            <span className="hm-field__box" />
          </span>
        </div>

        <div className="hm-actions">
          <span className="hm-small">
            Used only to identify your community record and continue registration.
          </span>
          <span className="hm-btn">Continue</span>
        </div>
      </div>
    </Window>
  );
}

/* ------------------------------------------------------------------ */
/* Floating UI cards layered around the hero screen                    */
/* ------------------------------------------------------------------ */

export function FloatMemberCard() {
  return (
    <div className="hm-float" aria-hidden="true">
      <Avatar tone={1} />
      <span className="hm-float__body">
        <span className="hm-label">Member profile</span>
        <strong>Head of family</strong>
        <span className="hm-small">Family information up to date</span>
      </span>
    </div>
  );
}

export function FloatMembershipCard() {
  return (
    <div className="hm-float" aria-hidden="true">
      <span className="hm-float__body">
        <span className="hm-label">Membership status</span>
        <span className="hm-chip hm-chip--ok">Active</span>
        <span className="hm-small">Annual plan · renews yearly</span>
      </span>
    </div>
  );
}

export function FloatBloodCard() {
  return (
    <div className="hm-float" aria-hidden="true">
      <span className="hm-drop">O+</span>
      <span className="hm-float__body">
        <span className="hm-label">Blood support</span>
        <strong>Matching donor found</strong>
        <span className="hm-small">Within the community</span>
      </span>
    </div>
  );
}

export function FloatUpdateCard() {
  return (
    <div className="hm-float" aria-hidden="true">
      <span className="hm-receipt">
        <LpIcon d={LP_PATHS.bell} label="" />
      </span>
      <span className="hm-float__body">
        <span className="hm-label">Community update</span>
        <strong>Membership renewals are now open</strong>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Miniature product screens for feature cards                         */
/* ------------------------------------------------------------------ */

export function MiniFamily() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">My Family</span>
        <span className="hm-chip hm-chip--flat">Members</span>
      </div>
      {["Head of family", "Spouse", "Child"].map((relation, i) => (
        <div key={relation + i} className="hm-mini__row">
          <Avatar tone={i} />
          <span className="hm-mini__text">
            <strong>{relation}</strong>
            <span className="hm-small">Linked profile</span>
          </span>
        </div>
      ))}
    </Mini>
  );
}

export function MiniBlood() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Blood support</span>
        <span className="hm-chip hm-chip--ok">Available</span>
      </div>
      <div className="hm-mini__row">
        <span className="hm-drop">O+</span>
        <span className="hm-mini__text">
          <strong>Verified donor</strong>
          <span className="hm-small">Matching blood group</span>
        </span>
      </div>
      <div className="hm-mini__note">
        <span className="hm-activity__dot" />
        Emergency request
      </div>
    </Mini>
  );
}

export function MiniServices() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Community services</span>
        <span className="hm-chip hm-chip--flat">Categories</span>
      </div>
      {["Business", "Professional", "Community service"].map((category) => (
        <div key={category} className="hm-mini__row hm-mini__row--flat">
          <span className="hm-mini__text">
            <strong>{category}</strong>
            <span className="hm-small">Listed by a community member</span>
          </span>
        </div>
      ))}
    </Mini>
  );
}

export function MiniMatrimony() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Matrimony</span>
        <span className="hm-chip hm-chip--flat">Profiles</span>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="hm-mini__row">
          <Avatar tone={i + 1} />
          <span className="hm-mini__text">
            <strong>Community profile</strong>
            <span className="hm-small">Details shared on consent</span>
          </span>
        </div>
      ))}
    </Mini>
  );
}

export function MiniMembership() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Membership</span>
        <span className="hm-chip hm-chip--ok">Active</span>
      </div>
      <div className="hm-mini__row">
        <span className="hm-receipt">
          <LpIcon d={LP_PATHS.receipt} label="" />
        </span>
        <span className="hm-mini__text">
          <strong>Annual membership</strong>
          <span className="hm-small">Receipt in payment history</span>
        </span>
      </div>
      <div className="hm-mini__note">
        <span className="hm-activity__dot hm-activity__dot--muted" />
        Renewal reminder enabled
      </div>
    </Mini>
  );
}

export function MiniEvents() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Events &amp; activities</span>
        <span className="hm-chip hm-chip--flat">Calendar</span>
      </div>
      {[
        { day: "12", meta: "Community gathering · Community area" },
        { day: "24", meta: "Cultural activity · Community area" },
      ].map((event) => (
        <div key={event.day} className="hm-mini__row">
          <span className="hm-date">{event.day}</span>
          <span className="hm-mini__text">
            <strong>Community activity</strong>
            <span className="hm-small">{event.meta}</span>
          </span>
        </div>
      ))}
    </Mini>
  );
}

export function MiniNotifications() {
  return (
    <Mini>
      <div className="hm-mini__head">
        <span className="hm-label">Updates</span>
        <LpIcon d={LP_PATHS.bell} label="" />
      </div>
      {["Community announcement", "Membership reminder", "Blood support request"].map((item) => (
        <div key={item} className="hm-mini__note">
          <span className="hm-activity__dot" />
          {item}
        </div>
      ))}
    </Mini>
  );
}
