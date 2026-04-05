import ComunicadosEditor from './ComunicadosEditor';

/**
 * NoticiasEditor — manages news items that appear on the Home page (/ensa).
 * Items with displaySections containing "HOME" appear in the home-page news section.
 * Uses the shared ComunicadosEditor with sectionFilter="HOME".
 */
export default function NoticiasEditor() {
  return (
    <ComunicadosEditor
      sectionFilter="HOME"
      pageTitle="Notícias"
      pageSlug="/ensa (secção notícias)"
      pageDesc="Gestão de notícias visíveis na página inicial da plataforma de investidores."
      defaultSections="HOME"
      pageUrl="/"
    />
  );
}
