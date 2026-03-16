// Pure utility functions for building HTML table strings from AI Vision JSON data.

const esc = (s: any) => String(s ?? '');

/** Build use case table HTML from JSON array */
export const buildUseCaseTable = (arr: any[]): string =>
    `<table><tr><th>ID</th><th>Feature</th><th>Use Case</th><th>Use Case Description</th></tr>${
        arr.map(uc => `<tr><td>${esc(uc.id)}</td><td>${esc(uc.feature)}</td><td>${esc(uc.name || uc.use_case)}</td><td>${esc(uc.description)}</td></tr>`).join('')
    }</table>`;

/** Build screen details table HTML */
export const buildScreenDetailsTable = (arr: any[]): string =>
    `<table><tr><th>#</th><th>Feature</th><th>Screen</th><th>Description</th></tr>${
        arr.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.feature)}</td><td>${esc(s.screen || s.name)}</td><td>${esc(s.description)}</td></tr>`).join('')
    }</table>`;

/** Build user authorization table HTML — dynamic roles from permissions keys */
export const buildAuthorizationTable = (arr: any[]): string => {
    // Normalize permission value → "x" for access, "" for no access
    const toX = (v: any): string => {
        if (v === true || v === 'true' || v === 'x' || v === 'X' || v === 'yes') return 'x';
        return typeof v === 'string' && v.trim() ? v : '';
    };

    // Collect all unique role keys across all permission objects
    const roleSet = new Set<string>();
    arr.forEach(a => {
        const p = a.permissions || {};
        Object.keys(p).forEach(k => roleSet.add(k));
    });
    const roles = roleSet.size > 0
        ? Array.from(roleSet)
        : ['Admin', 'Lecturer', 'Team Leader', 'Team Member'];

    return `<table><tr><th>Screen</th>${roles.map(r => `<th>${esc(r)}</th>`).join('')}</tr>${
        arr.map(a => {
            const p = a.permissions || {};
            return `<tr><td>${esc(a.screenName || a.screen)}</td>${
                roles.map(r => `<td>${toX(p[r])}</td>`).join('')
            }</tr>`;
        }).join('')
    }</table>`;
};

/** Build db table descriptions HTML */
export const buildDbSchemaTable = (arr: any[]): string =>
    `<table><tr><th>No</th><th>Table</th><th>Description</th></tr>${
        arr.map((t, i) => `<tr><td>${esc(t.no ?? i + 1)}</td><td>${esc(t.table || t.name)}</td><td>${esc(t.description)}</td></tr>`).join('')
    }</table>`;

/** Build Section III Functional Requirements skeleton HTML with mockup AI action buttons */
export const buildFunctionalRequirementsHTML = (funcReqs: any[]): string => {
    let html = '';
    funcReqs.forEach((feature, fIdx) => {
        html += `<h3>${fIdx + 1}. ${esc(feature.name || '<<Feature Name>>')}</h3>`;
        const functions = feature.functions || [];
        functions.forEach((func: any, fnIdx: number) => {
            const letter = String.fromCharCode(97 + fnIdx);
            html += `<h4>${letter}. ${esc(func.name || '<<Function Name>>')}</h4>`;
            // Add mockup AI action button for each function
            html += `<div data-ai-action="mockup" data-done="false" class="srs-ai-action" contenteditable="false"><button class="srs-ai-action-btn" data-action-type="mockup">📷 Upload Image</button></div>`;
            html += `<ul>`;
            html += `<li>Function trigger:</li>`;
            html += `<li>Function description:</li>`;
            html += `<li>Function Details:</li>`;
            html += `</ul>`;
        });
    });
    return html;
};

/** Convert a File to base64 data URL */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
};
