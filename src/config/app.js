/**
 * MontarAI Backend - API REST
 * Copyright (C) 2024
 *
 * Configuración dinámica de marca/aplicación
 * Permite reutilizar el backend en múltiples proyectos
 */

const supportedSocialNetworks = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'bluesky'];

// Construir objeto de redes sociales (solo las que tienen valor)
const buildSocialConfig = () => {
  const social = {};
  supportedSocialNetworks.forEach(network => {
    const value = process.env[`SOCIAL_${network.toUpperCase()}`];
    if (value && value.trim() !== '') {
      social[network] = value.trim();
    }
  });
  return social;
};

// Obtener array de redes sociales activas para emails
const getActiveSocialLinks = () => {
  const social = buildSocialConfig();
  return Object.entries(social).map(([name, url]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    url,
    icon: `${name}.png`
  }));
};

module.exports = {
  // Información básica de la aplicación
  name: process.env.APP_NAME || 'MontarAI',
  url: process.env.APP_URL || 'https://montarai.com',
  supportEmail: process.env.APP_SUPPORT_EMAIL || 'soporte@montarai.com',
  
  // Configuración de email
  email: {
    fromName: process.env.EMAIL_FROM_NAME || process.env.APP_NAME || 'MontarAI',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@montarai.com'
  },
  
  // Branding visual
  branding: {
    primaryColor: process.env.APP_PRIMARY_COLOR || '#007bff',
    logoUrl: process.env.APP_LOGO_URL || '',
    faviconUrl: process.env.APP_FAVICON_URL || ''
  },
  
  // Datos de la empresa
  company: {
    name: process.env.COMPANY_NAME || '',
    address: process.env.COMPANY_ADDRESS || '',
    phone: process.env.COMPANY_PHONE || '',
    cif: process.env.COMPANY_CIF || ''
  },
  
  // Redes sociales
  social: buildSocialConfig(),
  getActiveSocialLinks,
  hasSocialLinks: () => getActiveSocialLinks().length > 0,
  
  // URLs legales
  urls: {
    terms: process.env.URL_TERMS || '',
    privacy: process.env.URL_PRIVACY || '',
    legal: process.env.URL_LEGAL || '',
    cookies: process.env.URL_COOKIES || '',
    contact: process.env.URL_CONTACT || ''
  },
  
  // Helper para verificar si hay URLs legales configuradas
  hasLegalUrls: function() {
    return Object.values(this.urls).some(url => url && url.trim() !== '');
  }
};
