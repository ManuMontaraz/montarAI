/**
 * MontarAI Backend - API REST
 * Copyright (C) 2026
 */

const { locales, defaultLocale } = require('../locales');
const appConfig = require('../config/app');

/**
 * Obtiene un valor anidado de un objeto usando notación de puntos
 * Ej: getNestedValue(obj, 'auth.error.account_not_found')
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

/**
 * Interpola variables en un string
 * Soporta:
 * - Variables pasadas manualmente: {firstName}
 * - Variables de configuración de app: {appName}, {appUrl}, {supportEmail}
 * - Variables de empresa: {companyName}, {companyAddress}, {companyPhone}
 * 
 * Ej: interpolate("Hola {firstName}, bienvenido a {appName}", { firstName: "Juan" })
 * Resultado: "Hola Juan, bienvenido a MontarAI"
 */
const interpolate = (str, variables = {}) => {
  // Variables por defecto de la app
  const defaultVars = {
    appName: appConfig.name,
    appUrl: appConfig.url,
    supportEmail: appConfig.supportEmail,
    companyName: appConfig.company.name,
    companyAddress: appConfig.company.address,
    companyPhone: appConfig.company.phone,
    companyCif: appConfig.company.cif,
    emailFromName: appConfig.email.fromName,
    primaryColor: appConfig.branding.primaryColor
  };
  
  // Combinar variables pasadas con las por defecto
  const allVars = { ...defaultVars, ...variables };
  
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return allVars[key] !== undefined ? allVars[key] : match;
  });
};

/**
 * Función principal de traducción
 * @param {string} key - Clave de traducción (ej: 'auth.error.account_not_found')
 * @param {string} lang - Idioma solicitado
 * @param {object} variables - Variables para interpolación
 * @returns {object} - Objeto con key, message, lang
 */
const t = (key, lang = defaultLocale, variables = {}) => {
  // Intentar obtener traducción en el idioma solicitado
  const locale = locales[lang] || locales[defaultLocale];
  let translated = getNestedValue(locale, key);
  
  // Si no existe en el idioma solicitado, intentar en el idioma por defecto
  let usedLang = lang;
  if (translated === undefined && lang !== defaultLocale) {
    translated = getNestedValue(locales[defaultLocale], key);
    usedLang = defaultLocale;
  }
  
  // Si no existe en ningún idioma, devolver la key
  if (translated === undefined) {
    translated = key;
  }
  
  // Interpolar variables
  translated = interpolate(translated, variables);
  
  return {
    key,
    message: translated,
    lang: usedLang
  };
};

/**
 * Obtiene solo el mensaje traducido (sin metadata)
 * @param {string} key - Clave de traducción
 * @param {string} lang - Idioma solicitado
 * @param {object} variables - Variables para interpolación
 * @returns {string} - Mensaje traducido
 */
const translate = (key, lang = defaultLocale, variables = {}) => {
  return t(key, lang, variables).message;
};

module.exports = {
  t,
  translate,
  interpolate
};
