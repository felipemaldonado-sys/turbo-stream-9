/**
 * Productos de ejemplo en contexto Colombia / quick commerce (solo UI demo).
 */

export type SuggestedProduct = {
  id: string;
  name: string;
  priceLabel: string;
  emoji: string;
  hint?: string;
};

export const SUGGESTED_PRODUCTS_CO: SuggestedProduct[] = [
  { id: "1", name: "Arepa de chócolo", priceLabel: "$2.800", emoji: "🌽" },
  { id: "2", name: "Café molido", priceLabel: "$15.900", emoji: "☕" },
  { id: "3", name: "Gaseosa colombiana", priceLabel: "$3.200", emoji: "🥤" },
  { id: "4", name: "Chocoramo", priceLabel: "$2.500", emoji: "🍫" },
  { id: "5", name: "Aguacate Hass", priceLabel: "$8.900", emoji: "🥑" },
  { id: "6", name: "Banano Urabá", priceLabel: "$4.500", emoji: "🍌" },
  { id: "7", name: "Panela en bloque", priceLabel: "$5.400", emoji: "🟤" },
  { id: "8", name: "Harina PAN", priceLabel: "$6.800", emoji: "🫓" },
  { id: "9", name: "Leche entera", priceLabel: "$4.200", emoji: "🥛" },
  { id: "10", name: "Huevos AA x6", priceLabel: "$7.900", emoji: "🥚" },
  { id: "11", name: "Pandebono", priceLabel: "$3.100", emoji: "🥯" },
  { id: "12", name: "Limón Tahití", priceLabel: "$2.100", emoji: "🍋" },
  { id: "13", name: "Arroz Diana", priceLabel: "$9.500", emoji: "🍚" },
  { id: "14", name: "Aceite vegetal", priceLabel: "$18.400", emoji: "🫒" },
  { id: "15", name: "Salchicha Zenú", priceLabel: "$12.200", emoji: "🌭" },
  { id: "16", name: "Queso campesino", priceLabel: "$11.800", emoji: "🧀" },
  { id: "17", name: "Yogurt Alpina", priceLabel: "$3.900", emoji: "🫙" },
  { id: "18", name: "Papas fritas", priceLabel: "$4.600", emoji: "🥔" },
  { id: "19", name: "Chocolate Jet", priceLabel: "$5.700", emoji: "🍫" },
  { id: "20", name: "Agua sin gas", priceLabel: "$2.000", emoji: "💧" },
];
