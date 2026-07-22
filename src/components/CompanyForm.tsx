import { useEffect, useState } from "react";
import type { AxisGroup } from "../config/taxonomy";
import type { CompanyDraft } from "../types";
import { CompanyLogo } from "./CompanyLogo";

interface CompanyFormProps {
  initial: CompanyDraft;
  isEditing: boolean;
  domainAxis: AxisGroup[];
  capabilityAxis: AxisGroup[];
  onSave: (draft: CompanyDraft) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function CompanyForm({
  initial,
  isEditing,
  domainAxis,
  capabilityAxis,
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
            <label htmlFor="cf-domain">Scientific domain</label>
            <select
              id="cf-domain"
              value={draft.domain}
              onChange={(e) => set("domain", e.target.value)}
            >
              {domainAxis.map((group) => (
                <optgroup key={group.id} label={group.label ?? " "}>
                  {group.leaves.map((leaf) => (
                    <option key={leaf.id} value={leaf.id}>
                      {leaf.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="cf-capability">Capability</label>
            <select
              id="cf-capability"
              value={draft.capabilityRow}
              onChange={(e) => set("capabilityRow", e.target.value)}
            >
              {capabilityAxis.map((group) => (
                <optgroup key={group.id} label={group.label ?? " "}>
                  {group.leaves.map((leaf) => (
                    <option key={leaf.id} value={leaf.id}>
                      {leaf.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="cf-tag">Tag (optional)</label>
            <input
              id="cf-tag"
              value={draft.tag ?? ""}
              onChange={(e) => set("tag", e.target.value)}
              placeholder="e.g. Autonomous lab"
            />
          </div>
          <div className="form-field">
            <label htmlFor="cf-founded">Founded year (optional)</label>
            <input
              id="cf-founded"
              type="number"
              min={1900}
              max={2100}
              value={draft.foundedYear ?? ""}
              onChange={(e) =>
                set(
                  "foundedYear",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              placeholder="e.g. 2023"
            />
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
            placeholder="Rationale for this domain/capability position"
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
