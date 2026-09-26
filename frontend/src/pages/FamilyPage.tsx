import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/common/Button";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { AddFamilyMemberForm } from "../features/family/AddFamilyMemberForm";
import { FamilyMemberList } from "../features/family/FamilyMemberList";
import { addFamilyMember, cancelInvitation, getFamily, listInvitations } from "../features/family/family.service";
import { useAuth } from "../hooks/useAuth";
import type { Family, FamilyInvitation, NewMemberInput } from "../types/api";

export default function FamilyPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFamily();
      setFamily(res.family);
      if (user?.isHead) {
        try {
          const invites = await listInvitations();
          setInvitations(invites.invitations);
        } catch {
          setInvitations([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your family details.");
    } finally {
      setLoading(false);
    }
  }, [user?.isHead]);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  async function handleAdd(input: NewMemberInput) {
    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    setInviteLink(null);
    try {
      const res = await addFamilyMember(input);
      setFamily(res.family);
      setShowAddForm(false);
      setAddSuccess(`An invitation was created for ${input.firstName} ${input.lastName}.`);
      setInviteLink(res.inviteLink || null);
      const invites = await listInvitations();
      setInvitations(invites.invitations);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add the family member. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleCancelInvitation(id: string) {
    setCancellingId(id);
    try {
      await cancelInvitation(id);
      const invites = await listInvitations();
      setInvitations(invites.invitations);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not cancel the invitation. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="My Family"
            title="Manage Your Family"
            description="Keep your family information up to date."
          />

          {addSuccess && <div className="notice notice--success" style={{ marginBottom: "var(--space-4)" }}>{addSuccess}</div>}
          {inviteLink && (
            <div className="notice notice--info" style={{ marginBottom: "var(--space-4)" }}>
              Share this invitation link: {inviteLink}
            </div>
          )}

          {loading && <LoadingState message="Loading your family…" />}

          {error && !family && (
            <ErrorState
              title="We couldn't load your family."
              message={error}
              actionLabel="Try again"
              onAction={() => void loadFamily()}
            />
          )}

          {family && (
            <>
              <div style={{ marginBottom: "var(--space-5)" }}>
                {showAddForm ? (
                  <AddFamilyMemberForm
                    busy={adding}
                    error={addError}
                    onAdd={(input) => void handleAdd(input)}
                    onCancel={() => {
                      setShowAddForm(false);
                      setAddError(null);
                    }}
                  />
                ) : (
                  <Button variant="secondary" onClick={() => setShowAddForm(true)}>
                    + Add Family Member
                  </Button>
                )}
              </div>

              {family.members.length > 0 ? (
                <FamilyMemberList members={family.members} />
              ) : (
                <EmptyState
                  title="No family members have been added yet."
                  message="Add a family member to get started."
                />
              )}

              {user?.isHead && invitations.length > 0 && (
                <section className="app-section" aria-labelledby="pending-invitations">
                  <div className="app-section__head">
                    <h2 id="pending-invitations">Pending invitations</h2>
                  </div>
                  <div className="member-grid">
                    {invitations
                      .filter((inv) => inv.status === "PENDING")
                      .map((inv) => (
                        <div key={inv.id} className="member-row">
                          <div className="member-row__top">
                            <span className="member-row__name">{inv.inviteeName}</span>
                            <Button
                              variant="secondary"
                              onClick={() => void handleCancelInvitation(inv.id)}
                              loading={cancellingId === inv.id}
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="member-row__meta">
                            {[inv.inviteeMobile, inv.inviteeEmail].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}