import { useEffect, useState } from "react";
import type { CompanyDraft } from "../types";
import { CompanyLogo } from "./CompanyLogo";

interface CompanyFormProps {
  initial: CompanyDraft;
  isEditing: boolean;
  domains: string[];
  bandLabels: string[];
  onSave: (draft: CompanyDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function CompanyForm({
  initial,
  isEditing,
  domains,
  bandLabels,
  onSave,
  onCancel,
  onDelete,
}: CompanyFormProps) {
  const [draft, setDraft] = useState<CompanyDraft>(initial);

  useEffect(() => setDraft(initial), [initial]);

  const set = <K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const canSave = draft.name.trim().length > 0 && draft.websiteUrl.trim().length > 0;

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div
        className="modal-card"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="modal-title">
          {isEditing ? "Edit company" : "Add company"}
        </h2>

        <div className="form-row form-row-logo">
          <CompanyLogo name={draft.name} websiteUrl={draft.websiteUrl} size={44} />
          <div className="form-field form-field-grow">
            <label htmlFor="cf-name">Name</label>
            <input
              id="cf-name"
              autoFocus
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Company name"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="cf-url">Website</label>
          <input
            id="cf-url"
            value={draft.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
            placeholder="example.com"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="cf-domain">Domain</label>
            <select
              id="cf-domain"
              value={draft.domain}
              onChange={(e) => set("domain", e.target.value)}
            >
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="cf-tag">Tag (optional)</label>
            <input
              id="cf-tag"
              value={draft.tag ?? ""}
              onChange={(e) => set("tag", e.target.value)}
              placeholder="e.g. Autonomous lab"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="cf-execution">
            Full-stack execution / autonomy: <strong>{Math.round(draft.execution)}</strong>
          </label>
          <input
            id="cf-execution"
            type="range"
            min={0}
            max={100}
            value={draft.execution}
            onChange={(e) => set("execution", Number(e.target.value))}
          />
          <div className="slider-scale">
            {bandLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="cf-desc">Description</label>
          <textarea
            id="cf-desc"
            rows={2}
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="1-2 sentences on what they do"
          />
        </div>

        <div className="form-field">
          <label htmlFor="cf-rationale">Why it's placed here</label>
          <textarea
            id="cf-rationale"
            rows={2}
            value={draft.rationale}
            onChange={(e) => set("rationale", e.target.value)}
            placeholder="Rationale for this domain/execution position"
          />
        </div>

        <div className="modal-actions">
          {isEditing && onDelete && (
            <button type="button" className="btn btn-danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <div className="modal-actions-right">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!canSave}
              onClick={() => onSave(draft)}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
