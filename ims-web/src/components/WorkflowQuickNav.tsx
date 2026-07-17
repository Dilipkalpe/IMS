import { workspaceWorkflows, workflowRegistry } from '../navigation/workflowRegistry';
import './WorkflowQuickNav.scss';

export interface WorkflowQuickNavProps {
  onSelect: (navKey: string) => void;
}

/** QA menu: jump to WPF-aligned workflows (workspaces, designers, reports) */
export function WorkflowQuickNav({ onSelect }: WorkflowQuickNavProps) {
  return (
    <label className="workflow-quick-nav">
      <span className="workflow-quick-nav__label">Workflows</span>
      <select
        className="workflow-quick-nav__select"
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value;
          if (v) onSelect(v);
          e.target.value = '';
        }}
      >
        <option value="" disabled>
          Validate workflow…
        </option>
        <optgroup label="Core">
          {workflowRegistry.map((w) => (
            <option key={w.id} value={w.reactNavKey}>
              {w.title}
            </option>
          ))}
        </optgroup>
        <optgroup label="Document workspaces">
          {workspaceWorkflows.map((w) => (
            <option key={w.navKey} value={w.navKey}>
              {w.title}
            </option>
          ))}
        </optgroup>
        <optgroup label="Master forms">
          <option value="product-master-form">Product Master Form</option>
          <option value="account-master-form">Account Master Form</option>
        </optgroup>
        <optgroup label="Designers">
          <option value="bill-format-design">Bill Format Designer</option>
          <option value="report-format-design">Report Format (Canvas)</option>
        </optgroup>
      </select>
    </label>
  );
}
