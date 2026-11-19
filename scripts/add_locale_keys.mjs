// Add signIn + register keys to all locale files
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const localesDir = join(process.cwd(), 'src/locales');

const translations = {
  en: { signIn: 'Sign In', register: 'Register' },
  de: { signIn: 'Anmelden', register: 'Registrieren' },
  fr: { signIn: 'Connexion', register: 'Inscription' },
  es: { signIn: 'Iniciar Sesión', register: 'Registrarse' },
  it: { signIn: 'Accedi', register: 'Registrati' },
  pl: { signIn: 'Zaloguj się', register: 'Zarejestruj się' },
  ru: { signIn: 'Войти', register: 'Регистрация' },
  uk: { signIn: 'Увійти', register: 'Реєстрація' },
};

for (const [lang, keys] of Object.entries(translations)) {
  const filePath = join(localesDir, `${lang}.ts`);
  let content = readFileSync(filePath, 'utf8');

  // Skip if already has signIn key
  if (content.includes('signIn:')) {
    console.log(`${lang}.ts — already has signIn, skipping`);
    continue;
  }

  // Insert signIn + register after signInRegister line
  const signInLine = `    signIn: '${keys.signIn}',\n    register: '${keys.register}',\n`;
  content = content.replace(
    /([ \t]*signInRegister:[^\n]+\n)/,
    `$1${signInLine}`
  );

  writeFileSync(filePath, content, 'utf8');
  console.log(`${lang}.ts — added signIn: '${keys.signIn}', register: '${keys.register}'`);
}

console.log('\nDone.');
