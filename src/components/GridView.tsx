import { useMemo, useState } from "react";
import { DOMAIN_AXIS, flattenLeaves } from "../config/taxonomy";
import type { Company } from "../types";
import { CompanyChip } from "./CompanyChip";
import { CompanyForm } from "./CompanyForm";

interface GridViewProps {
  companies: Company[];
  onUpdate: (id: string, draft: Omit<Company, "id">) => void;
  onDelete: (id: string) => void;
  query: string;
}

export function GridView({ companies, onUpdate, onDelete, query }: GridViewProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const domainLeaves = useMemo(() => flattenLeaves(DOMAIN_AXIS), []);

  const byDomain = useMemo(() => {
    const map = new Map<string, Company[]>();
    domainLeaves.forEach((leaf) => map.set(leaf.id, []));
    companies.forEach((c) => {
      if (!map.has(c.domain)) map.set(c.domain, []);
      map.get(c.domain)!.push(c);
    });
    map.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [companies, domainLeaves]);

  return (
    <div className="grid-view">
      {domainLeaves.map((leaf) => {
        const list = byDomain.get(leaf.id) ?? [];
        return (
          <div key={leaf.id} className="grid-card">
            <div className="grid-card-header">{leaf.label}</div>
            <div className="grid-card-body">
              {list.length === 0 ? (
                <span className="grid-card-empty">No companies yet</span>
              ) : (
                list.map((company) => (
                  <CompanyChip
                    key={company.id}
                    company={company}
                    variant="grid"
                    query={query}
                    onEdit={setEditingCompany}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}

      {editingCompany && (
        <CompanyForm
          initial={editingCompany}
          isEditing
          onCancel={() => setEditingCompany(null)}
          onDelete={() => {
            onDelete(editingCompany.id);
            setEditingCompany(null);
          }}
          onSave={(draft) => {
            onUpdate(editingCompany.id, draft);
            setEditingCompany(null);
          }}
        />
      )}
    </div>
  );
}
