import { useMemo, useState } from "react";
import type { Company } from "../types";
import { CompanyChip } from "./CompanyChip";
import { CompanyForm } from "./CompanyForm";

interface GridViewProps {
  companies: Company[];
  onUpdate: (id: string, draft: Omit<Company, "id">) => void;
  onDelete: (id: string) => void;
  domains: string[];
  bandLabels: string[];
}

export function GridView({
  companies,
  onUpdate,
  onDelete,
  domains,
  bandLabels,
}: GridViewProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const byDomain = useMemo(() => {
    const map = new Map<string, Company[]>();
    domains.forEach((d) => map.set(d, []));
    companies.forEach((c) => {
      if (!map.has(c.domain)) map.set(c.domain, []);
      map.get(c.domain)!.push(c);
    });
    map.forEach((list) => list.sort((a, b) => b.execution - a.execution));
    return map;
  }, [companies, domains]);

  return (
    <div className="grid-view">
      {domains.map((domain) => {
        const list = byDomain.get(domain) ?? [];
        return (
          <div key={domain} className="grid-card">
            <div className="grid-card-header">{domain}</div>
            <div className="grid-card-body">
              {list.length === 0 ? (
                <span className="grid-card-empty">No companies yet</span>
              ) : (
                list.map((company) => (
                  <CompanyChip
                    key={company.id}
                    company={company}
                    variant="grid"
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
          domains={domains}
          bandLabels={bandLabels}
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
