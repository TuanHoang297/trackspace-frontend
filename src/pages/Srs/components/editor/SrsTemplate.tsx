import React from 'react';
import fptLogo from '../../../../assets/logo-fpt.png';
export interface SrsData {
    projectName?: string;
    locationDate?: string;
    introduction: {
        overview?: string;
        context?: string;
    };
    businessMainFlows: {
        description?: string;
        flows?: { title?: string; diagramPlaceholder?: string }[];
    };
    businessRules?: {
        id?: string;
        description?: string;
    }[];
    useCases: {
        description?: string;
        diagramInfo?: string;
        list?: { id?: string; feature?: string; name?: string; description?: string }[];
    };
    systemFunctions: {
        screenFlow?: string;
        screenDetails?: { feature?: string; name?: string; description?: string }[];
        roles?: { id: string; name: string }[];
        authorizations?: { screenName?: string; permissions: Record<string, boolean> }[];
        nonScreenFunctions?: { feature?: string; name?: string; description?: string }[];
    };
    highLevelDesign: {
        conceptualERD?: string;
        logicalERD?: string;
        dbSchema?: string;
        tables?: { name?: string; description?: string; pk?: string; fk?: string }[];
    };
    functionalRequirements?: {
        name?: string;
        functions?: { name?: string; trigger?: string; description?: string; layoutInfo?: string; details?: string }[];
    }[];
}

interface SrsTemplateProps {
    srsData: SrsData;
}

export const SrsTemplate: React.FC<SrsTemplateProps> = ({ srsData }) => {
    return (
    <div className="srs-container">
      
      {/* --- COVER PAGE --- */}
      {/* Thêm style "page-break-after: always" để in PDF thì trang cover tách ra một trang riêng biệt */}
      <header className="srs-cover-page" style={{ textAlign: 'center', marginBottom: '80px', marginTop: '40px', minHeight: '800px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pageBreakAfter: 'always' }}>
        <div>
           {/* LOGO TRƯỜNG FPT Ở ĐÂY */}
           <img 
               src={fptLogo} 
               alt="FPT University Logo" 
               style={{ width: '200px', height: 'auto', marginBottom: '20px' }} 
           />
        </div>

        <div style={{ margin: '150px 0' }}>
            <h1 className="srs-title">{srsData.projectName || '<<PROJECT NAME>>'}</h1>
            <h2 className="srs-subtitle">Software Requirement Specification</h2>
        </div>

        <div style={{ height: '80px' }} /> {/* Extra 4 lines spacer (approx 20px per line) */}
        <p style={{ marginTop: 'auto', textAlign: 'center', width: '100%', fontSize: '14pt' }}>
            {srsData.locationDate || '– Ho Chi Minh, March 2026 –'}
        </p>
      </header>

      {/* --- I. OVERVIEW --- */}
      <section>
        <h2>I. Overview</h2>
        
        {/* 1. Introduction */}
        <h3>1. Introduction</h3>
        <div className="section-content">
          <p>{srsData.introduction?.overview || '[High-level overview of the product, environment, users, constraints...]'}</p>
          <p>{srsData.introduction?.context || '[Context diagram and boundary connections...]'}</p>
        </div>

        {/* 2. Business Main Flows */}
        <h3>2. Business Main Flows</h3>
        <div className="section-content">
          <p>{srsData.businessMainFlows?.description || '[Shows all the business main-flows...]'}</p>
          {Array.isArray(srsData.businessMainFlows?.flows) && srsData.businessMainFlows.flows.map((flow: any, index: number) => (
            <div key={index}>
              <h4>2.{index + 1}. {flow.title || `Main-flow 0${index + 1}`}</h4>
              <p>{flow.diagramPlaceholder || '[Swimlane diagram for main-flow here]'}</p>
            </div>
          ))}
        </div>

        {/* 3. Business Rules */}
        <h3>3. Business Rules</h3>
        <table border={1} cellPadding={8} className="srs-table">
          <thead>
            <tr>
               <th>Business Rule ID</th>
              <th>Business Rule Describe</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(srsData.businessRules) && srsData.businessRules.map((rule: any, index: number) => (
              <tr key={index}>
                <td>{rule.id || 'BR-01'}</td>
                <td>{rule.description || 'Describe the business rule content here'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Use cases */}
        <h3>4. Use cases</h3>
        <p>{srsData.useCases?.description || '[A use case describes a sequence of interactions...]'}</p>
        
        <h4>4.1. Use case Diagram(s)</h4>
        <div className="diagram-placeholder">
           <p>{srsData.useCases?.diagramInfo || '[Provide the UC diagram(s) here]'}</p>
        </div>

        <h4>4.2. Descriptions</h4>
        <table border={1} cellPadding={8} className="srs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feature</th>
              <th>Use Case</th>
              <th>Use Case Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(srsData.useCases?.list) && srsData.useCases.list.map((uc: any, index: number) => (
              <tr key={index}>
                <td>{uc.id || '01'}</td>
                <td>{uc.feature || 'Menu Operations'}</td>
                <td>{uc.name || 'View Menu'}</td>
                <td>{uc.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 5. System Functions */}
        <h3>5. System Functions</h3>
        
        <h4>5.1. Screen Flow</h4>
        <p>{srsData.systemFunctions?.screenFlow || '[This part shows the system screens and relationship...]'}</p>

        <h4>5.2. Screen Details</h4>
        <table border={1} cellPadding={8} className="srs-table">
          <thead>
             <tr>
              <th>#</th>
              <th>Feature</th>
              <th>Screen</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(srsData.systemFunctions?.screenDetails) && srsData.systemFunctions.screenDetails.map((screen: any, index: number) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{screen.feature}</td>
                <td>{screen.name}</td>
                <td>{screen.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4>5.3. User Authorization</h4>
        <table border={1} cellPadding={8} className="srs-table">
          <thead>
            <tr>
              <th>Screen</th>
              {Array.isArray(srsData.systemFunctions?.roles) && srsData.systemFunctions.roles.map((role: any, idx: number) => <th key={idx}>{role.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(srsData.systemFunctions?.authorizations) && srsData.systemFunctions.authorizations.map((auth: any, index: number) => (
              <tr key={index}>
                <td>{auth.screenName || '<<Screen Name>>'}</td>
                {Array.isArray(srsData.systemFunctions?.roles) && srsData.systemFunctions.roles.map((role: any, idx: number) => (
                  <td key={idx} style={{ textAlign: 'center' }}>{auth.permissions?.[role.id] ? 'X' : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        <h4>5.4. Non-Screen Functions</h4>
        <p>[Provide the descriptions for the non-screen system functions, i.e batch/cron job, service, API, etc.]</p>
      </section>

      {/* --- II. SYSTEM HIGH LEVEL DESIGN --- */}
      <section style={{ pageBreakBefore: 'always' }}>
        <h2>II. System High Level Design</h2>
        
        <h3>1. Conceptual Entity Relationship Diagram</h3>
        <p>{srsData.highLevelDesign?.conceptualERD || '<<Draw the Conceptual Entity Relationship Diagram here...>>'}</p>

        <h3>2. Logical Entity Relationship Diagram</h3>
        <p>{srsData.highLevelDesign?.logicalERD || '<<Draw the Logical Entity Relationship Diagram here...>>'}</p>

        <h3>3. Database Design</h3>
        <h4>a. Database Schema</h4>
         <p>{srsData.highLevelDesign?.dbSchema || '[Provide the tables relationship like example below]'}</p>
        
        <h4>b. Table Descriptions</h4>
        <table border={1} cellPadding={8} className="srs-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Table</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
             {Array.isArray(srsData.highLevelDesign?.tables) && srsData.highLevelDesign.tables.map((table: any, index: number) => (
              <tr key={index}>
                <td>{index < 9 ? `0${index + 1}` : index + 1}</td>
                <td>{table.name || '<Table name>'}</td>
                <td>
                  {table.description || '<Description of the table>'} <br/>
                  - Primary keys: {table.pk || '<<list>>'} <br/>
                  - Foreign keys: {table.fk || '<<list>>'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* --- III. FUNCTIONAL REQUIREMENTS --- */}
      {/* Content is generated when user uploads Screen Flow diagram (5.1) */}
      <section style={{ pageBreakBefore: 'always' }}>
        <h2>III. Functional Requirements</h2>
        <p><em>[This section will be auto-generated when you upload the Screen Flow diagram in section 5.1 above]</em></p>
      </section>

    </div>
  );
};
