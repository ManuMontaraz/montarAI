const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Colores de la marca desde variables de entorno
const PRIMARY_COLOR = process.env.APP_PRIMARY_COLOR || '#008807';
const APP_NAME = process.env.APP_NAME || 'API';
const APP_URL = process.env.APP_URL || '';

// Versión desde package.json
const getVersion = () => {
  try {
    const packageJson = require('../../package.json');
    return packageJson.version;
  } catch {
    return '1.0.0';
  }
};

// Extraer encabezados del HTML para crear el índice
const extractHeadings = (html) => {
  const headings = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const text = match[2].replace(/<[^>]*>/g, ''); // Eliminar tags HTML
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    headings.push({ level, text, id });
  }
  
  return headings;
};

// Generar HTML del índice
const generateToc = (headings) => {
  if (headings.length === 0) return '';
  
  let html = '<nav class="toc"><h3>Indice</h3><ul>';
  
  headings.forEach(heading => {
    const indent = heading.level === 3 ? 'style="margin-left: 1rem;"' : '';
    html += `<li ${indent}><a href="#${heading.id}">${heading.text}</a></li>`;
  });
  
  html += '</ul></nav>';
  return html;
};

// Añadir IDs a los encabezados del contenido
const addHeadingIds = (html, headings) => {
  let index = 0;
  return html.replace(/<h([23])([^>]*)>/gi, (match, level, attrs) => {
    if (index < headings.length) {
      const id = headings[index].id;
      index++;
      return `<h${level}${attrs} id="${id}">`;
    }
    return match;
  });
};

// CSS con tema oscuro y sidebar
const getStyles = () => `
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #c9d1d9;
      background-color: #0d1117;
      margin: 0;
      padding: 0;
    }
    
    .header {
      background: linear-gradient(135deg, #161b22 0%, #0d1117 100%);
      border-bottom: 2px solid ${PRIMARY_COLOR};
      padding: 2rem;
      text-align: center;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      height: 120px;
    }
    
    .header h1 {
      color: #ffffff;
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    }
    
    .header .version {
      color: ${PRIMARY_COLOR};
      font-size: 1rem;
      font-weight: 500;
    }
    
    .header .status {
      color: #3fb950;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
    
    .main-container {
      display: flex;
      margin-top: 120px;
      min-height: calc(100vh - 120px);
    }
    
    .sidebar {
      width: 280px;
      background-color: #161b22;
      border-right: 1px solid #30363d;
      padding: 2rem 1.5rem;
      position: fixed;
      height: calc(100vh - 120px);
      overflow-y: auto;
      top: 120px;
      left: 0;
    }
    
    .sidebar h3 {
      color: #ffffff;
      margin: 0 0 1rem 0;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid ${PRIMARY_COLOR};
      padding-bottom: 0.5rem;
    }
    
    .sidebar ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .sidebar li {
      margin: 0.25rem 0;
    }
    
    .sidebar a {
      color: #8b949e;
      text-decoration: none;
      font-size: 0.9rem;
      display: block;
      padding: 0.4rem 0.5rem;
      border-radius: 4px;
      transition: all 0.2s;
    }
    
    .sidebar a:hover {
      color: #ffffff;
      background-color: #21262d;
      text-decoration: none;
    }
    
    .content {
      margin-left: 280px;
      flex: 1;
      padding: 2rem;
      max-width: calc(100% - 280px);
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #ffffff;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      scroll-margin-top: 140px;
    }
    
    h1 { border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 0.5rem; }
    h2 { border-bottom: 1px solid #30363d; padding-bottom: 0.3rem; }
    h3 { color: #e6edf3; }
    
    a {
      color: ${PRIMARY_COLOR};
      text-decoration: none;
      transition: opacity 0.2s;
    }
    
    a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
    
    code {
      background-color: #161b22;
      color: #e6edf3;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.9em;
    }
    
    pre {
      background-color: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1rem 0;
    }
    
    pre code {
      background: none;
      padding: 0;
      color: #c9d1d9;
    }
    
    blockquote {
      border-left: 4px solid ${PRIMARY_COLOR};
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background-color: #161b22;
      border-radius: 0 8px 8px 0;
    }
    
    blockquote p {
      margin: 0;
      color: #8b949e;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      background-color: #161b22;
      border-radius: 8px;
      overflow: hidden;
    }
    
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #30363d;
    }
    
    th {
      background-color: #21262d;
      color: #ffffff;
      font-weight: 600;
    }
    
    tr:hover {
      background-color: #1c2128;
    }
    
    hr {
      border: none;
      border-top: 1px solid #30363d;
      margin: 2rem 0;
    }
    
    ul, ol {
      padding-left: 2rem;
    }
    
    li {
      margin: 0.5rem 0;
    }
    
    p {
      margin: 1rem 0;
    }
    
    strong {
      color: #ffffff;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding: 2rem;
      margin-top: 3rem;
      border-top: 1px solid #30363d;
      color: #8b949e;
      font-size: 0.9rem;
      margin-left: 280px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .header {
        height: auto;
        padding: 1rem;
      }
      
      .header h1 {
        font-size: 1.5rem;
      }
      
      .main-container {
        flex-direction: column;
        margin-top: 100px;
      }
      
      .sidebar {
        position: static;
        width: 100%;
        height: auto;
        max-height: 300px;
        border-right: none;
        border-bottom: 1px solid #30363d;
        padding: 1rem;
        top: auto;
      }
      
      .content {
        margin-left: 0;
        max-width: 100%;
        padding: 1rem;
      }
      
      .footer {
        margin-left: 0;
      }
      
      table {
        font-size: 0.9rem;
      }
      
      th, td {
        padding: 0.5rem;
      }
      
      h1, h2, h3, h4, h5, h6 {
        scroll-margin-top: 120px;
      }
    }
  </style>
`;

// HTML template
const getHtmlTemplate = (toc, content, version) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME} - API Documentation</title>
  ${getStyles()}
</head>
<body>
  <div class="header">
    <h1>${APP_NAME}</h1>
    <div class="version">v${version}</div>
    <div class="status">● Online</div>
  </div>
  
  <div class="main-container">
    <aside class="sidebar">
      ${toc}
    </aside>
    
    <main class="content">
      ${content}
    </main>
  </div>
  
  <div class="footer">
    <p>${APP_NAME} API &copy; ${new Date().getFullYear()}</p>
    ${APP_URL ? `<p><a href="${APP_URL}">${APP_URL}</a></p>` : ''}
  </div>
</body>
</html>
`;

// Middleware para servir documentación
const serveDocs = (req, res) => {
  try {
    // Leer API.md
    const apiMdPath = path.join(__dirname, '../../API.md');
    const markdown = fs.readFileSync(apiMdPath, 'utf-8');
    
    // Convertir a HTML
    const htmlContent = marked(markdown);
    
    // Extraer encabezados para el índice
    const headings = extractHeadings(htmlContent);
    
    // Generar índice
    const toc = generateToc(headings);
    
    // Añadir IDs a los encabezados
    const contentWithIds = addHeadingIds(htmlContent, headings);
    
    // Obtener versión
    const version = getVersion();
    
    // Generar HTML completo
    const fullHtml = getHtmlTemplate(toc, contentWithIds, version);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(fullHtml);
  } catch (error) {
    console.error('Error serving docs:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem; text-align: center; background: #0d1117; color: #c9d1d9;">
          <h1>Error cargando documentación</h1>
          <p>No se pudo cargar el archivo API.md</p>
        </body>
      </html>
    `);
  }
};

module.exports = { serveDocs };
