import type { JSONContent } from '@tiptap/core';
import type { SrsData } from '../components/srs/SrsTemplate';
import fptLogo from '../assets/logo-fpt.png';

// --- primitive node builders ---
const txt = (text: string): JSONContent => ({ type: 'text', text });
const bold = (text: string): JSONContent => ({ type: 'text', text, marks: [{ type: 'bold' }] });

function p(text?: string): JSONContent {
    return { type: 'paragraph', content: text ? [txt(text)] : undefined };
}
function pCenter(text: string): JSONContent {
    return { type: 'paragraph', attrs: { textAlign: 'center' }, content: [txt(text)] };
}
function h(level: 1 | 2 | 3 | 4 | 5 | 6, text: string): JSONContent {
    return { type: 'heading', attrs: { level }, content: [txt(text)] };
}
function hr(): JSONContent {
    return { type: 'horizontalRule' };
}

// --- table helpers ---
function th(text: string): JSONContent {
    return { type: 'tableHeader', attrs: {}, content: [{ type: 'paragraph', content: [bold(text)] }] };
}
function td(text: string): JSONContent {
    return { type: 'tableCell', attrs: {}, content: [p(text)] };
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

/**
 * Converts AI-generated SrsData JSON directly into a TipTap JSONContent document.
 * This avoids rendering via SrsTemplate → HTML → TipTap parse (which loses table editability).
 */
export function srsDataToTiptapContent(data: SrsData): JSONContent {
    const nodes: JSONContent[] = [];

    // ─── COVER PAGE ─────────────────────────────────────────────────────────────
    nodes.push(p());
    nodes.push({ type: 'image', attrs: { src: fptLogo, alt: 'FPT University Logo', width: '200px', align: 'center' } });
    nodes.push(p());
    nodes.push({ type: 'heading', attrs: { level: 1, textAlign: 'center' }, content: [txt(data.projectName || '<<PROJECT NAME>>')] });
    nodes.push({ type: 'heading', attrs: { level: 5, textAlign: 'center' }, content: [txt('Software Requirement Specification')] });
    // Push date to bottom of cover page with spacer lines
    for (let i = 0; i < 10; i++) nodes.push(p());
    nodes.push(pCenter(data.locationDate || '– Hanoi, April 2021 –'));
    nodes.push(hr()); // visual page break after cover

    // ─── I. OVERVIEW ────────────────────────────────────────────────────────────
    nodes.push(h(2, 'I. Overview'));

    // 1. Introduction
    nodes.push(h(3, '1. Introduction'));
    nodes.push(p(data.introduction?.overview || '[High-level overview of the product, environment, users, constraints...]'));
    nodes.push(p(data.introduction?.context || '[Context diagram and boundary connections...]'));

    // 2. Business Main Flows
    nodes.push(h(3, '2. Business Main Flows'));
    nodes.push(p(data.businessMainFlows?.description || '[Shows all the business main-flows...]'));
    (data.businessMainFlows?.flows ?? []).forEach((flow, idx) => {
        nodes.push(h(4, `2.${idx + 1}. ${flow.title ?? `Main-flow 0${idx + 1}`}`));
        nodes.push(p(flow.diagramPlaceholder ?? '[Swimlane diagram for main-flow here]'));
    });

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
    nodes.push(p(data.useCases?.description ?? '[A use case describes a sequence of interactions...]'));
    nodes.push(h(4, '4.1. Use Case Diagram(s)'));
    nodes.push(p(data.useCases?.diagramInfo ?? '[Provide the UC diagram(s) here]'));
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
    nodes.push(p(data.systemFunctions?.screenFlow ?? '[This part shows the system screens and relationship...]'));

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
    const roles = data.systemFunctions?.roles ?? [];
    const authRows = ensureDataRow(
        [
            tr(th('Screen'), ...roles.map(r => th(r.name))),
            ...(data.systemFunctions?.authorizations ?? []).map(auth =>
                tr(
                    td(auth.screenName ?? '<<Screen Name>>'),
                    ...roles.map(role => td(auth.permissions?.[role.id] ? 'X' : ''))
                )
            ),
        ],
        tr(td(''), ...roles.map(() => td('')))
    );
    nodes.push(table(authRows));

    nodes.push(h(4, '5.4. Non-Screen Functions'));
    nodes.push(p('[Provide the descriptions for the non-screen system functions, i.e batch/cron job, service, API, etc.]'));

    // ─── II. SYSTEM HIGH LEVEL DESIGN ───────────────────────────────────────────
    nodes.push(hr());
    nodes.push(h(2, 'II. System High Level Design'));

    nodes.push(h(3, '1. Conceptual Entity Relationship Diagram'));
    nodes.push(p(data.highLevelDesign?.conceptualERD ?? '<<Draw the Conceptual Entity Relationship Diagram here...>>'));

    nodes.push(h(3, '2. Logical Entity Relationship Diagram'));
    nodes.push(p(data.highLevelDesign?.logicalERD ?? '<<Draw the Logical Entity Relationship Diagram here...>>'));

    nodes.push(h(3, '3. Database Design'));
    nodes.push(h(4, 'a. Database Schema'));
    nodes.push(p(data.highLevelDesign?.dbSchema ?? '[Provide the tables relationship like example below]'));

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
            nodes.push(bulletList([
                `Function trigger: ${func.trigger ?? 'how this function is triggered...'}`,
                `Function description: ${func.description ?? 'actors/roles, purpose...'}`,
                `Screen layout: ${func.layoutInfo ?? 'mockup prototype of the screen...'}`,
            ]));
            nodes.push(p(`Function Details: ${func.details ?? 'provide explanation for the data, validation, business logics...'}`));
        });
    });

    return { type: 'doc', content: nodes };
}
