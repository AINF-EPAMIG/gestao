/**
 * Configurações de autenticação e autorização do sistema
 */

// Lista de emails que devem ter privilégios de chefia independente do cargo/hierarquia formal
export const EXCEPTION_EMAILS_CHEFIA: string[] = [
  // "exemplo@epamig.br",
];

/**
 * Verifica se um email está na lista de exceções para privilégios de chefia
 */
export function isExceptionEmailChefia(email: string): boolean {
  return EXCEPTION_EMAILS_CHEFIA.includes(email.toLowerCase());
}

/**
 * Adiciona um email à lista de exceções de chefia (uso programático)
 * @param email - Email a ser adicionado à lista de exceções
 */
export function addExceptionEmailChefia(email: string): void {
  const emailLower = email.toLowerCase();
  if (!EXCEPTION_EMAILS_CHEFIA.includes(emailLower)) {
    EXCEPTION_EMAILS_CHEFIA.push(emailLower);
  }
}

/**
 * Remove um email da lista de exceções de chefia (uso programático)
 * @param email - Email a ser removido da lista de exceções
 */
export function removeExceptionEmailChefia(email: string): void {
  const emailLower = email.toLowerCase();
  const index = EXCEPTION_EMAILS_CHEFIA.indexOf(emailLower);
  if (index > -1) {
    EXCEPTION_EMAILS_CHEFIA.splice(index, 1);
  }
} 