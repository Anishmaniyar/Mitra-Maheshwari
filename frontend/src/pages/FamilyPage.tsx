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
import { addFamilyMember, getFamily } from "../features/family/family.service";
import type { Family, NewMemberInput } from "../types/api";

export default function FamilyPage() {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const loadFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFamily();
      setFamily(res.family);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your family details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFamily();
  }, [loadFamily]);

  async function handleAdd(input: NewMemberInput) {
    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const res = await addFamilyMember(input);
      setFamily(res.family);
      setShowAddForm(false);
      setAddSuccess(`${input.firstName} ${input.lastName} was added to your family.`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add the family member. Please try again.");
    } finally {
      setAdding(false);
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
            </>
          )}
        </div>
      </PageContainer>
    </AppLayout>
  );
}