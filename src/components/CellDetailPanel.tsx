import type { Company } from "../types";
import { CompanyLogo } from "./CompanyLogo";

interface CellDetailPanelProps {
  domainLabel: string;
  capabilityLabel: string;
  companies: Company[];
  onClose: () => void;
  onEdit: (company: Company) => void;
}

/**
 * "Zoom into a cell" — a clean, scrollable, never-overlapping, never-truncated
 * view of every company in one domain/capability cell.
 */
export function CellDetailPanel({
  domainLabel,
  capabilityLabel,
  companies,
  onClose,
  onEdit,
}: CellDetailPanelProps) {
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal-card cell-detail-card"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="cell-detail-header">
          <h2 className="modal-title">
            {domainLabel} <span className="cell-detail-sep">×</span> {capabilityLabel}
          </h2>
          <span className="cell-detail-count">{companies.length} companies</span>
        </div>

        <div className="cell-detail-list">
          {companies.map((company) => (
            <button
              key={company.id}
              className="cell-detail-row"
              onClick={() => onEdit(company)}
            >
              <CompanyLogo name={company.name} websiteUrl={company.websiteUrl} size={32} />
              <div className="cell-detail-row-text">
                <span className="cell-detail-row-name">{company.name}</span>
                <span className="cell-detail-row-desc">{company.description}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <div className="modal-actions-right">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
