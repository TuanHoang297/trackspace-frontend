import type { JSONContent } from '@tiptap/core';
import type { SrsData } from '../pages/Srs/components/editor/SrsTemplate';
import fptLogo from '../assets/logo-fpt.png';

// --- primitive node builders (defensive: coerce everything to string) ---
const safe = (v: any): string => (v == null ? '' : String(v));
const txt = (text: any): JSONContent => ({ type: 'text', text: safe(text) || ' ' }); // TipTap rejects empty text nodes
const bold = (text: any): JSONContent => ({ type: 'text', text: safe(text) || ' ', marks: [{ type: 'bold' }] });
const blueTxt = (text: any): JSONContent => ({ type: 'text', text: safe(text) || ' ', marks: [{ type: 'textStyle', attrs: { color: '#2563eb' } }, { type: 'italic' }] });

function p(text?: any): JSONContent {
    const s = safe(text);
    return { type: 'paragraph', content: s ? [txt(s)] : undefined };
}
function pBlue(text: any): JSONContent {
    return { type: 'paragraph', content: [blueTxt(text)] };
}

function h(level: 1 | 2 | 3 | 4 | 5 | 6, text: any): JSONContent {
    return { type: 'heading', attrs: { level }, content: [txt(text)] };
}
function hr(): JSONContent {
    return { type: 'horizontalRule' };
}

// --- table helpers ---
function th(text: any): JSONContent {
    return { type: 'tableHeader', attrs: {}, content: [{ type: 'paragraph', content: [bold(text)] }] };
}
function td(text: any): JSONContent {
    return { type: 'tableCell', attrs: {}, content: [p(safe(text))] };
}
function tdNodes(nodes: JSONContent[]): JSONContent {
    return { type: 'tableCell', attrs: {}, content: nodes.length ? nodes : [p()] };
}
function tr(...cells: JSONContent[]): JSONContent {
    return { type: 'tableRow', content: cells };
}
function table(rows: JSONContent[]): JSONContent {
    return { type: 'table', content: rows };
}

// --- bullet list ---
function bulletList(items: string[]): JSONContent {
    return {
        type: 'bulletList',
        content: items.map(text => ({ type: 'listItem', content: [p(text)] })),
    };
}

// Ensure a table has at least one data row so TipTap doesn't error
function ensureDataRow(rows: JSONContent[], emptyRow: JSONContent): JSONContent[] {
    return rows.length <= 1 ? [...rows, emptyRow] : rows;
}

// --- AI action button (hidden on PDF export) ---
function aiAction(actionType: string, label: string): JSONContent {
    return {
        type: 'aiActionButton',
        attrs: { actionType, label },
    };
}

/**
 * Converts AI-generated SrsData JSON directly into a TipTap JSONContent document.
 * This avoids rendering via SrsTemplate → HTML → TipTap parse (which loses table editability).
 */
export function srsDataToTiptapContent(data: SrsData): JSONContent {
    const nodes: JSONContent[] = [];

    // ─── COVER PAGE ─────────────────────────────────────────────────────────────
    nodes.push(p());
    nodes.push({ type: 'image', attrs: { src: fptLogo, alt: 'FPT University Logo', width: '200px', align: 'center' } });
    // Spacers between logo and title — push title to vertical center
    for (let i = 0; i < 7; i++) nodes.push(p());
    nodes.push({ type: 'heading', attrs: { level: 1, textAlign: 'center' }, content: [txt(data.projectName || '<<PROJECT NAME>>')] });
    nodes.push({ type: 'heading', attrs: { level: 5, textAlign: 'center' }, content: [txt('Software Requirement Specification')] });
    // Spacers after subtitle — push date to bottom of page
    for (let i = 0; i < 17; i++) nodes.push(p());
    nodes.push({ type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: safe(data.locationDate) || '– Ho Chi Minh, March 2026 –', marks: [{ type: 'textStyle', attrs: { fontSize: '14pt' } }] }] });
    nodes.push(hr()); // visual page break after cover

    // ─── I. OVERVIEW ────────────────────────────────────────────────────────────
    nodes.push(h(2, 'I. Overview'));

    // 1. Introduction
    nodes.push(h(3, '1. Introduction'));
    nodes.push(p(data.introduction?.overview || '[High-level overview of the product, environment, users, constraints...]'));
    nodes.push(p(data.introduction?.context || '[Context diagram and boundary connections...]'));
    nodes.push(pBlue('[Context diagram here]'));

    // 2. Business Main Flows
    nodes.push(h(3, '2. Business Main Flows'));
    nodes.push(pBlue(data.businessMainFlows?.description || '[This part shows all the business main-flows have to be implemented to get the Goal of your Project. You can draw the Swimlane diagram for the business main-flows]'));
    const flows = data.businessMainFlows?.flows ?? [];
    if (flows.length > 0) {
        flows.forEach((flow, idx) => {
            nodes.push(h(4, `2.${idx + 1}. ${flow.title ?? `Main-flow 0${idx + 1}`}`));
            nodes.push(pBlue(flow.diagramPlaceholder ?? `[Swimlane diagram for main-flow 0${idx + 1} here]`));
        });
    } else {
        // Default 3 main-flows
        for (let i = 1; i <= 3; i++) {
            nodes.push(h(4, `2.${i}. Main-flow 0${i}`));
            nodes.push(pBlue(`[Swimlane diagram for main-flow 0${i} here]`));
        }
    }

    // 3. Business Rules
    nodes.push(h(3, '3. Business Rules'));
    const brRows = ensureDataRow(
        [
            tr(th('Business Rule ID'), th('Business Rule Describe')),
            ...(data.businessRules ?? []).map(rule =>
                tr(td(rule.id ?? 'BR-01'), td(rule.description ?? 'Describe the business rule content here'))
            ),
        ],
        tr(td(''), td(''))
    );
    nodes.push(table(brRows));

    // 4. Use Cases
    nodes.push(h(3, '4. Use Cases'));
    nodes.push(h(4, '4.1. Use Case Diagram(s)'));
    nodes.push(aiAction('usecase', '📷 Upload Image'));
    nodes.push(h(4, '4.2. Descriptions'));
    const ucRows = ensureDataRow(
        [
            tr(th('ID'), th('Feature'), th('Use Case'), th('Use Case Description')),
            ...(data.useCases?.list ?? []).map(uc =>
                tr(td(uc.id ?? '01'), td(uc.feature ?? ''), td(uc.name ?? ''), td(uc.description ?? ''))
            ),
        ],
        tr(td(''), td(''), td(''), td(''))
    );
    nodes.push(table(ucRows));

    // 5. System Functions
    nodes.push(h(3, '5. System Functions'));
    nodes.push(h(4, '5.1. Screen Flow'));
    nodes.push(aiAction('screenflow', '📷 Upload Image'));

    nodes.push(h(4, '5.2. Screen Details'));
    const sdRows = ensureDataRow(
        [
            tr(th('#'), th('Feature'), th('Screen'), th('Description')),
            ...(data.systemFunctions?.screenDetails ?? []).map((screen, idx) =>
                tr(td(String(idx + 1)), td(screen.feature ?? ''), td(screen.name ?? ''), td(screen.description ?? ''))
            ),
        ],
        tr(td(''), td(''), td(''), td(''))
    );
    nodes.push(table(sdRows));

    nodes.push(h(4, '5.3. User Authorization'));
    const rawRoles = data.systemFunctions?.roles ?? [];
    // Gemini may return ["ADMIN","LECTURER"] (strings) or [{name:"Admin",id:"admin"}] (objects)
    const roleNames: string[] = rawRoles.map((r: any) => typeof r === 'string' ? r : (r.name ?? ''));
    const rawAuth = data.systemFunctions?.authorizations ?? [];
    // authorizations may be string[] (placeholder) or object[] ({screenName, permissions})
    const authObjects = rawAuth.filter((a: any) => typeof a === 'object' && a !== null && a.screenName);
    const authRows = ensureDataRow(
        [
            tr(th('Screen'), ...roleNames.map(name => th(name))),
            ...authObjects.map((auth: any) =>
                tr(
                    td(auth.screenName ?? '<<Screen Name>>'),
                    ...roleNames.map((_name: string, idx: number) => td(auth.permissions?.[idx] ? 'X' : ''))
                )
            ),
        ],
        tr(td(''), ...roleNames.map(() => td('')))
    );
    nodes.push(table(authRows));

    nodes.push(h(4, '5.4. Non-Screen Functions'));
    const nsfRows = ensureDataRow(
        [
            tr(th('#'), th('Feature'), th('System Function'), th('Description')),
            ...(data.systemFunctions?.nonScreenFunctions ?? []).map((nsf, idx) =>
                tr(td(String(idx + 1)), td(nsf.feature ?? ''), td(nsf.name ?? ''), td(nsf.description ?? ''))
            ),
        ],
        tr(td(''), td(''), td(''), td(''))
    );
    nodes.push(table(nsfRows));

    // ─── II. SYSTEM HIGH LEVEL DESIGN ───────────────────────────────────────────
    nodes.push(hr());
    nodes.push(h(2, 'II. System High Level Design'));

    nodes.push(h(3, '1. Conceptual Entity Relationship Diagram'));
    nodes.push(pBlue(data.highLevelDesign?.conceptualERD || '<<Draw the Conceptual Entity Relationship Diagram here showing all entities and relationship here...>>'));

    nodes.push(h(3, '2. Logical Entity Relationship Diagram'));
    nodes.push(pBlue(data.highLevelDesign?.logicalERD || '<<Draw the Logical Entity Relationship Diagram here showing all entities, relationship of all entities, attributes, primary key, foreign key of each entity here...>>'));

    nodes.push(h(3, '3. Database Design'));
    nodes.push(h(4, 'a. Database Schema'));
    nodes.push(aiAction('db_schema', '📷 Upload Image'));

    nodes.push(h(4, 'b. Table Descriptions'));
    const dbRows = ensureDataRow(
        [
            tr(th('No'), th('Table'), th('Description')),
            ...(data.highLevelDesign?.tables ?? []).map((t, idx) =>
                tr(
                    td(idx < 9 ? `0${idx + 1}` : String(idx + 1)),
                    td(t.name ?? '<Table name>'),
                    tdNodes([
                        p(t.description ?? '<Description of the table>'),
                        p(`- Primary keys: ${t.pk ?? '<<list>>'}`),
                        p(`- Foreign keys: ${t.fk ?? '<<list>>'}`),
                    ])
                )
            ),
        ],
        tr(td(''), td(''), td(''))
    );
    nodes.push(table(dbRows));

    // ─── III. FUNCTIONAL REQUIREMENTS ───────────────────────────────────────────
    nodes.push(hr());
    nodes.push(h(2, 'III. Functional Requirements'));

    (data.functionalRequirements ?? []).forEach((feature, fIdx) => {
        nodes.push(h(3, `${fIdx + 1}. ${feature.name ?? '<<Feature Name>>'}`));
        (feature.functions ?? []).forEach((func, fnIdx) => {
            const letter = String.fromCharCode(97 + fnIdx);
            nodes.push(h(4, `${letter}. ${func.name ?? '<<Function Name>>'}`));
            nodes.push(aiAction('mockup', '📷 Upload Image'));
            nodes.push(bulletList([
                `Function trigger: ${func.trigger ?? ''}`,
                `Function description: ${func.description ?? ''}`,
                `Function Details: ${func.details ?? ''}`,
            ]));
        });
    });

    // If no functionalRequirements data, show placeholder
    if (!data.functionalRequirements || data.functionalRequirements.length === 0) {
        nodes.push(p('[This section will be auto-generated when you upload the Screen Flow diagram in section 5.1 above]'));
    }

    return { type: 'doc', content: nodes };
}
