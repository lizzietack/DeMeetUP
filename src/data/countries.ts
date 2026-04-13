export type CountryCurrency = {
  country: string;
  code: string;
  currency: string;
  currencySymbol: string;
};

export const COUNTRIES: CountryCurrency[] = [
  { country: "Ghana", code: "GH", currency: "GHS", currencySymbol: "GH₵" },
  { country: "Nigeria", code: "NG", currency: "NGN", currencySymbol: "₦" },
  { country: "South Africa", code: "ZA", currency: "ZAR", currencySymbol: "R" },
  { country: "Kenya", code: "KE", currency: "KES", currencySymbol: "KSh" },
  { country: "Tanzania", code: "TZ", currency: "TZS", currencySymbol: "TSh" },
  { country: "Uganda", code: "UG", currency: "UGX", currencySymbol: "USh" },
  { country: "Ethiopia", code: "ET", currency: "ETB", currencySymbol: "Br" },
  { country: "Rwanda", code: "RW", currency: "RWF", currencySymbol: "RF" },
  { country: "Cameroon", code: "CM", currency: "XAF", currencySymbol: "FCFA" },
  { country: "Senegal", code: "SN", currency: "XOF", currencySymbol: "CFA" },
  { country: "Ivory Coast", code: "CI", currency: "XOF", currencySymbol: "CFA" },
  { country: "Egypt", code: "EG", currency: "EGP", currencySymbol: "E£" },
  { country: "Morocco", code: "MA", currency: "MAD", currencySymbol: "MAD" },
  { country: "Tunisia", code: "TN", currency: "TND", currencySymbol: "DT" },
  { country: "Algeria", code: "DZ", currency: "DZD", currencySymbol: "DA" },
  { country: "Zimbabwe", code: "ZW", currency: "USD", currencySymbol: "$" },
  { country: "Zambia", code: "ZM", currency: "ZMW", currencySymbol: "ZK" },
  { country: "Botswana", code: "BW", currency: "BWP", currencySymbol: "P" },
  { country: "Mozambique", code: "MZ", currency: "MZN", currencySymbol: "MT" },
  { country: "Angola", code: "AO", currency: "AOA", currencySymbol: "Kz" },
  { country: "United States", code: "US", currency: "USD", currencySymbol: "$" },
  { country: "United Kingdom", code: "GB", currency: "GBP", currencySymbol: "£" },
  { country: "Canada", code: "CA", currency: "CAD", currencySymbol: "C$" },
  { country: "Australia", code: "AU", currency: "AUD", currencySymbol: "A$" },
  { country: "Germany", code: "DE", currency: "EUR", currencySymbol: "€" },
  { country: "France", code: "FR", currency: "EUR", currencySymbol: "€" },
  { country: "Netherlands", code: "NL", currency: "EUR", currencySymbol: "€" },
  { country: "Spain", code: "ES", currency: "EUR", currencySymbol: "€" },
  { country: "Italy", code: "IT", currency: "EUR", currencySymbol: "€" },
  { country: "Brazil", code: "BR", currency: "BRL", currencySymbol: "R$" },
  { country: "India", code: "IN", currency: "INR", currencySymbol: "₹" },
  { country: "UAE", code: "AE", currency: "AED", currencySymbol: "د.إ" },
  { country: "Saudi Arabia", code: "SA", currency: "SAR", currencySymbol: "﷼" },
  { country: "Japan", code: "JP", currency: "JPY", currencySymbol: "¥" },
  { country: "China", code: "CN", currency: "CNY", currencySymbol: "¥" },
  { country: "Singapore", code: "SG", currency: "SGD", currencySymbol: "S$" },
  { country: "Malaysia", code: "MY", currency: "MYR", currencySymbol: "RM" },
  { country: "Thailand", code: "TH", currency: "THB", currencySymbol: "฿" },
  { country: "Philippines", code: "PH", currency: "PHP", currencySymbol: "₱" },
  { country: "Indonesia", code: "ID", currency: "IDR", currencySymbol: "Rp" },
  { country: "Mexico", code: "MX", currency: "MXN", currencySymbol: "MX$" },
  { country: "Colombia", code: "CO", currency: "COP", currencySymbol: "COL$" },
  { country: "Turkey", code: "TR", currency: "TRY", currencySymbol: "₺" },
  { country: "Poland", code: "PL", currency: "PLN", currencySymbol: "zł" },
  { country: "Sweden", code: "SE", currency: "SEK", currencySymbol: "kr" },
  { country: "Norway", code: "NO", currency: "NOK", currencySymbol: "kr" },
  { country: "Switzerland", code: "CH", currency: "CHF", currencySymbol: "CHF" },
  { country: "New Zealand", code: "NZ", currency: "NZD", currencySymbol: "NZ$" },
].sort((a, b) => a.country.localeCompare(b.country));

export const getCountryCurrency = (country: string): CountryCurrency | undefined =>
  COUNTRIES.find((c) => c.country === country);
