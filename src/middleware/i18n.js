/**
 * MontarAI Backend - API REST
 * Copyright (C) 2026
 */

const { supportedLocales, defaultLocale } = require('../locales');
const { t } = require('../utils/translator');

/**
 * Extrae el código de idioma del header Accept-Language
 * Ej: 'es-ES,es;q=0.9,en;q=0.8' => 'es'
 */
const parseAcceptLanguage = (header) => {
  if (!header) return null;
  
  // Tomar el primer idioma de la lista
  const primaryLang = header.split(',')[0].trim();
  
  // Extraer solo el código de idioma (sin región)
  // Ej: 'es-ES' => 'es', 'en-US' => 'en'
  const langCode = primaryLang.split('-')[0].toLowerCase();
  
  return supportedLocales.includes(langCode) ? langCode : null;
};

/**
 * Middleware para detectar y establecer el idioma
 * Prioridad: Query param > Header Accept-Language > Default
 */
const i18nMiddleware = (req, res, next) => {
  // 1. Intentar obtener de query param (?lang=es)
  let lang = req.query.lang;
  
  // 2. Si no hay query param, intentar del header Accept-Language
  if (!lang || !supportedLocales.includes(lang)) {
    lang = parseAcceptLanguage(req.headers['accept-language']);
  }
  
  // 3. Si no se detectó ninguno, usar el idioma por defecto
  if (!lang) {
    lang = defaultLocale;
  }
  
  // Guardar el idioma en el request para usarlo posteriormente
  req.lang = lang;
  
  // Agregar función helper t() al request
  req.t = (key, variables = {}) => t(key, lang, variables);
  
  // Agregar función para respuestas traducidas
  res.sendTranslated = (key, statusCode = 200, additionalData = {}, variables = {}) => {
    const translation = req.t(key, variables);
    res.status(statusCode).json({
      ...translation,
      ...additionalData
    });
  };
  
  next();
};

module.exports = {
  i18nMiddleware
};
