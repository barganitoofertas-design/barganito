/**
 * Converte uma string de input datetime-local (YYYY-MM-DDTHH:mm) interpretada como
 * horário de Brasília (America/Sao_Paulo) para um objeto Date UTC correto.
 * Use esta função ao receber datas de formulários para salvar no banco.
 */
export function parseBRInputToUTC(value: string): Date {
  if (!value) return new Date();
  // O input datetime-local retorna "YYYY-MM-DDTHH:mm" sem timezone.
  // Interpretamos como America/Sao_Paulo (UTC-3 no inverno, UTC-2 no horário de verão).
  // A forma mais confiável é usar Intl para descobrir o offset real de SP no instante dado.
  const naive = new Date(value); // interpretado como local do servidor (pode ser UTC na Vercel)
  if (isNaN(naive.getTime())) return new Date();

  // Descobre o offset de Sao Paulo nesse instante via Intl
  const spFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Gera um Date tratando o valor do input como se fosse UTC,
  // depois corrige somando o offset de SP
  const asUTC = new Date(value + "Z"); // força interpretação UTC
  if (isNaN(asUTC.getTime())) return new Date();

  // Obtém a representação de SP para esse instante UTC
  const parts = spFormatter.formatToParts(asUTC);
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? "0");
  const spDate = new Date(
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ),
  );

  // O offset de SP neste momento = asUTC - spDate (em ms)
  const offsetMs = asUTC.getTime() - spDate.getTime();

  // Data correta em UTC = asUTC + offsetMs
  return new Date(asUTC.getTime() + offsetMs);
}

/**
 * Formata uma data para o padrão de Brasília (pt-BR)
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";

  const d = typeof date === "string" ? new Date(date) : date;

  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Retorna o "agora" em um objeto Date normalizado para Brasília
 * Útil para logs ou comparações manuais se o processo não respeitar o TZ env
 */
export function getBrasiliaNow(): Date {
  return new Date();
}

/**
 * Formata data para inputs datetime-local
 */
export function formatDateForInput(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  // Ajusta para o fuso local (que agora é America/Sao_Paulo via TZ env)
  // O slice(0, 16) pega YYYY-MM-DDTHH:mm
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

/**
 * Converte chave VAPID base64 para Uint8Array necessário para o navegador
 */
export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Formata um valor numérico para o padrão brasileiro de moeda (R$ 1.234,56)
 */
export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}
/**
 * Formata o método de pagamento para exibição legível
 */
export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return "-";

  const methods: Record<string, string> = {
    avista: "À vista",
    parcelado: "Parcelado",
    app_avista: "App à vista",
    app_prazo: "App a prazo",
  };

  return methods[method] || method;
}
